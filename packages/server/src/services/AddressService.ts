import { SuiCliExecutor } from '../cli/SuiCliExecutor';
import { ConfigParser } from '../cli/ConfigParser';
import type { SuiAddress, GasCoin } from '@sui-cli-web/shared';
import {
  validateModuleName,
  validateFunctionName,
  validateTypeArgs,
  validateMoveArgs,
  validateObjectId,
  validateOptionalGasBudget,
} from '../utils/validation';
import { CommunityService } from './CommunityService';
import { TierService, TIER_METADATA } from './TierService';

// Constants
const SUI_COIN_TYPE = '0x2::sui::SUI';
const MIST_PER_SUI = 1_000_000_000;
const FETCH_TIMEOUT_MS = 5_000; // Reduced from 10s to 5s for faster failures
const RPC_BATCH_SIZE = 10; // Max concurrent RPC calls

// Cache for addresses data (reduces repeated CLI calls)
interface AddressCache {
  data: SuiAddress[];
  timestamp: number;
}
let addressCache: AddressCache | null = null;
const ADDRESS_CACHE_TTL_MS = 30_000; // 30 seconds

// Cache for balances with stale-while-revalidate pattern
interface BalanceCacheEntry {
  balance: string;
  timestamp: number;
  isFresh: boolean;
}
const balanceCache = new Map<string, BalanceCacheEntry>();
const BALANCE_CACHE_FRESH_MS = 30_000; // 30 seconds - fresh data
const BALANCE_CACHE_STALE_MS = 120_000; // 2 minutes - serve stale while revalidating
const BALANCE_REVALIDATION_IN_PROGRESS = new Set<string>(); // Track ongoing revalidations

// Helper for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// Batch RPC helper - executes multiple RPC calls in single batch request
async function batchRpcCall(
  rpcUrl: string,
  calls: Array<{ method: string; params: unknown[] }>
): Promise<unknown[]> {
  const batchRequest = calls.map((call, idx) => ({
    jsonrpc: '2.0',
    id: idx + 1,
    method: call.method,
    params: call.params,
  }));

  const response = await fetchWithTimeout(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchRequest),
  });

  if (!response.ok) throw new Error(response.statusText);

  const results = (await response.json()) as
    | Array<{ id: number; result?: unknown }>
    | { result?: unknown };

  // Results may come back in any order, sort by id
  if (Array.isArray(results)) {
    results.sort((a, b) => a.id - b.id);
    return results.map((r) => r.result);
  }

  return [(results as { result?: unknown }).result];
}

