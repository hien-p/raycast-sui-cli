import { execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(execFile);

export interface BlobInfo {
  blobId: string;
  objectId?: string;
  size: number;
  encodedSize?: number;
  expiresEpoch: number;
  deletable: boolean;
  certifiedEpoch?: number;
  storedEpoch?: number;
}

export interface UploadResult {
  blobId: string;
  objectId?: string;
  mediaType?: string;
  size: number;
  cost?: string;
  suiRefUrl?: string;
}

export interface StorageInfo {
  currentEpoch: number;
  epochDuration: string;
  pricePerUnit?: string;
}

export class WalrusService {
  private async execute(args: string[]): Promise<string> {
    const home = process.env.HOME || "";
    const commonPaths = [
      `${home}/.local/bin`,
      `${home}/.cargo/bin`,
      "/usr/local/bin",
      "/opt/homebrew/bin",
    ];

    const env = {
      ...process.env,
      PATH: `${commonPaths.join(":")}:${process.env.PATH || ""}`,
    };

    const execOptions = { env, maxBuffer: 10 * 1024 * 1024 };

    try {
      const { stdout, stderr } = await execAsync("walrus", args, execOptions);
      if (stderr) {
        console.warn("Walrus CLI stderr:", stderr);
      }
      return stdout.trim();
    } catch (error: any) {
      const errorMessage = error.stderr || error.stdout || error.message;
      throw new Error(`Walrus CLI execution failed:\n${errorMessage}`);
    }
  }

  /**
   * Check if Walrus CLI is installed
   */
  public async checkInstallation(): Promise<boolean> {
    try {
      await this.execute(["--version"]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload a file to Walrus
   */
  public async uploadBlob(
    filePath: string,
    options?: {
      epochs?: number;
      deletable?: boolean;
      dryRun?: boolean;
    },
  ): Promise<UploadResult> {
    const args = ["store", filePath];

    if (options?.epochs) {
      args.push("--epochs", String(options.epochs));
    }

    if (options?.deletable === false) {
      args.push("--permanent");
    } else {
      args.push("--deletable");
    }

    if (options?.dryRun) {
      args.push("--dry-run");
    }

    args.push("--json");

    const output = await this.execute(args);

    try {
      const data = JSON.parse(output);

      // Handle different response formats
      const result = data.newlyCreated || data.alreadyCertified || data;

      return {
        blobId: result.blobObject?.blobId || result.blobId || "",
        objectId: result.blobObject?.id || result.objectId || "",
        mediaType: result.mediaType,
        size: result.blobObject?.size || result.size || 0,
        cost: result.cost?.totalCost || result.cost,
        suiRefUrl: result.suiRefUrl,
      };
    } catch {
      // Parse text output for blob ID
      const blobIdMatch = output.match(/blob[Ii]d[:\s]+([a-zA-Z0-9]+)/);
      return {
        blobId: blobIdMatch ? blobIdMatch[1] : "",
        size: 0,
      };
    }
  }

  /**
   * Download a blob by ID
   */
  public async downloadBlob(
    blobId: string,
    outputPath: string,
  ): Promise<string> {
    const args = ["read", blobId, "-o", outputPath];
    return this.execute(args);
  }

  /**
   * Get blob status/info
   */
  public async getBlobStatus(blobId: string): Promise<BlobInfo | null> {
    try {
      const output = await this.execute([
        "blob-status",
        "--blob-id",
        blobId,
        "--json",
      ]);
      const data = JSON.parse(output);

      return {
        blobId: data.blobId || blobId,
        objectId: data.objectId,
        size: data.size || 0,
        encodedSize: data.encodedSize,
        expiresEpoch: data.endEpoch || data.expiresEpoch || 0,
        deletable: data.deletable ?? true,
        certifiedEpoch: data.certifiedEpoch,
        storedEpoch: data.storedEpoch,
      };
    } catch {
      return null;
    }
  }

  /**
   * List blobs owned by current wallet
   */
  public async listBlobs(includeExpired: boolean = false): Promise<BlobInfo[]> {
    const args = ["list-blobs", "--json"];
    if (includeExpired) {
      args.push("--include-expired");
    }

    try {
      const output = await this.execute(args);
      const data = JSON.parse(output);

      if (Array.isArray(data)) {
        return data.map((blob: any) => ({
          blobId: blob.blobId || "",
          objectId: blob.objectId || blob.id,
          size: blob.size || 0,
          encodedSize: blob.encodedSize,
          expiresEpoch: blob.endEpoch || blob.expiresEpoch || 0,
          deletable: blob.deletable ?? true,
          certifiedEpoch: blob.certifiedEpoch,
          storedEpoch: blob.storedEpoch,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Delete a deletable blob
   */
  public async deleteBlob(blobId: string): Promise<string> {
    return this.execute(["delete", "--blob-id", blobId, "--yes"]);
  }

  /**
   * Extend blob lifetime
   */
  public async extendBlob(
    blobObjectId: string,
    epochs: number,
  ): Promise<string> {
    return this.execute([
      "extend",
      "--blob-obj-id",
      blobObjectId,
      "--epochs",
      String(epochs),
    ]);
  }

  /**
   * Get storage system info
   */
  public async getSystemInfo(): Promise<StorageInfo> {
    try {
      const output = await this.execute(["info", "--json"]);
      const data = JSON.parse(output);

      return {
        currentEpoch: data.currentEpoch || data.epoch || 0,
        epochDuration: data.epochDuration || "14 days",
        pricePerUnit: data.pricePerUnit || data.price,
      };
    } catch {
      return {
        currentEpoch: 0,
        epochDuration: "14 days",
      };
    }
  }

  /**
   * Estimate storage cost (using dry-run)
   */
  public async estimateCost(
    filePath: string,
    epochs: number,
  ): Promise<{ cost: string; encodedSize: number }> {
    const result = await this.uploadBlob(filePath, {
      epochs,
      deletable: true,
      dryRun: true,
    });

    return {
      cost: result.cost || "Unknown",
      encodedSize: result.size || 0,
    };
  }

  /**
   * Set blob attribute (e.g., content-type)
   */
  public async setBlobAttribute(
    blobObjectId: string,
    attribute: string,
    value: string,
  ): Promise<string> {
    return this.execute([
      "set-blob-attribute",
      blobObjectId,
      "--attr",
      attribute,
      value,
    ]);
  }

  /**
   * Get WAL balance (for testnet)
   */
  public async getWalBalance(): Promise<string> {
    try {
      const output = await this.execute(["get-wal"]);
      return output;
    } catch {
      return "Unable to get WAL balance";
    }
  }
}
