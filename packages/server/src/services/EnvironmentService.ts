import { ConfigParser } from '../cli/ConfigParser';
import { SuiCliExecutor } from '../cli/SuiCliExecutor';
import type { SuiEnvironment } from '@sui-cli-web/shared';

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

  public async getEnvironments(): Promise<SuiEnvironment[]> {
    const config = await this.configParser.getConfig();
    if (!config) return [];

    return config.envs.map((env) => ({
      alias: env.alias,
      rpc: env.rpc,
      ws: env.ws || undefined,
      isActive: env.alias === config.active_env,
    }));
  }

  public async switchEnvironment(alias: string): Promise<void> {
    await this.executor.execute(['client', 'switch', '--env', alias]);
  }

  public async addEnvironment(alias: string, rpc: string, ws?: string): Promise<void> {
    const args = ['client', 'new-env', '--alias', alias, '--rpc', rpc];
    if (ws) {
      args.push('--ws', ws);
    }
    await this.executor.execute(args);
  }

  public async removeEnvironment(alias: string): Promise<void> {
    await this.configParser.removeEnvironment(alias);
  }
}
