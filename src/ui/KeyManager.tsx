import {
  Action,
  ActionPanel,
  Alert,
  Clipboard,
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
import { useState } from "react";

import { MultiSigTools } from "./MultiSigTools";
import { useSuiKeys } from "../state/useSuiKeys";
import { KeyScheme, WordLength, GeneratedKey } from "../services/KeyService";

export function KeyManager() {
  const { keys, isLoading, loadKeys, exportKey } = useSuiKeys();
  const { push } = useNavigation();

  const handleExport = async (address: string) => {
    const confirmed = await confirmAlert({
      title: "Export Private Key",
      message:
        "This will export your private key. Anyone with access to this key can control your funds. Are you sure?",
      primaryAction: {
        title: "Export",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    const privateKey = await exportKey(address);
    if (privateKey) {
      await Clipboard.copy(privateKey);
      // Auto-clear clipboard after 30 seconds
      setTimeout(async () => {
        const current = await Clipboard.readText();
        if (current === privateKey) {
          await Clipboard.copy("");
          showToast({
            style: Toast.Style.Success,
            title: "Clipboard cleared",
            message: "Private key removed from clipboard",
          });
        }
      }, 30000);

      push(<ExportedKeyView privateKey={privateKey} address={address} />);
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search keys..."
      isShowingDetail
    >
      <List.Section title="Keys">
        {keys.map((key) => (
          <List.Item
            key={key.suiAddress}
            title={key.alias || key.suiAddress.slice(0, 16) + "..."}
            subtitle={key.keyScheme}
            icon={{ source: Icon.Key, tintColor: Color.Yellow }}
            keywords={[key.suiAddress, key.alias || "", key.keyScheme]}
            accessories={[
              {
                tag: {
                  value: key.keyScheme,
                  color:
                    key.keyScheme === "ed25519"
                      ? Color.Blue
                      : key.keyScheme === "secp256k1"
                        ? Color.Orange
                        : Color.Purple,
                },
              },
            ]}
            detail={
              <List.Item.Detail
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label
                      title="Alias"
                      text={key.alias || "-"}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Address"
                      text={key.suiAddress}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Key Scheme"
                      text={key.keyScheme}
                    />
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label
                      title="Public Key (Base64)"
                      text={key.publicBase64Key || "-"}
                    />
                    {key.peerId && (
                      <List.Item.Detail.Metadata.Label
                        title="Peer ID"
                        text={key.peerId}
                      />
                    )}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title="Copy Address"
                  content={key.suiAddress}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action
                  title="Export Private Key"
                  icon={Icon.Upload}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                  onAction={() => handleExport(key.suiAddress)}
                />
                <Action.Push
                  title="Sign Message"
                  icon={Icon.Pencil}
                  shortcut={{ modifiers: ["cmd"], key: "s" }}
                  target={<SignMessageForm address={key.suiAddress} />}
                />
                {key.alias && (
                  <Action.CopyToClipboard
                    title="Copy Alias"
                    content={key.alias}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                )}
                {key.publicBase64Key && (
                  <Action.CopyToClipboard
                    title="Copy Public Key"
                    content={key.publicBase64Key}
                  />
                )}
                <ActionPanel.Section title="Create">
                  <Action.Push
                    title="Generate New Key"
                    icon={Icon.Plus}
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    target={<GenerateKeyForm onComplete={loadKeys} />}
                  />
                  <Action.Push
                    title="Import Key"
                    icon={Icon.Download}
                    shortcut={{ modifiers: ["cmd"], key: "i" }}
                    target={<ImportKeyForm onComplete={loadKeys} />}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={loadKeys}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {keys.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Keys Found"
          description="Generate or import a key to get started"
          actions={
            <ActionPanel>
              <Action.Push
                title="Generate New Key"
                icon={Icon.Plus}
                target={<GenerateKeyForm onComplete={loadKeys} />}
              />
              <Action.Push
                title="Import Key"
                icon={Icon.Download}
                target={<ImportKeyForm onComplete={loadKeys} />}
              />
            </ActionPanel>
          }
        />
      )}
      <List.Section title="Actions">
        <List.Item
          title="Generate New Key"
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action
                title="Generate Key"
                onAction={() => push(<GenerateKeyForm onComplete={loadKeys} />)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Import Key"
          icon={Icon.Download}
          actions={
            <ActionPanel>
              <Action
                title="Import Key"
                onAction={() => push(<ImportKeyForm onComplete={loadKeys} />)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Multi-Sig Tools"
          icon={Icon.TwoPeople}
          actions={
            <ActionPanel>
              <Action
                title="Open Multi-sig Tools"
                onAction={() => push(<MultiSigTools />)}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

function GenerateKeyForm({ onComplete }: { onComplete: () => void }) {
  const { generateKey } = useSuiKeys();
  const { push, pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: {
    scheme: string;
    alias: string;
    wordLength: string;
  }) => {
    setIsSubmitting(true);
    try {
      const result = await generateKey(
        values.scheme as KeyScheme,
        values.alias || undefined,
        parseInt(values.wordLength) as WordLength,
      );

      if (result) {
        onComplete();
        push(<GeneratedKeyView result={result} />);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Key" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="scheme" title="Key Scheme" defaultValue="ed25519">
        <Form.Dropdown.Item value="ed25519" title="Ed25519 (Recommended)" />
        <Form.Dropdown.Item
          value="secp256k1"
          title="Secp256k1 (Bitcoin compatible)"
        />
        <Form.Dropdown.Item
          value="secp256r1"
          title="Secp256r1 (WebAuthn compatible)"
        />
      </Form.Dropdown>

      <Form.TextField
        id="alias"
        title="Alias (Optional)"
        placeholder="my-wallet"
        info="A friendly name for this key"
      />

      <Form.Dropdown id="wordLength" title="Word Length" defaultValue="12">
        <Form.Dropdown.Item value="12" title="12 words (Standard)" />
        <Form.Dropdown.Item value="15" title="15 words" />
        <Form.Dropdown.Item value="18" title="18 words" />
        <Form.Dropdown.Item value="21" title="21 words" />
        <Form.Dropdown.Item value="24" title="24 words (Maximum security)" />
      </Form.Dropdown>

      <Form.Description
        title="Security Warning"
        text="Your recovery phrase will be shown once. Store it securely offline. Anyone with this phrase can access your funds."
      />
    </Form>
  );
}

function GeneratedKeyView({ result }: { result: GeneratedKey }) {
  const [showMnemonic, setShowMnemonic] = useState(false);
  const { pop } = useNavigation();

  const maskedMnemonic = result.mnemonic
    .split(" ")
    .map(() => "••••")
    .join(" ");

  const markdown = `
# Key Generated Successfully

## Address
\`${result.address}\`

## Key Scheme
${result.keyScheme}

${result.alias ? `## Alias\n${result.alias}` : ""}

---

## Recovery Phrase
${showMnemonic ? `\`\`\`\n${result.mnemonic}\n\`\`\`` : `\`${maskedMnemonic}\``}

${showMnemonic ? "" : "*Click 'Reveal Recovery Phrase' to show*"}

---

> **Warning**: This is the ONLY time you'll see this phrase. Write it down and store it securely.
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title={
              showMnemonic ? "Hide Recovery Phrase" : "Reveal Recovery Phrase"
            }
            icon={showMnemonic ? Icon.EyeDisabled : Icon.Eye}
            onAction={() => setShowMnemonic(!showMnemonic)}
          />
          {showMnemonic && (
            <Action.CopyToClipboard
              title="Copy Recovery Phrase"
              content={result.mnemonic}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          )}
          <Action.CopyToClipboard
            title="Copy Address"
            content={result.address}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action
            title="Done"
            icon={Icon.Check}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
            onAction={pop}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Address" text={result.address} />
          <Detail.Metadata.Label title="Scheme" text={result.keyScheme} />
          {result.alias && (
            <Detail.Metadata.Label title="Alias" text={result.alias} />
          )}
          <Detail.Metadata.Separator />
          <Detail.Metadata.TagList title="Status">
            <Detail.Metadata.TagList.Item text="New Key" color={Color.Green} />
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
    />
  );
}

function ImportKeyForm({ onComplete }: { onComplete: () => void }) {
  const { importKey } = useSuiKeys();
  const { pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: {
    input: string;
    scheme: string;
    alias: string;
  }) => {
    setIsSubmitting(true);
    try {
      const address = await importKey(
        values.input,
        values.scheme as KeyScheme,
        values.alias || undefined,
      );

      if (address) {
        onComplete();
        showToast({
          style: Toast.Style.Success,
          title: "Key Imported",
          message: `Address: ${address.slice(0, 16)}...`,
        });
        pop();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Import Key" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.PasswordField
        id="input"
        title="Recovery Phrase or Private Key"
        placeholder="Enter mnemonic words or suiprivkey..."
        info="Your 12-24 word recovery phrase or a suiprivkey format private key"
      />

      <Form.Dropdown id="scheme" title="Key Scheme" defaultValue="ed25519">
        <Form.Dropdown.Item value="ed25519" title="Ed25519" />
        <Form.Dropdown.Item value="secp256k1" title="Secp256k1" />
        <Form.Dropdown.Item value="secp256r1" title="Secp256r1" />
      </Form.Dropdown>

      <Form.TextField
        id="alias"
        title="Alias (Optional)"
        placeholder="imported-wallet"
      />

      <Form.Description
        title="Security"
        text="Your recovery phrase is only used locally and never sent anywhere."
      />
    </Form>
  );
}

function ExportedKeyView({
  privateKey,
  address,
}: {
  privateKey: string;
  address: string;
}) {
  const [showKey, setShowKey] = useState(false);
  const { pop } = useNavigation();

  const maskedKey = privateKey
    .split("")
    .map((_, i) => (i < 10 ? privateKey[i] : "•"))
    .join("");

  const markdown = `
# Private Key Exported

## Address
\`${address}\`

## Private Key
${showKey ? `\`\`\`\n${privateKey}\n\`\`\`` : `\`${maskedKey}\``}

${showKey ? "" : "*Click 'Reveal Private Key' to show*"}

---

> **Warning**: This private key has been copied to your clipboard. It will be automatically cleared in 30 seconds.
>
> Anyone with this key can control your funds. Store it securely.
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title={showKey ? "Hide Private Key" : "Reveal Private Key"}
            icon={showKey ? Icon.EyeDisabled : Icon.Eye}
            onAction={() => setShowKey(!showKey)}
          />
          <Action.CopyToClipboard
            title="Copy Private Key"
            content={privateKey}
          />
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}

function SignMessageForm({ address }: { address: string }) {
  const { signData } = useSuiKeys();
  const { push, pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { data: string; intent: string }) => {
    setIsSubmitting(true);
    try {
      const result = await signData(
        address,
        values.data,
        values.intent as "TransactionData" | "PersonalMessage",
      );

      if (result) {
        push(<SignResultView result={result} />);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Sign" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description title="Signing Address" text={address} />

      <Form.TextArea
        id="data"
        title="Data to Sign"
        placeholder="Enter base64 encoded data..."
        info="The data to sign (base64 encoded)"
      />

      <Form.Dropdown id="intent" title="Intent" defaultValue="PersonalMessage">
        <Form.Dropdown.Item value="PersonalMessage" title="Personal Message" />
        <Form.Dropdown.Item value="TransactionData" title="Transaction Data" />
      </Form.Dropdown>
    </Form>
  );
}

function SignResultView({
  result,
}: {
  result: { suiSignature: string; suiAddress: string };
}) {
  const { pop } = useNavigation();

  const markdown = `
# Signature Created

## Signer Address
\`${result.suiAddress}\`

## Signature
\`\`\`
${result.suiSignature}
\`\`\`
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Signature"
            content={result.suiSignature}
          />
          <Action.CopyToClipboard
            title="Copy Address"
            content={result.suiAddress}
          />
          <Action title="Done" icon={Icon.Check} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}
