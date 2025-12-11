/// Crafting module - recipe-based item creation system
/// Demonstrates: Table for recipe storage, dynamic fields for material consumption
module game_demo::crafting {
    use std::string::String;
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use sui::event;
    use game_demo::item::{Self, Item};
    use game_demo::character::{Self, Character};

    // ============ Constants ============

    const ERecipeNotFound: u64 = 0;
    const EInsufficientMaterials: u64 = 1;
    const EMaterialNotFound: u64 = 2;
    const ERegistryAlreadyExists: u64 = 3;

    // ============ Structs ============

    /// Crafting recipe definition
    public struct CraftingRecipe has store, copy, drop {
        result_name: String,
        result_type: u8,
        result_power: u64,
        result_rarity: u8,
        // Material requirements (name -> count)
        material1_name: String,
        material1_count: u64,
        material2_name: String,
        material2_count: u64,
    }

    /// Game registry - stores recipes and game stats (shared object)
    public struct GameRegistry has key {
        id: UID,
        recipes: Table<String, CraftingRecipe>,
        total_characters: u64,
        total_items_crafted: u64,
    }

    /// Admin capability for managing recipes
    public struct AdminCap has key, store {
        id: UID,
    }

    // ============ Events ============

    public struct ItemCrafted has copy, drop {
        character_id: ID,
        recipe_name: String,
        item_id: ID,
    }

    public struct RecipeAdded has copy, drop {
        recipe_name: String,
        result_name: String,
    }

    // ============ Init ============

    /// Initialize the game registry with default recipes
    fun init(ctx: &mut TxContext) {
        let mut registry = GameRegistry {
            id: object::new(ctx),
            recipes: table::new(ctx),
            total_characters: 0,
            total_items_crafted: 0,
        };

        // Add default recipes
        add_default_recipes(&mut registry);

        // Share the registry
        transfer::share_object(registry);

        // Transfer admin cap to deployer
        transfer::transfer(AdminCap {
            id: object::new(ctx),
        }, ctx.sender());
    }

    /// Add default crafting recipes
    fun add_default_recipes(registry: &mut GameRegistry) {
        // Iron Sword: 3 Iron Ore + 1 Wood
        table::add(&mut registry.recipes, std::string::utf8(b"Iron Sword"), CraftingRecipe {
            result_name: std::string::utf8(b"Iron Sword"),
            result_type: item::type_weapon(),
            result_power: 25,
            result_rarity: item::rarity_common(),
            material1_name: std::string::utf8(b"Iron Ore"),
            material1_count: 3,
            material2_name: std::string::utf8(b"Wood"),
            material2_count: 1,
        });

        // Steel Sword: 5 Iron Ore + 2 Coal
        table::add(&mut registry.recipes, std::string::utf8(b"Steel Sword"), CraftingRecipe {
            result_name: std::string::utf8(b"Steel Sword"),
            result_type: item::type_weapon(),
            result_power: 50,
            result_rarity: item::rarity_uncommon(),
            material1_name: std::string::utf8(b"Iron Ore"),
            material1_count: 5,
            material2_name: std::string::utf8(b"Coal"),
            material2_count: 2,
        });

        // Leather Armor: 4 Leather + 2 Thread
        table::add(&mut registry.recipes, std::string::utf8(b"Leather Armor"), CraftingRecipe {
            result_name: std::string::utf8(b"Leather Armor"),
            result_type: item::type_armor(),
            result_power: 20,
            result_rarity: item::rarity_common(),
            material1_name: std::string::utf8(b"Leather"),
            material1_count: 4,
            material2_name: std::string::utf8(b"Thread"),
            material2_count: 2,
        });

        // Iron Armor: 6 Iron Ore + 3 Leather
        table::add(&mut registry.recipes, std::string::utf8(b"Iron Armor"), CraftingRecipe {
            result_name: std::string::utf8(b"Iron Armor"),
            result_type: item::type_armor(),
            result_power: 40,
            result_rarity: item::rarity_uncommon(),
            material1_name: std::string::utf8(b"Iron Ore"),
            material1_count: 6,
            material2_name: std::string::utf8(b"Leather"),
            material2_count: 3,
        });

        // Lucky Ring: 2 Gold + 1 Gem
        table::add(&mut registry.recipes, std::string::utf8(b"Lucky Ring"), CraftingRecipe {
            result_name: std::string::utf8(b"Lucky Ring"),
            result_type: item::type_accessory(),
            result_power: 15,
            result_rarity: item::rarity_rare(),
            material1_name: std::string::utf8(b"Gold"),
            material1_count: 2,
            material2_name: std::string::utf8(b"Gem"),
            material2_count: 1,
        });

        // Health Potion: 2 Herb + 1 Water
        table::add(&mut registry.recipes, std::string::utf8(b"Health Potion"), CraftingRecipe {
            result_name: std::string::utf8(b"Health Potion"),
            result_type: item::type_consumable(),
            result_power: 50,
            result_rarity: item::rarity_common(),
            material1_name: std::string::utf8(b"Herb"),
            material1_count: 2,
            material2_name: std::string::utf8(b"Water"),
            material2_count: 1,
        });
    }