export class AddressService {
  private executor: SuiCliExecutor;
  private configParser: ConfigParser;
  private communityService: CommunityService;
  private tierService: TierService;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
    this.configParser = ConfigParser.getInstance();
    this.communityService = new CommunityService();
    this.tierService = new TierService();
  }

  public async getAddresses(includeBalance: boolean = true): Promise<SuiAddress[]> {
    const activeAddress = await this.getActiveAddress();
    const rpcUrl = await this.getActiveRpcUrl();

    let addresses: SuiAddress[] = [];

    try {
      const output = await this.executor.execute(['client', 'addresses'], { json: true });
      const data = JSON.parse(output);

      if (data.addresses && Array.isArray(data.addresses)) {
        addresses = data.addresses
          .map((addr: any) => {
            try {
              let address: string;
              let alias: string | undefined;

              if (Array.isArray(addr)) {
                const p1 = addr[0];
                const p2 = addr[1];
                if (typeof p1 === 'string' && p1.startsWith('0x')) {
                  address = p1;
                  alias = p2 || undefined;
                } else if (typeof p2 === 'string' && p2.startsWith('0x')) {
                  address = p2;
                  alias = p1 || undefined;
                } else {
                  address = String(p1);
                }
              } else if (typeof addr === 'string') {
                address = addr;
              } else {
                return null;
              }

              return {
                address,
                alias,
                isActive: address === activeAddress,
              };
            } catch {
              return null;
            }
          })
          .filter((item: SuiAddress | null): item is SuiAddress => item !== null);
      }
    } catch {
      // Fallback to text parsing
      try {
        const textOutput = await this.executor.execute(['client', 'addresses']);
        const parsed = textOutput
          .split('\n')
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            const addr = parts.find((p) => p.startsWith('0x'));
            const alias = parts.find((p) => !p.startsWith('0x') && p !== 'Active' && p !== 'Address');
            if (addr) {
              return {
                address: addr,
                alias,
                isActive: addr === activeAddress,
              } as SuiAddress;
            }
            return null;
          })
          .filter((item): item is SuiAddress => item !== null);
        addresses = parsed;
      } catch {
        // Return empty array if both methods fail
        addresses = [];
      }
    }

    // OPTIMIZED: Fetch ALL data in parallel with batch RPC calls
    if (addresses.length > 0 && rpcUrl) {
      // Step 1: Batch fetch ALL balances in ONE RPC call
      const balanceMap = includeBalance
        ? await this.fetchBalancesBatch(addresses.map((a) => a.address), rpcUrl)
        : new Map<string, string>();

      // Step 2: Batch fetch membership and tier info
      const [membershipMap, tierInfoMap] = await Promise.all([
        this.communityService.checkMembershipsBatch(addresses.map((a) => a.address)),
        this.tierService.getTierInfoBatch(addresses.map((a) => a.address)),
      ]);

      // Step 3: Merge all data (no more async calls needed)
      addresses = addresses.map((addr) => ({
        ...addr,
        balance: balanceMap.get(addr.address) || '0',
        isCommunityMember: membershipMap.get(addr.address) || false,
        ...(membershipMap.get(addr.address) && tierInfoMap.get(addr.address)
          ? {
              tierLevel: tierInfoMap.get(addr.address)!.level,
              tierName: tierInfoMap.get(addr.address)!.name,
              tierIcon: tierInfoMap.get(addr.address)!.icon,
            }
          : {}),
      }));
    } else if (addresses.length > 0) {
      // Fallback: No RPC URL, use sequential fetching
      const enrichedPromises = addresses.map(async (addr) => {
        const enrichedAddr = { ...addr };
        if (includeBalance) {
          try {
            enrichedAddr.balance = await this.getBalance(addr.address);
          } catch {
            enrichedAddr.balance = '0';
          }
        }
        return enrichedAddr;
      });
      addresses = await Promise.all(enrichedPromises);
    }

    return addresses;
  }

  /**
   * Fetch balances for multiple addresses with stale-while-revalidate pattern
   * - Fresh cache (<30s): Return immediately
   * - Stale cache (30s-2m): Return stale data + revalidate in background
   * - No cache/expired: Fetch and return
   */
  private async fetchBalancesBatch(
    addresses: string[],
    rpcUrl: string
  ): Promise<Map<string, string>> {
    const balanceMap = new Map<string, string>();
    const now = Date.now();

    // Separate addresses into: fresh, stale (need revalidation), and uncached
    const staleAddresses: string[] = [];
    const uncachedAddresses: string[] = [];

    for (const addr of addresses) {
      const cached = balanceCache.get(addr);

      if (!cached) {
        // No cache - must fetch
        uncachedAddresses.push(addr);
      } else if (now - cached.timestamp < BALANCE_CACHE_FRESH_MS) {
        // Fresh cache - use immediately
        balanceMap.set(addr, cached.balance);
      } else if (now - cached.timestamp < BALANCE_CACHE_STALE_MS) {
        // Stale but usable - return immediately, revalidate in background
        balanceMap.set(addr, cached.balance);
        if (!BALANCE_REVALIDATION_IN_PROGRESS.has(addr)) {
          staleAddresses.push(addr);
        }
      } else {
        // Expired - must fetch
        uncachedAddresses.push(addr);
      }
    }

    // If all are fresh, return immediately
    if (uncachedAddresses.length === 0 && staleAddresses.length === 0) {
      return balanceMap;
    }

    // Fetch uncached addresses (blocking - needed for response)
    if (uncachedAddresses.length > 0) {
      try {
        const balancePromises = uncachedAddresses.map(async (addr) => {
          try {
            const balance = await this.fetchBalanceViaRpc(addr, rpcUrl);
            return { addr, balance };
          } catch {
            return { addr, balance: '0' };
          }
        });

        const results = await Promise.all(balancePromises);

        // Process results and update cache
        for (const { addr, balance } of results) {
          balanceMap.set(addr, balance);
          balanceCache.set(addr, { balance, timestamp: now, isFresh: true });
        }
      } catch (error) {
        // On failure, set all to '0' but DON'T cache
        for (const addr of uncachedAddresses) {
          balanceMap.set(addr, '0');
        }
      }
    }

    // Revalidate stale addresses in background (non-blocking)
    if (staleAddresses.length > 0) {
      // Mark as in progress to avoid duplicate revalidations
      staleAddresses.forEach((addr) => BALANCE_REVALIDATION_IN_PROGRESS.add(addr));

      // Don't await - let it run in background
      this.revalidateBalancesInBackground(staleAddresses, rpcUrl).finally(() => {
        staleAddresses.forEach((addr) => BALANCE_REVALIDATION_IN_PROGRESS.delete(addr));
      });
    }

    return balanceMap;
  }

  /**
   * Background revalidation - updates cache without blocking response
   */
  private async revalidateBalancesInBackground(addresses: string[], rpcUrl: string): Promise<void> {
    try {
      const now = Date.now();
      const balancePromises = addresses.map(async (addr) => {
        try {
          const balance = await this.fetchBalanceViaRpc(addr, rpcUrl);
          return { addr, balance };
        } catch {
          return { addr, balance: null }; // null means keep existing stale data
        }
      });

      const results = await Promise.all(balancePromises);

      for (const { addr, balance } of results) {
        if (balance !== null) {
          // Update cache with fresh data
          balanceCache.set(addr, { balance, timestamp: now, isFresh: true });
        }
      }
    } catch (error) {
      // Silent fail - stale data is still being served
      console.error('[AddressService] Background revalidation failed:', error);
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

  public async removeAddress(address: string): Promise<void> {
    // Check if address is active
    const activeAddress = await this.getActiveAddress();
    if (address === activeAddress) {
      throw new Error('Cannot remove active address. Please switch to another address first.');
    }

    // Execute sui client remove-address command
    await this.executor.execute(['client', 'remove-address', address]);
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
    const response = await fetchWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getBalance',
        params: [address, SUI_COIN_TYPE],
      }),
    });

    if (!response.ok) throw new Error(response.statusText);

    const data = (await response.json()) as {
      error?: { message: string };
      result?: { totalBalance?: string };
    };
    if (data.error) throw new Error(data.error.message);

    const totalBalance = data.result?.totalBalance;
    if (totalBalance) {
      return (parseInt(totalBalance) / MIST_PER_SUI).toFixed(4);
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
                if (coin.coinType === SUI_COIN_TYPE) {
                  totalSui += parseInt(coin.balance || '0');
                }
              }
            }
          }
        }
        return (totalSui / MIST_PER_SUI).toFixed(4);
      }

      if (Array.isArray(data) && data.length > 0) {
        const suiBalance = data.find((b: any) => b.coinType === SUI_COIN_TYPE);
        if (suiBalance?.totalBalance) {
          return (parseInt(suiBalance.totalBalance) / MIST_PER_SUI).toFixed(4);
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

    // Handle "Object does not exist" case - CLI returns plain text instead of JSON
    if (output.includes('does not exist') || output.includes('not found')) {
      throw new Error(`Object ${objectId} does not exist`);
    }

    return JSON.parse(output);
  }

  public async getTransactionBlock(digest: string): Promise<any> {
    const output = await this.executor.execute(['client', 'tx-block', digest], { json: true });
    return JSON.parse(output);
  }

  public async getPackageSummary(packageId: string): Promise<any> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');

    // Create temp directory for output
    const tempDir = path.join(os.tmpdir(), `sui-pkg-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Run sui move summary
      await this.executor.execute([
        'move',
        'summary',
        '--package-id',
        packageId,
        '--bytecode',
        '--output-directory',
        tempDir,
      ]);

      // Read the generated files
      const result: any = {
        packageId,
        modules: [],
        metadata: null,
      };

      // Read root package metadata
      const metadataPath = path.join(tempDir, 'root_package_metadata.json');
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        result.metadata = JSON.parse(metadataContent);
      } catch {
        // Metadata might not exist
      }

      // Read module summaries
      const packageDir = path.join(tempDir, packageId);
      try {
        const files = await fs.readdir(packageDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const modulePath = path.join(packageDir, file);
            const moduleContent = await fs.readFile(modulePath, 'utf-8');
            const moduleData = JSON.parse(moduleContent);
            result.modules.push({
              name: file.replace('.json', ''),
              ...moduleData,
            });
          }
        }
      } catch {
        // Package directory might not exist
      }

      return result;
    } finally {
      // Cleanup temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  public async callFunction(
    packageId: string,
    module: string,
    functionName: string,
    typeArgs: string[] = [],
    args: string[] = [],
    gasBudget: string = '10000000'
  ): Promise<any> {
    // Validate all inputs to prevent command injection
    const validPackageId = validateObjectId(packageId, 'packageId');
    const validModule = validateModuleName(module);
    const validFunction = validateFunctionName(functionName);
    const validTypeArgs = validateTypeArgs(typeArgs);
    const validArgs = validateMoveArgs(args);
    const validGasBudget = validateOptionalGasBudget(gasBudget) || '10000000';

    const cmdArgs = [
      'client',
      'call',
      '--package',
      validPackageId,
      '--module',
      validModule,
      '--function',
      validFunction,
      '--gas-budget',
      validGasBudget,
    ];

    if (validTypeArgs.length > 0) {
      cmdArgs.push('--type-args', ...validTypeArgs);
    }

    if (validArgs.length > 0) {
      cmdArgs.push('--args', ...validArgs);
    }

    const output = await this.executor.execute(cmdArgs, { json: true });
    return JSON.parse(output);
  }

  public async dryRunCall(
    packageId: string,
    module: string,
    functionName: string,
    typeArgs: string[] = [],
    args: string[] = [],
    gasBudget: string = '10000000'
  ): Promise<any> {
    // Validate all inputs to prevent command injection
    const validPackageId = validateObjectId(packageId, 'packageId');
    const validModule = validateModuleName(module);
    const validFunction = validateFunctionName(functionName);
    const validTypeArgs = validateTypeArgs(typeArgs);
    const validArgs = validateMoveArgs(args);
    const validGasBudget = validateOptionalGasBudget(gasBudget) || '10000000';

    const cmdArgs = [
      'client',
      'call',
      '--package',
      validPackageId,
      '--module',
      validModule,
      '--function',
      validFunction,
      '--gas-budget',
      validGasBudget,
      '--dry-run',
    ];

    if (validTypeArgs.length > 0) {
      cmdArgs.push('--type-args', ...validTypeArgs);
    }

    if (validArgs.length > 0) {
      cmdArgs.push('--args', ...validArgs);
    }

    const output = await this.executor.execute(cmdArgs, { json: true });
    return JSON.parse(output);
  }
}
