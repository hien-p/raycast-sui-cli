/// Item module - defines items that can be stored, equipped, and traded
/// Demonstrates: Basic object creation with `key` and `store` abilities
module game_demo::item {
    use std::string::String;

    // ============ Constants ============

    // Item types
    const ITEM_TYPE_WEAPON: u8 = 0;
    const ITEM_TYPE_ARMOR: u8 = 1;
    const ITEM_TYPE_ACCESSORY: u8 = 2;
    const ITEM_TYPE_MATERIAL: u8 = 3;
    const ITEM_TYPE_CONSUMABLE: u8 = 4;

    // Rarity levels
    const RARITY_COMMON: u8 = 0;
    const RARITY_UNCOMMON: u8 = 1;
    const RARITY_RARE: u8 = 2;
    const RARITY_EPIC: u8 = 3;
    const RARITY_LEGENDARY: u8 = 4;

    // Error codes
    const EInvalidItemType: u64 = 0;
    const EInvalidRarity: u64 = 1;

    // ============ Structs ============

    /// Item object - can be stored in inventory, equipped, or traded
    /// Has `key` for unique ID and `store` for transferability
    public struct Item has key, store {
        id: UID,
        name: String,
        item_type: u8,      // 0=weapon, 1=armor, 2=accessory, 3=material, 4=consumable
        power: u64,         // Attack/Defense/Buff power
        rarity: u8,         // 0=common, 1=uncommon, 2=rare, 3=epic, 4=legendary
    }

    // ============ Public Functions ============

    /// Create a new item (internal use by game logic)
    public fun create(
        name: String,
        item_type: u8,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ): Item {
        assert!(item_type <= ITEM_TYPE_CONSUMABLE, EInvalidItemType);
        assert!(rarity <= RARITY_LEGENDARY, EInvalidRarity);

        Item {
            id: object::new(ctx),
            name,
            item_type,
            power,
            rarity,
        }
    }

    /// Mint a weapon
    public fun mint_weapon(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ): Item {
        create(name, ITEM_TYPE_WEAPON, power, rarity, ctx)
    }

    /// Mint an armor
    public fun mint_armor(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ): Item {
        create(name, ITEM_TYPE_ARMOR, power, rarity, ctx)
    }

    /// Mint an accessory
    public fun mint_accessory(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ): Item {
        create(name, ITEM_TYPE_ACCESSORY, power, rarity, ctx)
    }

    /// Mint a material (for crafting)
    public fun mint_material(
        name: String,
        rarity: u8,
        ctx: &mut TxContext
    ): Item {
        create(name, ITEM_TYPE_MATERIAL, 0, rarity, ctx)
    }

    /// Mint a consumable
    public fun mint_consumable(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ): Item {
        create(name, ITEM_TYPE_CONSUMABLE, power, rarity, ctx)
    }

    // ============ Accessors ============

    public fun id(item: &Item): ID {
        object::uid_to_inner(&item.id)
    }

    public fun name(item: &Item): String {
        item.name
    }

    public fun item_type(item: &Item): u8 {
        item.item_type
    }

    public fun power(item: &Item): u64 {
        item.power
    }

    public fun rarity(item: &Item): u8 {
        item.rarity
    }

    public fun is_weapon(item: &Item): bool {
        item.item_type == ITEM_TYPE_WEAPON
    }

    public fun is_armor(item: &Item): bool {
        item.item_type == ITEM_TYPE_ARMOR
    }

    public fun is_accessory(item: &Item): bool {
        item.item_type == ITEM_TYPE_ACCESSORY
    }

    public fun is_material(item: &Item): bool {
        item.item_type == ITEM_TYPE_MATERIAL
    }

    public fun is_consumable(item: &Item): bool {
        item.item_type == ITEM_TYPE_CONSUMABLE
    }

    public fun is_equippable(item: &Item): bool {
        item.item_type <= ITEM_TYPE_ACCESSORY
    }

    // ============ Type Constants (for external use) ============

    public fun type_weapon(): u8 { ITEM_TYPE_WEAPON }
    public fun type_armor(): u8 { ITEM_TYPE_ARMOR }
    public fun type_accessory(): u8 { ITEM_TYPE_ACCESSORY }
    public fun type_material(): u8 { ITEM_TYPE_MATERIAL }
    public fun type_consumable(): u8 { ITEM_TYPE_CONSUMABLE }

    public fun rarity_common(): u8 { RARITY_COMMON }
    public fun rarity_uncommon(): u8 { RARITY_UNCOMMON }
    public fun rarity_rare(): u8 { RARITY_RARE }
    public fun rarity_epic(): u8 { RARITY_EPIC }
    public fun rarity_legendary(): u8 { RARITY_LEGENDARY }

    // ============ Destroy ============

    /// Destroy an item (burn)
    public fun destroy(item: Item) {
        let Item { id, name: _, item_type: _, power: _, rarity: _ } = item;
        object::delete(id);
    }
}
