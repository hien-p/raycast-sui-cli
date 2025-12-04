import type {
  ApiResponse,
  SuiAddress,
  SuiEnvironment,
  GasCoin,
  FaucetResponse,
} from '@/types';

// In production (deployed UI), connect to localhost server
// In development (vite dev), use proxy
const isDev = import.meta.env.DEV;

// Try multiple localhost variants for browser compatibility
const LOCALHOST_URLS = [
  'http://localhost:3001/api',
  'http://127.0.0.1:3001/api',
];

let API_BASE = isDev ? '/api' : LOCALHOST_URLS[0];
let currentUrlIndex = 0;

// Connection state
let isServerConnected = false;

// Request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

export function getConnectionStatus() {
  return isServerConnected;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Check if response is ok - for 4xx errors, try to read the error message from body
    if (!response.ok) {
      isServerConnected = response.status < 500; // Still connected if it's a 4xx error

      // Try to read error message from response body
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (errorData.error) {
            throw new Error(errorData.error);
          }
        }
      } catch (parseError) {
        // If parsing fails, fall through to generic error
        if (parseError instanceof Error && !parseError.message.includes('Server error')) {
          throw parseError;
        }
      }

      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      isServerConnected = false;
      throw new Error('Server returned non-JSON response. Is the server running?');
    }

    const text = await response.text();
    if (!text) {
      isServerConnected = false;
      throw new Error('Server returned empty response. Is the server running?');
    }

    const data: ApiResponse<T> = JSON.parse(text);
    isServerConnected = true;

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check for timeout (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      isServerConnected = false;
      throw new Error('Request timed out. Please try again.');
    }
    // Check if it's a network error (server not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      isServerConnected = false;
      throw new Error('Cannot connect to local server. Make sure the server is running on port 3001.');
    }
    // Check for JSON parse error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      isServerConnected = false;
      throw new Error('Invalid server response. Is the server running correctly?');
    }
    throw error;
  }
}

// Check server connection - tries multiple localhost URLs for browser compatibility
export async function checkConnection(): Promise<boolean> {
  if (isDev) {
    try {
      await fetch(`${API_BASE}/health`, { method: 'GET' });
      isServerConnected = true;
      return true;
    } catch {
      isServerConnected = false;
      return false;
    }
  }

  // In production, try multiple localhost URLs (some browsers block certain variants)
  for (let i = 0; i < LOCALHOST_URLS.length; i++) {
    const url = LOCALHOST_URLS[(currentUrlIndex + i) % LOCALHOST_URLS.length];
    try {
      await fetch(`${url}/health`, { method: 'GET' });
      // Found working URL, update API_BASE
      API_BASE = url;
      currentUrlIndex = (currentUrlIndex + i) % LOCALHOST_URLS.length;
      isServerConnected = true;
      return true;
    } catch {
      // Try next URL
    }
  }

  isServerConnected = false;
  return false;
}

// Status
export async function getStatus() {
  return fetchApi<{ suiInstalled: boolean; suiVersion?: string }>('/status');
}

// Addresses
export async function getAddresses() {
  return fetchApi<SuiAddress[]>('/addresses');
}

export async function getActiveAddress() {
  return fetchApi<{ address: string }>('/addresses/active');
}

