import { SuiCliExecutor } from "../cli/SuiCliExecutor";

export class FaucetService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  public async requestTokens(
    network: "testnet" | "devnet" | "localnet",
  ): Promise<string> {
    const activeAddress = (
      await this.executor.execute(["client", "active-address"])
    ).trim();

    let faucetUrl = "";
    if (network === "localnet") {
      faucetUrl = "http://127.0.0.1:9123/gas";
    } else {
      faucetUrl = `https://faucet.${network}.sui.io/gas`;
    }

    try {
      const response = await fetch(faucetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: activeAddress,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Faucet request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      // The response format usually contains transferred_gas_objects or similar.
      // Let's return a friendly message with the data.
      return JSON.stringify(data, null, 2);
    } catch (error) {
      // Fallback to CLI if fetch fails (e.g. network issues or different API structure)
      // But since CLI is already known to fail for testnet, we might just throw the error from fetch
      // or try CLI as a last resort if it's not a "use web ui" error.
      // For now, let's throw the fetch error as it's likely more descriptive for the API call.
      throw new Error(
        `Failed to request tokens from ${faucetUrl}: ${String(error)}`,
      );
    }
  }
}
