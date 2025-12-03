import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export class PackageManagerService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  public async build(path: string): Promise<string> {
    return this.executor.execute(["move", "build"], { cwd: path });
  }

  public async test(path: string): Promise<string> {
    return this.executor.execute(["move", "test"], { cwd: path });
  }

  public async publish(path: string, gasBudget: number): Promise<string> {
    return this.executor.execute(
      [
        "client",
        "publish",
        "--gas-budget",
        String(gasBudget),
        "--skip-dependency-verification",
      ],
      { cwd: path },
    );
  }

  public async create(name: string, path: string): Promise<string> {
    return this.executor.execute(["move", "new", name], { cwd: path });
  }

  public async upgrade(
    path: string,
    capId: string,
    gasBudget: number,
  ): Promise<string> {
    return this.executor.execute(
      [
        "client",
        "upgrade",
        "--upgrade-capability",
        capId,
        "--gas-budget",
        String(gasBudget),
        "--skip-dependency-verification",
      ],
      { cwd: path },
    );
  }

  public async verify(path: string, packageAddress: string): Promise<string> {
    return this.executor.execute(
      ["client", "verify-source", "--address", packageAddress],
      { cwd: path },
    );
  }

  /**
   * Run tests with coverage enabled
   */
  public async testWithCoverage(path: string): Promise<string> {
    return this.executor.execute(["move", "test", "--coverage"], { cwd: path });
  }

  /**
   * Get coverage summary after running tests with coverage
   */
  public async coverageSummary(path: string): Promise<string> {
    return this.executor.execute(["move", "coverage", "summary"], {
      cwd: path,
    });
  }

  /**
   * Get source coverage for a specific module
   */
  public async coverageSource(
    path: string,
    moduleName: string,
  ): Promise<string> {
    return this.executor.execute(
      ["move", "coverage", "source", "--module", moduleName],
      {
        cwd: path,
      },
    );
  }

  /**
   * Migrate package to Move 2024 edition
   */
  public async migrate(path: string): Promise<string> {
    return this.executor.execute(["move", "migrate"], { cwd: path });
  }

  /**
   * Build with documentation generation
   */
  public async buildWithDocs(path: string): Promise<string> {
    return this.executor.execute(["move", "build", "--doc"], { cwd: path });
  }

  /**
   * Build with linting enabled
   */
  public async buildWithLint(path: string): Promise<string> {
    return this.executor.execute(["move", "build", "--lint"], { cwd: path });
  }

  /**
   * Disassemble bytecode for a module
   */
  public async disassemble(path: string, moduleName: string): Promise<string> {
    return this.executor.execute(
      ["move", "disassemble", "--name", moduleName],
      {
        cwd: path,
      },
    );
  }
}
