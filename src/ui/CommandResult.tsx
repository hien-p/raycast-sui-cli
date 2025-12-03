import { Action, ActionPanel, List } from "@raycast/api";

export function CommandResult({
  result,
  title,
}: {
  result: string;
  title: string;
}) {
  return (
    <List isShowingDetail navigationTitle={title}>
      <List.Item
        title="Output"
        detail={<List.Item.Detail markdown={`\`\`\`\n${result}\n\`\`\``} />}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard content={result} title="Copy Output" />
          </ActionPanel>
        }
      />
    </List>
  );
}
