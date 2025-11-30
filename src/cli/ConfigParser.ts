import fs from "fs";
import path from "path";
import os from "os";
import yaml from "js-yaml";

interface SuiConfig {
    active_env: string;
    active_address: string;
    envs: string[];
    keystore: {
        File: string;
    };
}

export class ConfigParser {
    private static instance: ConfigParser;
    private configPath: string;

    private constructor() {
        this.configPath = path.join(os.homedir(), ".sui", "sui_config", "client.yaml");
    }

    public static getInstance(): ConfigParser {
        if (!ConfigParser.instance) {
            ConfigParser.instance = new ConfigParser();
        }
        return ConfigParser.instance;
    }

    public async getConfig(): Promise<SuiConfig | null> {
        try {
            if (!fs.existsSync(this.configPath)) {
                return null;
            }
            const fileContents = await fs.promises.readFile(this.configPath, "utf8");
            const config = yaml.load(fileContents) as any;

            // Map the raw config to our interface
            // Note: The actual structure of client.yaml might vary slightly, 
            // but usually has active_env, active_address, envs (list of aliases).

            return {
                active_env: config.active_env,
                active_address: config.active_address,
                envs: config.envs ? config.envs.map((e: any) => e.alias) : [],
                keystore: config.keystore,
            };
        } catch (error) {
            console.error("Failed to parse Sui config:", error);
            return null;
        }
    }
    public async saveConfig(config: SuiConfig): Promise<void> {
        try {
            // We need to read the original file to preserve other fields if possible, 
            // but for now we'll reconstruct the essential structure.
            // A better approach is to read, update specific fields, and write back.

            const currentContent = await fs.promises.readFile(this.configPath, "utf8");
            const currentConfig = yaml.load(currentContent) as any;

            // Update fields
            currentConfig.active_env = config.active_env;
            currentConfig.active_address = config.active_address;

            // Reconstruct envs list
            // The config uses a list of objects { alias: string, rpc: string, ws: string | null }
            // Our internal config only tracks aliases for now, so we need to be careful not to lose RPC URLs.
            // This is a limitation of our current interface. 
            // We should probably update getEnvironments to return full objects or handle this in Service.

            // However, for removing an environment, we just filter the existing list.
            if (config.envs) {
                currentConfig.envs = currentConfig.envs.filter((e: any) => config.envs.includes(e.alias));
            }

            const newContent = yaml.dump(currentConfig);
            await fs.promises.writeFile(this.configPath, newContent, "utf8");
        } catch (error) {
            throw new Error(`Failed to save Sui config: ${error}`);
        }
    }
}
