import { ConfigParser } from "../cli/ConfigParser";
import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export class EnvironmentService {
  private configParser: ConfigParser;
  private executor: SuiCliExecutor;

  constructor() {
    this.configParser = ConfigParser.getInstance();
    this.executor = SuiCliExecutor.getInstance();
  }

  public async getActiveEnvironment(): Promise<string | null> {
    const config = await this.configParser.getConfig();
    return config?.active_env || null;
  }

  public async getEnvironments(): Promise<string[]> {
    const config = await this.configParser.getConfig();
    return config?.envs || [];
  }

  public async switchEnvironment(env: string): Promise<void> {
    await this.executor.execute(`client switch --env ${env}`);
  }
  public async addEnvironment(alias: string, rpc: string): Promise<void> {
    await this.executor.execute(`client new-env --alias ${alias} --rpc ${rpc}`);
  }

  public async removeEnvironment(alias: string): Promise<void> {
    const config = await this.configParser.getConfig();
    if (!config) {
      throw new Error("Could not load configuration");
    }

    if (config.active_env === alias) {
      throw new Error(
        "Cannot remove the active environment. Switch to another environment first.",
      );
    }

    const newEnvs = config.envs.filter((e) => e !== alias);

    // We need to pass the updated list to saveConfig.
    // Note: Our saveConfig implementation in ConfigParser currently expects the full config object
    // and handles the mapping back to the raw structure.
    await this.configParser.saveConfig({
      ...config,
      envs: newEnvs,
    });
  }
}
