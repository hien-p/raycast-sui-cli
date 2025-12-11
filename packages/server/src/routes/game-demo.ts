/**
 * Game Demo Routes - Interactive Dynamic Fields Demo
 * RPG Inventory System showcasing Sui dynamic fields
 */

import { FastifyInstance } from 'fastify';
import { GameService } from '../services/GameService';
import type { ApiResponse } from '@sui-cli-web/shared';
import { handleRouteError } from '../utils/errorHandler';
import { validateObjectId, validateAddress } from '../utils/validation';

const gameService = new GameService();

export async function gameDemoRoutes(fastify: FastifyInstance) {
  // Get contract info
  fastify.get<{
    Reply: ApiResponse<ReturnType<GameService['getContractInfo']>>;
  }>('/game/info', async (request, reply) => {
    try {
      const info = gameService.getContractInfo();
      return { success: true, data: info };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Get available recipes
  fastify.get<{
    Reply: ApiResponse<ReturnType<GameService['getRecipes']>>;
  }>('/game/recipes', async (request, reply) => {
    try {
      const recipes = gameService.getRecipes();
      return { success: true, data: recipes };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Create a new character
  fastify.post<{
    Body: { name: string };
    Reply: ApiResponse<{ digest: string; characterId?: string }>;
  }>('/game/character', async (request, reply) => {
    try {
      const name = request.body?.name;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Character name is required',
        });
      }

      const result = await gameService.createCharacter(name.trim());
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Mint starter pack
  fastify.post<{
    Reply: ApiResponse<{ digest: string; itemCount: number }>;
  }>('/game/starter-pack', async (request, reply) => {
    try {
      const result = await gameService.mintStarterPack();
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Add item to inventory
  fastify.post<{
    Body: { characterId: string; itemId: string };
    Reply: ApiResponse<{ digest: string }>;
  }>('/game/inventory/add', async (request, reply) => {
    try {
      const characterId = validateObjectId(request.body?.characterId);
      const itemId = validateObjectId(request.body?.itemId);

      const result = await gameService.addToInventory(characterId, itemId);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Remove item from inventory
  fastify.post<{
    Body: { characterId: string; itemId: string };
    Reply: ApiResponse<{ digest: string }>;
  }>('/game/inventory/remove', async (request, reply) => {
    try {
      const characterId = validateObjectId(request.body?.characterId);
      const itemId = validateObjectId(request.body?.itemId);

      const result = await gameService.takeFromInventory(characterId, itemId);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Equip item (from owned items)
  fastify.post<{
    Body: { characterId: string; slot: string; itemId: string };
    Reply: ApiResponse<{ digest: string }>;
  }>('/game/equip', async (request, reply) => {
    try {
      const characterId = validateObjectId(request.body?.characterId);
      const itemId = validateObjectId(request.body?.itemId);
      const slot = request.body?.slot;

      if (!slot || !['weapon', 'armor', 'accessory'].includes(slot)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid slot. Must be weapon, armor, or accessory',
        });
      }

      const result = await gameService.equip(characterId, slot, itemId);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Equip from inventory
  fastify.post<{
    Body: { characterId: string; slot: string; itemId: string };
    Reply: ApiResponse<{ digest: string }>;
  }>('/game/equip-from-inventory', async (request, reply) => {
    try {
      const characterId = validateObjectId(request.body?.characterId);
      const itemId = validateObjectId(request.body?.itemId);
      const slot = request.body?.slot;

      if (!slot || !['weapon', 'armor', 'accessory'].includes(slot)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid slot. Must be weapon, armor, or accessory',
        });
      }

      const result = await gameService.equipFromInventory(characterId, slot, itemId);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Unequip to inventory
  fastify.post<{
    Body: { characterId: string; slot: string };
    Reply: ApiResponse<{ digest: string }>;
  }>('/game/unequip', async (request, reply) => {
    try {
      const characterId = validateObjectId(request.body?.characterId);
      const slot = request.body?.slot;

      if (!slot || !['weapon', 'armor', 'accessory'].includes(slot)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid slot. Must be weapon, armor, or accessory',
        });
      }

      const result = await gameService.unequipToInventory(characterId, slot);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Craft an item
  fastify.post<{
    Body: {
      characterId: string;
      recipeName: string;
      material1Ids: string[];
      material2Ids: string[];
    };
    Reply: ApiResponse<{ digest: string; craftedItemId?: string }>;
  }>('/game/craft', async (request, reply) => {
    try {
      const characterId = validateObjectId(request.body?.characterId);
      const recipeName = request.body?.recipeName;
      const material1Ids = request.body?.material1Ids || [];
      const material2Ids = request.body?.material2Ids || [];

      if (!recipeName || typeof recipeName !== 'string') {
        return reply.code(400).send({
          success: false,
          error: 'Recipe name is required',
        });
      }

      // Validate material IDs
      material1Ids.forEach(id => validateObjectId(id));
      material2Ids.forEach(id => validateObjectId(id));

      const result = await gameService.craft(characterId, recipeName, material1Ids, material2Ids);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Transfer item
  fastify.post<{
    Body: { itemId: string; recipient: string };
    Reply: ApiResponse<{ digest: string }>;
  }>('/game/transfer', async (request, reply) => {
    try {
      const itemId = validateObjectId(request.body?.itemId);
      const recipient = validateAddress(request.body?.recipient);

      const result = await gameService.transferItem(itemId, recipient);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });

  // Mint a specific item (for testing)
  fastify.post<{
    Body: { name: string; itemType: number; power: number; rarity: number };
    Reply: ApiResponse<{ digest: string; itemId?: string }>;
  }>('/game/mint-item', async (request, reply) => {
    try {
      const { name, itemType, power, rarity } = request.body || {};

      if (!name || typeof name !== 'string') {
        return reply.code(400).send({
          success: false,
          error: 'Item name is required',
        });
      }

      if (typeof itemType !== 'number' || itemType < 0 || itemType > 4) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid item type (0-4)',
        });
      }

      if (typeof power !== 'number' || power < 0) {
        return reply.code(400).send({
          success: false,
          error: 'Power must be a non-negative number',
        });
      }

      if (typeof rarity !== 'number' || rarity < 0 || rarity > 4) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid rarity (0-4)',
        });
      }

      const result = await gameService.mintItem(name, itemType, power, rarity);
      return { success: true, data: result };
    } catch (error) {
      return handleRouteError(error, reply);
    }
  });
}
