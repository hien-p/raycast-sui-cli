import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Detail,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState, useEffect } from "react";
import {
  WalrusService,
  BlobInfo,
  UploadResult,
  StorageInfo,
} from "../services/WalrusService";

export function WalrusStorage() {
  const [blobs, setBlobs] = useState<BlobInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalled, setIsInstalled] = useState(true);
  const walrusService = new WalrusService();
  useNavigation();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const installed = await walrusService.checkInstallation();
      setIsInstalled(installed);

      if (!installed) {
        setIsLoading(false);
        return;
      }

      const [blobList, info] = await Promise.all([
        walrusService.listBlobs(),
        walrusService.getSystemInfo(),
      ]);

      setBlobs(blobList);
      setSystemInfo(info);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load Walrus data",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (blobId: string) => {
    const confirmed = await confirmAlert({
      title: "Delete Blob",
      message:
        "Are you sure you want to delete this blob? This cannot be undone.",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    try {
      showToast({ style: Toast.Style.Animated, title: "Deleting blob..." });
      await walrusService.deleteBlob(blobId);
      showToast({ style: Toast.Style.Success, title: "Blob deleted" });
      loadData();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete",
        message: String(error),
      });
    }
  };

  if (!isInstalled) {
    return (
      <Detail
        markdown={`
# Walrus CLI Not Found

The Walrus CLI is not installed or not in your PATH.

## Installation

### Mainnet
\`\`\`bash
curl -sSf https://install.wal.app | sh
\`\`\`

### Testnet
\`\`\`bash
curl -sSf https://install.wal.app | sh -s -- -n testnet
\`\`\`

### Configuration
Download the config file:
\`\`\`bash
curl --create-dirs https://docs.wal.app/setup/client_config.yaml \\
  -o ~/.config/walrus/client_config.yaml
\`\`\`

After installation, restart Raycast and try again.
`}
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="View Installation Docs"
              url="https://docs.wal.app"
            />
            <Action
              title="Retry"
              icon={Icon.ArrowClockwise}
              onAction={loadData}
            />
          </ActionPanel>
        }
      />
    );
  }

  const epochsRemaining = (expiresEpoch: number) => {
    if (!systemInfo) return "Unknown";
    const remaining = expiresEpoch - systemInfo.currentEpoch;
    if (remaining <= 0) return "Expired";
    const days = remaining * 14; // 14 days per epoch
    if (days > 365)
      return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}mo`;
    if (days > 30) return `${Math.floor(days / 30)}mo ${days % 30}d`;
    return `${days}d`;
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search blobs..."
      navigationTitle={`Walrus Storage | Epoch ${systemInfo?.currentEpoch || "?"}`}
    >
      <List.Section title="Quick Actions">
        <List.Item
          title="Upload File"
          icon={{ source: Icon.Upload, tintColor: Color.Blue }}
          accessories={[{ text: "Upload to Walrus" }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Upload File"
                target={<UploadBlobForm onComplete={loadData} />}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Download by Blob ID"
          icon={{ source: Icon.Download, tintColor: Color.Green }}
          accessories={[{ text: "Retrieve blob" }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Download Blob"
                target={<DownloadBlobForm />}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Storage Info"
          icon={{ source: Icon.Info, tintColor: Color.Purple }}
          accessories={[{ text: `Epoch ${systemInfo?.currentEpoch || "?"}` }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View System Info"
                target={<SystemInfoView />}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="My Blobs" subtitle={`${blobs.length} blobs`}>
        {blobs.map((blob) => {
          const remaining = epochsRemaining(blob.expiresEpoch);
          const isExpiringSoon =
            systemInfo && blob.expiresEpoch - systemInfo.currentEpoch <= 3;

          return (
            <List.Item
              key={blob.blobId}
              title={blob.blobId.slice(0, 16) + "..."}
              subtitle={formatSize(blob.size)}
              icon={{
                source: Icon.Document,
                tintColor: isExpiringSoon ? Color.Orange : Color.SecondaryText,
              }}
              accessories={[
                {
                  tag: {
                    value: remaining,
                    color: isExpiringSoon ? Color.Orange : Color.Green,
                  },
                },
                {
                  tag: {
                    value: blob.deletable ? "Deletable" : "Permanent",
                    color: blob.deletable ? Color.Blue : Color.Purple,
                  },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Blob Id"
                    content={blob.blobId}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.Push
                    title="View Details"
                    icon={Icon.Eye}
                    target={
                      <BlobDetailView blob={blob} systemInfo={systemInfo} />
                    }
                  />
                  <Action.Push
                    title="Download"
                    icon={Icon.Download}
                    target={<DownloadBlobForm defaultBlobId={blob.blobId} />}
                  />
                  {blob.deletable && (
                    <Action
                      title="Delete Blob"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      onAction={() => handleDelete(blob.blobId)}
                    />
                  )}
                  <Action.Push
                    title="Extend Lifetime"
                    icon={Icon.Clock}
                    target={
                      <ExtendBlobForm
                        blobObjectId={blob.objectId || blob.blobId}
                        currentEpoch={blob.expiresEpoch}
                        onComplete={loadData}
                      />
                    }
                  />
                  {blob.objectId && (
                    <Action.CopyToClipboard
                      title="Copy Object Id"
                      content={blob.objectId}
                    />
                  )}
                  <ActionPanel.Section>
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={loadData}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>

      {blobs.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Blobs Found"
          description="Upload your first file to Walrus"
          actions={
            <ActionPanel>
              <Action.Push
                title="Upload File"
                target={<UploadBlobForm onComplete={loadData} />}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

function UploadBlobForm({ onComplete }: { onComplete: () => void }) {
  const { push, pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costEstimate, setCostEstimate] = useState<string | null>(null);
  const walrusService = new WalrusService();

  const handleEstimateCost = async (values: {
    file: string[];
    epochs: string;
  }) => {
    if (!values.file || values.file.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: "Select a file first",
      });
      return;
    }

    try {
      showToast({ style: Toast.Style.Animated, title: "Estimating cost..." });
      const result = await walrusService.estimateCost(
        values.file[0],
        parseInt(values.epochs) || 1,
      );
      setCostEstimate(result.cost);
      showToast({
        style: Toast.Style.Success,
        title: `Estimated: ${result.cost}`,
      });
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to estimate",
        message: String(error),
      });
    }
  };

  const handleSubmit = async (values: {
    file: string[];
    epochs: string;
    deletable: boolean;
  }) => {
    if (!values.file || values.file.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: "Select a file to upload",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      showToast({ style: Toast.Style.Animated, title: "Uploading..." });

      const result = await walrusService.uploadBlob(values.file[0], {
        epochs: parseInt(values.epochs) || 1,
        deletable: values.deletable,
      });

      showToast({ style: Toast.Style.Success, title: "Upload complete" });
      onComplete();
      push(<UploadResultView result={result} />);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Upload failed",
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Upload" onSubmit={handleSubmit} />
          <Action.SubmitForm
            title="Estimate Cost"
            icon={Icon.Calculator}
            onSubmit={handleEstimateCost}
          />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="file"
        title="File"
        allowMultipleSelection={false}
        info="Select the file to upload to Walrus"
      />

      <Form.TextField
        id="epochs"
        title="Storage Duration (Epochs)"
        defaultValue="15"
        info="1 epoch = 14 days. Max 53 epochs (2 years)"
      />

      <Form.Checkbox
        id="deletable"
        title="Deletable"
        label="Allow deletion before expiry"
        defaultValue={true}
        info="If unchecked, blob will be permanent until expiry"
      />

      {costEstimate && (
        <Form.Description title="Estimated Cost" text={costEstimate} />
      )}

      <Form.Description
        title="Duration Guide"
        text={`• 1 epoch = 14 days
