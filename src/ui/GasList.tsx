import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { CommandService } from "../services/CommandService";
import { AddressService } from "../services/AddressService";
import { CommandResult } from "./CommandResult";

interface GasObject {
  gasCoinId: string;
  mistBalance: number;
  suiBalance: string;
}

export function GasList() {
  const [gasObjects, setGasObjects] = useState<GasObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoins, setSelectedCoins] = useState<Set<string>>(new Set());
  const commandService = new CommandService();
  const addressService = new AddressService();
  const { push } = useNavigation();

  const fetchGas = async () => {
    setIsLoading(true);
    try {
      const data =
        await commandService.executeCommandJson<GasObject[]>("client gas");
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
  };

  useEffect(() => {
    fetchGas();
  }, []);

  const totalBalance = gasObjects.reduce(
    (acc, obj) => acc + obj.mistBalance,
    0,
  );
  const totalSui = (totalBalance / 1_000_000_000).toFixed(4);

  const toggleSelection = (coinId: string) => {
    const newSelection = new Set(selectedCoins);
    if (newSelection.has(coinId)) {
      newSelection.delete(coinId);
    } else {
      newSelection.add(coinId);
    }
    setSelectedCoins(newSelection);
  };

  const handleMergeCoins = async () => {
    if (selectedCoins.size < 2) {
      showToast({
        style: Toast.Style.Failure,
        title: "Select at least 2 coins to merge",
      });
      return;
    }

    const confirmed = await confirmAlert({
      title: "Merge Coins",
      message: `Merge ${selectedCoins.size} coins into one?`,
      primaryAction: { title: "Merge" },
    });

    if (!confirmed) return;

    try {
      showToast({ style: Toast.Style.Animated, title: "Merging coins..." });

      const coinIds = Array.from(selectedCoins);
      const primaryCoin = coinIds[0];
      const coinsToMerge = coinIds.slice(1);

      const result = await addressService.mergeCoins(primaryCoin, coinsToMerge);

      showToast({ style: Toast.Style.Success, title: "Coins merged" });
      setSelectedCoins(new Set());
      push(<CommandResult result={result} title="Merge Result" />);
      fetchGas();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to merge",
        message: String(error),
      });
    }
  };

  const handleMergeAll = async () => {
    if (gasObjects.length < 2) {
      showToast({
        style: Toast.Style.Failure,
        title: "Need at least 2 coins to merge",
      });
      return;
    }

    const confirmed = await confirmAlert({
      title: "Merge All Coins",
      message: `Merge all ${gasObjects.length} gas coins into one?`,
      primaryAction: {
        title: "Merge All",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    try {
      showToast({ style: Toast.Style.Animated, title: "Merging all coins..." });

      const coinIds = gasObjects.map((g) => g.gasCoinId);
      const primaryCoin = coinIds[0];
      const coinsToMerge = coinIds.slice(1);

      const result = await addressService.mergeCoins(primaryCoin, coinsToMerge);

      showToast({ style: Toast.Style.Success, title: "All coins merged" });
      push(<CommandResult result={result} title="Merge Result" />);
      fetchGas();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to merge",
        message: String(error),
      });
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search gas objects..."
      navigationTitle={`Total: ${totalSui} SUI | Selected: ${selectedCoins.size}`}
    >
      <List.Section
        title="Gas Coins"
        subtitle={`${gasObjects.length} coins | ${totalSui} SUI total`}
      >
        {gasObjects.map((gas) => {
          const isSelected = selectedCoins.has(gas.gasCoinId);
          return (
            <List.Item
              key={gas.gasCoinId}
              title={`${gas.suiBalance} SUI`}
              subtitle={gas.gasCoinId}
              accessories={[
                { text: `${gas.mistBalance.toLocaleString()} MIST` },
                isSelected
                  ? {
                      icon: {
                        source: Icon.CheckCircle,
                        tintColor: Color.Green,
                      },
                    }
                  : { icon: Icon.Circle },
              ]}
              icon={{ source: Icon.Coins, tintColor: Color.Yellow }}
              actions={
                <ActionPanel>
                  <ActionPanel.Section title="Selection">
                    <Action
                      title={isSelected ? "Deselect Coin" : "Select Coin"}
                      icon={isSelected ? Icon.Circle : Icon.CheckCircle}
                      onAction={() => toggleSelection(gas.gasCoinId)}
                    />
                    <Action
                      title="Select All"
                      icon={Icon.CheckCircle}
                      shortcut={{ modifiers: ["cmd"], key: "a" }}
                      onAction={() =>
                        setSelectedCoins(
                          new Set(gasObjects.map((g) => g.gasCoinId)),
                        )
                      }
                    />
                    <Action
                      title="Clear Selection"
                      icon={Icon.XMarkCircle}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                      onAction={() => setSelectedCoins(new Set())}
                    />
                  </ActionPanel.Section>

                  <ActionPanel.Section title="Actions">
                    {selectedCoins.size >= 2 && (
                      <Action
                        title={`Merge Selected (${selectedCoins.size})`}
                        icon={Icon.ArrowsContract}
                        shortcut={{ modifiers: ["cmd"], key: "m" }}
                        onAction={handleMergeCoins}
                      />
                    )}
                    <Action
                      title="Merge All Coins"
                      icon={Icon.ArrowsContract}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                      onAction={handleMergeAll}
                    />
                    <Action.Push
                      title="Split Coin"
                      icon={Icon.ArrowsExpand}
                      shortcut={{ modifiers: ["cmd"], key: "s" }}
                      target={
                        <SplitCoinForm
                          coinId={gas.gasCoinId}
                          balance={gas.mistBalance}
                          onComplete={fetchGas}
                        />
                      }
                    />
                  </ActionPanel.Section>

                  <ActionPanel.Section title="Copy">
                    <Action.CopyToClipboard
                      content={gas.gasCoinId}
                      title="Copy Coin Id"
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    <Action.CopyToClipboard
                      content={gas.suiBalance}
                      title="Copy Sui Balance"
                    />
                    <Action.CopyToClipboard
                      content={String(gas.mistBalance)}
                      title="Copy Mist Balance"
                    />
                  </ActionPanel.Section>

                  <ActionPanel.Section>
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={fetchGas}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}

function SplitCoinForm({
  coinId,
  balance,
  onComplete,
}: {
  coinId: string;
  balance: number;
  onComplete: () => void;
}) {
  const { push, pop } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addressService = new AddressService();

  const handleSubmit = async (values: {
    amounts: string;
    gasBudget: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Parse amounts (comma or space separated)
      const amounts = values.amounts
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => {
          // Support both SUI and MIST input
          const num = parseFloat(s);
          if (s.toLowerCase().includes("sui") || num < 1000) {
            // Assume SUI if small number or explicitly stated
            return Math.floor(num * 1_000_000_000);
          }
          return Math.floor(num);
        });

      if (amounts.length === 0) {
        showToast({
          style: Toast.Style.Failure,
          title: "Enter at least one amount",
        });
        return;
      }

      const totalSplit = amounts.reduce((a, b) => a + b, 0);
      if (totalSplit > balance) {
        showToast({
          style: Toast.Style.Failure,
          title: "Total exceeds coin balance",
          message: `Trying to split ${totalSplit} MIST from ${balance} MIST`,
        });
        return;
      }

      showToast({ style: Toast.Style.Animated, title: "Splitting coin..." });

      const result = await addressService.splitCoin(
        coinId,
        amounts,
        parseInt(values.gasBudget),
      );

      showToast({ style: Toast.Style.Success, title: "Coin split" });
      onComplete();
      push(<CommandResult result={result} title="Split Result" />);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to split",
        message: String(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const balanceSui = (balance / 1_000_000_000).toFixed(4);

  return (
    <Form
      isLoading={isSubmitting}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Split Coin" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Coin to Split"
        text={`${coinId}\nBalance: ${balanceSui} SUI (${balance.toLocaleString()} MIST)`}
      />

      <Form.TextField
        id="amounts"
        title="Split Amounts"
        placeholder="1000000000, 2000000000 or 1 SUI, 2 SUI"
        info="Enter amounts in MIST (comma or space separated). Small numbers (<1000) are treated as SUI."
      />

      <Form.TextField
        id="gasBudget"
        title="Gas Budget"
        defaultValue="10000000"
        info="Gas budget in MIST"
      />

      <Form.Description
        title="Example"
        text="To split into 1 SUI and 0.5 SUI: enter '1000000000 500000000' or '1, 0.5'"
      />
    </Form>
  );
}
