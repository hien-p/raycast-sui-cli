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

// Move module name: alphanumeric with underscores, starts with letter or underscore
const MODULE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,127}$/;

// Move function name: same as module name
const FUNCTION_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,127}$/;

// Type args: safe characters for generic type parameters (e.g., "0x2::sui::SUI")
const TYPE_ARG_REGEX = /^[a-zA-Z0-9_:<>,\s]+$/;

// Transaction digest: base58, 44 characters
const TX_DIGEST_REGEX = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;

// Shell metacharacters to block in args
const SHELL_METACHAR_REGEX = /[;&|`$(){}[\]\\'"<>!#~*?]/;

export function isValidModuleName(name: string): boolean {
  return typeof name === 'string' && MODULE_NAME_REGEX.test(name);
}

export function isValidFunctionName(name: string): boolean {
  return typeof name === 'string' && FUNCTION_NAME_REGEX.test(name);
}

export function isValidTypeArg(arg: string): boolean {
  return typeof arg === 'string' && TYPE_ARG_REGEX.test(arg) && arg.length <= 256;
}

export function isValidTxDigest(digest: string): boolean {
  return typeof digest === 'string' && TX_DIGEST_REGEX.test(digest);
}

export function isSafeArg(arg: string): boolean {
  return typeof arg === 'string' && !SHELL_METACHAR_REGEX.test(arg) && arg.length <= 1024;
}

export function validateModuleName(module: unknown, fieldName = 'module'): string {
  if (typeof module !== 'string' || !isValidModuleName(module)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid module name (alphanumeric/underscore, starts with letter/underscore, max 128 chars)' },
    ]);
  }
  return module;
}

export function validateFunctionName(functionName: unknown, fieldName = 'function'): string {
  if (typeof functionName !== 'string' || !isValidFunctionName(functionName)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid function name (alphanumeric/underscore, starts with letter/underscore, max 128 chars)' },
    ]);
  }
  return functionName;
}

export function validateTypeArgs(typeArgs: unknown): string[] {
  if (typeArgs === undefined || typeArgs === null) {
    return [];
  }
  if (!Array.isArray(typeArgs)) {
    throw new ValidationException([
      { field: 'typeArgs', message: 'Type arguments must be an array' },
    ]);
  }
  for (let i = 0; i < typeArgs.length; i++) {
    if (!isValidTypeArg(typeArgs[i])) {
      throw new ValidationException([
        { field: `typeArgs[${i}]`, message: 'Invalid type argument format' },
      ]);
    }
  }
  return typeArgs;
}

export function validateMoveArgs(args: unknown): string[] {
  if (args === undefined || args === null) {
    return [];
  }
  if (!Array.isArray(args)) {
    throw new ValidationException([
      { field: 'args', message: 'Arguments must be an array' },
    ]);
  }
  for (let i = 0; i < args.length; i++) {
    if (!isSafeArg(args[i])) {
      throw new ValidationException([
        { field: `args[${i}]`, message: 'Invalid argument (contains forbidden characters or too long)' },
      ]);
    }
  }
  return args;
}

export function validateTxDigest(digest: unknown, fieldName = 'digest'): string {
  if (typeof digest !== 'string' || !isValidTxDigest(digest)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid transaction digest format (expected base58, 43-44 chars)' },
    ]);
  }
  return digest;
}

// Private key validation (Bech32 format starting with "suiprivkey")
const PRIVATE_KEY_REGEX = /^suiprivkey[a-zA-Z0-9]+$/;

export function isValidPrivateKey(privateKey: string): boolean {
  return typeof privateKey === 'string' && PRIVATE_KEY_REGEX.test(privateKey);
}

// Mnemonic validation (12, 15, 18, 21, or 24 words)
export function isValidMnemonic(mnemonic: string): boolean {
  if (typeof mnemonic !== 'string') return false;

  const words = mnemonic.trim().split(/\s+/);
  const validWordCounts = [12, 15, 18, 21, 24];
  return validWordCounts.includes(words.length);
}

// Amount validation for transfers (must be positive decimal)
export function isValidTransferAmount(amount: string): boolean {
  if (typeof amount !== 'string') return false;

  // Allow decimal amounts like "0.1", "1", "100.5"
  const amountRegex = /^(\d+\.?\d*|\d*\.\d+)$/;
  if (!amountRegex.test(amount)) return false;

  const numValue = parseFloat(amount);
  return !isNaN(numValue) && numValue > 0;
}

export function validateTransferAmount(amount: unknown, fieldName = 'amount'): string {
  if (!isValidTransferAmount(amount as string)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid amount (must be a positive decimal number)' },
    ]);
  }
  return amount as string;
}

export function validatePrivateKey(privateKey: unknown, fieldName = 'privateKey'): string {
  if (typeof privateKey !== 'string' || !isValidPrivateKey(privateKey)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid private key format (expected Bech32 starting with "suiprivkey")' },
    ]);
  }
  return privateKey;
}

export function validateMnemonic(mnemonic: unknown, fieldName = 'mnemonic'): string {
  if (typeof mnemonic !== 'string' || !isValidMnemonic(mnemonic)) {
    throw new ValidationException([
      { field: fieldName, message: 'Invalid mnemonic (expected 12, 15, 18, 21, or 24 words)' },
    ]);
  }
  return mnemonic;
}
