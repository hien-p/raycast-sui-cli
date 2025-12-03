import { FastifyInstance } from 'fastify';
import { FaucetService } from '../services/FaucetService';
import type { ApiResponse, FaucetResponse } from '@sui-cli-web/shared';
import {
  validateNetwork,
  validateAddress,
  ValidationException,
} from '../utils/validation';

const faucetService = new FaucetService();

// Helper to handle validation errors
function handleError(error: unknown, reply: any) {
  if (error instanceof ValidationException) {
    reply.status(400);
    return { success: false, error: error.message };
  }
  reply.status(500);
  return { success: false, error: String(error) };
}

export async function faucetRoutes(fastify: FastifyInstance) {
  // Request tokens from faucet
  fastify.post<{
    Body: { network: 'testnet' | 'devnet' | 'localnet'; address?: string };
    Reply: ApiResponse<FaucetResponse>;
  }>('/faucet/request', async (request, reply) => {
    try {
      const network = validateNetwork(request.body?.network);
      // Address is optional - if not provided, uses active address
      let address: string | undefined;
      if (request.body?.address) {
        address = validateAddress(request.body.address);
      }
      const result = await faucetService.requestTokens(network, address);
      return { success: true, data: result };
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
