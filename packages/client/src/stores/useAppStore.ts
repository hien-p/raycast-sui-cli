import { create } from 'zustand';
import type { SuiAddress, SuiEnvironment, GasCoin } from '@/types';
import * as api from '@/api/client';
import { checkConnection, TierInfo } from '@/api/client';
import { suiService } from '@/services/SuiService';
import { trackEvent, identifyUser, setTag, ClarityEvents } from '@/lib/clarity';
import { apiCache, cacheKeys } from '@/api/cache';

export type View =
  | 'commands'
  | 'addresses'
  | 'environments'
  | 'objects'
  | 'gas'
  | 'faucet'
  | 'object-detail';

export type ThemeMode = 'glass' | 'dark';

interface AppState {
  // UI State
  isOpen: boolean;
  view: View;
  searchQuery: string;
  selectedIndex: number;
  isLoading: boolean;
  error: string | null;
  themeMode: ThemeMode;
  gridEnabled: boolean;

  // Connection state
  isServerConnected: boolean | null; // null = checking, true = connected, false = disconnected
  isCheckingConnection: boolean;

  // Community state
  isCommunityMember: boolean;
  communityStats: { totalMembers: number; isConfigured: boolean };
  tierInfo: TierInfo | null;

  // Data
  addresses: SuiAddress[];
  environments: SuiEnvironment[];
  gasCoins: GasCoin[];
  objects: Record<string, unknown>[];
  selectedObjectId: string | null;
  suiInstalled: boolean | null;
  suiVersion: string | null;

