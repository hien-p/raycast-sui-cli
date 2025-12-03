import { FastifyInstance } from 'fastify';
import { FaucetService } from '../services/FaucetService';
import type { ApiResponse, FaucetResponse } from '@sui-cli-web/shared';

const faucetService = new FaucetService();

export async function faucetRoutes(fastify: FastifyInstance) {
  // Request tokens from faucet
  fastify.post<{
    Body: { network: 'testnet' | 'devnet' | 'localnet'; address?: string };
    Reply: ApiResponse<FaucetResponse>;
  }>('/faucet/request', async (request, reply) => {
    try {
      const { network, address } = request.body;
      const result = await faucetService.requestTokens(network, address);
      return { success: true, data: result };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });
}
