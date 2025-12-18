/**
 * Community/Membership State Slice
 * @module stores/slices/communitySlice
 */

import type { StateCreator } from 'zustand';
import {
  checkCommunityMembership,
  getCommunityStats,
  joinCommunity as apiJoinCommunity,
  getTierInfo,
  refreshTier,
  type TierInfo,
} from '@/api/services/community';
import { trackEvent, identifyUser, setTag, ClarityEvents } from '@/lib/clarity';

export interface CommunitySlice {
  // State
  isCommunityMember: boolean;
  communityStats: { totalMembers: number; isConfigured: boolean };
  tierInfo: TierInfo | null;

  // Actions
  fetchCommunityStatus: () => Promise<void>;
  joinCommunity: () => Promise<{ success: boolean; txDigest?: string; error?: string }>;
  fetchTierInfo: (address?: string) => Promise<void>;
  refreshTierInfo: (address?: string) => Promise<void>;
}

// Type for accessing other slices (for combined store)
interface StoreWithWallet {
  addresses: Array<{ address: string; isActive: boolean }>;
}

export const createCommunitySlice: StateCreator<
  CommunitySlice & StoreWithWallet,
  [],
  [],
  CommunitySlice
> = (set, get) => ({
  // Initial State
  isCommunityMember: false,
  communityStats: { totalMembers: 0, isConfigured: false },
  tierInfo: null,

  // Actions
  fetchCommunityStatus: async () => {
    try {
      const [membershipResult, statsResult] = await Promise.all([
        checkCommunityMembership(),
        getCommunityStats(),
      ]);

      set({
        isCommunityMember: membershipResult.isMember,
        communityStats: statsResult,
      });

      // Track membership status
      if (membershipResult.isMember) {
        setTag('memberStatus', 'member');
      }
    } catch (error) {
      console.error('Failed to fetch community status:', error);
    }
  },

  joinCommunity: async () => {
    try {
      const result = await apiJoinCommunity();

      if (result.alreadyMember) {
        set({ isCommunityMember: true });
        return { success: true };
      }

      if (result.txDigest) {
        set({ isCommunityMember: true });

        // Track successful join
        trackEvent(ClarityEvents.COMMUNITY_JOIN);
        setTag('memberStatus', 'member');

        // Identify user after joining
        const activeAddress = get().addresses.find(a => a.isActive);
        if (activeAddress) {
          identifyUser(activeAddress.address);
        }

        return { success: true, txDigest: result.txDigest };
      }

      return { success: false, error: 'Join failed - no transaction digest returned' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to join community';
      return { success: false, error: errorMsg };
    }
  },

  fetchTierInfo: async (address?: string) => {
    try {
      const targetAddress = address || get().addresses.find(a => a.isActive)?.address;
      if (!targetAddress) return;

      const tierInfo = await getTierInfo(targetAddress);
      set({ tierInfo });

      // Track tier in analytics
      if (tierInfo) {
        setTag('tier', tierInfo.name);
        setTag('tierLevel', String(tierInfo.level));
      }
    } catch (error) {
      console.error('Failed to fetch tier info:', error);
    }
  },

  refreshTierInfo: async (address?: string) => {
    try {
      const targetAddress = address || get().addresses.find(a => a.isActive)?.address;
      if (!targetAddress) return;

      const tierInfo = await refreshTier(targetAddress);
      set({ tierInfo });
    } catch (error) {
      console.error('Failed to refresh tier info:', error);
    }
  },
});
