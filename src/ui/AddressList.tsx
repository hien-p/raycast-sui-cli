import { Action, ActionPanel, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useState, useEffect } from "react";
import { AddressService } from "../services/AddressService";
import { CommandResult } from "./CommandResult";

export function AddressList() {
    const [addresses, setAddresses] = useState<{
        address: string;
        alias: string | null;
        balance: string;
        allBalances: { coinType: string; totalBalance: string; count: number }[];
        objectCount: number;
    }[]>([]);
    const [activeAddress, setActiveAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const service = new AddressService();
    const { push } = useNavigation();

    const loadAddresses = async () => {
        setIsLoading(true);
        try {
            const [addrs, active] = await Promise.all([
                service.getAddresses(),
                service.getActiveAddress()
            ]);

            // Fetch details for all addresses
            const addressesWithDetails = await Promise.all(
                addrs.map(async (item) => {
                    const [balance, allBalances, objectCount] = await Promise.all([
                        service.getBalance(item.address),
                        service.getAllBalances(item.address),
                        service.getObjectCount(item.address)
                    ]);
                    return { ...item, balance, allBalances, objectCount };
                })
            );

            setAddresses(addressesWithDetails);
            setActiveAddress(active);
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Failed to load addresses", message: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    const handleSwitch = async (address: string) => {
        try {
            await service.switchAddress(address);
            setActiveAddress(address);
            showToast({ style: Toast.Style.Success, title: "Switched Address" });
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Failed to switch", message: String(error) });
        }
    };

    const handleCreate = async (keyScheme: "ed25519" | "secp256k1" | "secp256r1") => {
        try {
            showToast({ style: Toast.Style.Animated, title: "Creating Address..." });
            const result = await service.createAddress(keyScheme);
            showToast({ style: Toast.Style.Success, title: "Address Created" });
            push(<CommandResult result={result} title="New Address" />);
            loadAddresses();
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Failed to create", message: String(error) });
        }
    };

    return (
        <List isLoading={isLoading} searchBarPlaceholder="Search addresses..." isShowingDetail>
            {addresses.map((item) => {
                const isActive = item.address === activeAddress;
                const title = item.alias ? item.alias : item.address;
                const subtitle = item.alias ? item.address : "No Alias";

                const isError = item.balance.startsWith("Error:");
                const balanceDisplay = isError ? "Failed" : item.balance;
                const accessoryIcon = isError ? Icon.Warning : Icon.Coins;
                const accessoryColor = isError ? "red" : undefined;
                const tooltip = isError ? item.balance : undefined;

                const explorerUrl = service.getExplorerUrl(item.address);

                const markdown = `
# ${item.alias || "Address Details"}

**Address**: \`${item.address}\`
${isActive ? "**Status**: ✅ Active" : ""}

---

## 💰 Coin Balances
| Coin | Balance | Objects |
|------|---------|---------|
${item.allBalances.length > 0
                        ? item.allBalances.map(b => `| ${b.coinType.split("::").pop()} | ${b.totalBalance} | ${b.count} |`).join("\n")
                        : "| No coins found | - | - |"}

---

## 📦 Objects
**Total Objects**: ${item.objectCount}

`;

                return (
                    <List.Item
                        key={item.address}
                        title={title}
                        subtitle={subtitle}
                        keywords={[item.address, item.alias || ""]}
                        icon={isActive ? Icon.CheckCircle : Icon.Circle}
                        accessories={[
                            {
                                text: balanceDisplay,
                                icon: { source: accessoryIcon, tintColor: accessoryColor },
                                tooltip: tooltip
                            }
                        ]}
                        detail={
                            <List.Item.Detail
                                markdown={markdown}
                                metadata={
                                    <List.Item.Detail.Metadata>
                                        <List.Item.Detail.Metadata.Label title="Alias" text={item.alias || "-"} />
                                        <List.Item.Detail.Metadata.Label title="Address" text={item.address} />
                                        <List.Item.Detail.Metadata.Label title="Active" icon={isActive ? Icon.Check : Icon.Multiply} />
                                        <List.Item.Detail.Metadata.Separator />
                                        <List.Item.Detail.Metadata.Label title="SUI Balance" text={item.balance} />
                                        <List.Item.Detail.Metadata.Label title="Total Objects" text={String(item.objectCount)} />
                                    </List.Item.Detail.Metadata>
                                }
                            />
                        }
                        actions={
                            <ActionPanel>
                                {!isActive && (
                                    <Action title="Switch to Address" icon={Icon.Switch} onAction={() => handleSwitch(item.address)} />
                                )}
                                <Action.OpenInBrowser url={explorerUrl} title="View on Suiscan" />
                                <Action.CopyToClipboard content={item.address} title="Copy Address" />
                                {item.alias && <Action.CopyToClipboard content={item.alias} title="Copy Alias" />}
                                {isError && <Action.CopyToClipboard content={item.balance} title="Copy Error Details" icon={Icon.ExclamationMark} />}
                                <ActionPanel.Section title="Create New Address">
                                    <Action title="Create Ed25519" icon={Icon.Plus} onAction={() => handleCreate("ed25519")} />
                                    <Action title="Create Secp256k1" icon={Icon.Plus} onAction={() => handleCreate("secp256k1")} />
                                    <Action title="Create Secp256r1" icon={Icon.Plus} onAction={() => handleCreate("secp256r1")} />
                                </ActionPanel.Section>
                            </ActionPanel>
                        }
                    />
                );
            })}
        </List>
    );
}
