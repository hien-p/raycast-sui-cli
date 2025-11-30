import { Action, ActionPanel, Form, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { PackageManagerService } from "../services/PackageManagerService";
import { CommandResult } from "./CommandResult";

export function PackageManagement() {
    const [paths, setPaths] = useState<string[]>([]);
    const [isPackageSelected, setIsPackageSelected] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const { push } = useNavigation();

    const handlePathSubmit = (values: { path: string[] }) => {
        if (values.path && values.path.length > 0) {
            setPaths(values.path);
            setIsPackageSelected(true);
        }
    };

    if (isCreating) {
        return <CreatePackageForm onPackageCreated={(path) => {
            setPaths([path]);
            setIsPackageSelected(true);
            setIsCreating(false);
        }} onCancel={() => setIsCreating(false)} />;
    }

    if (!isPackageSelected) {
        return (
            <Form
                actions={
                    <ActionPanel>
                        <Action.SubmitForm title="Select Package" onSubmit={handlePathSubmit} />
                        <Action
                            title="Create New Package"
                            icon={Icon.Plus}
                            shortcut={{ modifiers: ["cmd"], key: "n" }}
                            onAction={() => setIsCreating(true)}
                        />
                    </ActionPanel>
                }
            >
                <Form.FilePicker
                    id="path"
                    title="Package Path"
                    allowMultipleSelection={false}
                    canChooseDirectories={true}
                    canChooseFiles={false}
                    value={paths}
                    onChange={setPaths}
                    info="Select an existing Move package folder"
                />
            </Form>
        );
    }

    return <PackageActions path={paths[0]} />;
}

function CreatePackageForm({ onPackageCreated, onCancel }: { onPackageCreated: (path: string) => void, onCancel: () => void }) {
    const [name, setName] = useState("");
    const [parentPaths, setParentPaths] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const service = new PackageManagerService();

    const handleSubmit = async () => {
        if (!name || parentPaths.length === 0) {
            showToast({ style: Toast.Style.Failure, title: "Missing fields", message: "Please provide a name and parent directory" });
            return;
        }

        setIsLoading(true);
        try {
            const parentDir = parentPaths[0];
            await service.create(name, parentDir);
            showToast({ style: Toast.Style.Success, title: "Package Created" });
            onPackageCreated(`${parentDir}/${name}`);
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Failed to create package", message: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            isLoading={isLoading}
            navigationTitle="Create New Package"
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Create Package" onSubmit={handleSubmit} />
                    <Action title="Cancel" onAction={onCancel} />
                </ActionPanel>
            }
        >
            <Form.TextField
                id="name"
                title="Package Name"
                placeholder="my_move_package"
                value={name}
                onChange={setName}
            />
            <Form.FilePicker
                id="parent"
                title="Parent Directory"
                allowMultipleSelection={false}
                canChooseDirectories={true}
                canChooseFiles={false}
                value={parentPaths}
                onChange={setParentPaths}
                info="Where should the package be created?"
            />
        </Form>
    );
}

function PackageActions({ path }: { path: string }) {
    const service = new PackageManagerService();
    const { push } = useNavigation();
    const [isLoading, setIsLoading] = useState(false);

    const runAction = async (actionName: string, actionFn: () => Promise<string>) => {
        setIsLoading(true);
        try {
            showToast({ style: Toast.Style.Animated, title: `${actionName}...` });
            const result = await actionFn();
            showToast({ style: Toast.Style.Success, title: "Success" });
            push(<CommandResult result={result} title={`${actionName} Output`} />);
        } catch (error) {
            showToast({
                style: Toast.Style.Failure,
                title: "Failed",
                message: "Check output for details",
            });
            push(<CommandResult result={String(error)} title={`${actionName} Failed`} />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <List isLoading={isLoading} navigationTitle={`Managing: ${path.split("/").pop()}`}>
            <List.Section title="Actions">
                <List.Item
                    title="Build"
                    subtitle="Build the Move package"
                    icon={Icon.Hammer}
                    actions={
                        <ActionPanel>
                            <Action title="Run Build" onAction={() => runAction("Building", () => service.build(path))} />
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Test"
                    subtitle="Run Move tests"
                    icon={Icon.CheckCircle}
                    actions={
                        <ActionPanel>
                            <Action title="Run Tests" onAction={() => runAction("Testing", () => service.test(path))} />
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Publish"
                    subtitle="Publish package to network"
                    icon={Icon.Cloud}
                    actions={
                        <ActionPanel>
                            <Action title="Publish" onAction={() => push(<PublishForm path={path} service={service} />)} />
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Upgrade"
                    subtitle="Upgrade a Move package"
                    icon={Icon.ArrowUpCircle}
                    actions={
                        <ActionPanel>
                            <Action title="Upgrade" onAction={() => push(<UpgradeForm path={path} service={service} />)} />
                        </ActionPanel>
                    }
                />
                <List.Item
                    title="Verify Source"
                    subtitle="Verify local source against on-chain"
                    icon={Icon.Checkmark}
                    actions={
                        <ActionPanel>
                            <Action title="Verify" onAction={() => push(<VerifyForm path={path} service={service} />)} />
                        </ActionPanel>
                    }
                />
            </List.Section>
        </List>
    );
}

function PublishForm({ path, service }: { path: string; service: PackageManagerService }) {
    const { push } = useNavigation();
    const [gasBudget, setGasBudget] = useState("100000000");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            showToast({ style: Toast.Style.Animated, title: "Publishing..." });
            const result = await service.publish(path, parseInt(gasBudget));
            showToast({ style: Toast.Style.Success, title: "Published!" });
            push(<CommandResult result={result} title="Publish Output" />);
        } catch (error) {
            showToast({
                style: Toast.Style.Failure,
                title: "Publish Failed",
                message: "Check output for details",
            });
            push(<CommandResult result={String(error)} title="Publish Failed" />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            isLoading={isLoading}
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Publish Package" onSubmit={handleSubmit} />
                </ActionPanel>
            }
        >
            <Form.TextField
                id="gas"
                title="Gas Budget"
                value={gasBudget}
                onChange={setGasBudget}
            />
        </Form>
    );
}

function UpgradeForm({ path, service }: { path: string; service: PackageManagerService }) {
    const { push } = useNavigation();
    const [capId, setCapId] = useState("");
    const [gasBudget, setGasBudget] = useState("100000000");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            showToast({ style: Toast.Style.Animated, title: "Upgrading..." });
            const result = await service.upgrade(path, capId, parseInt(gasBudget));
            showToast({ style: Toast.Style.Success, title: "Upgraded!" });
            push(<CommandResult result={result} title="Upgrade Output" />);
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Upgrade Failed", message: String(error) });
            push(<CommandResult result={String(error)} title="Upgrade Failed" />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            isLoading={isLoading}
            actions={<ActionPanel><Action.SubmitForm title="Upgrade Package" onSubmit={handleSubmit} /></ActionPanel>}
        >
            <Form.TextField id="capId" title="Upgrade Capability ID" value={capId} onChange={setCapId} placeholder="0x..." />
            <Form.TextField id="gas" title="Gas Budget" value={gasBudget} onChange={setGasBudget} />
        </Form>
    );
}

function VerifyForm({ path, service }: { path: string; service: PackageManagerService }) {
    const { push } = useNavigation();
    const [pkgAddr, setPkgAddr] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            showToast({ style: Toast.Style.Animated, title: "Verifying..." });
            const result = await service.verify(path, pkgAddr);
            showToast({ style: Toast.Style.Success, title: "Verified!" });
            push(<CommandResult result={result} title="Verify Output" />);
        } catch (error) {
            showToast({ style: Toast.Style.Failure, title: "Verification Failed", message: String(error) });
            push(<CommandResult result={String(error)} title="Verification Failed" />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form
            isLoading={isLoading}
            actions={<ActionPanel><Action.SubmitForm title="Verify Source" onSubmit={handleSubmit} /></ActionPanel>}
        >
            <Form.TextField id="pkgAddr" title="Package Address" value={pkgAddr} onChange={setPkgAddr} placeholder="0x..." />
        </Form>
    );
}
