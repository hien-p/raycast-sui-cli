/// Character module - NFT with dynamic field inventory
/// Demonstrates: Dynamic fields for inventory and equipment slots
module game_demo::character {
    use std::string::String;
    use sui::dynamic_field as df;
    use sui::event;
    use game_demo::item::{Self, Item};

    // ============ Constants ============

    // Equipment slot names (used as dynamic field keys)
    const SLOT_WEAPON: vector<u8> = b"weapon";
    const SLOT_ARMOR: vector<u8> = b"armor";
    const SLOT_ACCESSORY: vector<u8> = b"accessory";

    // Error codes
    const ENotOwner: u64 = 0;
    const ESlotOccupied: u64 = 1;
    const ESlotEmpty: u64 = 2;
    const EItemNotInInventory: u64 = 3;
    const EInvalidSlot: u64 = 4;
    const EWrongItemType: u64 = 5;
    const EItemAlreadyInInventory: u64 = 6;

    // ============ Structs ============

    /// Character NFT - inventory stored as dynamic fields
    /// Equipment slots: "weapon", "armor", "accessory" (string keys)
    /// Inventory items: item_id (ID keys)
    public struct Character has key {
        id: UID,
        name: String,
        level: u64,
        experience: u64,
        // Stats computed from equipment
        attack: u64,
        defense: u64,
        // Dynamic fields store:
        // - Equipment: df::add(&mut id, b"weapon", item)
        // - Inventory: df::add(&mut id, item_id, item)
    }

    // ============ Events ============

    public struct CharacterCreated has copy, drop {
        character_id: ID,
        name: String,
        owner: address,
    }

    public struct ItemEquipped has copy, drop {
        character_id: ID,
        slot: String,
        item_id: ID,
    }

    public struct ItemUnequipped has copy, drop {
        character_id: ID,
        slot: String,
        item_id: ID,
    }

    public struct ItemAddedToInventory has copy, drop {
        character_id: ID,
        item_id: ID,
    }

    public struct ItemRemovedFromInventory has copy, drop {
        character_id: ID,
        item_id: ID,
    }

    // ============ Entry Functions ============

    /// Create a new character
    public entry fun create_character(
        name: String,
        ctx: &mut TxContext
    ) {
        let character = Character {
            id: object::new(ctx),
            name,
            level: 1,
            experience: 0,
            attack: 10,  // Base attack
            defense: 5,  // Base defense
        };

        event::emit(CharacterCreated {
            character_id: object::uid_to_inner(&character.id),
            name: character.name,
            owner: ctx.sender(),
        });

        transfer::transfer(character, ctx.sender());
    }

    /// Add an item to character's inventory
    /// Uses item ID as the dynamic field key
    public entry fun add_to_inventory(
        character: &mut Character,
        item: Item,
    ) {
        let item_id = item::id(&item);

        // Check item not already in inventory
        assert!(!df::exists_(&character.id, item_id), EItemAlreadyInInventory);

        // Add item as dynamic field with ID as key
        df::add(&mut character.id, item_id, item);

        event::emit(ItemAddedToInventory {
            character_id: object::uid_to_inner(&character.id),
            item_id,
        });
    }

    /// Remove an item from inventory and return it
    public fun remove_from_inventory(
        character: &mut Character,
        item_id: ID,
    ): Item {
        // Check item exists in inventory
        assert!(df::exists_(&character.id, item_id), EItemNotInInventory);

        // Remove and return the item
        let item: Item = df::remove(&mut character.id, item_id);

        event::emit(ItemRemovedFromInventory {
            character_id: object::uid_to_inner(&character.id),
            item_id,
        });

        item
    }

    /// Remove item from inventory and transfer to owner (entry version)
    public entry fun take_from_inventory(
        character: &mut Character,
        item_id: ID,
        ctx: &mut TxContext
    ) {
        let item = remove_from_inventory(character, item_id);
        transfer::public_transfer(item, ctx.sender());
    }

    /// Equip an item to a slot (weapon/armor/accessory)
    /// Item must match the slot type
    public entry fun equip(
        character: &mut Character,
        slot: vector<u8>,
        item: Item,
    ) {
        // Validate slot name
        assert!(
            slot == SLOT_WEAPON || slot == SLOT_ARMOR || slot == SLOT_ACCESSORY,
            EInvalidSlot
        );

        // Validate item type matches slot
        if (slot == SLOT_WEAPON) {
            assert!(item::is_weapon(&item), EWrongItemType);
        } else if (slot == SLOT_ARMOR) {
            assert!(item::is_armor(&item), EWrongItemType);
        } else if (slot == SLOT_ACCESSORY) {
            assert!(item::is_accessory(&item), EWrongItemType);
        };

        // Check slot is empty
        assert!(!df::exists_(&character.id, slot), ESlotOccupied);

        let item_id = item::id(&item);
        let power = item::power(&item);

        // Update stats based on item type
        if (slot == SLOT_WEAPON) {
            character.attack = character.attack + power;
        } else if (slot == SLOT_ARMOR) {
            character.defense = character.defense + power;
        };
        // Accessory could add various bonuses

        // Add item to equipment slot
        df::add(&mut character.id, slot, item);

        event::emit(ItemEquipped {
            character_id: object::uid_to_inner(&character.id),
            slot: std::string::utf8(slot),
            item_id,
        });
    }

