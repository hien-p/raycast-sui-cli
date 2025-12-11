/// Game module - main entry points and demo helpers
/// Provides convenient functions for testing the dynamic fields demo
module game_demo::game {
    use std::string::{Self, String};
    use sui::event;
    use game_demo::item::{Self, Item};

    // ============ Events ============

    public struct StarterPackMinted has copy, drop {
        recipient: address,
        item_count: u64,
    }

    // ============ Demo Entry Functions ============

    /// Mint a starter pack with basic items (no character - character created separately)
    /// Items are transferred directly to sender, who can then add to character inventory
    public entry fun mint_starter_pack(ctx: &mut TxContext) {
        let sender = ctx.sender();
        let mut item_count: u64 = 0;

        // Mint starter weapon
        let wooden_sword = item::mint_weapon(
            string::utf8(b"Wooden Sword"),
            10,
            item::rarity_common(),
            ctx
        );
        transfer::public_transfer(wooden_sword, sender);
        item_count = item_count + 1;

        // Mint starter armor
        let cloth_armor = item::mint_armor(
            string::utf8(b"Cloth Armor"),
            5,
            item::rarity_common(),
            ctx
        );
        transfer::public_transfer(cloth_armor, sender);
        item_count = item_count + 1;

        // Materials for crafting - Iron Ore x5
        let mut i = 0;
        while (i < 5) {
            let iron_ore = item::mint_material(
                string::utf8(b"Iron Ore"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(iron_ore, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        // Wood x3
        i = 0;
        while (i < 3) {
            let wood = item::mint_material(
                string::utf8(b"Wood"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(wood, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        // Coal x2
        i = 0;
        while (i < 2) {
            let coal = item::mint_material(
                string::utf8(b"Coal"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(coal, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        // Leather x4
        i = 0;
        while (i < 4) {
            let leather = item::mint_material(
                string::utf8(b"Leather"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(leather, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        // Thread x2
        i = 0;
        while (i < 2) {
            let thread = item::mint_material(
                string::utf8(b"Thread"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(thread, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        // Herb x4 (for potions)
        i = 0;
        while (i < 4) {
            let herb = item::mint_material(
                string::utf8(b"Herb"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(herb, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        // Water x2 (for potions)
        i = 0;
        while (i < 2) {
            let water = item::mint_material(
                string::utf8(b"Water"),
                item::rarity_common(),
                ctx
            );
            transfer::public_transfer(water, sender);
            item_count = item_count + 1;
            i = i + 1;
        };

        event::emit(StarterPackMinted {
            recipient: sender,
            item_count,
        });
    }

    /// Mint individual items for testing
    public entry fun mint_item(
        name: String,
        item_type: u8,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        let item = item::create(name, item_type, power, rarity, ctx);
        transfer::public_transfer(item, ctx.sender());
    }

    /// Mint weapon and transfer to sender
    public entry fun mint_weapon(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        let weapon = item::mint_weapon(name, power, rarity, ctx);
        transfer::public_transfer(weapon, ctx.sender());
    }

    /// Mint armor and transfer to sender
    public entry fun mint_armor(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        let armor = item::mint_armor(name, power, rarity, ctx);
        transfer::public_transfer(armor, ctx.sender());
    }

    /// Mint accessory and transfer to sender
    public entry fun mint_accessory(
        name: String,
        power: u64,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        let accessory = item::mint_accessory(name, power, rarity, ctx);
        transfer::public_transfer(accessory, ctx.sender());
    }

    /// Mint material and transfer to sender
    public entry fun mint_material(
        name: String,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        let material = item::mint_material(name, rarity, ctx);
        transfer::public_transfer(material, ctx.sender());
    }

    /// Mint multiple materials of the same type
    public entry fun mint_materials(
        name: String,
        rarity: u8,
        count: u64,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let mut i = 0;
        while (i < count) {
            let material = item::mint_material(name, rarity, ctx);
            transfer::public_transfer(material, sender);
            i = i + 1;
        };
    }

    // ============ Transfer Functions ============

    /// Transfer an item to another address (simple trading)
    public entry fun transfer_item(
        item: Item,
        recipient: address,
    ) {
        transfer::public_transfer(item, recipient);
    }
}
