import { SuiCliExecutor } from '../cli/SuiCliExecutor';
import { ConfigParser } from '../cli/ConfigParser';
import type { SuiAddress, GasCoin } from '@sui-cli-web/shared';

export class AddressService {
  private executor: SuiCliExecutor;
  private configParser: ConfigParser;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
    this.configParser = ConfigParser.getInstance();
  }

  public async getAddresses(): Promise<SuiAddress[]> {
    const activeAddress = await this.getActiveAddress();

    try {
      const output = await this.executor.execute(['client', 'addresses'], { json: true });
      const data = JSON.parse(output);

      if (data.addresses && Array.isArray(data.addresses)) {
        return data.addresses.map((addr: any) => {
          let address: string;
          let alias: string | undefined;

          if (Array.isArray(addr)) {
            const p1 = addr[0];
            const p2 = addr[1];
            if (p1.startsWith('0x')) {
              address = p1;
              alias = p2 || undefined;
            } else if (p2 && p2.startsWith('0x')) {
              address = p2;
              alias = p1 || undefined;
            } else {
              address = p1;
            }
          } else {
            address = addr;
          }

          return {
            address,
            alias,
            isActive: address === activeAddress,
          };
        });
      }
      return [];
    } catch {
      // Fallback to text parsing
      const textOutput = await this.executor.execute(['client', 'addresses']);
      return textOutput
        .split('\n')
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          const addr = parts.find((p) => p.startsWith('0x'));
          const alias = parts.find((p) => !p.startsWith('0x') && p !== 'Active' && p !== 'Address');
          if (addr) {
            return {
              address: addr,
              alias: alias || undefined,
              isActive: addr === activeAddress,
            };
          }
          return null;
        })
        .filter((item): item is SuiAddress => item !== null);
    }
  }

  public async getActiveAddress(): Promise<string> {
    const output = await this.executor.execute(['client', 'active-address']);
    return output.trim();
  }

  public async switchAddress(address: string): Promise<void> {
    await this.executor.execute(['client', 'switch', '--address', address]);
  }

  public async createAddress(
    keyScheme: 'ed25519' | 'secp256k1' | 'secp256r1' = 'ed25519',
    alias?: string
  ): Promise<{ address: string; phrase?: string }> {
    const args = ['client', 'new-address', keyScheme];
    if (alias) {
      args.push('--alias', alias);
    }

    const output = await this.executor.execute(args);

    // Parse output to extract address and recovery phrase
    const addressMatch = output.match(/0x[a-fA-F0-9]+/);
    const phraseMatch = output.match(/Recovery phrase[:\s]+(.+?)(?:\n|$)/i);

    return {
      address: addressMatch?.[0] || '',
      phrase: phraseMatch?.[1]?.trim(),
    };
  }

  private async getActiveRpcUrl(): Promise<string | null> {
    try {
      const config = await this.configParser.getConfig();
      if (config) {
        const activeEnv = config.envs.find((e) => e.alias === config.active_env);
        return activeEnv?.rpc || null;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  private async fetchBalanceViaRpc(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getBalance',
        params: [address, '0x2::sui::SUI'],
      }),
    });

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const totalBalance = data.result?.totalBalance;
    if (totalBalance) {
      return (parseInt(totalBalance) / 1_000_000_000).toFixed(4);
    }
    return '0';
  }

  public async getBalance(address: string): Promise<string> {
    // Try RPC first
    try {
      const rpcUrl = await this.getActiveRpcUrl();
      if (rpcUrl) {
        return await this.fetchBalanceViaRpc(address, rpcUrl);
      }
    } catch {
      // Fall back to CLI
    }

    try {
      const output = await this.executor.execute(['client', 'balance', address], { json: true });
      const data = JSON.parse(output);

      if (Array.isArray(data) && data.length >= 1 && Array.isArray(data[0])) {
        const groups = data[0];
        let totalSui = 0;
        for (const group of groups) {
          if (Array.isArray(group) && group.length === 2) {
            const coins = group[1];
            if (Array.isArray(coins)) {
              for (const coin of coins) {
                if (coin.coinType === '0x2::sui::SUI') {
                  totalSui += parseInt(coin.balance || '0');
                }
              }
            }
          }
        }
        return (totalSui / 1_000_000_000).toFixed(4);
      }

      if (Array.isArray(data) && data.length > 0) {
        const suiBalance = data.find((b: any) => b.coinType === '0x2::sui::SUI');
        if (suiBalance?.totalBalance) {
          return (parseInt(suiBalance.totalBalance) / 1_000_000_000).toFixed(4);
        }
      }

      return '0';
    } catch (e) {
      const errStr = String(e);
      if (errStr.includes('No gas objects') || errStr.includes('No coins') || errStr.includes('not found')) {
        return '0';
      }
      throw e;
    }
  }

  public async getGasCoins(address: string): Promise<GasCoin[]> {
    try {
      const output = await this.executor.execute(['client', 'gas', address], { json: true });
      const data = JSON.parse(output);

      if (Array.isArray(data)) {
        return data.map((coin: any) => ({
          coinObjectId: coin.gasCoinId || coin.gas_coin_id || coin.id?.id || '',
          balance: String(coin.mistBalance || coin.mist_balance || parseInt(coin.balance) || 0),
          version: coin.version || '',
          digest: coin.digest || '',
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  public async splitCoin(
    coinId: string,
    amounts: string[],
    gasBudget: string = '10000000'
  ): Promise<string> {
    const args = ['client', 'split-coin', '--coin-id', coinId, '--amounts', ...amounts, '--gas-budget', gasBudget];
    return this.executor.execute(args, { json: true });
  }

  public async mergeCoins(
    primaryCoinId: string,
    coinIdsToMerge: string[],
    gasBudget: string = '10000000'
  ): Promise<string> {
    const args = [
      'client',
      'merge-coin',
      '--primary-coin',
      primaryCoinId,
      '--coin-to-merge',
      ...coinIdsToMerge,
      '--gas-budget',
      gasBudget,
    ];
    return this.executor.execute(args, { json: true });
  }

  public async getObjects(address: string): Promise<any[]> {
    try {
      const output = await this.executor.execute(['client', 'objects', address], { json: true });
      const data = JSON.parse(output);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch {
      return [];
    }
  }

  public async getObject(objectId: string): Promise<any> {
    const output = await this.executor.execute(['client', 'object', objectId], { json: true });
    return JSON.parse(output);
  }
}
