import { Detail, ActionPanel, Action, Form, useNavigation, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { CommandService } from "../services/CommandService";

export function TransactionDetail() {
    const [digest, setDigest] = useState("");
    const [txData, setTxData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const commandService = new CommandService();

    const handleInspect = async () => {
        if (!digest) return;
        setIsLoading(true);
        try {
            const result = await commandService.executeCommandJson<any>(`client tx-block ${digest}`);
            setTxData(result);
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Failed to inspect", message: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    if (txData) {
        const markdown = `
# Transaction Details

**Digest**: \`${txData.digest}\`
**Status**: ${txData.effects?.status?.status}

## Transaction Block

\`\`\`json
${JSON.stringify(txData, null, 2)}
\`\`\`
        `;

        return (
            <Detail
                markdown={markdown}
                actions={
                    <ActionPanel>
                        <Action title="Inspect Another" onAction={() => { setTxData(null); setDigest(""); }} />
                        <Action.CopyToClipboard content={JSON.stringify(txData, null, 2)} title="Copy JSON" />
                    </ActionPanel>
                }
            />
        );
    }

    return (
        <Form
            isLoading={isLoading}
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Inspect Transaction" onSubmit={handleInspect} />
                </ActionPanel>
            }
        >
            <Form.TextField
                id="digest"
                title="Transaction Digest"
                placeholder="Enter transaction digest..."
                value={digest}
                onChange={setDigest}
            />
        </Form>
    );
}