    /// Unequip an item from a slot and return it
    public fun unequip(
        character: &mut Character,
        slot: vector<u8>,
    ): Item {
        // Validate slot name
        assert!(
            slot == SLOT_WEAPON || slot == SLOT_ARMOR || slot == SLOT_ACCESSORY,
            EInvalidSlot
        );

        // Check slot has an item
        assert!(df::exists_(&character.id, slot), ESlotEmpty);

        // Remove item from slot
        let item: Item = df::remove(&mut character.id, slot);
        let item_id = item::id(&item);
        let power = item::power(&item);

        // Update stats
        if (slot == SLOT_WEAPON) {
            character.attack = character.attack - power;
        } else if (slot == SLOT_ARMOR) {
            character.defense = character.defense - power;
        };

        event::emit(ItemUnequipped {
            character_id: object::uid_to_inner(&character.id),
            slot: std::string::utf8(slot),
            item_id,
        });

        item
    }

    /// Unequip and transfer to owner (entry version)
    public entry fun unequip_to_inventory(
        character: &mut Character,
        slot: vector<u8>,
    ) {
        let item = unequip(character, slot);
        let item_id = item::id(&item);

        // Add to inventory instead of transferring
        df::add(&mut character.id, item_id, item);

        event::emit(ItemAddedToInventory {
            character_id: object::uid_to_inner(&character.id),
            item_id,
        });
    }

    /// Swap equipment - unequip current and equip new
    public entry fun swap_equipment(
        character: &mut Character,
        slot: vector<u8>,
        new_item: Item,
        ctx: &mut TxContext
    ) {
        // Unequip current item if slot is occupied
        if (df::exists_(&character.id, slot)) {
            let old_item = unequip(character, slot);
            transfer::public_transfer(old_item, ctx.sender());
        };

        // Equip new item
        equip(character, slot, new_item);
    }

    /// Equip directly from inventory
    public entry fun equip_from_inventory(
        character: &mut Character,
        slot: vector<u8>,
        item_id: ID,
    ) {
        // Remove from inventory
        let item = remove_from_inventory(character, item_id);

        // Equip to slot
        equip(character, slot, item);
    }

    /// Add experience and potentially level up
    public entry fun gain_experience(
        character: &mut Character,
        amount: u64,
    ) {
        character.experience = character.experience + amount;

        // Simple leveling: 100 XP per level
        let new_level = (character.experience / 100) + 1;
        if (new_level > character.level) {
            character.level = new_level;
            // Gain stats on level up
            character.attack = character.attack + 2;
            character.defense = character.defense + 1;
        };
    }

    // ============ View Functions ============

    public fun id(character: &Character): ID {
        object::uid_to_inner(&character.id)
    }

    public fun name(character: &Character): String {
        character.name
    }

    public fun level(character: &Character): u64 {
        character.level
    }

    public fun experience(character: &Character): u64 {
        character.experience
    }

    public fun attack(character: &Character): u64 {
        character.attack
    }

    public fun defense(character: &Character): u64 {
        character.defense
    }

    /// Check if a slot has equipment
    public fun has_equipment(character: &Character, slot: vector<u8>): bool {
        df::exists_(&character.id, slot)
    }

    /// Check if an item is in inventory
    public fun has_item(character: &Character, item_id: ID): bool {
        df::exists_(&character.id, item_id)
    }

    /// Borrow equipped item (read-only)
    public fun borrow_equipment(character: &Character, slot: vector<u8>): &Item {
        df::borrow(&character.id, slot)
    }

    /// Borrow inventory item (read-only)
    public fun borrow_item(character: &Character, item_id: ID): &Item {
        df::borrow(&character.id, item_id)
    }

    // ============ Slot Constants ============

    public fun slot_weapon(): vector<u8> { SLOT_WEAPON }
    public fun slot_armor(): vector<u8> { SLOT_ARMOR }
    public fun slot_accessory(): vector<u8> { SLOT_ACCESSORY }
}
