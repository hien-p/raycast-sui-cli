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

export function getConnectionStatus() {
  return isServerConnected;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();
    isServerConnected = true;

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.data as T;
  } catch (error) {
    // Check if it's a network error (server not running)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      isServerConnected = false;
      throw new Error('Cannot connect to local server. Make sure the server is running on port 3001.');
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

export async function getBalance(address: string) {
  return fetchApi<{ balance: string }>(`/addresses/${address}/balance`);
}

export async function getObjects(address: string) {
  return fetchApi<any[]>(`/addresses/${address}/objects`);
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
  return fetchApi<any>(`/objects/${objectId}`);
}