• 15 epochs = ~7 months
• 53 epochs = 2 years (maximum)`}
      />
    </Form>
  );
}

function UploadResultView({ result }: { result: UploadResult }) {
  const { pop } = useNavigation();

  const markdown = `
# Upload Successful

## Blob ID
\`${result.blobId}\`

${result.objectId ? `## Object ID\n\`${result.objectId}\`` : ""}

## Details
- **Size**: ${formatSize(result.size)}
${result.cost ? `- **Cost**: ${result.cost}` : ""}
${result.mediaType ? `- **Media Type**: ${result.mediaType}` : ""}

${result.suiRefUrl ? `## Sui Reference\n[View on Sui](${result.suiRefUrl})` : ""}
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Blob Id"
            content={result.blobId}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          {result.objectId && (
            <Action.CopyToClipboard
              title="Copy Object Id"
              content={result.objectId}
            />
          )}
          {result.suiRefUrl && (
            <Action.OpenInBrowser title="View on Sui" url={result.suiRefUrl} />
          )}
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}

function DownloadBlobForm({ defaultBlobId }: { defaultBlobId?: string }) {
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const walrusService = new WalrusService();

  const handleSubmit = async (values: {
    blobId: string;
    outputPath: string;
  }) => {
    if (!values.blobId) {
      showToast({ style: Toast.Style.Failure, title: "Enter a Blob ID" });
      return;
    }

    setIsSubmitting(true);
    try {
      showToast({ style: Toast.Style.Animated, title: "Downloading..." });

      const outputPath = values.outputPath || `~/Downloads/${values.blobId}`;
      await walrusService.downloadBlob(values.blobId, outputPath);

      showToast({ style: Toast.Style.Success, title: "Download complete" });
      pop();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Download failed",
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Download" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="blobId"
        title="Blob ID"
        defaultValue={defaultBlobId}
        placeholder="Enter Walrus blob ID"
      />

      <Form.TextField
        id="outputPath"
        title="Output Path"
        placeholder="~/Downloads/filename"
        info="Where to save the downloaded file"
      />
    </Form>
  );
}

function ExtendBlobForm({
  blobObjectId,
  currentEpoch,
  onComplete,
}: {
  blobObjectId: string;
  currentEpoch: number;
  onComplete: () => void;
}) {
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const walrusService = new WalrusService();

  const handleSubmit = async (values: { epochs: string }) => {
    setIsSubmitting(true);
    try {
      showToast({ style: Toast.Style.Animated, title: "Extending..." });

      await walrusService.extendBlob(blobObjectId, parseInt(values.epochs));

      showToast({ style: Toast.Style.Success, title: "Lifetime extended" });
      onComplete();
      pop();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to extend",
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Extend" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description title="Current Expiry" text={`Epoch ${currentEpoch}`} />

      <Form.TextField
        id="epochs"
        title="Additional Epochs"
        defaultValue="10"
        info="Number of epochs to add (1 epoch = 14 days)"
      />
    </Form>
  );
}

function BlobDetailView({
  blob,
  systemInfo,
}: {
  blob: BlobInfo;
  systemInfo: StorageInfo | null;
}) {
  const { pop } = useNavigation();

  const remaining = systemInfo
    ? blob.expiresEpoch - systemInfo.currentEpoch
    : 0;
  const daysRemaining = remaining * 14;

  const markdown = `
# Blob Details

## Blob ID
\`${blob.blobId}\`

${blob.objectId ? `## Object ID\n\`${blob.objectId}\`` : ""}

## Properties
| Property | Value |
|----------|-------|
| Size | ${formatSize(blob.size)} |
| Encoded Size | ${blob.encodedSize ? formatSize(blob.encodedSize) : "Unknown"} |
| Expires | Epoch ${blob.expiresEpoch} (~${daysRemaining} days) |
| Deletable | ${blob.deletable ? "Yes" : "No"} |
${blob.certifiedEpoch ? `| Certified | Epoch ${blob.certifiedEpoch} |` : ""}
${blob.storedEpoch ? `| Stored | Epoch ${blob.storedEpoch} |` : ""}
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Blob Id" content={blob.blobId} />
          {blob.objectId && (
            <Action.CopyToClipboard
              title="Copy Object Id"
              content={blob.objectId}
            />
          )}
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Blob ID" text={blob.blobId} />
          <Detail.Metadata.Label title="Size" text={formatSize(blob.size)} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Expires"
            text={`Epoch ${blob.expiresEpoch}`}
          />
          <Detail.Metadata.Label
            title="Days Remaining"
            text={`~${daysRemaining} days`}
          />
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item
              text={blob.deletable ? "Deletable" : "Permanent"}
              color={blob.deletable ? Color.Blue : Color.Purple}
            />
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
    />
  );
}

function SystemInfoView() {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const walrusService = new WalrusService();
  const { pop } = useNavigation();

  useEffect(() => {
    async function loadInfo() {
      try {
        const systemInfo = await walrusService.getSystemInfo();
        setInfo(systemInfo);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load info",
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadInfo();
  }, []);

  const markdown = info
    ? `
# Walrus Storage System

## Current State
| Property | Value |
|----------|-------|
| Current Epoch | ${info.currentEpoch} |
| Epoch Duration | ${info.epochDuration} |
${info.pricePerUnit ? `| Price per Unit | ${info.pricePerUnit} |` : ""}

## Network Info
- **Mainnet**: Production network with 2-year max storage
- **Testnet**: Testing network with free WAL tokens

## Storage Costs
Storage is priced based on:
- Encoded size (~5x original due to erasure coding)
- Number of epochs (duration)
- Current network demand

## Epoch Timeline
- 1 epoch = 14 days
- Max storage = 53 epochs (~2 years)
`
    : "Loading...";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="View Walrus Docs"
            url="https://docs.wal.app"
          />
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
