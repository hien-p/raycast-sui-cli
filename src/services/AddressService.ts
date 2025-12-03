import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export class AddressService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  public async getAddresses(): Promise<
    { address: string; alias: string | null }[]
  > {
    const output = await this.executor.execute("client addresses", {
      json: true,
    });
    try {
      const data = JSON.parse(output);
      if (data.addresses && Array.isArray(data.addresses)) {
        return data.addresses.map((addr: any) => {
          if (Array.isArray(addr)) {
            // Check which one is the address (starts with 0x)
            const p1 = addr[0];
            const p2 = addr[1];
            if (p1.startsWith("0x")) return { address: p1, alias: p2 || null };
            if (p2 && p2.startsWith("0x"))
              return { address: p2, alias: p1 || null };
            return { address: p1, alias: null }; // Fallback
          }
          return { address: addr, alias: null };
        });
      }
      return [];
    } catch (e) {
      const textOutput = await this.executor.execute("client addresses");
      return textOutput
        .split("\n")
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          const addr = parts.find((p) => p.startsWith("0x"));
          const alias = parts.find(
            (p) => !p.startsWith("0x") && p !== "Active" && p !== "Address",
          );
          if (addr) return { address: addr, alias: alias || null };
          return null;
        })
        .filter(
          (item): item is { address: string; alias: string | null } =>
            item !== null,
        );
    }
  }

  public async getActiveAddress(): Promise<string> {
    return (await this.executor.execute("client active-address")).trim();
  }

  public async switchAddress(address: string): Promise<string> {
    return this.executor.execute(`client switch --address ${address}`);
  }

  public async createAddress(
    keyScheme: "ed25519" | "secp256k1" | "secp256r1" = "ed25519",
    alias?: string,
  ): Promise<string> {
    let cmd = `client new-address ${keyScheme}`;
    if (alias) {
      cmd += ` --alias ${alias}`;
    }
    return this.executor.execute(cmd);
  }
  private async getActiveRpcUrl(): Promise<string | null> {
    try {
      const envsOutput = await this.executor.execute("client envs", {
        json: true,
      });
      const envs = JSON.parse(envsOutput);
      // Format: [ { "alias": "mainnet", "rpc": "...", "active": true }, ... ]
      if (Array.isArray(envs)) {
        const active = envs.find((e: any) => e.active);
        return active ? active.rpc : null;
      }
    } catch (e) {
      // Fallback to text parsing
      try {
        const text = await this.executor.execute("client envs");
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.includes("*")) {
            // Active env has *
            // line format: * <alias> <url>
            const parts = line.trim().split(/\s+/);
            // find the part that looks like a url
            const url = parts.find((p) => p.startsWith("http"));
            return url || null;
          }
        }
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  private async fetchBalanceViaRpc(
    address: string,
    rpcUrl: string,
  ): Promise<string> {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "suix_getBalance",
          params: [address, "0x2::sui::SUI"],
        }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const totalBalance = data.result?.totalBalance;
      if (totalBalance) {
        return `${(parseInt(totalBalance) / 1000000000).toFixed(2)} SUI`;
      }
      return "0 SUI";
    } catch (e) {
      throw new Error(`RPC Error: ${String(e)}`);
    }
  }

  public async getBalance(address: string): Promise<string> {
    // Try RPC first as it's faster and more reliable than CLI wrapper
    try {
      const rpcUrl = await this.getActiveRpcUrl();
      if (rpcUrl) {
        return await this.fetchBalanceViaRpc(address, rpcUrl);
      }
    } catch (e) {
      // Ignore RPC errors and fall back to CLI
    }

    try {
      // Try `client balance` (JSON)
      // Note: `client balance` takes address as positional argument, not --address
      const output = await this.executor.execute(`client balance ${address}`, {
        json: true,
      });
      const data = JSON.parse(output);

      // Handle nested structure: [ [ [meta, coins[]], ... ], hasMore ]
      if (Array.isArray(data) && data.length >= 1 && Array.isArray(data[0])) {
        const groups = data[0];
        let totalSui = 0;
        for (const group of groups) {
          if (Array.isArray(group) && group.length === 2) {
            const coins = group[1];
            if (Array.isArray(coins)) {
              for (const coin of coins) {
                if (coin.coinType === "0x2::sui::SUI") {
                  totalSui += parseInt(coin.balance || "0");
                }
              }
            }
          }
        }
        return `${(totalSui / 1000000000).toFixed(2)} SUI`;
      }

      // Handle flat structure (legacy or other versions)
      if (Array.isArray(data) && data.length > 0) {
        const suiBalance = data.find(
          (b: any) => b.coinType === "0x2::sui::SUI",
        );
        if (suiBalance && suiBalance.totalBalance) {
          return `${(parseInt(suiBalance.totalBalance) / 1000000000).toFixed(2)} SUI`;
        }
      }
      if (data && data.coinType === "0x2::sui::SUI" && data.totalBalance) {
        return `${(parseInt(data.totalBalance) / 1000000000).toFixed(2)} SUI`;
      }

      // If we parsed successfully but found no SUI, return 0
      if (Array.isArray(data)) return "0 SUI";
    } catch (e) {
      const errStr = String(e);
      // Common errors that just mean "no balance"
      if (
        errStr.includes("No gas objects") ||
        errStr.includes("No coins") ||
        errStr.includes("not found")
      ) {
        return "0 SUI";
      }

      // Fallback to `client gas` (JSON)
      try {
        // Note: `client gas` takes address as positional argument
        const output = await this.executor.execute(`client gas ${address}`, {
          json: true,
        });
        const data = JSON.parse(output);
        if (Array.isArray(data)) {
          // client gas returns [{ mistBalance: number, ... }]
          const total = data.reduce((acc: number, obj: any) => {
            const bal =
              obj.mistBalance !== undefined
                ? obj.mistBalance
                : parseInt(obj.balance) || 0;
            return acc + bal;
          }, 0);
          return `${(total / 1000000000).toFixed(2)} SUI`;
        }
      } catch (err) {
        const gasErrStr = String(err);
        if (
          gasErrStr.includes("No gas objects") ||
          gasErrStr.includes("No coins") ||
          gasErrStr.includes("not found")
        ) {
          return "0 SUI";
        }
      }

      return `Error: ${errStr}`;
    }
    return "0 SUI";
  }
  public async getAllBalances(
    address: string,
  ): Promise<{ coinType: string; totalBalance: string; count: number }[]> {
    try {
      const output = await this.executor.execute(`client balance ${address}`, {
        json: true,
      });
      const data = JSON.parse(output);

      // Handle nested structure: [ [ [meta, coins[]], ... ], hasMore ]
      if (Array.isArray(data) && data.length >= 1 && Array.isArray(data[0])) {
        const groups = data[0];
        const balances: {
          coinType: string;
          totalBalance: string;
          count: number;
        }[] = [];

        for (const group of groups) {
          if (Array.isArray(group) && group.length === 2) {
            const meta = group[0]; // { coinType: ... }
            const coins = group[1];
            if (Array.isArray(coins)) {
              let total = 0;
              for (const coin of coins) {
                total += parseInt(coin.balance || "0");
              }
              balances.push({
                coinType: meta.coinType || "Unknown",
                totalBalance: (total / 1000000000).toFixed(2), // Assuming 9 decimals for simplicity, ideally should check metadata
                count: coins.length,
              });
            }
          }
        }
        return balances;
      }

      // Fallback for flat structure
      if (Array.isArray(data)) {
        return data.map((b: any) => ({
          coinType: b.coinType,
          totalBalance: (parseInt(b.totalBalance) / 1000000000).toFixed(2),
          count: b.coinObjectCount || 1,
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  public async getObjectCount(address: string): Promise<number> {
    try {
      // client objects returns a list of objects
      const output = await this.executor.execute(`client objects ${address}`, {
        json: true,
      });
      const data = JSON.parse(output);
      if (Array.isArray(data)) {
        return data.length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  public getExplorerUrl(address: string): string {
    return `https://suiscan.xyz/mainnet/account/${address}`;
  }

  /**
   * Split a coin into multiple coins with specified amounts
   */
  public async splitCoin(
    coinId: string,
    amounts: number[],
    gasBudget: number = 10000000,
  ): Promise<string> {
    const amountsStr = amounts.join(" ");
    return this.executor.execute(
      `client split-coin --coin-id ${coinId} --amounts ${amountsStr} --gas-budget ${gasBudget}`,
      { json: true },
    );
  }

  /**
   * Merge multiple coins into one
   */
  public async mergeCoins(
    primaryCoinId: string,
    coinToMergeIds: string[],
    gasBudget: number = 10000000,
  ): Promise<string> {
    const coinsToMerge = coinToMergeIds.join(" ");
    return this.executor.execute(
      `client merge-coin --primary-coin ${primaryCoinId} --coin-to-merge ${coinsToMerge} --gas-budget ${gasBudget}`,
      { json: true },
    );
  }

  /**
   * Get gas coins for an address
   */
  public async getGasCoins(
    address: string,
  ): Promise<{ coinId: string; balance: number }[]> {
    try {
      const output = await this.executor.execute(`client gas ${address}`, {
        json: true,
      });
      const data = JSON.parse(output);

      if (Array.isArray(data)) {
        return data.map((coin: any) => ({
          coinId: coin.gasCoinId || coin.gas_coin_id || coin.id?.id || "",
          balance:
            coin.mistBalance ||
            coin.mist_balance ||
            parseInt(coin.balance) ||
            0,
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Transfer objects to an address
   */
  public async transferObjects(
    objectIds: string[],
    recipient: string,
    gasBudget: number = 10000000,
  ): Promise<string> {
    const objects = objectIds.join(" ");
    return this.executor.execute(
      `client transfer --to ${recipient} --object-id ${objects} --gas-budget ${gasBudget}`,
      { json: true },
    );
  }

  /**
   * Transfer SUI to an address
   */
  public async transferSui(
    recipient: string,
    amount: number,
    gasBudget: number = 10000000,
  ): Promise<string> {
    return this.executor.execute(
      `client transfer-sui --to ${recipient} --sui-coin-object-id gas --amount ${amount} --gas-budget ${gasBudget}`,
      { json: true },
    );
  }

  /**
   * Pay SUI to multiple recipients
   */
  public async paySui(
    recipients: string[],
    amounts: number[],
    gasBudget: number = 10000000,
  ): Promise<string> {
    const recipientsStr = recipients.join(" ");
    const amountsStr = amounts.join(" ");
    return this.executor.execute(
      `client pay-sui --recipients ${recipientsStr} --amounts ${amountsStr} --gas-budget ${gasBudget}`,
      { json: true },
    );
  }
}
