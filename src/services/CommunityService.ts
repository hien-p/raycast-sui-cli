/**
 * CommunityService - Connect to Sui CLI Web backend for community features
 *
 * Requires Sui CLI Web server running on localhost:3001
 * Start with: cd sui-cli-web && npx sui-cli-web
 */

const API_BASE = 'http://localhost:3001/api';

export interface TierInfo {
  level: number;
  name: string;
  icon: string;
  color: string;
  colorGradient: string;
  description: string;
  txCount: number;
  hasDeployedContract: boolean;
  progress: {
    current: number;
    required: number;
    percentage: number;
    nextTier: string | null;
  };
}

export interface CommunityStats {
  totalMembers: number;
  isConfigured: boolean;
}

export interface MembershipStatus {
  isMember: boolean;
  joinedAt?: number;
}

export class CommunityService {
  /**
   * Check if Sui CLI Web server is running
   */
  async checkServerConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3s timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<CommunityStats> {
    const response = await fetch(`${API_BASE}/community/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch community stats');
    }
    const data = await response.json();
    return data.data;
  }

  /**
   * Get tier information for an address
   */
  async getTierInfo(address: string): Promise<TierInfo> {
    const response = await fetch(`${API_BASE}/community/tier/${address}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tier info');
    }
    const data = await response.json();
    return data.data;
  }

  /**
   * Check if address is a community member
   */
  async checkMembership(address: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/community/membership`, {
        method: 'GET',
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.data.isMember;
    } catch {
      return false;
    }
  }

  /**
   * Join the community (requires active address)
   */
  async joinCommunity(): Promise<{ success: boolean; txDigest?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/community/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Join failed' };
      }

      return {
        success: true,
        txDigest: data.data.txDigest,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get tier benefits based on tier level
   */
  getTierBenefits(tierLevel: number): string[] {
    switch (tierLevel) {
      case 0: // Droplet
        return [
          'Full access to all features',
          'Droplet badge on profile',
          'Counted in community stats',
        ];
      case 1: // Wave
        return [
          'Wave badge with glow animation',
          'Priority in community leaderboard',
          'Early access to beta features',
          'NFT Card: Basic static design',
        ];
      case 2: // Tsunami
        return [
          'Tsunami badge with particle effects',
          'NFT Card: Animated effects + custom colors',
          'Governance voting rights',
          'Featured in Top Builders section',
          'Grant program eligibility',
        ];
      case 3: // Ocean
        return [
          'Ocean badge - legendary holographic effect',
          'NFT Card: Full customization',
          'Ambassador status',
          'Revenue sharing opportunities',
          'Advisory board seat',
        ];
      default:
        return [];
    }
  }

  /**
   * Get hints for what to unlock next
   */
  getNextTierHints(tierLevel: number): string[] {
    switch (tierLevel) {
      case 0: // Droplet → Wave
        return [
          'Make 25 transactions OR deploy 3 smart contracts',
          'Each transaction brings you closer to Wave tier',
          'Deploying contracts counts more towards progress',
        ];
      case 1: // Wave → Tsunami
        return [
          'Make 100 transactions OR deploy 10 contracts',
          'Contribute to Sui ecosystem (PRs, guides)',
          'Only top 3-5% reach Tsunami tier',
        ];
      case 2: // Tsunami → Ocean
        return [
          'Reach 500+ transactions + major contributions',
          'Get peer review from 3 Ocean members',
          'Requires core team endorsement',
          'Limited to 50 members worldwide',
        ];
      case 3: // Ocean - Max tier
        return [
          'You\'ve reached the pinnacle!',
          'Continue contributing to maintain status',
          'Annual re-certification required',
        ];
      default:
        return [];
    }
  }
}
