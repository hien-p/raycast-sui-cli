import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export interface SuiCommand {
  id: string;
  title: string;
  command: string;
  description: string;
  category: string;
}

export class CommandService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  public async executeCommand(command: string): Promise<string> {
    return this.executor.execute(command);
  }

  public async executeCommandJson<T>(command: string): Promise<T> {
    const output = await this.executor.execute(command, { json: true });
    try {
      return JSON.parse(output);
    } catch (e) {
      throw new Error(`Failed to parse JSON output: ${output}`);
    }
  }

  public getAvailableCommands(): SuiCommand[] {
    return [
      {
        id: "client-help",
        title: "Client Help",
        command: "client --help",
        description: "Show help for Sui Client CLI",
        category: "Client",
      },
      {
        id: "client-envs",
        title: "List Environments",
        command: "client envs",
        description: "List all available Sui environments",
        category: "Client",
      },
      {
        id: "client-active-address",
        title: "Get Active Address",
        command: "client active-address",
        description: "Get the currently active address",
        category: "Client",
      },
      {
        id: "client-active-env",
        title: "Get Active Environment",
        command: "client active-env",
        description: "Get the currently active environment",
        category: "Client",
      },
      {
        id: "client-objects",
        title: "List Objects",
        command: "client objects",
        description: "List objects owned by the active address",
        category: "Client",
      },
      {
        id: "client-gas",
        title: "Get Gas",
        command: "client gas",
        description: "Get gas objects owned by the active address",
        category: "Client",
      },
      {
        id: "client-addresses",
        title: "Manage Addresses",
        command: "client addresses",
        description: "List and manage Sui addresses",
        category: "Client",
      },
      {
        id: "client-faucet",
        title: "Request Faucet",
        command: "client faucet",
        description: "Request tokens from the faucet",
        category: "Tools",
      },
      {
        id: "client-tx-block",
        title: "Inspect Transaction",
        command: "client tx-block",
        description: "Inspect a transaction block",
        category: "Client",
      },
      {
        id: "client-upgrade",
        title: "Upgrade Package",
        command: "client upgrade",
        description: "Upgrade a Move package",
        category: "Move",
      },
      {
        id: "client-verify-source",
        title: "Verify Source",
        command: "client verify-source",
        description: "Verify local source against on-chain package",
        category: "Move",
      },
    ];
  }
}
