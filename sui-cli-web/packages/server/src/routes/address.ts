import { FastifyInstance } from 'fastify';
import { AddressService } from '../services/AddressService';
import type { ApiResponse, SuiAddress, GasCoin } from '@sui-cli-web/shared';
import {
  validateAddress,
  validateObjectId,
  validateOptionalAlias,
  validateKeyScheme,
  validateAmounts,
  validateCoinIds,
  validateOptionalGasBudget,
  ValidationException,
} from '../utils/validation';

const addressService = new AddressService();

// Helper to handle validation errors
function handleError(error: unknown, reply: any) {
  if (error instanceof ValidationException) {
    reply.status(400);
    return { success: false, error: error.message };
  }
  reply.status(500);
  return { success: false, error: String(error) };
}

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
      return handleError(error, reply);
    }
  });

  // Get active address
  fastify.get<{ Reply: ApiResponse<{ address: string }> }>('/addresses/active', async (request, reply) => {
    try {
      const address = await addressService.getActiveAddress();
      return { success: true, data: { address } };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Switch active address
  fastify.post<{
    Body: { address: string };
    Reply: ApiResponse<void>;
  }>('/addresses/switch', async (request, reply) => {
    try {
      const address = validateAddress(request.body?.address);
      await addressService.switchAddress(address);
      return { success: true };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Create new address
  fastify.post<{
    Body: { keyScheme?: 'ed25519' | 'secp256k1' | 'secp256r1'; alias?: string };
    Reply: ApiResponse<{ address: string; phrase?: string }>;
  }>('/addresses/create', async (request, reply) => {
    try {
      const keyScheme = validateKeyScheme(request.body?.keyScheme);
      const alias = validateOptionalAlias(request.body?.alias);
      const result = await addressService.createAddress(keyScheme, alias);
      return { success: true, data: result };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get balance for specific address
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<{ balance: string }>;
  }>('/addresses/:address/balance', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      const balance = await addressService.getBalance(address);
      return { success: true, data: { balance } };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get objects for an address
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<any[]>;
  }>('/addresses/:address/objects', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      const objects = await addressService.getObjects(address);
      return { success: true, data: objects };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get gas coins
  fastify.get<{
    Params: { address: string };
    Reply: ApiResponse<GasCoin[]>;
  }>('/addresses/:address/gas', async (request, reply) => {
    try {
      const address = validateAddress(request.params.address);
      const gasCoins = await addressService.getGasCoins(address);
      return { success: true, data: gasCoins };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Split coin
  fastify.post<{
    Body: { coinId: string; amounts: string[]; gasBudget?: string };
    Reply: ApiResponse<string>;
  }>('/gas/split', async (request, reply) => {
    try {
      const coinId = validateObjectId(request.body?.coinId, 'coinId');
      const amounts = validateAmounts(request.body?.amounts);
      const gasBudget = validateOptionalGasBudget(request.body?.gasBudget);
      const result = await addressService.splitCoin(coinId, amounts, gasBudget);
      return { success: true, data: result };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Merge coins
  fastify.post<{
    Body: { primaryCoinId: string; coinIdsToMerge: string[]; gasBudget?: string };
    Reply: ApiResponse<string>;
  }>('/gas/merge', async (request, reply) => {
    try {
      const primaryCoinId = validateObjectId(request.body?.primaryCoinId, 'primaryCoinId');
      const coinIdsToMerge = validateCoinIds(request.body?.coinIdsToMerge, 'coinIdsToMerge');
      const gasBudget = validateOptionalGasBudget(request.body?.gasBudget);
      const result = await addressService.mergeCoins(primaryCoinId, coinIdsToMerge, gasBudget);
      return { success: true, data: result };
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get object by ID
  fastify.get<{
    Params: { objectId: string };
    Reply: ApiResponse<any>;
  }>('/objects/:objectId', async (request, reply) => {
    try {
      const objectId = validateObjectId(request.params.objectId);
      const object = await addressService.getObject(objectId);
      return { success: true, data: object };
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
