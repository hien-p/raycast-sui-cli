import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class SuiCliExecutor {
    private static instance: SuiCliExecutor;

    private constructor() { }

    public static getInstance(): SuiCliExecutor {
        if (!SuiCliExecutor.instance) {
            SuiCliExecutor.instance = new SuiCliExecutor();
        }
        return SuiCliExecutor.instance;
    }

    public async execute(command: string, options?: { json?: boolean; cwd?: string }): Promise<string> {
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

        const cmd = options?.json ? `sui ${command} --json` : `sui ${command}`;
        const execOptions = { env, cwd: options?.cwd };

        try {
            const { stdout, stderr } = await execAsync(cmd, execOptions);
            // Some commands might output to stderr even on success or warnings
            if (stderr && !stdout) {
                throw new Error(stderr);
            }
            return stdout.trim();
        } catch (error: any) {
            const errorMessage = error.stderr || error.stdout || error.message;
            throw new Error(`Sui CLI execution failed:\n${errorMessage}`);
        }
    }

    public async checkInstallation(): Promise<boolean> {
        try {
            await this.execute("--version");
            return true;
        } catch (error) {
            return false;
        }
    }
}
