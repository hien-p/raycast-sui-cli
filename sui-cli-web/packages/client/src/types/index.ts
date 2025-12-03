// Shared types for Sui CLI Web

export interface SuiAddress {
  address: string;
  alias?: string;
  isActive: boolean;
  balance?: string;
  objectCount?: number;
}

export interface SuiEnvironment {
  alias: string;
  rpc: string;
  ws?: string;
  isActive: boolean;
}

export interface SuiObject {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: string;
  previousTransaction?: string;
  storageRebate?: string;
  content?: Record<string, unknown>;
}

export interface GasCoin {
  coinObjectId: string;
  balance: string;
  version: string;
  digest: string;
}

export interface FaucetResponse {
  success: boolean;
  message: string;
  txDigest?: string;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Command types for the palette
export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  category: string;
  keywords?: string[];
  action: string;
}

export const CATEGORIES = {
  ADDRESS: 'Addresses',
  ENVIRONMENT: 'Environment',
  OBJECTS: 'Objects & Assets',
  GAS: 'Gas',
  FAUCET: 'Faucet',
  KEYS: 'Keys & Security',
  COMMUNITY: 'Community',
} as const;

export const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'addresses',
    title: 'Manage Addresses',
    subtitle: 'View, switch, and create addresses',
    icon: '👤',
    category: CATEGORIES.ADDRESS,
    keywords: ['wallet', 'account', 'address'],
    action: 'addresses',
  },
  {
    id: 'environments',
    title: 'Switch Environment',
    subtitle: 'Change network (devnet, testnet, mainnet)',
    icon: '🌐',
    category: CATEGORIES.ENVIRONMENT,
    keywords: ['network', 'rpc', 'devnet', 'testnet', 'mainnet'],
    action: 'environments',
  },
  {
    id: 'objects',
    title: 'My Objects',
    subtitle: 'Browse owned objects',
    icon: '📦',
    category: CATEGORIES.OBJECTS,
    keywords: ['nft', 'coin', 'token', 'asset'],
    action: 'objects',
  },
  {
    id: 'gas',
    title: 'Gas Coins',
    subtitle: 'Manage gas coins (split, merge)',
    icon: '⛽',
    category: CATEGORIES.GAS,
    keywords: ['gas', 'coin', 'split', 'merge', 'sui'],
    action: 'gas',
  },
  {
    id: 'faucet',
    title: 'Request Faucet',
    subtitle: 'Get test tokens from faucet',
    icon: '🚰',
    category: CATEGORIES.FAUCET,
    keywords: ['faucet', 'free', 'token', 'test'],
    action: 'faucet',
  },
  {
    id: 'community',
    title: 'My Community Profile',
    subtitle: 'View tier, progress & hints',
    icon: '👥',
    category: CATEGORIES.COMMUNITY,
    keywords: ['community', 'tier', 'member', 'profile', 'progress', 'badge', 'rank'],
    action: 'community',
  },
];
