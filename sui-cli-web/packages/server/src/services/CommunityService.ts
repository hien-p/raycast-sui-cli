import { SuiCliExecutor } from '../cli/SuiCliExecutor';
import { ConfigParser } from '../cli/ConfigParser';
import { TierService } from './TierService';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Try to load deployment config from my_deployments.json
let deploymentConfig: { package_id?: string; registry_id?: string } = {};
try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // Go up from packages/server/src/services to project root's package_summaries
  const deploymentPath = join(__dirname, '../../../../../package_summaries/my_deployments.json');
  const content = readFileSync(deploymentPath, 'utf-8');
  const deployments = JSON.parse(content);
  if (deployments.community_registry) {
    deploymentConfig = {
      package_id: deployments.community_registry.package_id,
      registry_id: deployments.community_registry.shared_objects?.CommunityRegistry,
    };
  }
} catch {
  // Deployment file not found or invalid, will use env vars
}

// Contract addresses - priority: env vars > my_deployments.json
const PACKAGE_ID = process.env.COMMUNITY_PACKAGE_ID || deploymentConfig.package_id || '';
const REGISTRY_ID = process.env.COMMUNITY_REGISTRY_ID || deploymentConfig.registry_id || '';
const CLOCK_ID = '0x6'; // Sui system clock

export interface CommunityStats {
  totalMembers: number;
  isConfigured: boolean;
}

export interface JoinResult {
  success: boolean;
  txDigest?: string;
  error?: string;
  alreadyMember?: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  txCount: number;
  balance: number;
  requirements: {
    minTxCount: number;
    minBalance: number;
  };
}

export class CommunityService {
  private executor: SuiCliExecutor;
  private configParser: ConfigParser;
  private tierService: TierService;

