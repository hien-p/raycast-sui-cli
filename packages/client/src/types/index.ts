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
  TRANSFER: 'Transfer',
  KEYS: 'Keys & Security',
  MEMBERSHIP: 'Membership',
  DEVELOPMENT: 'Development',
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
    id: 'dynamic-fields',
    title: 'Dynamic Fields',
    subtitle: 'Query dynamic fields on objects',
    icon: '🔗',
    category: CATEGORIES.OBJECTS,
    keywords: ['dynamic', 'field', 'object', 'query', 'explore'],
    action: 'dynamic-fields',
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
    id: 'transfer',
    title: 'Transfer SUI',
    subtitle: 'Send SUI tokens to another address',
    icon: '💸',
    category: CATEGORIES.TRANSFER,
    keywords: ['transfer', 'send', 'pay', 'payment', 'sui', 'token'],
    action: 'transfer',
  },
  {
    id: 'membership',
    title: 'My Profile',
    subtitle: 'View your membership, tier & achievements',
    icon: '🎖️',
    category: CATEGORIES.MEMBERSHIP,
    keywords: ['membership', 'tier', 'member', 'profile', 'progress', 'badge', 'rank', 'achievement'],
    action: 'membership',
  },
  {
    id: 'move',
    title: 'Move Development',
    subtitle: 'Build, test, publish & upgrade Move packages',
    icon: '📦',
    category: CATEGORIES.DEVELOPMENT,
    keywords: ['move', 'smart contract', 'build', 'test', 'publish', 'upgrade', 'package', 'deploy', 'development'],
    action: 'move',
  },
  {
    id: 'inspector',
    title: 'Transaction Inspector',
    subtitle: 'Inspect & replay transactions for debugging',
    icon: '🔍',
    category: CATEGORIES.DEVELOPMENT,
    keywords: ['transaction', 'inspect', 'replay', 'debug', 'debugger', 'bytecode', 'tx'],
    action: 'inspector',
  },
  {
    id: 'devtools',
    title: 'Developer Tools',
    subtitle: 'Coverage, disassembly, package summary',
    icon: '🛠️',
    category: CATEGORIES.DEVELOPMENT,
    keywords: ['coverage', 'disassemble', 'summary', 'bytecode', 'test', 'debug'],
    action: 'devtools',
  },
  {
    id: 'security',
    title: 'Security Tools',
    subtitle: 'Verify source, bytecode, decode transactions',
    icon: '🔒',
    category: CATEGORIES.KEYS,
    keywords: ['verify', 'source', 'bytecode', 'security', 'decode', 'transaction', 'audit'],
    action: 'security',
  },
  {
    id: 'keytool',
    title: 'Key Management',
    subtitle: 'Generate keys, sign messages, multi-sig',
    icon: '🔑',
    category: CATEGORIES.KEYS,
    keywords: ['key', 'generate', 'sign', 'multisig', 'signature', 'keypair'],
    action: 'keytool',
  },
];
