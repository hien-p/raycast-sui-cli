import { Action, ActionPanel, List, Icon, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { CommandService } from "../services/CommandService";
import { ObjectDetail } from "./ObjectDetail";

interface SuiObject {
    data: {
        objectId: string;
        version: string;
        digest: string;
        type: string;
        content?: any;
    };
}

export function ObjectList() {
    const [objects, setObjects] = useState<SuiObject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState("all");
    const commandService = new CommandService();

    useEffect(() => {
        async function fetchObjects() {
            try {
                const data = await commandService.executeCommandJson<SuiObject[]>("client objects");
                setObjects(data);
            } catch (error) {
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load objects",
                    message: String(error),
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchObjects();
    }, []);

    const filteredObjects = objects.filter((obj) => {
        if (filterType === "all") return true;
        if (filterType === "coins") return obj.data.type.startsWith("0x2::coin::Coin");
        if (filterType === "others") return !obj.data.type.startsWith("0x2::coin::Coin");
        return true;
    });

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search objects..."
            isShowingDetail
            searchBarAccessory={
                <List.Dropdown tooltip="Filter by Type" onChange={setFilterType}>
                    <List.Dropdown.Item title="All Objects" value="all" />
                    <List.Dropdown.Item title="Coins" value="coins" />
                    <List.Dropdown.Item title="Others" value="others" />
                </List.Dropdown>
            }
        >
            {filteredObjects.map((obj) => {
                const typeName = obj.data.type.split("::").pop() || obj.data.type;
                const isCoin = obj.data.type.startsWith("0x2::coin::Coin");
                const balance = isCoin && obj.data.content?.fields?.balance ? `${obj.data.content.fields.balance} MIST` : null;

                return (
                    <List.Item
                        key={obj.data.objectId}
                        title={typeName}
                        subtitle={obj.data.objectId.slice(0, 6) + "..." + obj.data.objectId.slice(-4)}
                        accessories={balance ? [{ text: balance, icon: Icon.Coins }] : []}
                        icon={isCoin ? Icon.Coins : Icon.Box}
                        detail={
                            <List.Item.Detail
                                metadata={
                                    <List.Item.Detail.Metadata>
                                        <List.Item.Detail.Metadata.Label title="Type" text={obj.data.type} />
                                        <List.Item.Detail.Metadata.Label title="Object ID" text={obj.data.objectId} />
                                        <List.Item.Detail.Metadata.Label title="Version" text={obj.data.version} />
                                        <List.Item.Detail.Metadata.Label title="Digest" text={obj.data.digest} />
                                        {balance && <List.Item.Detail.Metadata.Label title="Balance" text={balance} />}
                                        <List.Item.Detail.Metadata.Separator />
                                        <List.Item.Detail.Metadata.Label title="Fields" />
                                        {obj.data.content?.fields && Object.entries(obj.data.content.fields).map(([key, value]) => (
                                            <List.Item.Detail.Metadata.Label key={key} title={key} text={String(value)} />
                                        ))}
                                    </List.Item.Detail.Metadata>
                                }
                                markdown={`\`\`\`json\n${JSON.stringify(obj.data.content, null, 2)}\n\`\`\``}
                            />
                        }
                        actions={
                            <ActionPanel>
                                <Action.Push title="View Details" icon={Icon.Eye} target={<ObjectDetail object={obj.data} />} />
                                <Action.CopyToClipboard content={obj.data.objectId} title="Copy Object ID" />
                                <Action.CopyToClipboard content={obj.data.type} title="Copy Type" />
                                {balance && <Action.CopyToClipboard content={obj.data.content.fields.balance} title="Copy Balance" />}
                                <Action.CopyToClipboard content={JSON.stringify(obj.data, null, 2)} title="Copy Full JSON" />
                            </ActionPanel>
                        }
                    />
                );
            })}
        </List>
    );
}