export async function switchAddress(address: string) {
  return fetchApi<void>('/addresses/switch', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function createAddress(
  keyScheme?: 'ed25519' | 'secp256k1' | 'secp256r1',
  alias?: string
) {
  return fetchApi<{ address: string; phrase?: string }>('/addresses/create', {
    method: 'POST',
    body: JSON.stringify({ keyScheme, alias }),
  });
}

export async function removeAddress(address: string) {
  return fetchApi<void>('/addresses/remove', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function getBalance(address: string) {
  return fetchApi<{ balance: string }>(`/addresses/${address}/balance`);
}

export async function getObjects(address: string) {
  return fetchApi<Record<string, unknown>[]>(`/addresses/${address}/objects`);
}

export async function getGasCoins(address: string) {
  return fetchApi<GasCoin[]>(`/addresses/${address}/gas`);
}

export async function splitCoin(
  coinId: string,
  amounts: string[],
  gasBudget?: string
) {
  return fetchApi<string>('/gas/split', {
    method: 'POST',
    body: JSON.stringify({ coinId, amounts, gasBudget }),
  });
}

export async function mergeCoins(
  primaryCoinId: string,
  coinIdsToMerge: string[],
  gasBudget?: string
) {
  return fetchApi<string>('/gas/merge', {
    method: 'POST',
    body: JSON.stringify({ primaryCoinId, coinIdsToMerge, gasBudget }),
  });
}

// Environments
export async function getEnvironments() {
  return fetchApi<SuiEnvironment[]>('/environments');
}

export async function getActiveEnvironment() {
  return fetchApi<{ alias: string | null }>('/environments/active');
}

export async function switchEnvironment(alias: string) {
  return fetchApi<void>('/environments/switch', {
    method: 'POST',
    body: JSON.stringify({ alias }),
  });
}

export async function addEnvironment(alias: string, rpc: string, ws?: string) {
  return fetchApi<void>('/environments', {
    method: 'POST',
    body: JSON.stringify({ alias, rpc, ws }),
  });
}

export async function removeEnvironment(alias: string) {
  return fetchApi<void>(`/environments/${alias}`, {
    method: 'DELETE',
  });
}

// Faucet
export async function requestFaucet(
  network: 'testnet' | 'devnet' | 'localnet',
  address?: string
) {
  return fetchApi<FaucetResponse>('/faucet/request', {
    method: 'POST',
    body: JSON.stringify({ network, address }),
  });
}

// Objects
export async function getObject(objectId: string) {
  return fetchApi<Record<string, unknown>>(`/objects/${objectId}`);
}

// Transaction
export async function getTransactionBlock(digest: string) {
  return fetchApi<Record<string, unknown>>(`/tx/${digest}`);
}

// Package
export async function getPackageSummary(packageId: string) {
  return fetchApi<Record<string, unknown>>(`/packages/${packageId}/summary`);
}

// Move call
export async function callFunction(
  packageId: string,
  module: string,
  functionName: string,
  typeArgs: string[] = [],
  args: string[] = [],
  gasBudget?: string
) {
  return fetchApi<Record<string, unknown>>('/call', {
    method: 'POST',
    body: JSON.stringify({
      packageId,
      module,
      function: functionName,
      typeArgs,
      args,
      gasBudget,
    }),
  });
}

export async function dryRunCall(
  packageId: string,
  module: string,
  functionName: string,
  typeArgs: string[] = [],
  args: string[] = [],
  gasBudget?: string
) {
  return fetchApi<Record<string, unknown>>('/call/dry-run', {
    method: 'POST',
    body: JSON.stringify({
      packageId,
      module,
      function: functionName,
      typeArgs,
      args,
      gasBudget,
    }),
  });
}

// Community
export async function getCommunityStats() {
  return fetchApi<{ totalMembers: number; isConfigured: boolean }>('/community/stats');
}

export async function getCommunityConfig() {
  return fetchApi<{ packageId: string; registryId: string; isConfigured: boolean }>('/community/config');
}

export async function checkCommunityMembership() {
  return fetchApi<{ isMember: boolean }>('/community/membership');
}

export async function joinCommunity() {
  return fetchApi<{ txDigest?: string; alreadyMember?: boolean }>('/community/join', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export interface EligibilityInfo {
  eligible: boolean;
  reasons: string[];
  txCount: number;
  balance: number;
  requirements: {
    minTxCount: number;
    minBalance: number;
  };
}

export async function checkEligibility(address: string) {
  return fetchApi<EligibilityInfo>(`/community/eligibility/${address}`);
}

// Tier types
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

export interface TierMetadata {
  name: string;
  icon: string;
  color: string;
  colorGradient: string;
  description: string;
}

// Tier API
export async function getTierInfo(address: string) {
  return fetchApi<TierInfo>(`/community/tier/${address}`);
}

export async function getTierMetadata() {
  return fetchApi<Record<number, TierMetadata>>('/community/tier-metadata');
}

export async function getTierRequirements() {
  return fetchApi<{ WAVE_MIN_TX: number; TSUNAMI_MIN_TX: number }>('/community/tier-requirements');
}

export async function refreshTier(address: string) {
  return fetchApi<TierInfo>(`/community/tier/refresh/${address}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// Deployed packages
export interface DeployedPackage {
  id: string;
  package: string;
  version: string;
  digest: string;
}

export async function getDeployedPackages(address: string) {
  return fetchApi<DeployedPackage[]>(`/community/packages/${address}`);
}