    // ============ Entry Functions ============

    /// Craft an item using materials from character's inventory
    /// Materials are consumed (destroyed) during crafting
    public entry fun craft(
        registry: &mut GameRegistry,
        character: &mut Character,
        recipe_name: String,
        material1_ids: vector<ID>,
        material2_ids: vector<ID>,
        ctx: &mut TxContext
    ) {
        // Get recipe
        assert!(table::contains(&registry.recipes, recipe_name), ERecipeNotFound);
        let recipe = *table::borrow(&registry.recipes, recipe_name);

        // Verify material counts
        assert!(
            vector::length(&material1_ids) >= recipe.material1_count,
            EInsufficientMaterials
        );
        assert!(
            vector::length(&material2_ids) >= recipe.material2_count,
            EInsufficientMaterials
        );

        // Consume material1
        let mut i = 0;
        while (i < recipe.material1_count) {
            let item_id = *vector::borrow(&material1_ids, i);
            assert!(character::has_item(character, item_id), EMaterialNotFound);

            // Remove from inventory and destroy
            let item = character::remove_from_inventory(character, item_id);
            // Verify it's the right material type
            assert!(item::name(&item) == recipe.material1_name, EMaterialNotFound);
            item::destroy(item);

            i = i + 1;
        };

        // Consume material2
        i = 0;
        while (i < recipe.material2_count) {
            let item_id = *vector::borrow(&material2_ids, i);
            assert!(character::has_item(character, item_id), EMaterialNotFound);

            let item = character::remove_from_inventory(character, item_id);
            assert!(item::name(&item) == recipe.material2_name, EMaterialNotFound);
            item::destroy(item);

            i = i + 1;
        };

        // Create the crafted item
        let crafted_item = item::create(
            recipe.result_name,
            recipe.result_type,
            recipe.result_power,
            recipe.result_rarity,
            ctx
        );

        let item_id = item::id(&crafted_item);

        event::emit(ItemCrafted {
            character_id: character::id(character),
            recipe_name,
            item_id,
        });

        // Update stats
        registry.total_items_crafted = registry.total_items_crafted + 1;

        // Add crafted item to inventory
        character::add_to_inventory(character, crafted_item);
    }

    /// Admin: Add a new recipe
    public entry fun add_recipe(
        _admin: &AdminCap,
        registry: &mut GameRegistry,
        recipe_name: String,
        result_name: String,
        result_type: u8,
        result_power: u64,
        result_rarity: u8,
        material1_name: String,
        material1_count: u64,
        material2_name: String,
        material2_count: u64,
    ) {
        let recipe = CraftingRecipe {
            result_name,
            result_type,
            result_power,
            result_rarity,
            material1_name,
            material1_count,
            material2_name,
            material2_count,
        };

        table::add(&mut registry.recipes, recipe_name, recipe);

        event::emit(RecipeAdded {
            recipe_name,
            result_name,
        });
    }

    // ============ View Functions ============

    /// Get recipe details
    public fun get_recipe(registry: &GameRegistry, name: String): &CraftingRecipe {
        table::borrow(&registry.recipes, name)
    }

    /// Check if recipe exists
    public fun has_recipe(registry: &GameRegistry, name: String): bool {
        table::contains(&registry.recipes, name)
    }

    public fun total_items_crafted(registry: &GameRegistry): u64 {
        registry.total_items_crafted
    }

    // Recipe accessors
    public fun recipe_result_name(recipe: &CraftingRecipe): String { recipe.result_name }
    public fun recipe_result_type(recipe: &CraftingRecipe): u8 { recipe.result_type }
    public fun recipe_result_power(recipe: &CraftingRecipe): u64 { recipe.result_power }
    public fun recipe_result_rarity(recipe: &CraftingRecipe): u8 { recipe.result_rarity }
    public fun recipe_material1_name(recipe: &CraftingRecipe): String { recipe.material1_name }
    public fun recipe_material1_count(recipe: &CraftingRecipe): u64 { recipe.material1_count }
    public fun recipe_material2_name(recipe: &CraftingRecipe): String { recipe.material2_name }
    public fun recipe_material2_count(recipe: &CraftingRecipe): u64 { recipe.material2_count }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }
}
