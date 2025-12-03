import { LocalStorage } from "@raycast/api";

export interface CommandTemplate {
  id: string;
  name: string;
  template: string; // e.g., "client transfer --to {address} --amount {amount}"
  description: string;
}

export class TemplateService {
  private static readonly TEMPLATES_KEY = "sui_cli_templates";

  public async getTemplates(): Promise<CommandTemplate[]> {
    const data = await LocalStorage.getItem<string>(
      TemplateService.TEMPLATES_KEY,
    );
    const custom = data ? JSON.parse(data) : [];
    return [...this.getDefaultTemplates(), ...custom];
  }

  public async saveTemplate(template: CommandTemplate): Promise<void> {
    const data = await LocalStorage.getItem<string>(
      TemplateService.TEMPLATES_KEY,
    );
    const current = data ? JSON.parse(data) : [];
    const updated = [...current, template];
    await LocalStorage.setItem(
      TemplateService.TEMPLATES_KEY,
      JSON.stringify(updated),
    );
  }

  private getDefaultTemplates(): CommandTemplate[] {
    return [
      {
        id: "transfer-sui",
        name: "Transfer SUI",
        template:
          "client transfer --to {address} --amount {amount} --gas-budget 10000000",
        description: "Transfer SUI to an address",
      },
      {
        id: "publish-package",
        name: "Publish Package",
        template: "client publish --gas-budget 100000000 {path}",
        description: "Publish a Move package",
      },
    ];
  }

  public getPlaceholders(template: string): string[] {
    const matches = template.match(/{([^}]+)}/g);
    return matches ? matches.map((m) => m.slice(1, -1)) : [];
  }

  public fillTemplate(
    template: string,
    values: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`{${key}}`, "g"), value);
    }
    return result;
  }
}
