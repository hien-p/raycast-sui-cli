import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';

const execAsync = promisify(execFile);

export interface ExecuteOptions {
  json?: boolean;
  cwd?: string;
  timeout?: number;
}

export class SuiCliExecutor {
  private static instance: SuiCliExecutor;

  private constructor() {}

  public static getInstance(): SuiCliExecutor {
    if (!SuiCliExecutor.instance) {
      SuiCliExecutor.instance = new SuiCliExecutor();
    }
    return SuiCliExecutor.instance;
  }

  private getPaths(): string[] {
    const home = os.homedir();
    const platform = os.platform();

    // Common paths across platforms
    const paths = [
      path.join(home, '.local', 'bin'),
      path.join(home, '.cargo', 'bin'),
      '/usr/local/bin',
    ];

    // Platform-specific paths
    if (platform === 'darwin') {
      paths.push('/opt/homebrew/bin');
      paths.push('/opt/local/bin');
    } else if (platform === 'win32') {
      paths.push(path.join(home, 'AppData', 'Local', 'Programs', 'sui'));
      paths.push(path.join(home, '.sui', 'bin'));
      paths.push('C:\\Program Files\\sui');
    } else {
      // Linux
      paths.push('/snap/bin');
      paths.push(path.join(home, 'bin'));
    }

    return paths;
  }

  public async execute(args: string[], options?: ExecuteOptions): Promise<string> {
    const platform = os.platform();
    const pathSeparator = platform === 'win32' ? ';' : ':';
    const customPaths = this.getPaths();

    const env = {
      ...process.env,
      PATH: `${customPaths.join(pathSeparator)}${pathSeparator}${process.env.PATH || ''}`,
    };

    const finalArgs = options?.json ? [...args, '--json'] : args;
    const execOptions = {
      env,
      cwd: options?.cwd,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: options?.timeout || 60000, // 60s default timeout
    };

    const command = platform === 'win32' ? 'sui.exe' : 'sui';

    try {
      const { stdout, stderr } = await execAsync(command, finalArgs, execOptions);
      if (stdout.trim()) {
        return stdout.trim();
      }
      return stderr.trim();
    } catch (error: any) {
      const errorMessage = error.stderr || error.stdout || error.message;
      throw new Error(`Sui CLI execution failed:\n${errorMessage}`);
    }
  }

  public async executeJson<T>(args: string[], options?: Omit<ExecuteOptions, 'json'>): Promise<T> {
    const output = await this.execute(args, { ...options, json: true });
    try {
      return JSON.parse(output) as T;
    } catch {
      throw new Error(`Failed to parse JSON output: ${output}`);
    }
  }

  public async checkInstallation(): Promise<{ installed: boolean; version?: string }> {
    try {
      const output = await this.execute(['--version']);
      const versionMatch = output.match(/sui (\d+\.\d+\.\d+)/i);
      return {
        installed: true,
        version: versionMatch ? versionMatch[1] : output,
      };
    } catch {
      return { installed: false };
    }
  }
}
