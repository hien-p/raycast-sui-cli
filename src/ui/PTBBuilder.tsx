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
  Color,
} from "@raycast/api";
import { useState } from "react";
import { TransactionService } from "../services/TransactionService";

type PTBCommand = {
  type: string;
  args: string;
  description: string;
};

export function PTBBuilder() {
  const [commands, setCommands] = useState<PTBCommand[]>([]);
  const [gasBudget, setGasBudget] = useState<string>("10000000");
  const { push } = useNavigation();
  const transactionService = new TransactionService();

  const addCommand = (cmd: PTBCommand) => {
    setCommands([...commands, cmd]);
  };

  const removeCommand = (index: number) => {
    const newCommands = [...commands];
    newCommands.splice(index, 1);
    setCommands(newCommands);
  };

  const executePTB = async () => {
    if (commands.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: "No commands to execute",
      });
      return;
    }

    try {
      showToast({ style: Toast.Style.Animated, title: "Executing PTB..." });
      const commandStrings = commands.map((c) => `${c.type} ${c.args}`);
      const result = await transactionService.executePTB(
        commandStrings,
        parseInt(gasBudget),
      );
      showToast({ style: Toast.Style.Success, title: "PTB Executed" });

      push(
        <Detail
          markdown={`# PTB Executed\n\n**Digest**: \`${result.digest}\`\n\n## Effects\n\`\`\`json\n${JSON.stringify(result.effects, null, 2)}\n\`\`\``}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                content={result.digest}
                title="Copy Digest"
              />
            </ActionPanel>
          }
        />,
      );
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Execution Failed",
        message: String(error),
      });
    }
  };

  return (
    <List
      navigationTitle="PTB Builder"
      actions={
        <ActionPanel>
          <Action title="Execute Ptb" icon={Icon.Play} onAction={executePTB} />
          <Action.Push
            title="Add Transfer Objects"
            icon={Icon.ArrowRight}
            target={<AddTransferObjectsForm onAdd={addCommand} />}
            shortcut={{ modifiers: ["cmd"], key: "t" }}
          />
          <Action.Push
            title="Add Split Coins"
            icon={Icon.Circle}
            target={<AddSplitCoinsForm onAdd={addCommand} />}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
          <Action.Push
            title="Add Merge Coins"
            icon={Icon.ArrowsContract}
            target={<AddMergeCoinsForm onAdd={addCommand} />}
            shortcut={{ modifiers: ["cmd"], key: "m" }}
          />
          <Action.Push
            title="Add Move Call"
            icon={Icon.Code}
            target={<AddMoveCallForm onAdd={addCommand} />}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action
            title="Clear All"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={() => setCommands([])}
          />
        </ActionPanel>
      }
    >
      <List.Section title="Configuration">
        <List.Item
          title="Gas Budget"
          subtitle={gasBudget}
          icon={Icon.Bolt}
          actions={
            <ActionPanel>
              <Action.Push
                title="Set Gas Budget"
                target={
                  <Form
                    actions={
                      <ActionPanel>
                        <Action.SubmitForm
                          title="Set"
                          onSubmit={(values) => {
                            setGasBudget(values.gasBudget);
                            showToast({ title: "Gas Budget Updated" });
                          }}
                        />
                      </ActionPanel>
                    }
                  >
                    <Form.TextField
                      id="gasBudget"
                      title="Gas Budget"
                      defaultValue={gasBudget}
                    />
                  </Form>
                }
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Commands Queue">
        {commands.map((cmd, index) => (
          <List.Item
            key={index}
            title={cmd.description}
            subtitle={cmd.args}
            icon={{ source: Icon.Circle, tintColor: Color.Blue }}
            actions={
              <ActionPanel>
                <Action
                  title="Remove Command"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => removeCommand(index)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function AddTransferObjectsForm({
  onAdd,
}: {
  onAdd: (cmd: PTBCommand) => void;
}) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Add Transfer Objects"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Command"
            onSubmit={(values) => {
              onAdd({
                type: "--transfer-objects",
                args: `[${values.objects}] ${values.to}`,
                description: "Transfer Objects",
              });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="objects"
        title="Object IDs"
        placeholder="obj1, obj2 (comma separated)"
      />
      <Form.TextField id="to" title="Recipient" placeholder="0x..." />
    </Form>
  );
}

function AddSplitCoinsForm({ onAdd }: { onAdd: (cmd: PTBCommand) => void }) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Add Split Coins"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Command"
            onSubmit={(values) => {
              onAdd({
                type: "--split-coins",
                args: `${values.coin} [${values.amounts}]`,
                description: "Split Coins",
              });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="coin" title="Coin ID" placeholder="gas or objID" />
      <Form.TextField
        id="amounts"
        title="Amounts"
        placeholder="100, 200 (comma separated)"
      />
    </Form>
  );
}

function AddMergeCoinsForm({ onAdd }: { onAdd: (cmd: PTBCommand) => void }) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Add Merge Coins"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Command"
            onSubmit={(values) => {
              onAdd({
                type: "--merge-coins",
                args: `${values.dest} [${values.sources}]`,
                description: "Merge Coins",
              });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="dest"
        title="Destination Coin"
        placeholder="gas or objID"
      />
      <Form.TextField
        id="sources"
        title="Source Coins"
        placeholder="obj1, obj2 (comma separated)"
      />
    </Form>
  );
}

function AddMoveCallForm({ onAdd }: { onAdd: (cmd: PTBCommand) => void }) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Add Move Call"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Command"
            onSubmit={(values) => {
              let args = `${values.package}::${values.module}::${values.function}`;
              if (values.typeArgs) args += ` ${values.typeArgs}`;
              if (values.args) args += ` ${values.args}`;

              onAdd({
                type: "--move-call",
                args: args,
                description: "Move Call",
              });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="package" title="Package ID" placeholder="0x..." />
      <Form.TextField id="module" title="Module" placeholder="name" />
      <Form.TextField id="function" title="Function" placeholder="name" />
      <Form.TextField
        id="typeArgs"
        title="Type Arguments"
        placeholder="<T1, T2>"
      />
      <Form.TextField id="args" title="Arguments" placeholder="arg1 arg2" />
    </Form>
  );
}
