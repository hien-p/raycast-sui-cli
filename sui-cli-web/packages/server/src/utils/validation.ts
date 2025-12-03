// Validation utilities for Sui addresses and object IDs

// Sui address format: 0x followed by 64 hex characters
const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/;

// Object ID has the same format as address
const OBJECT_ID_REGEX = /^0x[a-fA-F0-9]{64}$/;

// Valid key schemes
const VALID_KEY_SCHEMES = ['ed25519', 'secp256k1', 'secp256r1'] as const;

// Alias: alphanumeric with underscores/hyphens, 1-50 chars
const ALIAS_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

// Network types
const VALID_NETWORKS = ['testnet', 'devnet', 'localnet'] as const;

export function isValidSuiAddress(address: string): boolean {
  return typeof address === 'string' && SUI_ADDRESS_REGEX.test(address);
}

export function isValidObjectId(objectId: string): boolean {
  return typeof objectId === 'string' && OBJECT_ID_REGEX.test(objectId);
}

export function isValidKeyScheme(
  scheme: string
): scheme is 'ed25519' | 'secp256k1' | 'secp256r1' {
  return VALID_KEY_SCHEMES.includes(scheme as any);
}

export function isValidAlias(alias: string): boolean {
  return typeof alias === 'string' && ALIAS_REGEX.test(alias);
}

export function isValidNetwork(
  network: string
): network is 'testnet' | 'devnet' | 'localnet' {
  return VALID_NETWORKS.includes(network as any);
}

export function isValidRpcUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidAmount(amount: string): boolean {
  // Must be a positive integer string
  return typeof amount === 'string' && /^[1-9]\d*$/.test(amount);
}

export function isValidGasBudget(budget: string): boolean {
  // Must be a positive integer string, reasonable range (1 to 50 billion MIST)
  if (typeof budget !== 'string' || !/^[1-9]\d*$/.test(budget)) {
    return false;
  }
  const value = BigInt(budget);
  return value >= 1n && value <= 50_000_000_000n;
}

// Validation result type
export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(errors.map((e) => `${e.field}: ${e.message}`).join(', '));
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

// Helper to validate and throw
export function validateAddress(address: unknown, fieldName = 'address'): string {
  if (typeof address !== 'string' || !isValidSuiAddress(address)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid Sui address format (expected 0x + 64 hex chars)' },
    ]);
  }
  return address;
}

export function validateObjectId(objectId: unknown, fieldName = 'objectId'): string {
  if (typeof objectId !== 'string' || !isValidObjectId(objectId)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid object ID format (expected 0x + 64 hex chars)' },
    ]);
  }
  return objectId;
}

export function validateOptionalAlias(alias: unknown): string | undefined {
  if (alias === undefined || alias === null || alias === '') {
    return undefined;
  }
  if (typeof alias !== 'string' || !isValidAlias(alias)) {
    throw new ValidationException([
      { field: 'alias', message: 'Invalid alias (1-50 alphanumeric chars, underscores, hyphens)' },
    ]);
  }
  return alias;
}

export function validateKeyScheme(
  scheme: unknown
): 'ed25519' | 'secp256k1' | 'secp256r1' | undefined {
  if (scheme === undefined || scheme === null) {
    return undefined;
  }
  if (typeof scheme !== 'string' || !isValidKeyScheme(scheme)) {
    throw new ValidationException([
      { field: 'keyScheme', message: 'Invalid key scheme (expected ed25519, secp256k1, or secp256r1)' },
    ]);
  }
  return scheme;
}

export function validateNetwork(network: unknown): 'testnet' | 'devnet' | 'localnet' {
  if (typeof network !== 'string' || !isValidNetwork(network)) {
    throw new ValidationException([
      { field: 'network', message: 'Invalid network (expected testnet, devnet, or localnet)' },
    ]);
  }
  return network;
}

export function validateRpcUrl(url: unknown, fieldName = 'rpc'): string {
  if (typeof url !== 'string' || !isValidRpcUrl(url)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid RPC URL (expected http:// or https://)' },
    ]);
  }
  return url;
}

export function validateAmounts(amounts: unknown): string[] {
  if (!Array.isArray(amounts) || amounts.length === 0) {
    throw new ValidationException([
      { field: 'amounts', message: 'Amounts must be a non-empty array' },
    ]);
  }
  for (let i = 0; i < amounts.length; i++) {
    if (!isValidAmount(amounts[i])) {
      throw new ValidationException([
        { field: `amounts[${i}]`, message: 'Each amount must be a positive integer string' },
      ]);
    }
  }
  return amounts;
}

export function validateCoinIds(coinIds: unknown, fieldName = 'coinIds'): string[] {
  if (!Array.isArray(coinIds) || coinIds.length === 0) {
    throw new ValidationException([
      { field: fieldName, message: 'Coin IDs must be a non-empty array' },
    ]);
  }
  for (let i = 0; i < coinIds.length; i++) {
    if (!isValidObjectId(coinIds[i])) {
      throw new ValidationException([
        { field: `${fieldName}[${i}]`, message: 'Invalid coin ID format' },
      ]);
    }
  }
  return coinIds;
}

export function validateOptionalGasBudget(budget: unknown): string | undefined {
  if (budget === undefined || budget === null || budget === '') {
    return undefined;
  }
  if (typeof budget !== 'string' || !isValidGasBudget(budget)) {
    throw new ValidationException([
      { field: 'gasBudget', message: 'Invalid gas budget (positive integer, max 50 billion)' },
    ]);
  }
  return budget;
}
