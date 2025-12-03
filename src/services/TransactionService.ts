import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export interface TransactionEffects {
  status: string;
  gasUsed: {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
    totalGas: string;
  };
  created?: { objectId: string; objectType: string }[];
  mutated?: { objectId: string; objectType: string }[];
  deleted?: string[];
}

export interface TransactionResult {
  digest: string;
  effects: TransactionEffects;
  rawOutput: string;
}

export interface DryRunResult {
  success: boolean;
  effects?: TransactionEffects;
  error?: string;
  rawOutput: string;
}

export class TransactionService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  /**
   * Execute a Move function call
   */
  public async call(options: {
    packageId: string;
    module: string;
    function: string;
    typeArgs?: string[];
    args?: string[];
    gasBudget?: number;
  }): Promise<TransactionResult> {
    const args = [
      "client",
      "call",
      "--package",
      options.packageId,
      "--module",
      options.module,
      "--function",
      options.function,
    ];

    if (options.typeArgs && options.typeArgs.length > 0) {
      args.push("--type-args", ...options.typeArgs);
    }

    if (options.args && options.args.length > 0) {
      args.push("--args", ...options.args);
    }

    args.push("--gas-budget", String(options.gasBudget || 10000000));

    const output = await this.executor.execute(args, { json: true });

    try {
      const data = JSON.parse(output);
      return this.parseTransactionResult(data, output);
    } catch {
      return {
        digest: "",
        effects: this.emptyEffects(),
        rawOutput: output,
      };
    }
  }

  /**
   * Dry run a transaction (simulate without executing)
   */
  public async dryRun(options: {
    packageId: string;
    module: string;
    function: string;
    typeArgs?: string[];
    args?: string[];
    gasBudget?: number;
  }): Promise<DryRunResult> {
    const args = [
      "client",
      "call",
      "--package",
      options.packageId,
      "--module",
      options.module,
      "--function",
      options.function,
    ];

    if (options.typeArgs && options.typeArgs.length > 0) {
      args.push("--type-args", ...options.typeArgs);
    }

    if (options.args && options.args.length > 0) {
      args.push("--args", ...options.args);
    }

    args.push(
      "--gas-budget",
      String(options.gasBudget || 10000000),
      "--dry-run",
    );

    try {
      const output = await this.executor.execute(args, { json: true });
      const data = JSON.parse(output);

      return {
        success: true,
        effects: this.parseEffects(data),
        rawOutput: output,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        rawOutput: String(error),
      };
    }
  }

  /**
   * Execute a Programmable Transaction Block (PTB)
   */
  public async executePTB(
    commands: string[],
    gasBudget?: number,
  ): Promise<TransactionResult> {
    const args = ["client", "ptb"];

    for (const command of commands) {
      // Split command string into args, respecting quotes if possible, but for now simple split
      // PTB commands from builder are constructed as "flag arg1 arg2"
      // We need to be careful here. The PTB builder constructs strings like "--transfer-objects [obj] addr"
      // Ideally executePTB should take structured commands, but for now we split by space
      // This is a limitation of the current refactor but safer than shell execution
      // However, splitting by space breaks args with spaces.
      // Given the PTB builder constructs simple strings, we can try to split them.
      // Better approach: The PTB builder should pass args array.
      // For now, let's assume commands are space separated.
      args.push(...command.split(" "));
    }

    args.push("--gas-budget", String(gasBudget || 10000000));

    const output = await this.executor.execute(args, { json: true });

    try {
      const data = JSON.parse(output);
      return this.parseTransactionResult(data, output);
    } catch {
      return {
        digest: "",
        effects: this.emptyEffects(),
        rawOutput: output,
      };
    }
  }

  /**
   * Get transaction details by digest
   */
  public async getTransaction(digest: string): Promise<string> {
    return this.executor.execute(["client", "tx-block", digest], {
      json: true,
    });
  }

  /**
   * Transfer SUI to an address
   */
  public async transferSui(
    recipient: string,
    amount: number,
    gasBudget?: number,
  ): Promise<TransactionResult> {
    const args = [
      "client",
      "transfer-sui",
      "--to",
      recipient,
      "--sui-coin-object-id",
      "gas",
      "--amount",
      String(amount),
      "--gas-budget",
      String(gasBudget || 10000000),
    ];

    const output = await this.executor.execute(args, { json: true });

    try {
      const data = JSON.parse(output);
      return this.parseTransactionResult(data, output);
    } catch {
      return {
        digest: "",
        effects: this.emptyEffects(),
        rawOutput: output,
      };
    }
  }

  /**
   * Transfer objects to an address
   */
  public async transferObjects(
    objectIds: string[],
    recipient: string,
    gasBudget?: number,
  ): Promise<TransactionResult> {
    const args = [
      "client",
      "transfer",
      "--to",
      recipient,
      "--object-id",
      ...objectIds,
      "--gas-budget",
      String(gasBudget || 10000000),
    ];

    const output = await this.executor.execute(args, { json: true });

    try {
      const data = JSON.parse(output);
      return this.parseTransactionResult(data, output);
    } catch {
      return {
        digest: "",
        effects: this.emptyEffects(),
        rawOutput: output,
      };
    }
  }

  /**
   * Pay SUI to multiple recipients
   */
  public async paySui(
    recipients: string[],
    amounts: number[],
    gasBudget?: number,
  ): Promise<TransactionResult> {
    const args = [
      "client",
      "pay-sui",
      "--recipients",
      ...recipients,
      "--amounts",
      ...amounts.map(String),
      "--gas-budget",
      String(gasBudget || 10000000),
    ];

    const output = await this.executor.execute(args, { json: true });

    try {
      const data = JSON.parse(output);
      return this.parseTransactionResult(data, output);
    } catch {
      return {
        digest: "",
        effects: this.emptyEffects(),
        rawOutput: output,
      };
    }
  }

  /**
   * Get object details
   */
  public async getObject(objectId: string): Promise<string> {
    return this.executor.execute(["client", "object", objectId], {
      json: true,
    });
  }

  /**
   * Get package modules (for call wizard)
   */
  public async getPackageModules(packageId: string): Promise<string[]> {
    try {
      const output = await this.executor.execute(
        ["client", "object", packageId],
        {
          json: true,
        },
      );
      const data = JSON.parse(output);

      // Extract module names from package object
      if (data.content?.dataType === "package" && data.content?.disassembled) {
        return Object.keys(data.content.disassembled);
      }

      // Alternative format
      if (data.data?.content?.dataType === "package") {
        const disassembled = data.data.content.disassembled || {};
        return Object.keys(disassembled);
      }

      return [];
    } catch {
      return [];
    }
  }

  private parseTransactionResult(
    data: any,
    rawOutput: string,
  ): TransactionResult {
    return {
      digest: data.digest || data.transaction?.digest || "",
      effects: this.parseEffects(data),
      rawOutput,
    };
  }

  private parseEffects(data: any): TransactionEffects {
    const effects = data.effects || data.transaction?.effects || {};
    const gasUsed = effects.gasUsed || {};

    return {
      status: effects.status?.status || "unknown",
      gasUsed: {
        computationCost: gasUsed.computationCost || "0",
        storageCost: gasUsed.storageCost || "0",
        storageRebate: gasUsed.storageRebate || "0",
        totalGas: String(
          parseInt(gasUsed.computationCost || "0") +
            parseInt(gasUsed.storageCost || "0") -
            parseInt(gasUsed.storageRebate || "0"),
        ),
      },
      created: effects.created?.map((obj: any) => ({
        objectId: obj.reference?.objectId || obj.objectId || "",
        objectType: obj.objectType || "Unknown",
      })),
      mutated: effects.mutated?.map((obj: any) => ({
        objectId: obj.reference?.objectId || obj.objectId || "",
        objectType: obj.objectType || "Unknown",
      })),
      deleted: effects.deleted?.map((obj: any) => obj.objectId || obj),
    };
  }

  private emptyEffects(): TransactionEffects {
    return {
      status: "unknown",
      gasUsed: {
        computationCost: "0",
        storageCost: "0",
        storageRebate: "0",
        totalGas: "0",
      },
    };
  }
}
