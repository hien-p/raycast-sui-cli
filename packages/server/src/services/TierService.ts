/**
 * TierService - Calculate user tiers based on on-chain activity
 *
 * Tier System (Sui-themed) - Research-based distribution:
 * - Tier 0: Droplet - Join community (100% of users)
 * - Tier 1: Wave - 25+ transactions OR 3+ contracts (15-20% target)
 * - Tier 2: Tsunami - 100+ transactions OR 10+ contracts (3-5% target)
 * - Tier 3: Ocean - 500+ tx + peer review + admin grant (<1% target, 50 max)
 *
 * Design Goals:
 * - Higher tiers are RARE and EARNED
 * - Based on meaningful contributions, not just transaction spam
 * - Comparable to League of Legends ranking (Bronze→Challenger)
 */

import { ConfigParser } from '../cli/ConfigParser';

// Tier level constants
export const TIER_DROPLET = 0;
export const TIER_WAVE = 1;
export const TIER_TSUNAMI = 2;
export const TIER_OCEAN = 3;

// Tier requirements - Updated for exclusivity
// Wave: 25 tx (old: 5) - only ~15-20% should reach
// Tsunami: 100 tx (old: 50) - only ~3-5% should reach
// Ocean: Admin grant required - <1%, capped at 50 members
const TIER_CONFIG = {
  WAVE_MIN_TX: 25, // Increased from 5 → 25
  WAVE_MIN_CONTRACTS: 3, // Alternative: deploy 3+ contracts
  TSUNAMI_MIN_TX: 100, // Increased from 50 → 100
  TSUNAMI_MIN_CONTRACTS: 10, // Alternative: deploy 10+ contracts
  OCEAN_MIN_TX: 500, // Reference only - requires admin grant
};

// Tier metadata for display
export const TIER_METADATA = {
  [TIER_DROPLET]: {
    name: 'Droplet',
    icon: '💧',
    color: '#4DA2FF',
    colorGradient: 'from-blue-400 to-blue-600',
    description: 'Welcome to the community!',
  },
  [TIER_WAVE]: {
    name: 'Wave',
    icon: '🌊',
    color: '#00D4AA',
    colorGradient: 'from-teal-400 to-cyan-500',
    description: 'Active builder (top 15-20%)',
  },
  [TIER_TSUNAMI]: {
    name: 'Tsunami',
    icon: '🌀',
    color: '#7B61FF',
    colorGradient: 'from-purple-500 to-indigo-600',
    description: 'Power contributor (top 3-5%)',
  },
  [TIER_OCEAN]: {
    name: 'Ocean',
    icon: '🌊',
    color: '#FFD700',
    colorGradient: 'from-yellow-400 to-orange-500',
    description: 'Legendary member (top 1%)',
  },
} as const;

export interface TierInfo {
  level: number;
  name: string;
  icon: string;
  color: string;
  colorGradient: string;
  description: string;
  txCount: number;
  contractCount: number;
  hasDeployedContract: boolean;
  progress: {
    current: number;
    required: number;
    percentage: number;
    nextTier: string | null;
  };
}

// Cache for tier data to reduce RPC calls
interface TierCache {
  data: TierInfo;
  timestamp: number;
}

const tierCache = new Map<string, TierCache>();
const CACHE_TTL_MS = 60000; // 1 minute cache

// Cache for transaction counts
const txCountCache = new Map<string, { count: number; timestamp: number }>();
const TX_COUNT_CACHE_TTL_MS = 30000; // 30 seconds

// Helper for fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 5000
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

export class TierService {
  private configParser: ConfigParser;

  constructor() {
    this.configParser = ConfigParser.getInstance();
  }

  /**
   * Get RPC URL from config
   */
  async getRpcUrl(): Promise<string | null> {
    try {
      const config = await this.configParser.getConfig();
      const activeEnv = config?.envs.find((e) => e.alias === config.active_env);
      return activeEnv?.rpc || null;
    } catch {
      return null;
    }
  }

