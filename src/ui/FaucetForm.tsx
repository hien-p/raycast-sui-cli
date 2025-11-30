import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { FaucetService } from "../services/FaucetService";
import { CommandResult } from "./CommandResult";

export function FaucetForm() {
    const [network, setNetwork] = useState<string>("devnet");
    const [isLoading, setIsLoading] = useState(false);
    const service = new FaucetService();
    const { push } = useNavigation();

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            showToast({ style: Toast.Style.Animated, title: "Requesting Tokens..." });
            const result = await service.requestTokens(network as "devnet" | "testnet" | "localnet");
            showToast({ style: Toast.Style.Success, title: "Request Sent" });
            push(<CommandResult result={result} title="Faucet Request" />);
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Request Failed", message: String(error) });
            push(<CommandResult result={String(error)} title="Faucet Failed" />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            isLoading={isLoading}
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Request Tokens" onSubmit={handleSubmit} />
                </ActionPanel>
            }
        >
            <Form.Dropdown id="network" title="Network" value={network} onChange={setNetwork}>
                <Form.Dropdown.Item value="devnet" title="Devnet" />
                <Form.Dropdown.Item value="testnet" title="Testnet" />
                <Form.Dropdown.Item value="localnet" title="Localnet" />
            </Form.Dropdown>
            <Form.Description text="Note: Faucet requests may be rate limited." />
        </Form>
    );
}
