import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
  Detail,
} from "@raycast/api";
import { useState } from "react";
import { KeyService } from "../services/KeyService";

export function MultiSigTools() {
  const { push } = useNavigation();

  return (
    <List navigationTitle="Multi-Sig Tools">
      <List.Item
        title="Create Multi-Sig Address"
        subtitle="Generate a new multi-signature address"
        icon={Icon.AddPerson}
        actions={
          <ActionPanel>
            <Action.Push title="Open Form" target={<CreateMultiSigForm />} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Combine Partial Signatures"
        subtitle="Combine signatures into a single multi-sig signature"
        icon={Icon.Pencil}
        actions={
          <ActionPanel>
            <Action.Push title="Open Form" target={<CombineSignaturesForm />} />
          </ActionPanel>
        }
      />
    </List>
  );
}

function CreateMultiSigForm() {
  const { push, pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const keyService = new KeyService();

  const handleSubmit = async (values: {
    publicKeys: string;
    weights: string;
    threshold: string;
  }) => {
    setIsLoading(true);
    try {
      const pks = values.publicKeys
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const weights = values.weights
        .split(/[\n,]+/)
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      const threshold = parseInt(values.threshold);

      if (pks.length !== weights.length) {
        throw new Error("Number of public keys and weights must match");
      }

      showToast({ style: Toast.Style.Animated, title: "Creating Address..." });
      const result = await keyService.createMultiSigAddress(
        pks,
        weights,
        threshold,
      );
      showToast({ style: Toast.Style.Success, title: "Address Created" });
      push(<MultiSigResultView result={result} />);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Create Multi-Sig Address"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Address" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="publicKeys"
        title="Public Keys"
        placeholder="Enter public keys (one per line or comma separated)"
        info="List of public keys participating in the multi-sig"
      />
      <Form.TextArea
        id="weights"
        title="Weights"
        placeholder="Enter weights (e.g., 1, 1, 2)"
        info="Weight for each public key (must match order)"
      />
      <Form.TextField
        id="threshold"
        title="Threshold"
        placeholder="Enter threshold (e.g., 2)"
        info="Minimum total weight required to sign"
      />
    </Form>
  );
}

function CombineSignaturesForm() {
  const { push, pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const keyService = new KeyService();

  const handleSubmit = async (values: {
    publicKeys: string;
    weights: string;
    threshold: string;
    signatures: string;
  }) => {
    setIsLoading(true);
    try {
      const pks = values.publicKeys
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const weights = values.weights
        .split(/[\n,]+/)
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      const signatures = values.signatures
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const threshold = parseInt(values.threshold);

      showToast({ style: Toast.Style.Animated, title: "Combining..." });
      const result = await keyService.combinePartialSignatures(
        pks,
        weights,
        signatures,
        threshold,
      );
      showToast({ style: Toast.Style.Success, title: "Signatures Combined" });
      push(
        <Detail
          markdown={`# Combined Signature\n\n\`\`\`\n${result}\n\`\`\``}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={result} title="Copy Signature" />
            </ActionPanel>
          }
        />,
      );
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Combine Signatures"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Combine" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="publicKeys"
        title="Public Keys"
        placeholder="Enter public keys"
      />
      <Form.TextArea id="weights" title="Weights" placeholder="Enter weights" />
      <Form.TextField
        id="threshold"
        title="Threshold"
        placeholder="Enter threshold"
      />
      <Form.TextArea
        id="signatures"
        title="Signatures"
        placeholder="Enter partial signatures"
      />
    </Form>
  );
}

function MultiSigResultView({
  result,
}: {
  result: { address: string; multiSigInfo: string };
}) {
  const { pop } = useNavigation();
  const markdown = `
# Multi-Sig Address Created

**Address**: \`${result.address}\`

## Details
\`\`\`json
${result.multiSigInfo}
\`\`\`
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            content={result.address}
            title="Copy Address"
          />
          <Action.CopyToClipboard
            content={result.multiSigInfo}
            title="Copy Info JSON"
          />
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}
