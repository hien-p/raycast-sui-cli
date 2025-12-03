import { FastifyInstance } from 'fastify';
import { AddressService } from '../services/AddressService';
import type { ApiResponse, SuiAddress, GasCoin } from '@sui-cli-web/shared';

const addressService = new AddressService();

export async function addressRoutes(fastify: FastifyInstance) {
  // Get all addresses with balances
  fastify.get<{ Reply: ApiResponse<SuiAddress[]> }>('/addresses', async (request, reply) => {
    try {
      const addresses = await addressService.getAddresses();

      // Fetch balances in parallel
      const addressesWithBalances = await Promise.all(
        addresses.map(async (addr) => {
          try {
            const balance = await addressService.getBalance(addr.address);
            return { ...addr, balance };
          } catch {
            return { ...addr, balance: '0' };
          }
        })
      );

      return { success: true, data: addressesWithBalances };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Get active address
  fastify.get<{ Reply: ApiResponse<{ address: string }> }>('/addresses/active', async (request, reply) => {
    try {
      const address = await addressService.getActiveAddress();
      return { success: true, data: { address } };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Switch active address
  fastify.post<{
    Body: { address: string };
    Reply: ApiResponse<void>;
  }>('/addresses/switch', async (request, reply) => {
    try {
      const { address } = request.body;
      await addressService.switchAddress(address);
      return { success: true };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Create new address
  fastify.post<{
    Body: { keyScheme?: 'ed25519' | 'secp256k1' | 'secp256r1'; alias?: string };
    Reply: ApiResponse<{ address: string; phrase?: string }>;
  }>('/addresses/create', async (request, reply) => {
    try {
      const { keyScheme, alias } = request.body;
      const result = await addressService.createAddress(keyScheme, alias);
      return { success: true, data: result };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Get balance for specific address
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<{ balance: string }>;
  }>('/addresses/:address/balance', async (request, reply) => {
    try {
      const { address } = request.params;
      const balance = await addressService.getBalance(address);
      return { success: true, data: { balance } };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Get objects for an address
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<any[]>;
  }>('/addresses/:address/objects', async (request, reply) => {
    try {
      const { address } = request.params;
      const objects = await addressService.getObjects(address);
      return { success: true, data: objects };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Get gas coins
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<GasCoin[]>;
  }>('/addresses/:address/gas', async (request, reply) => {
    try {
      const { address } = request.params;
      const gasCoins = await addressService.getGasCoins(address);
      return { success: true, data: gasCoins };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Split coin
  fastify.post<{
    Body: { coinId: string; amounts: string[]; gasBudget?: string };
    Reply: ApiResponse<string>;
  }>('/gas/split', async (request, reply) => {
    try {
      const { coinId, amounts, gasBudget } = request.body;
      const result = await addressService.splitCoin(coinId, amounts, gasBudget);
      return { success: true, data: result };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Merge coins
  fastify.post<{
    Body: { primaryCoinId: string; coinIdsToMerge: string[]; gasBudget?: string };
    Reply: ApiResponse<string>;
  }>('/gas/merge', async (request, reply) => {
    try {
      const { primaryCoinId, coinIdsToMerge, gasBudget } = request.body;
      const result = await addressService.mergeCoins(primaryCoinId, coinIdsToMerge, gasBudget);
      return { success: true, data: result };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });

  // Get object by ID
  fastify.get<{
    Params: { objectId: string };
    Reply: ApiResponse<any>;
  }>('/objects/:objectId', async (request, reply) => {
    try {
      const { objectId } = request.params;
      const object = await addressService.getObject(objectId);
      return { success: true, data: object };
    } catch (error) {
      reply.status(500);
      return { success: false, error: String(error) };
    }
  });
}