  // Actions
  setOpen: (open: boolean) => void;
  setView: (view: View) => void;
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  setError: (error: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setGridEnabled: (enabled: boolean) => void;

  // Data fetching
  fetchStatus: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  fetchEnvironments: () => Promise<void>;
  fetchGasCoins: (address: string) => Promise<void>;
  fetchObjects: (address: string) => Promise<void>;

  // Address actions
  switchAddress: (address: string) => Promise<void>;
  createAddress: (keyScheme?: 'ed25519' | 'secp256k1' | 'secp256r1', alias?: string) => Promise<{ address: string; phrase?: string }>;
  removeAddress: (address: string) => Promise<void>;

  // Environment actions
  switchEnvironment: (alias: string) => Promise<void>;
  addEnvironment: (alias: string, rpc: string, ws?: string) => Promise<void>;
  removeEnvironment: (alias: string) => Promise<void>;

  // Gas actions
  splitCoin: (coinId: string, amounts: string[]) => Promise<void>;
  mergeCoins: (primaryCoinId: string, coinIdsToMerge: string[]) => Promise<void>;

  // Faucet
  requestFaucet: (network: 'testnet' | 'devnet' | 'localnet') => Promise<void>;

  // Object detail
  viewObjectDetail: (objectId: string) => void;

  // Connection
  checkServerConnection: () => Promise<boolean>;

  // Community
  fetchCommunityStatus: () => Promise<void>;
  joinCommunity: () => Promise<{ success: boolean; txDigest?: string; error?: string }>;
  fetchTierInfo: (address?: string) => Promise<void>;
  refreshTierInfo: (address?: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial UI State
  isOpen: true,
  view: 'commands',
  searchQuery: '',
  selectedIndex: 0,
  isLoading: false,
  error: null,
  themeMode: (typeof window !== 'undefined' && localStorage.getItem('sui-cli-theme') as ThemeMode) || 'glass',
  gridEnabled: typeof window !== 'undefined' ? localStorage.getItem('sui-cli-grid') !== 'false' : true,

  // Connection state
  isServerConnected: null,
  isCheckingConnection: false,

  // Community state
  isCommunityMember: false,
  communityStats: { totalMembers: 0, isConfigured: false },
  tierInfo: null,

  // Initial Data
  addresses: [],
  environments: [],
  gasCoins: [],
  objects: [],
  selectedObjectId: null,
  suiInstalled: null as boolean | null,
  suiVersion: null,

  // UI Actions
  setOpen: (open) => set({ isOpen: open }),
  setView: (view) => set({ view, searchQuery: '', selectedIndex: 0 }),
  setSearchQuery: (query) => set({ searchQuery: query, selectedIndex: 0 }),
  setSelectedIndex: (index) => set({ selectedIndex: index }),
  setError: (error) => set({ error }),
  setThemeMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sui-cli-theme', mode);
    }
    set({ themeMode: mode });
  },
  setGridEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sui-cli-grid', enabled ? 'true' : 'false');
    }
    set({ gridEnabled: enabled });
  },

  // Data fetching
  fetchStatus: async () => {
    try {
      const status = await api.getStatus();
      set({ suiInstalled: status.suiInstalled, suiVersion: status.suiVersion || null });
    } catch (error) {
      // Don't show error for status check, just log it
      console.error('Failed to fetch status:', error);
      // Assume installed if we can't check (server might be starting)
      set({ suiInstalled: true });
    }
  },

  fetchAddresses: async () => {
    // Return cached data immediately if available (instant UI update)
    const cachedAddresses = get().addresses;
    if (cachedAddresses.length > 0) {
      // Data already in store - UI shows this instantly
      // But still fetch fresh data in background
      set({ isLoading: false });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      // Use cache and deduplication - prevents redundant calls
      const addresses = await apiCache.dedupe(
        cacheKeys.addresses(),
        () => api.getAddresses(),
        3000 // 3s cache for addresses
      );
      set({ addresses, isLoading: false, error: null });
    } catch (error) {
      // If we had cached data, keep showing it despite error
      if (cachedAddresses.length > 0) {
        set({ isLoading: false });
      } else {
        set({ error: String(error), isLoading: false });
      }
    }
  },

  fetchEnvironments: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use cache and deduplication
      const environments = await apiCache.dedupe(
        cacheKeys.environments(),
        () => api.getEnvironments(),
        5000 // 5s cache for environments (changes less frequently)
      );
      set({ environments, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchGasCoins: async (address: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use cache and deduplication
      const gasCoins = await apiCache.dedupe(
        cacheKeys.gasCoins(address),
        () => api.getGasCoins(address),
        2000 // 2s cache for gas coins
      );
      set({ gasCoins, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchObjects: async (address: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use cache and deduplication
      const objects = await apiCache.dedupe(
        cacheKeys.objects(address),
        () => api.getObjects(address),
        3000 // 3s cache for objects
      );
      set({ objects, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Address actions
  switchAddress: async (address: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.switchAddress(address);
      // Invalidate cache after address switch
      apiCache.invalidate(cacheKeys.addresses());
      apiCache.invalidatePattern(/^community:/);
      apiCache.invalidatePattern(/^tier:/);
      // Fetch in parallel for faster update
      await Promise.all([
        get().fetchAddresses(),
        get().fetchCommunityStatus(),
      ]);
      set({ isLoading: false });
      trackEvent(ClarityEvents.ADDRESS_SWITCHED);
      identifyUser(address);
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createAddress: async (keyScheme, alias) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.createAddress(keyScheme, alias);
      // Invalidate addresses cache
      apiCache.invalidate(cacheKeys.addresses());
      await get().fetchAddresses();
      set({ isLoading: false });
      trackEvent(ClarityEvents.ADDRESS_CREATED);
      return result;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  removeAddress: async (address: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.removeAddress(address);
      // Invalidate addresses cache
      apiCache.invalidate(cacheKeys.addresses());
      await get().fetchAddresses();
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Environment actions
  switchEnvironment: async (alias: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.switchEnvironment(alias);
      // Invalidate environments and addresses cache
      apiCache.invalidate(cacheKeys.environments());
      apiCache.invalidate(cacheKeys.addresses());
      // Fetch in parallel for faster update
      await Promise.all([
        get().fetchEnvironments(),
        get().fetchAddresses(),
      ]);
      set({ isLoading: false });
      trackEvent(ClarityEvents.ENVIRONMENT_SWITCHED);
      setTag('network', alias);
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addEnvironment: async (alias: string, rpc: string, ws?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.addEnvironment(alias, rpc, ws);
      // Invalidate environments cache
      apiCache.invalidate(cacheKeys.environments());
      await get().fetchEnvironments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  removeEnvironment: async (alias: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.removeEnvironment(alias);
      // Invalidate environments cache
      apiCache.invalidate(cacheKeys.environments());
      await get().fetchEnvironments();
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Gas actions
  splitCoin: async (coinId: string, amounts: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await api.splitCoin(coinId, amounts);
      const activeAddress = get().addresses.find((a) => a.isActive);
      if (activeAddress) {
        // Invalidate gas coins cache after mutation
        apiCache.invalidate(cacheKeys.gasCoins(activeAddress.address));
        await get().fetchGasCoins(activeAddress.address);
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  mergeCoins: async (primaryCoinId: string, coinIdsToMerge: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await api.mergeCoins(primaryCoinId, coinIdsToMerge);
      const activeAddress = get().addresses.find((a) => a.isActive);
      if (activeAddress) {
        // Invalidate gas coins cache after mutation
        apiCache.invalidate(cacheKeys.gasCoins(activeAddress.address));
        await get().fetchGasCoins(activeAddress.address);
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Faucet
  requestFaucet: async (network: 'testnet' | 'devnet' | 'localnet') => {
    set({ isLoading: true, error: null });
    try {
      await api.requestFaucet(network);
      // Wait for transaction to finalize on blockchain before refreshing balance
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Invalidate addresses cache after faucet request
      apiCache.invalidate(cacheKeys.addresses());
      await get().fetchAddresses();
      set({ isLoading: false });
      trackEvent(ClarityEvents.FAUCET_REQUESTED);
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Object detail
  viewObjectDetail: (objectId: string) => {
    set({ selectedObjectId: objectId, view: 'object-detail' });
  },

  // Connection
  checkServerConnection: async () => {
    set({ isCheckingConnection: true });
    try {
      const connected = await checkConnection();
      set({ isServerConnected: connected, isCheckingConnection: false });
      if (connected) {
        trackEvent(ClarityEvents.SERVER_CONNECTED);
      }
      return connected;
    } catch {
      set({ isServerConnected: false, isCheckingConnection: false });
      return false;
    }
  },

  // Community
  fetchCommunityStatus: async () => {
    try {
      // Try to get active address from store first, then from API if not available
      let activeAddress = get().addresses.find((a) => a.isActive)?.address;

      // If addresses not loaded yet, try to get from API
      if (!activeAddress) {
        try {
          const addresses = await api.getAddresses();
          activeAddress = addresses.find((a) => a.isActive)?.address;
        } catch {
          // Ignore - might not be connected to server yet
        }
      }

      // Use cache and deduplication to prevent redundant community status calls
      const result = await apiCache.dedupe(
        cacheKeys.communityStatus(activeAddress),
        async () => {
          const [statsData, isMember] = await Promise.all([
            suiService.getCommunityStats().catch(() => ({ totalMembers: 0, isConfigured: false })),
            activeAddress
              ? suiService.checkMembership(activeAddress).catch(() => false)
              : Promise.resolve(false),
          ]);
          return { statsData, isMember };
        },
        10000 // 10s cache for community status (changes infrequently)
      );

      set({
        communityStats: result.statsData,
        isCommunityMember: result.isMember,
      });
    } catch {
      // Silently fail
    }
  },

  joinCommunity: async () => {
    try {
      const result = await api.joinCommunity();
      if (result.alreadyMember || result.txDigest) {
        set({ isCommunityMember: true });
        // Invalidate community cache after joining
        apiCache.invalidatePattern(/^community:/);
        apiCache.invalidatePattern(/^tier:/);
        // Refresh stats
        const stats = await suiService.getCommunityStats().catch(() => get().communityStats);
        set({ communityStats: stats });
        trackEvent(ClarityEvents.COMMUNITY_JOINED);
        return { success: true, txDigest: result.txDigest };
      }
      return { success: false, error: 'Join failed' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  },

  fetchTierInfo: async (address?: string) => {
    try {
      // Get active address if not provided
      let targetAddress = address;
      if (!targetAddress) {
        targetAddress = get().addresses.find((a) => a.isActive)?.address;
        if (!targetAddress) {
          // Try to get from API
          try {
            const addresses = await api.getAddresses();
            targetAddress = addresses.find((a) => a.isActive)?.address;
          } catch {
            // Ignore
          }
        }
      }

      if (!targetAddress) {
        set({ tierInfo: null });
        return;
      }

      // Use cache and deduplication
      const tierInfo = await apiCache.dedupe(
        cacheKeys.tierInfo(targetAddress),
        () => api.getTierInfo(targetAddress),
        8000 // 8s cache for tier info
      );
      set({ tierInfo });
    } catch (error) {
      console.error('Failed to fetch tier info:', error);
      set({ tierInfo: null });
    }
  },

  refreshTierInfo: async (address?: string) => {
    try {
      let targetAddress = address;
      if (!targetAddress) {
        targetAddress = get().addresses.find((a) => a.isActive)?.address;
      }

      if (!targetAddress) {
        return;
      }

      // Invalidate tier cache before refreshing
      apiCache.invalidate(cacheKeys.tierInfo(targetAddress));
      const tierInfo = await api.refreshTier(targetAddress);
      set({ tierInfo });
    } catch (error) {
      console.error('Failed to refresh tier info:', error);
    }
  },
}));
