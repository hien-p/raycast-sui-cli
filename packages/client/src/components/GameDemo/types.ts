// Game Demo Types

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

export interface ContractInfo {
  packageId: string;
  gameRegistryId: string;
  network: string;
  modules: string[];
  itemTypes: Record<string, number>;
  rarities: Record<string, number>;
  slots: Record<string, string>;
}

// Item type constants
export const ITEM_TYPES = {
  WEAPON: 0,
  ARMOR: 1,
  ACCESSORY: 2,
  MATERIAL: 3,
  CONSUMABLE: 4,
} as const;

// Rarity constants
export const RARITIES = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
} as const;

// Item type to emoji mapping
export const ITEM_TYPE_ICONS: Record<number, string> = {
  0: '🗡️', // Weapon
  1: '🛡️', // Armor
  2: '💍', // Accessory
  3: '🪨', // Material
  4: '🧪', // Consumable
};

// Rarity to color mapping
export const RARITY_COLORS: Record<number, string> = {
  0: 'text-gray-400',    // Common
  1: 'text-green-400',   // Uncommon
  2: 'text-blue-400',    // Rare
  3: 'text-purple-400',  // Epic
  4: 'text-yellow-400',  // Legendary
};

export const RARITY_NAMES: Record<number, string> = {
  0: 'Common',
  1: 'Uncommon',
  2: 'Rare',
  3: 'Epic',
  4: 'Legendary',
};

export const ITEM_TYPE_NAMES: Record<number, string> = {
  0: 'Weapon',
  1: 'Armor',
  2: 'Accessory',
  3: 'Material',
  4: 'Consumable',
};
