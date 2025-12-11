/**
 * GameService - Handles game demo operations using PTB
 * Demonstrates dynamic fields with RPG inventory system
 */

import { SuiCliExecutor } from '../cli/SuiCliExecutor';

// Contract addresses (testnet)
const PACKAGE_ID = '0xd5a27c2bc7870cde3e3104bf9946ad93eccec5b3ab517b29c7d3bc732003f4b5';
const GAME_REGISTRY_ID = '0xe3f68fc95a9714411eb0e2368ecd92950f1c0295ea75b42184f4d3b17a18a704';

// Item types
const ITEM_TYPES = {
  WEAPON: 0,
  ARMOR: 1,
  ACCESSORY: 2,
  MATERIAL: 3,
  CONSUMABLE: 4,
} as const;

// Rarity levels
const RARITIES = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
} as const;

// Equipment slots
const SLOTS = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
} as const;

export interface GameCharacter {
  id: string;
  name: string;
  level: number;
  experience: number;
  attack: number;
  defense: number;
}

export interface GameItem {
  id: string;
  name: string;
  itemType: number;
  power: number;
  rarity: number;
}

export interface CraftingRecipe {
  name: string;
  resultName: string;
  resultType: number;
  resultPower: number;
  resultRarity: number;
  material1Name: string;
  material1Count: number;
  material2Name: string;
  material2Count: number;
}

export class GameService {
  private executor: SuiCliExecutor;

  constructor() {
    this.executor = SuiCliExecutor.getInstance();
  }

  /**
   * Create a new character
   */
  async createCharacter(name: string): Promise<{ digest: string; characterId?: string }> {
    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'character',
      '--function', 'create_character',
      '--args', `"${name}"`,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    // Extract character ID from created objects
    let characterId: string | undefined;
    if (parsed.objectChanges) {
      const charObj = parsed.objectChanges.find((obj: any) =>
        obj.type === 'created' &&
        obj.objectType?.includes('::character::Character')
      );
      if (charObj) {
        characterId = charObj.objectId;
      }
    }

    return {
      digest: parsed.digest,
      characterId,
    };
  }

  /**
   * Mint starter pack items
   */
  async mintStarterPack(): Promise<{ digest: string; itemCount: number }> {
    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'game',
      '--function', 'mint_starter_pack',
      '--gas-budget', '100000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    // Count created items
    let itemCount = 0;
    if (parsed.objectChanges) {
      itemCount = parsed.objectChanges.filter((obj: any) =>
        obj.type === 'created' &&
        obj.objectType?.includes('::item::Item')
      ).length;
    }

    return {
      digest: parsed.digest,
      itemCount,
    };
  }

  /**
   * Add item to character's inventory
   */
  async addToInventory(characterId: string, itemId: string): Promise<{ digest: string }> {
    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'character',
      '--function', 'add_to_inventory',
      '--args', characterId, itemId,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    return { digest: parsed.digest };
  }

  /**
   * Remove item from inventory
   */
  async takeFromInventory(characterId: string, itemId: string): Promise<{ digest: string }> {
    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'character',
      '--function', 'take_from_inventory',
      '--args', characterId, itemId,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    return { digest: parsed.digest };
  }

  /**
   * Equip item to slot
   */
  async equip(characterId: string, slot: string, itemId: string): Promise<{ digest: string }> {
    // Convert slot name to vector<u8> format
    const slotVector = this.stringToVector(slot);

    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'character',
      '--function', 'equip',
      '--args', characterId, slotVector, itemId,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    return { digest: parsed.digest };
  }

  /**
   * Unequip item from slot to inventory
   */
  async unequipToInventory(characterId: string, slot: string): Promise<{ digest: string }> {
    const slotVector = this.stringToVector(slot);

    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'character',
      '--function', 'unequip_to_inventory',
      '--args', characterId, slotVector,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    return { digest: parsed.digest };
  }

  /**
   * Equip item directly from inventory
   */
  async equipFromInventory(characterId: string, slot: string, itemId: string): Promise<{ digest: string }> {
    const slotVector = this.stringToVector(slot);

    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'character',
      '--function', 'equip_from_inventory',
      '--args', characterId, slotVector, itemId,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    return { digest: parsed.digest };
  }

