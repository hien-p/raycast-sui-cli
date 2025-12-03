import { SuiCliExecutor } from '../cli/SuiCliExecutor';
import type { FaucetResponse } from '@sui-cli-web/shared';
import { NETWORKS } from '@sui-cli-web/shared';

export class FaucetService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  public async requestTokens(
    network: 'testnet' | 'devnet' | 'localnet',
    address?: string
  ): Promise<FaucetResponse> {
    const targetAddress = address || (await this.executor.execute(['client', 'active-address'])).trim();

    const faucetUrl = NETWORKS[network].faucet;
    if (!faucetUrl) {
      return {
        success: false,
        message: `No faucet available for ${network}`,
        error: 'Faucet not available',
      };
    }

    try {
      const response = await fetch(faucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: targetAddress,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Faucet request failed: ${response.status} ${response.statusText}`,
          error: errorText,
        };
      }

      const data = await response.json();

      // Extract transaction digest if available
      let txDigest: string | undefined;
      if (data.transferredGasObjects) {
        txDigest = data.transferredGasObjects[0]?.transferTxDigest;
      } else if (data.task) {
        txDigest = data.task;
      }

      return {
        success: true,
        message: `Successfully requested tokens for ${targetAddress}`,
        txDigest,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to request tokens from ${faucetUrl}`,
        error: String(error),
      };
    }
  }
}
