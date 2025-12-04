/// Community Registry for Sui CLI Web
///
/// A privacy-first, opt-in community membership system.
/// Users voluntarily join to be counted as community members.
///
/// What we store:
/// - address: The wallet address (already public on-chain)
/// - joined_at: Timestamp when user joined
///
/// What we do NOT store:
/// - User actions/activities
/// - Balances or assets
/// - Transaction history
/// - Any personal metadata
module community_registry::registry {
    use sui::event;
    use sui::table::{Self, Table};
    use std::option::{Self, Option};

    // ====== Error Codes ======
    const EAlreadyMember: u64 = 1;
    const ENotMember: u64 = 2;
    const EPaused: u64 = 3;

    // ====== Structs ======

    /// Admin capability for emergency controls
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Shared registry object - stores all community members
    public struct CommunityRegistry has key {
        id: UID,
        /// Total number of unique members
        total_members: u64,
        /// Mapping from address to member info
        members: Table<address, MemberInfo>,
        /// Emergency pause flag
        paused: bool,
    }

    /// Minimal member information - privacy first
    public struct MemberInfo has store, drop {
        /// Timestamp when user joined (in milliseconds)
        joined_at: u64,
    }

    // ====== Events ======

    /// Emitted when a new member joins
    /// Can be indexed to track community growth
    public struct MemberJoined has copy, drop {
        member: address,
        timestamp: u64,
        total_members: u64,
    }

    // ====== Init ======

    /// Initialize the shared registry object
    fun init(ctx: &mut TxContext) {
        let registry = CommunityRegistry {
            id: object::new(ctx),
            total_members: 0,
            members: table::new(ctx),
            paused: false,
        };
        transfer::share_object(registry);

        // Give admin cap to deployer
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, ctx.sender());
    }

    // ====== Public Entry Functions ======

    /// Join the community - user calls this voluntarily
    ///
    /// Requirements:
    /// - User must not already be a member
    /// - User pays gas (~0.001 SUI)
    ///
    /// Effects:
    /// - Adds user address to members table
    /// - Increments total_members counter
    /// - Emits MemberJoined event for indexers
    #[allow(lint(public_entry))]
    public entry fun join_community(
        registry: &mut CommunityRegistry,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let timestamp = clock.timestamp_ms();

        // Check if paused
        assert!(!registry.paused, EPaused);

        // Check if already a member
        assert!(!table::contains(&registry.members, sender), EAlreadyMember);

        // Add to members table
        table::add(&mut registry.members, sender, MemberInfo {
            joined_at: timestamp,
        });

        // Increment counter
        registry.total_members = registry.total_members + 1;

        // Emit event for indexers
        event::emit(MemberJoined {
            member: sender,
            timestamp,
            total_members: registry.total_members,
        });
    }

    // ====== Admin Functions ======

    /// Pause the registry (emergency stop)
    public entry fun pause(_: &AdminCap, registry: &mut CommunityRegistry) {
        registry.paused = true;
    }

    /// Unpause the registry
    public entry fun unpause(_: &AdminCap, registry: &mut CommunityRegistry) {
        registry.paused = false;
    }

    // ====== View Functions ======

    /// Check if an address is a community member
    public fun is_member(registry: &CommunityRegistry, addr: address): bool {
        table::contains(&registry.members, addr)
    }

    /// Get total number of community members
    public fun get_total_members(registry: &CommunityRegistry): u64 {
        registry.total_members
    }

    /// Check if registry is paused
    public fun is_paused(registry: &CommunityRegistry): bool {
        registry.paused
    }

    /// Get member info (if exists)
    public fun get_member_info(registry: &CommunityRegistry, addr: address): Option<u64> {
        if (table::contains(&registry.members, addr)) {
            let info = table::borrow(&registry.members, addr);
            option::some(info.joined_at)
        } else {
            option::none()
        }
    }

    // ====== Test Only ======

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
