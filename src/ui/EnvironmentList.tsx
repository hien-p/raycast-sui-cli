import { Action, ActionPanel, Icon, List, useNavigation, Color } from "@raycast/api";
import { useSuiEnvironment } from "../state/useSuiEnvironment";
import { AddEnvironmentForm } from "./AddEnvironmentForm";

export function EnvironmentList() {
    const { envs, activeEnv, switchEnv, removeEnv, isLoading } = useSuiEnvironment();
    const { push } = useNavigation();

    return (
        <List isLoading={isLoading} searchBarPlaceholder="Search environments...">
            <List.Section title="Environments">
                {envs.map((env) => (
                    <List.Item
                        key={env}
                        title={env}
                        icon={env === activeEnv ? { source: Icon.CheckCircle, tintColor: Color.Green } : Icon.Circle}
                        accessories={env === activeEnv ? [{ text: "Active" }] : []}
                        actions={
                            <ActionPanel>
                                <Action title="Switch to Environment" icon={Icon.Switch} onAction={() => switchEnv(env)} />
                                <Action
                                    title="Add New Environment"
                                    icon={Icon.Plus}
                                    onAction={() => push(<AddEnvironmentForm />)}
                                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                                />
                                {env !== activeEnv && (
                                    <Action
                                        title="Delete Environment"
                                        icon={Icon.Trash}
                                        style={Action.Style.Destructive}
                                        onAction={() => removeEnv(env)}
                                        shortcut={{ modifiers: ["ctrl"], key: "x" }}
                                    />
                                )}
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
            <List.Section title="Actions">
                <List.Item
                    title="Add New Environment"
                    icon={Icon.Plus}
                    actions={
                        <ActionPanel>
                            <Action
                                title="Add New Environment"
                                onAction={() => push(<AddEnvironmentForm />)}
                            />
                        </ActionPanel>
                    }
                />
            </List.Section>
        </List>
    );
}
