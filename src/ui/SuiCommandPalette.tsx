import { Action, ActionPanel, List, useNavigation, Icon } from "@raycast/api";
import React, { useState } from "react";
import { useSuiCommands } from "../state/useSuiCommands";
import { useSuiEnvironment } from "../state/useSuiEnvironment";
import { useSuiHistory } from "../state/useSuiHistory";
import { useSuiTemplates } from "../state/useSuiTemplates";
import { CommandResult } from "./CommandResult";
import { EnvironmentList } from "./EnvironmentList";
import { GasList } from "./GasList";
import { ObjectList } from "./ObjectList";
import { PackageManagement } from "./PackageManagement";
import { TemplateForm } from "./TemplateForm";
import { AddressList } from "./AddressList";
import { FaucetForm } from "./FaucetForm";
import { TransactionDetail } from "./TransactionDetail";

export function SuiCommandPalette() {
    const { commands, isLoading: isLoadingCommands, executeCommand } = useSuiCommands();
    const { activeEnv, envs, switchEnv, isLoading: isLoadingEnv } = useSuiEnvironment();
    const { history, favorites, isLoading: isLoadingHistory, addToHistory, toggleFavorite } = useSuiHistory();
    const { templates, isLoading: isLoadingTemplates } = useSuiTemplates();
    const [output, setOutput] = useState<string | null>(null);
    const { push } = useNavigation();

    const isLoading = isLoadingCommands || isLoadingEnv || isLoadingHistory || isLoadingTemplates;

    const handleExecute = async (command: string) => {
        try {
            await addToHistory(command);
            if (command === "client envs") {
                push(<EnvironmentList />);
                return;
            }
            if (command === "client gas") {
                push(<GasList />);
                return;
            }
            if (command === "client objects") {
                push(<ObjectList />);
                return;
            }
            if (command === "client addresses") {
                push(<AddressList />);
                return;
            }
            if (command === "client faucet") {
                push(<FaucetForm />);
                return;
            }
            if (command === "client tx-block") {
                push(<TransactionDetail />);
                return;
            }
            const result = await executeCommand(command);
            push(<CommandResult result={result} title={command} />);
        } catch (error) {
            push(<CommandResult result={String(error)} title={`${command} (Failed)`} />);
        }
    };

    const getCommandTitle = (cmdString: string) => {
        const cmd = commands.find((c) => c.command === cmdString);
        return cmd ? cmd.title : cmdString;
    };

    const getKeywords = (command: string): string[] => {
        const parts = command.split(" ");
        const keywords = [...parts];
        if (command.includes("gas")) keywords.push("balance", "coins", "sui");
        if (command.includes("objects")) keywords.push("nfts", "assets", "owned");
        if (command.includes("active-address")) keywords.push("wallet", "account", "address");
        if (command.includes("envs")) keywords.push("network", "switch", "environment");
        if (command.includes("envs")) keywords.push("network", "switch", "environment");
        if (command.includes("addresses")) keywords.push("wallet", "account", "key", "list");
        if (command.includes("faucet")) keywords.push("tokens", "coins", "fund", "request");
        if (command.includes("tx-block")) keywords.push("transaction", "inspect", "digest");
        if (command.includes("help")) keywords.push("docs", "usage", "info");
        return keywords;
    };

    return (
        <List isLoading={isLoading} searchBarPlaceholder="Search Sui commands...">
            <List.Section title="Tools">
                <List.Item
                    title="Package Manager"
                    subtitle="Build, Test, Publish Move Packages"
                    icon={Icon.Box}
                    keywords={["move", "build", "test", "publish", "package", "deploy"]}
                    actions={
                        <ActionPanel>
                            <Action title="Open Package Manager" onAction={() => push(<PackageManagement />)} />
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Request Tokens"
                    subtitle="Get SUI from Faucet"
                    icon={Icon.Coins}
                    keywords={["faucet", "fund", "tokens"]}
                    actions={
                        <ActionPanel>
                            <Action title="Open Faucet" onAction={() => push(<FaucetForm />)} />
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Inspect Transaction"
                    subtitle="View transaction details"
                    icon={Icon.MagnifyingGlass}
                    keywords={["tx", "transaction", "inspect"]}
                    actions={
                        <ActionPanel>
                            <Action title="Open Inspector" onAction={() => push(<TransactionDetail />)} />
                        </ActionPanel>
                    }
                />
            </List.Section>
            <List.Section title="Environment">
                <List.Item
                    title="Active Environment"
                    subtitle={activeEnv || "Loading..."}
                    icon={Icon.Globe}
                    keywords={["env", "network", "switch", "active"]}
                    actions={
                        <ActionPanel>
                            <ActionPanel.Submenu title="Switch Environment">
                                {envs.map((env) => (
                                    <Action key={env} title={env} onAction={() => switchEnv(env)} />
                                ))}
                            </ActionPanel.Submenu>
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Manage Addresses"
                    subtitle="Switch, Create, List Addresses"
                    icon={Icon.Person}
                    keywords={["address", "wallet", "account"]}
                    actions={
                        <ActionPanel>
                            <Action title="Open Address Manager" onAction={() => push(<AddressList />)} />
                        </ActionPanel>
                    }
                />
            </List.Section>
            <List.Section title="Favorites">
                {commands
                    .filter((cmd) => favorites.includes(cmd.command))
                    .map((cmd) => (
                        <List.Item
                            key={`fav-${cmd.id}`}
                            title={cmd.title}
                            subtitle={cmd.description}
                            icon={Icon.Star}
                            accessories={[{ text: cmd.category }]}
                            keywords={getKeywords(cmd.command)}
                            actions={
                                <ActionPanel>
                                    <Action title="Execute" onAction={() => handleExecute(cmd.command)} />
                                    <Action title="Remove from Favorites" onAction={() => toggleFavorite(cmd.command)} icon={Icon.StarDisabled} />
                                    <Action.CopyToClipboard content={cmd.command} title="Copy Command" />
                                </ActionPanel>
                            }
                        />
                    ))}
            </List.Section>
            <List.Section title="Recent History">
                {history.map((item, index) => (
                    <List.Item
                        key={`hist-${index}`}
                        title={getCommandTitle(item.command)}
                        subtitle={new Date(item.timestamp).toLocaleTimeString()}
                        icon={Icon.Clock}
                        keywords={getKeywords(item.command)}
                        actions={
                            <ActionPanel>
                                <Action title="Execute" onAction={() => handleExecute(item.command)} />
                                <Action title={favorites.includes(item.command) ? "Remove from Favorites" : "Add to Favorites"} onAction={() => toggleFavorite(item.command)} icon={Icon.Star} />
                                <Action.CopyToClipboard content={item.command} title="Copy Command" />
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
            <List.Section title="Templates">
                {templates.map((template) => (
                    <List.Item
                        key={template.id}
                        title={template.name}
                        subtitle={template.description}
                        icon={Icon.Document}
                        keywords={["template", "snippet", ...template.name.split(" ")]}
                        actions={
                            <ActionPanel>
                                <Action title="Use Template" onAction={() => push(<TemplateForm template={template} />)} />
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
            <List.Section title="Help & Resources">
                {commands
                    .filter((cmd) => cmd.id === "client-help")
                    .map((cmd) => (
                        <List.Item
                            key={cmd.id}
                            title={cmd.title}
                            subtitle={cmd.description}
                            icon={Icon.QuestionMark}
                            keywords={getKeywords(cmd.command)}
                            actions={
                                <ActionPanel>
                                    <Action title="Execute" onAction={() => handleExecute(cmd.command)} />
                                </ActionPanel>
                            }
                        />
                    ))}
                <List.Item
                    title="Sui Documentation"
                    subtitle="Open official docs"
                    icon={Icon.Globe}
                    keywords={["docs", "documentation", "help", "web"]}
                    actions={
                        <ActionPanel>
                            <Action.OpenInBrowser url="https://docs.sui.io/" />
                        </ActionPanel>
                    }
                />
            </List.Section>
            <List.Section title="All Commands">
                {commands
                    .filter((cmd) => cmd.id !== "client-help")
                    .map((cmd) => (
                        <List.Item
                            key={cmd.id}
                            title={cmd.title}
                            subtitle={cmd.description}
                            accessories={[{ text: cmd.category }]}
                            keywords={getKeywords(cmd.command)}
                            actions={
                                <ActionPanel>
                                    <Action title="Execute" onAction={() => handleExecute(cmd.command)} />
                                    <Action title={favorites.includes(cmd.command) ? "Remove from Favorites" : "Add to Favorites"} onAction={() => toggleFavorite(cmd.command)} icon={Icon.Star} />
                                    <Action.CopyToClipboard content={cmd.command} title="Copy Command" />
                                </ActionPanel>
                            }
                        />
                    ))}
            </List.Section>
        </List>
    );
}
