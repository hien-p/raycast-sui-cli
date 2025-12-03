import {
  Action,
  ActionPanel,
  List,
  useNavigation,
  Icon,
  Color,
} from "@raycast/api";
import React from "react";
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
import { PTBBuilder } from "./PTBBuilder";
import { KeyManager } from "./KeyManager";
import { CallFunctionWizard } from "./CallFunctionWizard";
import { WalrusStorage } from "./WalrusStorage";

export function SuiCommandPalette() {
  const {
    commands,
    isLoading: isLoadingCommands,
    executeCommand,
  } = useSuiCommands();
  const {
    activeEnv,
    envs,
    switchEnv,
    isLoading: isLoadingEnv,
  } = useSuiEnvironment();
  const {
    history,
    favorites,
    isLoading: isLoadingHistory,
    addToHistory,
    toggleFavorite,
  } = useSuiHistory();
  const { templates, isLoading: isLoadingTemplates } = useSuiTemplates();
  const { push } = useNavigation();

  const isLoading =
    isLoadingCommands || isLoadingEnv || isLoadingHistory || isLoadingTemplates;

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
      push(
        <CommandResult result={String(error)} title={`${command} (Failed)`} />,
      );
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
    if (command.includes("active-address"))
      keywords.push("wallet", "account", "address");
    if (command.includes("envs"))
      keywords.push("network", "switch", "environment");
    if (command.includes("envs"))
      keywords.push("network", "switch", "environment");
    if (command.includes("addresses"))
      keywords.push("wallet", "account", "key", "list");
    if (command.includes("faucet"))
      keywords.push("tokens", "coins", "fund", "request");
    if (command.includes("tx-block"))
      keywords.push("transaction", "inspect", "digest");
    if (command.includes("help")) keywords.push("docs", "usage", "info");
    return keywords;
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search Sui commands...">
      {/* Keys & Security Section */}
      <List.Section title="Keys & Security">
        <List.Item
          title="Key Manager"
          subtitle="List, Generate, Import, Export Keys"
          icon={{ source: Icon.Key, tintColor: Color.Yellow }}
          keywords={[
            "key",
            "keytool",
            "generate",
            "import",
            "export",
            "sign",
            "wallet",
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Open Key Manager"
                onAction={() => push(<KeyManager />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Move Development Section */}
      <List.Section title="Move Development">
        <List.Item
          title="Package Manager"
          subtitle="Build, Test, Publish Move Packages"
          icon={{ source: Icon.Box, tintColor: Color.Blue }}
          keywords={[
            "move",
            "build",
            "test",
            "publish",
            "package",
            "deploy",
            "coverage",
            "migrate",
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Open Package Manager"
                onAction={() => push(<PackageManagement />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Transactions Section */}
      <List.Section title="Transactions">
        <List.Item
          title="Call Function"
          subtitle="Execute any Move function"
          icon={{ source: Icon.Play, tintColor: Color.Green }}
          keywords={[
            "call",
            "execute",
            "function",
            "move",
            "transaction",
            "ptb",
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Open Call Wizard"
                onAction={() => push(<CallFunctionWizard />)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="PTB Builder"
          subtitle="Build and execute programmable transaction blocks"
          icon={Icon.Layers}
          actions={
            <ActionPanel>
              <Action.Push title="Open Builder" target={<PTBBuilder />} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Inspect Transaction"
          subtitle="View transaction details by digest"
          icon={Icon.MagnifyingGlass}
          keywords={["tx", "transaction", "inspect", "digest", "view"]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Inspect Transaction"
                target={<TransactionDetail />}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Objects & Assets Section */}
      <List.Section title="Objects & Assets">
        <List.Item
          title="My Objects"
          subtitle="Browse owned objects"
          icon={{ source: Icon.List, tintColor: Color.Purple }}
          keywords={["objects", "nfts", "assets", "owned", "browse"]}
          actions={
            <ActionPanel>
              <Action
                title="View Objects"
                onAction={() => push(<ObjectList />)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Gas Coins"
          subtitle="View, Split, Merge Gas"
          icon={{ source: Icon.Coins, tintColor: Color.Yellow }}
          keywords={["gas", "coins", "balance", "split", "merge", "sui"]}
          actions={
            <ActionPanel>
              <Action
                title="View Gas Coins"
                onAction={() => push(<GasList />)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Request Tokens"
          subtitle="Get SUI from Faucet"
          icon={{ source: Icon.Download, tintColor: Color.Blue }}
          keywords={["faucet", "fund", "tokens", "free", "testnet"]}
          actions={
            <ActionPanel>
              <Action
                title="Open Faucet"
                onAction={() => push(<FaucetForm />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Walrus Storage Section */}
      <List.Section title="Walrus Storage">
        <List.Item
          title="Walrus Storage"
          subtitle="Upload, Download, Manage Blobs"
          icon={{ source: Icon.HardDrive, tintColor: Color.Orange }}
          keywords={[
            "walrus",
            "storage",
            "blob",
            "upload",
            "download",
            "decentralized",
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Open Walrus Storage"
                onAction={() => push(<WalrusStorage />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Environment Section */}
      <List.Section title="Environment">
        <List.Item
          title="Active Environment"
          subtitle={activeEnv || "Loading..."}
          icon={{ source: Icon.Globe, tintColor: Color.Green }}
          keywords={[
            "env",
            "network",
            "switch",
            "active",
            "mainnet",
            "testnet",
          ]}
          accessories={[
            {
              tag: {
                value: activeEnv || "...",
                color: activeEnv?.includes("mainnet") ? Color.Red : Color.Green,
              },
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Manage Environments"
                onAction={() => push(<EnvironmentList />)}
              />
              <ActionPanel.Submenu title="Quick Switch">
                {envs.map((env) => (
                  <Action
                    key={env}
                    title={env}
                    onAction={() => switchEnv(env)}
                  />
                ))}
              </ActionPanel.Submenu>
            </ActionPanel>
          }
        />
        <List.Item
          title="Manage Addresses"
          subtitle="Switch, Create, List Addresses"
          icon={{ source: Icon.Person, tintColor: Color.Blue }}
          keywords={["address", "wallet", "account", "switch"]}
          actions={
            <ActionPanel>
              <Action
                title="Open Address Manager"
                onAction={() => push(<AddressList />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <List.Section title="Favorites">
          {commands
            .filter((cmd) => favorites.includes(cmd.command))
            .map((cmd) => (
              <List.Item
                key={`fav-${cmd.id}`}
                title={cmd.title}
                subtitle={cmd.description}
                icon={{ source: Icon.Star, tintColor: Color.Yellow }}
                accessories={[{ text: cmd.category }]}
                keywords={getKeywords(cmd.command)}
                actions={
                  <ActionPanel>
                    <Action
                      title="Execute"
                      onAction={() => handleExecute(cmd.command)}
                    />
                    <Action
                      title="Remove from Favorites"
                      onAction={() => toggleFavorite(cmd.command)}
                      icon={Icon.StarDisabled}
                    />
                    <Action.CopyToClipboard
                      content={cmd.command}
                      title="Copy Command"
                    />
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      )}

      {/* Recent History Section */}
      {history.length > 0 && (
        <List.Section title="Recent History">
          {history.slice(0, 5).map((item, index) => (
            <List.Item
              key={`hist-${index}`}
              title={getCommandTitle(item.command)}
              subtitle={new Date(item.timestamp).toLocaleTimeString()}
              icon={Icon.Clock}
              keywords={getKeywords(item.command)}
              actions={
                <ActionPanel>
                  <Action
                    title="Execute"
                    onAction={() => handleExecute(item.command)}
                  />
                  <Action
                    title={
                      favorites.includes(item.command)
                        ? "Remove from Favorites"
                        : "Add to Favorites"
                    }
                    onAction={() => toggleFavorite(item.command)}
                    icon={Icon.Star}
                  />
                  <Action.CopyToClipboard
                    content={item.command}
                    title="Copy Command"
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {/* Templates Section */}
      {templates.length > 0 && (
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
                  <Action
                    title="Use Template"
                    onAction={() => push(<TemplateForm template={template} />)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {/* Help & Resources Section */}
      <List.Section title="Help & Resources">
        <List.Item
          title="Sui Documentation"
          subtitle="Open official docs"
          icon={Icon.Book}
          keywords={["docs", "documentation", "help", "web"]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                url="https://docs.sui.io/"
                title="Open Sui Docs"
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Walrus Documentation"
          subtitle="Learn about decentralized storage"
          icon={Icon.Book}
          keywords={["walrus", "docs", "storage", "help"]}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser
                url="https://docs.wal.app/"
                title="Open Walrus Docs"
              />
            </ActionPanel>
          }
        />
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
                  <Action
                    title="Execute"
                    onAction={() => handleExecute(cmd.command)}
                  />
                </ActionPanel>
              }
            />
          ))}
      </List.Section>

      {/* All Commands Section */}
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
                  <Action
                    title="Execute"
                    onAction={() => handleExecute(cmd.command)}
                  />
                  <Action
                    title={
                      favorites.includes(cmd.command)
                        ? "Remove from Favorites"
                        : "Add to Favorites"
                    }
                    onAction={() => toggleFavorite(cmd.command)}
                    icon={Icon.Star}
                  />
                  <Action.CopyToClipboard
                    content={cmd.command}
                    title="Copy Command"
                  />
                </ActionPanel>
              }
            />
          ))}
      </List.Section>
    </List>
  );
}
