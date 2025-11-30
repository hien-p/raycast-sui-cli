import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export class PackageManagerService {
    private executor: SuiCliExecutor;

    constructor() {
        this.executor = SuiCliExecutor.getInstance();
    }

    public async build(path: string): Promise<string> {
        return this.executor.execute("move build", { cwd: path });
    }

    public async test(path: string): Promise<string> {
        return this.executor.execute("move test", { cwd: path });
    }

    public async publish(path: string, gasBudget: number): Promise<string> {
        return this.executor.execute(`client publish --gas-budget ${gasBudget} --skip-dependency-verification`, { cwd: path });
    }

    public async create(name: string, path: string): Promise<string> {
        return this.executor.execute(`move new ${name}`, { cwd: path });
    }

    public async upgrade(path: string, capId: string, gasBudget: number): Promise<string> {
        return this.executor.execute(`client upgrade --upgrade-capability ${capId} --gas-budget ${gasBudget} --skip-dependency-verification`, { cwd: path });
    }

    public async verify(path: string, packageAddress: string): Promise<string> {
        return this.executor.execute(`client verify-source --address ${packageAddress}`, { cwd: path });
    }
}
