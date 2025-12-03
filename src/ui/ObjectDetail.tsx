import { Detail, ActionPanel, Action } from "@raycast/api";

interface ObjectDetailProps {
  object: any;
}

export function ObjectDetail({ object }: ObjectDetailProps) {
  const fields = object.content?.fields || {};
  const display = object.display?.data || {};
  const imageUrl =
    display.image_url ||
    display.img_url ||
    display.url ||
    fields.image_url ||
    fields.img_url ||
    fields.url;

  const markdown = `
# Object Details

${imageUrl ? `![NFT Image](${imageUrl})` : ""}

**Object ID**: \`${object.objectId}\`
**Type**: \`${object.type}\`
**Version**: \`${object.version}\`
**Digest**: \`${object.digest}\`

## Content

\`\`\`json
${JSON.stringify(object.content, null, 2)}
\`\`\`
    `;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Object ID" text={object.objectId} />
          <Detail.Metadata.Label title="Type" text={object.type} />
          <Detail.Metadata.Label title="Version" text={object.version} />
          <Detail.Metadata.Separator />
          {object.content?.fields &&
            Object.entries(object.content.fields).map(([key, value]) => (
              <Detail.Metadata.Label
                key={key}
                title={key}
                text={String(value)}
              />
            ))}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            content={object.objectId}
            title="Copy Object Id"
          />
          <Action.CopyToClipboard
            content={JSON.stringify(object, null, 2)}
            title="Copy JSON"
          />
        </ActionPanel>
      }
    />
  );
}
