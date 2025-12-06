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

// Common ports to scan for server
const COMMON_PORTS = [3001, 3002, 3003, 3004, 3005, 4001, 4002, 8001, 8080];

// Build localhost URLs for all common ports
function buildLocalhostUrls(port: number): string[] {
  return [
    `http://localhost:${port}/api`,
    `http://127.0.0.1:${port}/api`,
  ];
}

// Get saved port from localStorage or URL param
function getSavedPort(): number | null {
  // Check URL param first (highest priority)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const portParam = urlParams.get('port');
    if (portParam) {
      const port = parseInt(portParam, 10);
      if (port >= 1 && port <= 65535) {
        return port;
      }
    }

    // Check localStorage
    const savedPort = localStorage.getItem('sui-cli-server-port');
    if (savedPort) {
      const port = parseInt(savedPort, 10);
      if (port >= 1 && port <= 65535) {
        return port;
      }
    }
  }
  return null;
}

// Save discovered port to localStorage
function savePort(port: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sui-cli-server-port', String(port));
  }
}

// Get current server port
export function getServerPort(): number | null {
  return currentServerPort;
}

// Get all ports to try (saved port first, then common ports)
function getPortsToTry(): number[] {
  const savedPort = getSavedPort();
  const ports = [...COMMON_PORTS];

  if (savedPort && !ports.includes(savedPort)) {
    ports.unshift(savedPort);
  } else if (savedPort) {
    // Move saved port to front
    const idx = ports.indexOf(savedPort);
    if (idx > 0) {
      ports.splice(idx, 1);
      ports.unshift(savedPort);
    }
  }

  return ports;
}

let API_BASE = isDev ? '/api' : 'http://localhost:3001/api';
let currentServerPort: number | null = null;

// Connection state
let isServerConnected = false;

// Request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

export function getConnectionStatus() {
  return isServerConnected;
}

// Get current API base URL
export function getApiBaseUrl(): string {
  return API_BASE;
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
      throw new Error('Cannot connect to local server. Make sure the server is running (npx sui-cli-web-server).');
    }
    // Check for JSON parse error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      isServerConnected = false;
      throw new Error('Invalid server response. Is the server running correctly?');
    }
    throw error;
  }
}

// Check server connection - scans multiple ports to find the server
export async function checkConnection(): Promise<boolean> {
  if (isDev) {
    try {
      const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
      const data = await response.json();
      // Server returns port in health response
      if (data.port) {
        currentServerPort = data.port;
      }
      isServerConnected = true;
      return true;
    } catch {
      isServerConnected = false;
      return false;
    }
  }

  // In production, scan ports to find the server
  const portsToTry = getPortsToTry();

  for (const port of portsToTry) {
    const urls = buildLocalhostUrls(port);

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout per attempt

        const response = await fetch(`${url}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Try to get port from response
        try {
          const data = await response.json();
          if (data.port) {
            currentServerPort = data.port;
          } else {
            currentServerPort = port;
          }
        } catch {
          currentServerPort = port;
        }

        // Found working server, update API_BASE and save port
        API_BASE = url;
        if (currentServerPort) {
          savePort(currentServerPort);
        }
        isServerConnected = true;
        return true;
      } catch {
        // Try next URL/port
      }
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

// Filesystem API
export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isPackage?: boolean;
}

export interface BrowseResponse {
  currentPath: string;
  parentPath: string | null;
  entries: DirectoryEntry[];
}

export interface SuggestedDirectory {
  name: string;
  path: string;
}

export async function browseDirectory(path?: string) {
  const endpoint = path
    ? `/filesystem/browse?path=${encodeURIComponent(path)}`
    : '/filesystem/browse';
  return fetchApi<BrowseResponse>(endpoint);
}

export async function getSuggestedDirectories() {
  return fetchApi<{ directories: SuggestedDirectory[] }>('/filesystem/suggested');
}

// Move Package Development APIs
export async function buildMovePackage(packagePath: string) {
  return fetchApi<{ output: string }>('/move/build', {
    method: 'POST',
    body: JSON.stringify({ packagePath }),
  });
}

export async function testMovePackage(packagePath: string, filter?: string) {
  return fetchApi<{ output: string; passed: number; failed: number }>('/move/test', {
    method: 'POST',
    body: JSON.stringify({ packagePath, filter }),
  });
}

export async function publishPackage(
  packagePath: string,
  gasBudget: string,
  skipDependencyVerification: boolean
) {
  return fetchApi<{
    packageId?: string;
    digest?: string;
    createdObjects?: any[];
  }>('/packages/publish', {
    method: 'POST',
    body: JSON.stringify({ packagePath, gasBudget, skipDependencyVerification }),
  });
}

export async function upgradePackage(
  packagePath: string,
  upgradeCapId: string,
  gasBudget: string
) {
  return fetchApi<{
    packageId?: string;
    digest?: string;
  }>('/packages/upgrade', {
    method: 'POST',
    body: JSON.stringify({ packagePath, upgradeCapId, gasBudget }),
  });
}

export async function inspectPackage(packageId: string) {
  return fetchApi<{
    packageId: string;
    modules: any[];
  }>(`/inspector/package/${packageId}`);
}

export async function callPackageFunction(
  packageId: string,
  module: string,
  functionName: string,
  args: string[],
  typeArgs: string[],
  gasBudget: string
) {
  return fetchApi<{
    digest?: string;
    effects?: any;
    events?: any[];
    gasUsed?: string;
  }>(`/packages/${packageId}/call`, {
    method: 'POST',
    body: JSON.stringify({
      module,
      function: functionName,
      args,
      typeArgs,
      gasBudget,
    }),
  });
}

// Parameter Helper APIs
export interface ParsedType {
  category: string;
  rawType: string;
  baseType: string;
  genericParams: string[];
  isMutable: boolean;
  isReference: boolean;
  isVector: boolean;
  isOption: boolean;
}

export interface ParameterSuggestion {
  type: 'object' | 'value' | 'address' | 'coin';
  label: string;
  value: string;
  metadata?: {
    objectId?: string;
    type?: string;
    version?: string;
    digest?: string;
    balance?: string;
    fields?: Record<string, unknown>;
  };
}

export interface AnalyzedParameter {
  name: string;
  type: string;
  parsedType: ParsedType;
  suggestions: ParameterSuggestion[];
  autoFilled?: {
    value: string;
    reason: 'only_one_option' | 'default_value' | 'user_preference';
  };
  examples: string[];
  validation?: {
    pattern?: string;
    min?: string;
    max?: string;
    message?: string;
  };
  helpText?: string;
}

export async function analyzeParameters(
  packageId: string,
  module: string,
  functionName: string,
  userAddress: string
) {
  return fetchApi<{
    parameters: AnalyzedParameter[];
    function: { name: string; visibility: string };
  }>('/inspector/analyze-parameters', {
    method: 'POST',
    body: JSON.stringify({
      packageId,
      module,
      functionName,
      userAddress,
    }),
  });
}

export async function getObjectsByType(address: string, typePattern: string) {
  return fetchApi<Record<string, unknown>[]>(
    `/addresses/${address}/objects/by-type?type=${encodeURIComponent(typePattern)}`
  );
}

export async function getObjectMetadata(objectId: string) {
  return fetchApi<Record<string, unknown>>(`/inspector/object/${objectId}/metadata`);
}

export async function convertToVectorU8(value: string, format: 'string' | 'hex') {
  return fetchApi<{ result: string }>('/inspector/convert-to-vector-u8', {
    method: 'POST',
    body: JSON.stringify({ value, format }),
  });
}