  /**
   * Query transaction count for an address from RPC
   * OPTIMIZED: Single call with higher limit, uses cache
   */
  async getTransactionCount(address: string): Promise<number> {
    // Check cache first
    const cached = txCountCache.get(address);
    const now = Date.now();
    if (cached && now - cached.timestamp < TX_COUNT_CACHE_TTL_MS) {
      return cached.count;
    }

    const rpcUrl = await this.getRpcUrl();
    if (!rpcUrl) {
      return 0;
    }

    try {
      // OPTIMIZED: Single call with limit 200 (instead of 1 then 100)
      const response = await fetchWithTimeout(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_queryTransactionBlocks',
          params: [
            {
              filter: { FromAddress: address },
              options: { showEffects: false, showInput: false },
            },
            null,
            200, // Higher limit upfront - eliminates second call for most users
            true,
          ],
        }),
      });

      const result = (await response.json()) as {
        result?: {
          data?: unknown[];
          hasNextPage?: boolean;
        };
      };

      const data = result.result?.data || [];
      const hasMore = result.result?.hasNextPage || false;

      // If has more than 200, provide conservative estimate
      // This avoids additional RPC call for power users
      const count = hasMore ? data.length + 100 : data.length;

      // Update cache
      txCountCache.set(address, { count, timestamp: now });

      return count;
    } catch (error) {
      console.error('[TierService] Failed to get transaction count:', error);
      return 0;
    }
  }

  /**
   * Batch get transaction counts for multiple addresses
   * Uses parallel fetch with controlled concurrency
   */
  async getTransactionCountsBatch(addresses: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const now = Date.now();

    // Check cache and separate cached vs uncached
    const uncachedAddresses: string[] = [];
    for (const addr of addresses) {
      const cached = txCountCache.get(addr);
      if (cached && now - cached.timestamp < TX_COUNT_CACHE_TTL_MS) {
        results.set(addr, cached.count);
      } else {
        uncachedAddresses.push(addr);
      }
    }

    if (uncachedAddresses.length === 0) {
      return results;
    }

    // Parallel fetch with Promise.all (controlled concurrency)
    const promises = uncachedAddresses.map((addr) => this.getTransactionCount(addr));
    const counts = await Promise.all(promises);

    for (let i = 0; i < uncachedAddresses.length; i++) {
      results.set(uncachedAddresses[i], counts[i]);
    }

    return results;
  }

  /**
   * Get the number of deployed contracts for an address
   * Returns { count: number, hasDeployed: boolean }
   */
  async getDeployedContractsInfo(
    address: string
  ): Promise<{ count: number; hasDeployed: boolean }> {
    const rpcUrl = await this.getRpcUrl();
    if (!rpcUrl) {
      return { count: 0, hasDeployed: false };
    }

    try {
      // Query for published packages owned by this address
      // UpgradeCap is created when you publish a package
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getOwnedObjects',
          params: [
            address,
            {
              filter: { StructType: '0x2::package::UpgradeCap' },
              options: { showType: true },
            },
            null,
            50, // Get up to 50 to count properly
          ],
        }),
      });

      const result = (await response.json()) as {
        result?: { data?: unknown[] };
      };

      const count = result.result?.data?.length || 0;
      return { count, hasDeployed: count > 0 };
    } catch (error) {
      console.error('[TierService] Failed to check deployed contracts:', error);
      return { count: 0, hasDeployed: false };
    }
  }

  /**
   * Check if address has deployed a smart contract (backward compatibility)
   */
  async hasDeployedContract(address: string): Promise<boolean> {
    const info = await this.getDeployedContractsInfo(address);
    return info.hasDeployed;
  }

  /**
   * Calculate tier based on activity metrics
   *
   * New requirements (research-based for exclusivity):
   * - Wave: 25+ tx OR 3+ contracts (target 15-20%)
   * - Tsunami: 100+ tx OR 10+ contracts (target 3-5%)
   * - Ocean: Admin grant only, requires 500+ tx + peer review (<1%, 50 max)
   */
  calculateTier(
    txCount: number,
    hasDeployedContract: boolean,
    contractCount: number = 0
  ): number {
    // Ocean tier is admin-only, can't be calculated automatically
    // Requires: 500+ tx + major contributions + peer review + admin grant
    // For MVP, we don't track Ocean tier grants

    // Tsunami: 100+ tx OR 10+ contracts deployed
    if (
      txCount >= TIER_CONFIG.TSUNAMI_MIN_TX ||
      contractCount >= TIER_CONFIG.TSUNAMI_MIN_CONTRACTS
    ) {
      return TIER_TSUNAMI;
    }

    // Wave: 25+ tx OR 3+ contracts deployed
    if (
      txCount >= TIER_CONFIG.WAVE_MIN_TX ||
      contractCount >= TIER_CONFIG.WAVE_MIN_CONTRACTS
    ) {
      return TIER_WAVE;
    }

    // Default: Droplet (any community member)
    return TIER_DROPLET;
  }

  /**
   * Calculate progress to next tier
   *
   * Progress can be achieved via transactions OR contract deployments
   * Shows the path that gets user closer to next tier
   */
  calculateProgress(
    currentTier: number,
    txCount: number,
    contractCount: number
  ): TierInfo['progress'] {
    switch (currentTier) {
      case TIER_DROPLET: {
        // To Wave: 25 tx OR 3 contracts
        const txProgress = (txCount / TIER_CONFIG.WAVE_MIN_TX) * 100;
        const contractProgress =
          (contractCount / TIER_CONFIG.WAVE_MIN_CONTRACTS) * 100;
        const bestProgress = Math.max(txProgress, contractProgress);

        return {
          current: txCount,
          required: TIER_CONFIG.WAVE_MIN_TX,
          percentage: Math.min(100, bestProgress),
          nextTier: 'Wave',
        };
      }

      case TIER_WAVE: {
        // To Tsunami: 100 tx OR 10 contracts
        const txProgress = (txCount / TIER_CONFIG.TSUNAMI_MIN_TX) * 100;
        const contractProgress =
          (contractCount / TIER_CONFIG.TSUNAMI_MIN_CONTRACTS) * 100;
        const bestProgress = Math.max(txProgress, contractProgress);

        return {
          current: txCount,
          required: TIER_CONFIG.TSUNAMI_MIN_TX,
          percentage: Math.min(100, bestProgress),
          nextTier: 'Tsunami',
        };
      }

      case TIER_TSUNAMI: {
        // To Ocean: Requires admin grant + peer review
        // Show progress towards 500 tx threshold as reference
        const txProgress = (txCount / TIER_CONFIG.OCEAN_MIN_TX) * 100;

        return {
          current: txCount,
          required: TIER_CONFIG.OCEAN_MIN_TX,
          percentage: Math.min(100, txProgress),
          nextTier: 'Ocean (requires approval)',
        };
      }

      case TIER_OCEAN:
        return {
          current: txCount,
          required: 0,
          percentage: 100,
          nextTier: null, // Max tier
        };

      default:
        return {
          current: 0,
          required: TIER_CONFIG.WAVE_MIN_TX,
          percentage: 0,
          nextTier: 'Wave',
        };
    }
  }

  /**
   * Get full tier info for an address
   * Uses caching to reduce RPC calls
   */
  async getTierInfo(address: string): Promise<TierInfo> {
    // Check cache first
    const cached = tierCache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Fetch fresh data
    const [txCount, contractInfo] = await Promise.all([
      this.getTransactionCount(address),
      this.getDeployedContractsInfo(address),
    ]);

    const { count: contractCount, hasDeployed } = contractInfo;

    const tier = this.calculateTier(txCount, hasDeployed, contractCount);
    const metadata = TIER_METADATA[tier as keyof typeof TIER_METADATA];
    const progress = this.calculateProgress(tier, txCount, contractCount);

    const tierInfo: TierInfo = {
      level: tier,
      name: metadata.name,
      icon: metadata.icon,
      color: metadata.color,
      colorGradient: metadata.colorGradient,
      description: metadata.description,
      txCount,
      contractCount,
      hasDeployedContract: hasDeployed,
      progress,
    };

    // Update cache
    tierCache.set(address, {
      data: tierInfo,
      timestamp: Date.now(),
    });

    return tierInfo;
  }

  /**
   * Batch get tier info for multiple addresses
   * OPTIMIZED: Parallel fetching with cache-first strategy
   */
  async getTierInfoBatch(addresses: string[]): Promise<Map<string, TierInfo>> {
    const results = new Map<string, TierInfo>();
    const now = Date.now();

    // Check cache first
    const uncachedAddresses: string[] = [];
    for (const addr of addresses) {
      const cached = tierCache.get(addr);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        results.set(addr, cached.data);
      } else {
        uncachedAddresses.push(addr);
      }
    }

    if (uncachedAddresses.length === 0) {
      return results;
    }

    // Fetch all data in parallel for uncached addresses
    const [txCountsMap, contractInfos] = await Promise.all([
      this.getTransactionCountsBatch(uncachedAddresses),
      Promise.all(uncachedAddresses.map((addr) => this.getDeployedContractsInfo(addr))),
    ]);

    // Build tier info for each address
    for (let i = 0; i < uncachedAddresses.length; i++) {
      const addr = uncachedAddresses[i];
      const txCount = txCountsMap.get(addr) || 0;
      const { count: contractCount, hasDeployed } = contractInfos[i];

      const tier = this.calculateTier(txCount, hasDeployed, contractCount);
      const metadata = TIER_METADATA[tier as keyof typeof TIER_METADATA];
      const progress = this.calculateProgress(tier, txCount, contractCount);

      const tierInfo: TierInfo = {
        level: tier,
        name: metadata.name,
        icon: metadata.icon,
        color: metadata.color,
        colorGradient: metadata.colorGradient,
        description: metadata.description,
        txCount,
        contractCount,
        hasDeployedContract: hasDeployed,
        progress,
      };

      results.set(addr, tierInfo);

      // Update cache
      tierCache.set(addr, { data: tierInfo, timestamp: now });
    }

    return results;
  }

  /**
   * Clear cache for an address (e.g., after new transaction)
   */
  clearCache(address?: string): void {
    if (address) {
      tierCache.delete(address);
    } else {
      tierCache.clear();
    }
  }

  /**
   * Get tier requirements info (for display)
   */
  getTierRequirements(): typeof TIER_CONFIG {
    return { ...TIER_CONFIG };
  }

  /**
   * Get all tier metadata (for display)
   */
  getAllTierMetadata(): typeof TIER_METADATA {
    return { ...TIER_METADATA };
  }

  /**
   * Get deployed packages with metadata for display
   * Returns array of packages with ID, type, version info
   */
  async getDeployedPackages(address: string): Promise<Array<{
    id: string;
    package: string;
    version: string;
    digest: string;
  }>> {
    const rpcUrl = await this.getRpcUrl();
    if (!rpcUrl) {
      return [];
    }

    try {
      // Query for UpgradeCap objects owned by this address
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getOwnedObjects',
          params: [
            address,
            {
              filter: { StructType: '0x2::package::UpgradeCap' },
              options: {
                showType: true,
                showContent: true,
                showDisplay: true,
              },
            },
            null,
            50,
          ],
        }),
      });

      const result = (await response.json()) as {
        result?: {
          data?: Array<{
            data?: {
              objectId?: string;
              type?: string;
              content?: {
                dataType?: string;
                fields?: {
                  package?: string;
                  version?: string | number;
                  policy?: string;
                };
              };
              digest?: string;
            };
          }>;
        };
      };

      const packages = result.result?.data || [];

      // Filter active packages only (exclude deleted/wrapped objects)
      return packages
        .filter((obj) => {
          // Only include objects with content (active objects)
          // Deleted or wrapped objects won't have content.fields
          return obj.data?.content?.fields?.package;
        })
        .map((obj) => {
          const fields = obj.data!.content!.fields!;
          const packageId = fields.package!;
          const version = String(fields.version || '1');

          return {
            id: obj.data!.objectId!,
            package: packageId,
            version,
            digest: obj.data!.digest!,
          };
        });
    } catch (error) {
      console.error('[TierService] Failed to get deployed packages:', error);
      return [];
    }
  }
}
