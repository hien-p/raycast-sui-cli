import { Action, ActionPanel, List, Icon, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { CommandService } from "../services/CommandService";

interface GasObject {
    gasCoinId: string;
    mistBalance: number;
    suiBalance: string;
}

export function GasList() {
    const [gasObjects, setGasObjects] = useState<GasObject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const commandService = new CommandService();

    useEffect(() => {
        async function fetchGas() {
            try {
                const data = await commandService.executeCommandJson<GasObject[]>("client gas");
                // Sort by balance descending
                const sortedData = data.sort((a, b) => b.mistBalance - a.mistBalance);
                setGasObjects(sortedData);
            } catch (error) {
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load gas objects",
                    message: String(error),
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchGas();
    }, []);

    const totalBalance = gasObjects.reduce((acc, obj) => acc + obj.mistBalance, 0);
    const totalSui = (totalBalance / 1_000_000_000).toFixed(4);

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search gas objects..."
            navigationTitle={`Total Balance: ${totalSui} SUI`}
        >
            {gasObjects.map((gas) => (
                <List.Item
                    key={gas.gasCoinId}
                    title={`${gas.suiBalance} SUI`}
                    subtitle={gas.gasCoinId}
                    accessories={[{ text: `${gas.mistBalance} MIST` }]}
                    icon={Icon.Coins}
                    actions={
                        <ActionPanel>
                            <Action.CopyToClipboard content={gas.gasCoinId} title="Copy Gas ID" />
                            <Action.CopyToClipboard content={gas.suiBalance} title="Copy SUI Balance" />
                            <Action.CopyToClipboard content={totalSui} title="Copy Total Balance" />
                        </ActionPanel>
                    }
                />
            ))}
        </List>
    );
}
