import { create } from 'zustand';
import type { SuiAddress, SuiEnvironment, GasCoin } from '@/types';
import * as api from '@/api/client';

export type View =
  | 'commands'
  | 'addresses'
  | 'environments'
  | 'objects'
  | 'gas'
  | 'faucet'
  | 'object-detail';

interface AppState {
  // UI State
  isOpen: boolean;
  view: View;
  searchQuery: string;
  selectedIndex: number;
  isLoading: boolean;
  error: string | null;

  // Data
  addresses: SuiAddress[];
  environments: SuiEnvironment[];
  gasCoins: GasCoin[];
  objects: any[];
  selectedObjectId: string | null;
  suiInstalled: boolean | null;
  suiVersion: string | null;

  // Actions
  setOpen: (open: boolean) => void;
  setView: (view: View) => void;
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  setError: (error: string | null) => void;

  // Data fetching
  fetchStatus: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  fetchEnvironments: () => Promise<void>;
  fetchGasCoins: (address: string) => Promise<void>;
  fetchObjects: (address: string) => Promise<void>;

  // Address actions
  switchAddress: (address: string) => Promise<void>;
  createAddress: (keyScheme?: 'ed25519' | 'secp256k1' | 'secp256r1', alias?: string) => Promise<{ address: string; phrase?: string }>;

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
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial UI State
  isOpen: true,
  view: 'commands',
  searchQuery: '',
  selectedIndex: 0,
  isLoading: false,
  error: null,

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
    set({ isLoading: true, error: null });
    try {
      const addresses = await api.getAddresses();
      set({ addresses, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchEnvironments: async () => {
    set({ isLoading: true, error: null });
    try {
      const environments = await api.getEnvironments();
      set({ environments, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchGasCoins: async (address: string) => {
    set({ isLoading: true, error: null });
    try {
      const gasCoins = await api.getGasCoins(address);
      set({ gasCoins, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchObjects: async (address: string) => {
    set({ isLoading: true, error: null });
    try {
      const objects = await api.getObjects(address);
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
      await get().fetchAddresses();
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createAddress: async (keyScheme, alias) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.createAddress(keyScheme, alias);
      await get().fetchAddresses();
      set({ isLoading: false });
      return result;
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
      await get().fetchEnvironments();
      await get().fetchAddresses();
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addEnvironment: async (alias: string, rpc: string, ws?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.addEnvironment(alias, rpc, ws);
      await get().fetchEnvironments();
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  removeEnvironment: async (alias: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.removeEnvironment(alias);
      await get().fetchEnvironments();
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
        await get().fetchGasCoins(activeAddress.address);
      }
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
        await get().fetchGasCoins(activeAddress.address);
      }
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
      await get().fetchAddresses();
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Object detail
  viewObjectDetail: (objectId: string) => {
    set({ selectedObjectId: objectId, view: 'object-detail' });
  },
}));