  /**
   * Craft an item
   */
  async craft(
    characterId: string,
    recipeName: string,
    material1Ids: string[],
    material2Ids: string[]
  ): Promise<{ digest: string; craftedItemId?: string }> {
    const mat1Vector = material1Ids.length > 0 ? `vector[${material1Ids.join(',')}]` : 'vector[]';
    const mat2Vector = material2Ids.length > 0 ? `vector[${material2Ids.join(',')}]` : 'vector[]';

    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'crafting',
      '--function', 'craft',
      '--args', GAME_REGISTRY_ID, characterId, `"${recipeName}"`, mat1Vector, mat2Vector,
      '--gas-budget', '100000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    // Extract crafted item ID
    let craftedItemId: string | undefined;
    if (parsed.objectChanges) {
      const itemObj = parsed.objectChanges.find((obj: any) =>
        obj.type === 'created' &&
        obj.objectType?.includes('::item::Item')
      );
      if (itemObj) {
        craftedItemId = itemObj.objectId;
      }
    }

    return {
      digest: parsed.digest,
      craftedItemId,
    };
  }

  /**
   * Transfer an item to another address
   */
  async transferItem(itemId: string, recipient: string): Promise<{ digest: string }> {
    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'game',
      '--function', 'transfer_item',
      '--args', itemId, recipient,
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    return { digest: parsed.digest };
  }

  /**
   * Mint a specific item for testing
   */
  async mintItem(
    name: string,
    itemType: number,
    power: number,
    rarity: number
  ): Promise<{ digest: string; itemId?: string }> {
    const args = [
      'client', 'call',
      '--package', PACKAGE_ID,
      '--module', 'game',
      '--function', 'mint_item',
      '--args', `"${name}"`, itemType.toString(), power.toString(), rarity.toString(),
      '--gas-budget', '50000000',
      '--json'
    ];

    const result = await this.executor.execute(args);
    const parsed = JSON.parse(result);

    let itemId: string | undefined;
    if (parsed.objectChanges) {
      const itemObj = parsed.objectChanges.find((obj: any) =>
        obj.type === 'created' &&
        obj.objectType?.includes('::item::Item')
      );
      if (itemObj) {
        itemId = itemObj.objectId;
      }
    }

    return {
      digest: parsed.digest,
      itemId,
    };
  }

  /**
   * Get contract info
   */
  getContractInfo() {
    return {
      packageId: PACKAGE_ID,
      gameRegistryId: GAME_REGISTRY_ID,
      network: 'testnet',
      modules: ['character', 'item', 'crafting', 'game'],
      itemTypes: ITEM_TYPES,
      rarities: RARITIES,
      slots: SLOTS,
    };
  }

  /**
   * Get available recipes (static list for now)
   */
  getRecipes(): CraftingRecipe[] {
    return [
      {
        name: 'Iron Sword',
        resultName: 'Iron Sword',
        resultType: ITEM_TYPES.WEAPON,
        resultPower: 25,
        resultRarity: RARITIES.COMMON,
        material1Name: 'Iron Ore',
        material1Count: 3,
        material2Name: 'Wood',
        material2Count: 1,
      },
      {
        name: 'Steel Sword',
        resultName: 'Steel Sword',
        resultType: ITEM_TYPES.WEAPON,
        resultPower: 50,
        resultRarity: RARITIES.UNCOMMON,
        material1Name: 'Iron Ore',
        material1Count: 5,
        material2Name: 'Coal',
        material2Count: 2,
      },
      {
        name: 'Leather Armor',
        resultName: 'Leather Armor',
        resultType: ITEM_TYPES.ARMOR,
        resultPower: 20,
        resultRarity: RARITIES.COMMON,
        material1Name: 'Leather',
        material1Count: 4,
        material2Name: 'Thread',
        material2Count: 2,
      },
      {
        name: 'Iron Armor',
        resultName: 'Iron Armor',
        resultType: ITEM_TYPES.ARMOR,
        resultPower: 40,
        resultRarity: RARITIES.UNCOMMON,
        material1Name: 'Iron Ore',
        material1Count: 6,
        material2Name: 'Leather',
        material2Count: 3,
      },
      {
        name: 'Lucky Ring',
        resultName: 'Lucky Ring',
        resultType: ITEM_TYPES.ACCESSORY,
        resultPower: 15,
        resultRarity: RARITIES.RARE,
        material1Name: 'Gold',
        material1Count: 2,
        material2Name: 'Gem',
        material2Count: 1,
      },
      {
        name: 'Health Potion',
        resultName: 'Health Potion',
        resultType: ITEM_TYPES.CONSUMABLE,
        resultPower: 50,
        resultRarity: RARITIES.COMMON,
        material1Name: 'Herb',
        material1Count: 2,
        material2Name: 'Water',
        material2Count: 1,
      },
    ];
  }

  // Helper: Convert string to format for Move vector<u8>
  // Sui CLI expects vector<u8> as array of decimal numbers in square brackets
  private stringToVector(str: string): string {
    const bytes = Array.from(str)
      .map(c => c.charCodeAt(0))
      .join('u8,');
    return `[${bytes}u8]`;
  }
}
