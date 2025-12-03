import {
  Action,
  ActionPanel,
  Color,
  Detail,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState, useEffect } from "react";
import {
  TransactionService,
  DryRunResult,
  TransactionResult,
} from "../services/TransactionService";

interface CallParams {
  packageId: string;
  module: string;
  function: string;
  typeArgs: string[];
  args: string[];
  gasBudget: number;
}

export function CallFunctionWizard() {
  const { push } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Continue"
            onSubmit={(values: { packageId: string }) => {
              if (!values.packageId || !values.packageId.startsWith("0x")) {
                showToast({
                  style: Toast.Style.Failure,
                  title: "Invalid Package ID",
                  message: "Package ID must start with 0x",
                });
                return;
              }
              push(<ModuleSelector packageId={values.packageId} />);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="packageId"
        title="Package ID"
        placeholder="0x2"
        info="The package address containing the module you want to call"
      />

      <Form.Description
        title="Common Packages"
        text={`• 0x1 - Move Standard Library
• 0x2 - Sui Framework
• 0x3 - Sui System`}
      />
    </Form>
  );
}

function ModuleSelector({ packageId }: { packageId: string }) {
  const [modules, setModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const transactionService = new TransactionService();
  const { push, pop } = useNavigation();

  useEffect(() => {
    async function loadModules() {
      try {
        const moduleList =
          await transactionService.getPackageModules(packageId);
        setModules(moduleList);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load modules",
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadModules();
  }, [packageId]);

  if (modules.length === 0 && !isLoading) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Continue"
              onSubmit={(values: { module: string; function: string }) => {
                push(
                  <ArgumentsForm
                    packageId={packageId}
                    module={values.module}
                    functionName={values.function}
                  />,
                );
              }}
            />
            <Action title="Back" icon={Icon.ArrowLeft} onAction={pop} />
          </ActionPanel>
        }
      >
        <Form.Description title="Package" text={packageId} />
        <Form.TextField
          id="module"
          title="Module Name"
          placeholder="coin"
          info="Enter the module name manually"
        />
        <Form.TextField
          id="function"
          title="Function Name"
          placeholder="split"
          info="Enter the function name to call"
        />
      </Form>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search modules...">
      <List.Section
        title={`Package: ${packageId}`}
        subtitle={`${modules.length} modules`}
      >
        {modules.map((module) => (
          <List.Item
            key={module}
            title={module}
            icon={{ source: Icon.Box, tintColor: Color.Blue }}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Select Module"
                  target={
                    <FunctionSelector packageId={packageId} module={module} />
                  }
                />
                <Action title="Back" icon={Icon.ArrowLeft} onAction={pop} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function FunctionSelector({
  packageId,
  module,
}: {
  packageId: string;
  module: string;
}) {
  const { push, pop } = useNavigation();

  // Since we can't easily get function signatures from CLI,
  // provide a manual entry form
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Continue"
            onSubmit={(values: { function: string }) => {
              push(
                <ArgumentsForm
                  packageId={packageId}
                  module={module}
                  functionName={values.function}
                />,
              );
            }}
          />
          <Action title="Back" icon={Icon.ArrowLeft} onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Selected"
        text={`Package: ${packageId}\nModule: ${module}`}
      />

      <Form.TextField
        id="function"
        title="Function Name"
        placeholder="split"
        info="Enter the public function name to call"
      />

      <Form.Description
        title="Common Functions"
        text={`Examples for ${module}:
• transfer, split, merge (coin)
• public_transfer, share_object (transfer)
• delete, id (object)`}
      />
    </Form>
  );
}

function ArgumentsForm({
  packageId,
  module,
  functionName,
}: {
  packageId: string;
  module: string;
  functionName: string;
}) {
  const { push, pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const transactionService = new TransactionService();

  const handleDryRun = async (values: {
    typeArgs: string;
    args: string;
    gasBudget: string;
  }) => {
    setIsSubmitting(true);
    try {
      const params = parseFormValues(packageId, module, functionName, values);

      showToast({ style: Toast.Style.Animated, title: "Simulating..." });

      const result = await transactionService.dryRun(params);

      push(<DryRunResultView result={result} params={params} />);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Simulation failed",
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecute = async (values: {
    typeArgs: string;
    args: string;
    gasBudget: string;
  }) => {
    setIsSubmitting(true);
    try {
      const params = parseFormValues(packageId, module, functionName, values);

      showToast({ style: Toast.Style.Animated, title: "Executing..." });

      const result = await transactionService.call(params);

      showToast({ style: Toast.Style.Success, title: "Transaction executed" });
      push(<TransactionResultView result={result} />);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Execution failed",
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Simulate (dry Run)"
            icon={Icon.Eye}
            onSubmit={handleDryRun}
          />
          <Action.SubmitForm
            title="Execute"
            icon={Icon.Play}
            onSubmit={handleExecute}
          />
          <Action title="Back" icon={Icon.ArrowLeft} onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Function"
        text={`${packageId}::${module}::${functionName}`}
      />

      <Form.TextField
        id="typeArgs"
        title="Type Arguments"
        placeholder="0x2::sui::SUI"
        info="Comma-separated type arguments (e.g., 0x2::sui::SUI, 0x2::coin::Coin<0x2::sui::SUI>)"
      />

      <Form.TextArea
        id="args"
        title="Arguments"
        placeholder="0xabc123..., 1000000000"
        info="Comma-separated arguments. Use quotes for strings, brackets for vectors."
      />

      <Form.TextField
        id="gasBudget"
        title="Gas Budget"
        defaultValue="10000000"
        info="Maximum gas to spend (in MIST)"
      />

      <Form.Description
        title="Argument Format"
        text={`• Addresses/Object IDs: 0x...
• Numbers: 1000000000
• Strings: "hello"
• Vectors: [1, 2, 3] or [0xabc, 0xdef]
• Booleans: true, false`}
      />
    </Form>
  );
}

function parseFormValues(
  packageId: string,
  module: string,
  functionName: string,
  values: { typeArgs: string; args: string; gasBudget: string },
): CallParams {
  const typeArgs = values.typeArgs
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const args = parseArgs(values.args);

  return {
    packageId,
    module,
    function: functionName,
    typeArgs,
    args,
    gasBudget: parseInt(values.gasBudget) || 10000000,
  };
}

function parseArgs(argsStr: string): string[] {
  if (!argsStr.trim()) return [];

  // Handle vectors and complex arguments
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inQuote = false;

  for (const char of argsStr) {
    if (char === '"' && current[current.length - 1] !== "\\") {
      inQuote = !inQuote;
      current += char;
    } else if (char === "[" && !inQuote) {
      depth++;
      current += char;
    } else if (char === "]" && !inQuote) {
      depth--;
      current += char;
    } else if (char === "," && depth === 0 && !inQuote) {
      if (current.trim()) {
        args.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function DryRunResultView({
  result,
  params,
}: {
  result: DryRunResult;
  params: CallParams;
}) {
  const { push, pop } = useNavigation();
  const [isExecuting, setIsExecuting] = useState(false);
  const transactionService = new TransactionService();

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      showToast({ style: Toast.Style.Animated, title: "Executing..." });

      const txResult = await transactionService.call(params);

      showToast({ style: Toast.Style.Success, title: "Transaction executed" });
      push(<TransactionResultView result={txResult} />);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Execution failed",
        message: String(error),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const gasInfo = result.effects?.gasUsed;
  const totalGas = gasInfo
    ? (parseInt(gasInfo.totalGas) / 1_000_000_000).toFixed(6)
    : "0";

  const markdown = `
# ${result.success ? "Simulation Successful" : "Simulation Failed"}

## Function
\`${params.packageId}::${params.module}::${params.function}\`

${params.typeArgs.length > 0 ? `## Type Arguments\n${params.typeArgs.map((t) => `- \`${t}\``).join("\n")}` : ""}

${params.args.length > 0 ? `## Arguments\n${params.args.map((a) => `- \`${a}\``).join("\n")}` : ""}

---

## ${result.success ? "Gas Estimate" : "Error"}

${
  result.success && gasInfo
    ? `| Cost Type | Amount (MIST) |
|-----------|---------------|
| Computation | ${gasInfo.computationCost} |
| Storage | ${gasInfo.storageCost} |
| Rebate | -${gasInfo.storageRebate} |
| **Total** | **${gasInfo.totalGas}** (~${totalGas} SUI) |`
    : `\`\`\`\n${result.error || "Unknown error"}\n\`\`\``
}

${
  result.effects?.created && result.effects.created.length > 0
    ? `## Objects Created\n${result.effects.created.map((o) => `- \`${o.objectId}\` (${o.objectType})`).join("\n")}`
    : ""
}

${
  result.effects?.mutated && result.effects.mutated.length > 0
    ? `## Objects Mutated\n${result.effects.mutated.map((o) => `- \`${o.objectId}\``).join("\n")}`
    : ""
}
`;

  return (
    <Detail
      isLoading={isExecuting}
      markdown={markdown}
      actions={
        <ActionPanel>
          {result.success && (
            <Action
              title="Execute Transaction"
              icon={Icon.Play}
              onAction={handleExecute}
            />
          )}
          <Action title="Back" icon={Icon.ArrowLeft} onAction={pop} />
          <Action.CopyToClipboard
            title="Copy Raw Output"
            content={result.rawOutput}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Status"
            text={result.success ? "Success" : "Failed"}
            icon={
              result.success
                ? { source: Icon.CheckCircle, tintColor: Color.Green }
                : { source: Icon.XMarkCircle, tintColor: Color.Red }
            }
          />
          {gasInfo && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label
                title="Estimated Gas"
                text={`${totalGas} SUI`}
              />
            </>
          )}
        </Detail.Metadata>
      }
    />
  );
}

function TransactionResultView({ result }: { result: TransactionResult }) {
  const { pop } = useNavigation();

  const gasInfo = result.effects.gasUsed;
  const totalGas = (parseInt(gasInfo.totalGas) / 1_000_000_000).toFixed(6);

  const explorerUrl = `https://suiscan.xyz/mainnet/tx/${result.digest}`;

  const markdown = `
# Transaction ${result.effects.status === "success" ? "Successful" : "Failed"}

## Digest
\`${result.digest}\`

---

## Gas Used
| Cost Type | Amount (MIST) |
|-----------|---------------|
| Computation | ${gasInfo.computationCost} |
| Storage | ${gasInfo.storageCost} |
| Rebate | -${gasInfo.storageRebate} |
| **Total** | **${gasInfo.totalGas}** (~${totalGas} SUI) |

${
  result.effects.created && result.effects.created.length > 0
    ? `## Objects Created\n${result.effects.created.map((o) => `- \`${o.objectId}\`\n  Type: ${o.objectType}`).join("\n")}`
    : ""
}

${
  result.effects.mutated && result.effects.mutated.length > 0
    ? `## Objects Mutated\n${result.effects.mutated.map((o) => `- \`${o.objectId}\``).join("\n")}`
    : ""
}

${
  result.effects.deleted && result.effects.deleted.length > 0
    ? `## Objects Deleted\n${result.effects.deleted.map((id) => `- \`${id}\``).join("\n")}`
    : ""
}
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Digest"
            content={result.digest}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.OpenInBrowser
            title="View on Explorer"
            url={explorerUrl}
            shortcut={{ modifiers: ["cmd"], key: "o" }}
          />
          <Action.CopyToClipboard
            title="Copy Raw Output"
            content={result.rawOutput}
          />
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Status"
            text={result.effects.status}
            icon={
              result.effects.status === "success"
                ? { source: Icon.CheckCircle, tintColor: Color.Green }
                : { source: Icon.XMarkCircle, tintColor: Color.Red }
            }
          />
          <Detail.Metadata.Label title="Digest" text={result.digest} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Gas Used" text={`${totalGas} SUI`} />
          <Detail.Metadata.Link
            title="Explorer"
            text="View on Suiscan"
            target={explorerUrl}
          />
        </Detail.Metadata>
      }
    />
  );
}