  // Requirements to join community
  private static readonly MIN_TX_COUNT = 10;
  private static readonly MIN_BALANCE = 10; // 10 SUI

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
    this.configParser = ConfigParser.getInstance();
    this.tierService = new TierService();
  }

  /**
   * Check if community registry is configured
   */
  isConfigured(): boolean {
    return Boolean(PACKAGE_ID && REGISTRY_ID);
  }

  /**
   * Check if an address is eligible to join the community
   * Requirements:
   * - At least 10 transactions
   * - At least 10 SUI balance
   */
  async checkEligibility(address: string): Promise<EligibilityResult> {
    const reasons: string[] = [];

    try {
      // Get transaction count
      const txCount = await this.tierService.getTransactionCount(address);

      // Get balance via RPC (CLI balance command doesn't support --address flag)
      let balance = 0;
      const rpcUrl = await this.tierService.getRpcUrl();

      if (rpcUrl) {
        try {
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

          const result = await response.json() as {
            result?: {
              totalBalance?: string;
            };
          };

          if (result.result?.totalBalance) {
            // Convert from MIST to SUI (1 SUI = 1_000_000_000 MIST)
            balance = parseInt(result.result.totalBalance) / 1_000_000_000;
          }
        } catch (error) {
          console.error('[CommunityService] Failed to get balance via RPC:', error);
        }
      }

      // Check requirements
      if (txCount < CommunityService.MIN_TX_COUNT) {
        reasons.push(`Need at least ${CommunityService.MIN_TX_COUNT} transactions (you have ${txCount})`);
      }

      if (balance < CommunityService.MIN_BALANCE) {
        reasons.push(`Need at least ${CommunityService.MIN_BALANCE} SUI balance (you have ${balance.toFixed(2)} SUI)`);
      }

      const eligible = reasons.length === 0;

      return {
        eligible,
        reasons,
        txCount,
        balance,
        requirements: {
          minTxCount: CommunityService.MIN_TX_COUNT,
          minBalance: CommunityService.MIN_BALANCE,
        },
      };
    } catch (error) {
      console.error('[CommunityService] Failed to check eligibility:', error);
      return {
        eligible: false,
        reasons: ['Failed to check eligibility. Please try again.'],
        txCount: 0,
        balance: 0,
        requirements: {
          minTxCount: CommunityService.MIN_TX_COUNT,
          minBalance: CommunityService.MIN_BALANCE,
        },
      };
    }
  }

  /**
   * Join the community - user opts in voluntarily
   * User must have gas to pay for the transaction
   */
  async joinCommunity(): Promise<JoinResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Community registry not configured. Contract needs to be deployed first.',
      };
    }

    // Check eligibility first
    try {
      const activeAddress = (await this.executor.execute(['client', 'active-address'])).trim();
      const eligibility = await this.checkEligibility(activeAddress);

      if (!eligibility.eligible) {
        return {
          success: false,
          error: `Requirements not met:\n${eligibility.reasons.join('\n')}`,
        };
      }
    } catch (error) {
      console.error('[CommunityService] Failed to check eligibility before join:', error);
      // Continue anyway - let the contract handle it
    }

    try {
      const result = await this.executor.execute(
        [
          'client',
          'call',
          '--package',
          PACKAGE_ID,
          '--module',
          'registry',
          '--function',
          'join_community',
          '--args',
          REGISTRY_ID,
          CLOCK_ID,
          '--gas-budget',
          '5000000',
        ],
        { json: true }
      );

      const data = JSON.parse(result);

      // Check for success
      if (data.effects?.status?.status === 'success') {
        return {
          success: true,
          txDigest: data.digest,
        };
      }

      // Check for already member error
      const errorMsg = data.effects?.status?.error || '';
      if (errorMsg.includes('EAlreadyMember') || errorMsg.includes('1')) {
        return {
          success: false,
          alreadyMember: true,
          error: 'You are already a community member!',
        };
      }

      return {
        success: false,
        error: errorMsg || 'Transaction failed',
      };
    } catch (error) {
      const errorStr = String(error);

      // Parse common errors - check for abort codes
      // EAlreadyMember = 1
      if (errorStr.includes('EAlreadyMember') || (errorStr.includes('MoveAbort') && errorStr.includes(', 1)'))) {
        return {
          success: false,
          alreadyMember: true,
          error: 'You are already a community member!',
        };
      }

      // ENotMember = 2
      if (errorStr.includes('ENotMember') || (errorStr.includes('MoveAbort') && errorStr.includes(', 2)'))) {
        return {
          success: false,
          error: 'You are not a member yet.',
        };
      }

      // EPaused = 3
      if (errorStr.includes('EPaused') || (errorStr.includes('MoveAbort') && errorStr.includes(', 3)'))) {
        return {
          success: false,
          error: 'Community registration is temporarily paused. Please try again later.',
        };
      }

      // Gas related errors
      if (errorStr.includes('InsufficientGas') || errorStr.includes('No gas') || errorStr.includes('not enough')) {
        return {
          success: false,
          error: 'Insufficient gas. Please request tokens from faucet first.',
        };
      }

      // No coins/balance errors
      if (errorStr.includes('No valid gas coins') || errorStr.includes('unable to select')) {
        return {
          success: false,
          error: 'No SUI tokens found. Please request tokens from faucet first.',
        };
      }

      // Network/RPC errors
      if (errorStr.includes('ECONNREFUSED') || errorStr.includes('fetch failed') || errorStr.includes('network')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      // Generic error - sanitize the message
      const sanitizedError = errorStr
        .replace(/\/Users\/[^/\s]+/g, '***')
        .replace(/\/home\/[^/\s]+/g, '***')
        .substring(0, 200); // Limit length

      return {
        success: false,
        error: `Failed to join community: ${sanitizedError}`,
      };
    }
  }

  /**
   * Get community statistics by querying the registry object
   */
  async getStats(): Promise<CommunityStats> {
    if (!this.isConfigured()) {
      return {
        totalMembers: 0,
        isConfigured: false,
      };
    }

    try {
      const result = await this.executor.execute(
        ['client', 'object', REGISTRY_ID],
        { json: true }
      );

      const data = JSON.parse(result);
      const fields = data.content?.fields || data.data?.content?.fields || {};

      return {
        totalMembers: parseInt(fields.total_members || '0', 10),
        isConfigured: true,
      };
    } catch (error) {
      console.error('[CommunityService] Failed to get stats:', error);
      return {
        totalMembers: 0,
        isConfigured: true,
      };
    }
  }

  /**
   * Check if an address is a community member
   * Uses RPC to query the table
   */
  async checkMembership(address?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Get active address if not provided
      const targetAddress =
        address ||
        (await this.executor.execute(['client', 'active-address'])).trim();

      // Query the registry object to get the table ID
      const registryResult = await this.executor.execute(
        ['client', 'object', REGISTRY_ID],
        { json: true }
      );

      const registryData = JSON.parse(registryResult);
      const fields = registryData.content?.fields || registryData.data?.content?.fields || {};
      const membersTableId = fields.members?.fields?.id?.id;

      if (!membersTableId) {
        return false;
      }

      // Try to get the dynamic field for this address
      // This is a simplified check - in production you might use RPC directly
      const config = await this.configParser.getConfig();
      const activeEnv = config?.envs.find((e) => e.alias === config.active_env);
      const rpcUrl = activeEnv?.rpc;

      if (!rpcUrl) {
        return false;
      }

      // Query dynamic field
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getDynamicFieldObject',
          params: [
            membersTableId,
            {
              type: 'address',
              value: targetAddress,
            },
          ],
        }),
      });

      const result = await response.json() as { result?: { data?: unknown; error?: unknown } };

      // If we get data back, user is a member
      return result.result?.data !== undefined && result.result?.error === undefined;
    } catch (error) {
      console.error('[CommunityService] Failed to check membership:', error);
      return false;
    }
  }

  /**
   * Get contract configuration for frontend
   */
  getConfig(): { packageId: string; registryId: string; isConfigured: boolean } {
    return {
      packageId: PACKAGE_ID,
      registryId: REGISTRY_ID,
      isConfigured: this.isConfigured(),
    };
  }
}
