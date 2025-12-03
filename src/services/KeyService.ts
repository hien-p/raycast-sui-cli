import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export interface KeyInfo {
  alias: string | null;
  suiAddress: string;
  publicBase64Key: string;
  keyScheme: string;
  flag: number;
  peerId: string | null;
}

export interface GeneratedKey {
  alias: string | null;
  address: string;
  keyScheme: string;
  mnemonic: string;
}

export interface SignResult {
  suiSignature: string;
  suiAddress: string;
  rawTxData?: string;
  intent?: string;
}

export type KeyScheme = "ed25519" | "secp256k1" | "secp256r1";
export type WordLength = 12 | 15 | 18 | 21 | 24;

export class KeyService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  /**
   * List all keys in the keystore
   */
  public async listKeys(): Promise<KeyInfo[]> {
    try {
      const output = await this.executor.execute(["keytool", "list"], {
        json: true,
      });
      const data = JSON.parse(output);

      if (Array.isArray(data)) {
        return data.map((key: any) => ({
          alias: key.alias || null,
          suiAddress: key.suiAddress || key.sui_address || "",
          publicBase64Key: key.publicBase64Key || key.public_base64_key || "",
          keyScheme: key.keyScheme || key.key_scheme || "",
          flag: key.flag || 0,
          peerId: key.peerId || key.peer_id || null,
        }));
      }
      return [];
    } catch (e) {
      // Fallback to text parsing
      const output = await this.executor.execute(["keytool", "list"]);
      return this.parseKeysFromText(output);
    }
  }

  private parseKeysFromText(output: string): KeyInfo[] {
    const lines = output.split("\n");
    const keys: KeyInfo[] = [];

    for (const line of lines) {
      // Look for lines containing sui addresses
      const addressMatch = line.match(/0x[a-fA-F0-9]{64}/);
      if (addressMatch) {
        const parts = line.trim().split(/\s+/);
        keys.push({
          alias: null,
          suiAddress: addressMatch[0],
          publicBase64Key: "",
          keyScheme:
            parts.find((p) =>
              ["ed25519", "secp256k1", "secp256r1"].includes(p.toLowerCase()),
            ) || "",
          flag: 0,
          peerId: null,
        });
      }
    }
    return keys;
  }

  /**
   * Generate a new keypair with optional mnemonic word length
   */
  public async generateKey(
    scheme: KeyScheme = "ed25519",
    alias?: string,
    wordLength: WordLength = 12,
  ): Promise<GeneratedKey> {
    const args = [
      "keytool",
      "generate",
      scheme,
      "--word-length",
      String(wordLength),
    ];

    if (alias) {
      args.push("--alias", alias);
    }

    const output = await this.executor.execute(args);

    // Parse the output to extract address and mnemonic
    return this.parseGeneratedKey(output, scheme, alias);
  }

  private parseGeneratedKey(
    output: string,
    scheme: KeyScheme,
    alias?: string,
  ): GeneratedKey {
    const lines = output.split("\n");
    let address = "";
    let mnemonic = "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for address
      const addressMatch = trimmed.match(/0x[a-fA-F0-9]{64}/);
      if (addressMatch) {
        address = addressMatch[0];
      }

      // Look for mnemonic (usually 12-24 words)
      // Mnemonics are typically on a line by themselves or after "Recovery phrase:"
      if (
        trimmed.includes("Recovery phrase:") ||
        trimmed.includes("Mnemonic:")
      ) {
        const parts = trimmed.split(/:\s*/);
        if (parts.length > 1) {
          mnemonic = parts[1].trim();
        }
      } else if (
        !trimmed.startsWith("0x") &&
        !trimmed.includes(":") &&
        trimmed.split(/\s+/).length >= 12 &&
        trimmed.split(/\s+/).length <= 24
      ) {
        // Likely a mnemonic line
        mnemonic = trimmed;
      }
    }

    return {
      alias: alias || null,
      address,
      keyScheme: scheme,
      mnemonic,
    };
  }

  /**
   * Import a key from mnemonic or private key
   */
  public async importKey(
    input: string,
    scheme: KeyScheme = "ed25519",
    alias?: string,
  ): Promise<string> {
    const args = ["keytool", "import", input, scheme];

    if (alias) {
      args.push("--alias", alias);
    }

    const output = await this.executor.execute(args);

    // Extract address from output
    const addressMatch = output.match(/0x[a-fA-F0-9]{64}/);
    return addressMatch ? addressMatch[0] : output;
  }

  /**
   * Export private key for an address (returns Bech32 format)
   */
  public async exportKey(address: string): Promise<string> {
    const output = await this.executor.execute([
      "keytool",
      "export",
      "--key-identity",
      address,
    ]);

    // Look for the private key in the output (suiprivkey format)
    const lines = output.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("suiprivkey")) {
        return trimmed;
      }
      // Also check for raw export format
      if (trimmed.includes("Private key:")) {
        const parts = trimmed.split(":");
        return parts[1]?.trim() || "";
      }
    }

    return output.trim();
  }

  /**
   * Sign data with a key
   */
  public async signData(
    address: string,
    data: string,
    intent: "TransactionData" | "PersonalMessage" = "TransactionData",
  ): Promise<SignResult> {
    const output = await this.executor.execute(
      [
        "keytool",
        "sign",
        "--address",
        address,
        "--data",
        data,
        "--intent",
        intent,
      ],
      { json: true },
    );

    try {
      const result = JSON.parse(output);
      return {
        suiSignature: result.suiSignature || result.sui_signature || "",
        suiAddress: result.suiAddress || result.sui_address || address,
        rawTxData: result.rawTxData || result.raw_tx_data,
        intent: result.intent,
      };
    } catch {
      // Return raw output as signature if JSON parsing fails
      return {
        suiSignature: output.trim(),
        suiAddress: address,
      };
    }
  }

  /**
   * Update key alias
   */
  public async updateAlias(
    oldAlias: string,
    newAlias?: string,
  ): Promise<string> {
    const args = ["keytool", "update-alias", oldAlias];
    if (newAlias) {
      args.push(newAlias);
    }
    return this.executor.execute(args);
  }

  /**
   * Show key details from a key file
   */
  public async showKey(filePath: string): Promise<KeyInfo | null> {
    try {
      const output = await this.executor.execute(
        ["keytool", "show", filePath],
        {
          json: true,
        },
      );
      const data = JSON.parse(output);
      return {
        alias: data.alias || null,
        suiAddress: data.suiAddress || data.sui_address || "",
        publicBase64Key: data.publicBase64Key || data.public_base64_key || "",
        keyScheme: data.keyScheme || data.key_scheme || "",
        flag: data.flag || 0,
        peerId: data.peerId || data.peer_id || null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Convert key between different formats
   */
  public async convertKey(value: string): Promise<string> {
    return this.executor.execute(["keytool", "convert", value]);
  }

  /**
   * Create multi-sig address
   */
  public async createMultiSigAddress(
    publicKeys: string[],
    weights: number[],
    threshold: number,
  ): Promise<{ address: string; multiSigInfo: string }> {
    const args = [
      "keytool",
      "multi-sig-address",
      "--pks",
      ...publicKeys,
      "--weights",
      ...weights.map(String),
      "--threshold",
      String(threshold),
    ];

    const output = await this.executor.execute(args, { json: true });

    try {
      const data = JSON.parse(output);
      return {
        address: data.multisigAddress || data.multisig_address || "",
        multiSigInfo: JSON.stringify(data, null, 2),
      };
    } catch {
      // Extract address from text output
      const addressMatch = output.match(/0x[a-fA-F0-9]{64}/);
      return {
        address: addressMatch ? addressMatch[0] : "",
        multiSigInfo: output,
      };
    }
  }

  /**
   * Combine partial signatures for multi-sig
   */
  public async combinePartialSignatures(
    publicKeys: string[],
    weights: number[],
    signatures: string[],
    threshold: number,
  ): Promise<string> {
    const args = [
      "keytool",
      "multi-sig-combine-partial-sig",
      "--pks",
      ...publicKeys,
      "--weights",
      ...weights.map(String),
      "--sigs",
      ...signatures,
      "--threshold",
      String(threshold),
    ];

    return this.executor.execute(args);
  }

  /**
   * Decode or verify a transaction
   */
  public async decodeOrVerifyTransaction(
    txBytes: string,
    signature?: string,
    currentEpoch?: number,
  ): Promise<string> {
    const cmd = ["keytool", "decode-or-verify-tx", "--tx-bytes", txBytes];

    if (signature) {
      cmd.push("--sig", signature);
    }
    if (currentEpoch !== undefined) {
      cmd.push("--cur-epoch", String(currentEpoch));
    }

    return this.executor.execute(cmd);
  }
}
