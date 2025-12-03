import { execFile } from "child_process";
import { promisify } from "util";

const execAsync = promisify(execFile);

export class SuiCliExecutor {
  private static instance: SuiCliExecutor;

  private constructor() {}

  public static getInstance(): SuiCliExecutor {
    if (!SuiCliExecutor.instance) {
      SuiCliExecutor.instance = new SuiCliExecutor();
    }
    return SuiCliExecutor.instance;
  }

  public async execute(
    args: string[],
    options?: { json?: boolean; cwd?: string },
  ): Promise<string> {
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

    const finalArgs = options?.json ? [...args, "--json"] : args;
    const execOptions = { env, cwd: options?.cwd, maxBuffer: 10 * 1024 * 1024 };

    try {
      const { stdout, stderr } = await execAsync("sui", finalArgs, execOptions);
      // Sui CLI often outputs progress/warnings to stderr even on success
      // Return stdout if available, otherwise return stderr (for commands that only output to stderr)
      if (stdout.trim()) {
        return stdout.trim();
      }
      // For successful commands with only stderr output (like build progress), return that
      return stderr.trim();
    } catch (error: any) {
      // execAsync throws when exit code is non-zero - this is an actual error
      const errorMessage = error.stderr || error.stdout || error.message;
      throw new Error(`Sui CLI execution failed:\n${errorMessage}`);
    }
  }

  public async checkInstallation(): Promise<boolean> {
    try {
      await this.execute(["--version"]);
      return true;
    } catch (error) {
      return false;
    }
  }
}
