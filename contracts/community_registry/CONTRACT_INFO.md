# Community Registry Contract - Deployment Information

## Contract Details

### Package Information
- **Package ID:** `0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2`
- **Network:** Testnet
- **Module:** `community_registry::registry`

### Shared Objects
- **CommunityRegistry ID:** `0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b`
  - Type: Shared object (anyone can read, only contract can modify)
  - Contains: Member registry, total member count, pause flag

### Admin Capabilities

#### UpgradeCap (Package Upgrade Authority)
- **Object ID:** `0xbd8a966a583849490166f5da62f92909f4f21c1d04aeed5dee2e0688a429d0dd`
- **Type:** `0x2::package::UpgradeCap`
- **Owner:** `0x010030a0afc40b6d8fe99cee368cab5652baa0d36b7be60a9b017d5228c0bdfd` (deployer address)
- **Current Version:** 1
- **Policy:** 0 (compatible upgrades only)

⚠️ **IMPORTANT:** Keep this UpgradeCap safe! You need it to upgrade the contract.

#### AdminCap (Contract Administration)
- Created at deployment but not tracked here
- Owner: Same deployer address
- Functions: `pause()`, `unpause()` registry

### Deployment Transaction
- **Transaction Digest:** `5VzTox1hRX4feF9gzWoUUPcMLY5YWmMauYqiu6UrKap5`
- **Deployer Address:** `0x010030a0afc40b6d8fe99cee368cab5652baa0d36b7be60a9b017d5228c0bdfd`

## Contract Capabilities

### Public Entry Functions
1. **`join_community`** - Users voluntarily join the community
   - Cost: ~0.001 SUI (gas only)
   - Creates on-chain membership record
   - Emits `MemberJoined` event

### Admin Functions (Require AdminCap)
1. **`pause`** - Emergency stop for new registrations
2. **`unpause`** - Resume registrations

### View Functions (Anyone can call)
1. **`is_member(address)`** - Check if address is a member
2. **`get_total_members()`** - Get total member count
3. **`is_paused()`** - Check if registry is paused
4. **`get_member_info(address)`** - Get member join timestamp

## Privacy & Data Storage

**What we store:**
- ✅ Address (already public on blockchain)
- ✅ Joined timestamp

**What we DO NOT store:**
- ❌ User actions/activities
- ❌ Balances or assets
- ❌ Transaction history
- ❌ Any personal metadata

## How to Use

### Check Membership Status
```bash
sui client call \
  --package 0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2 \
  --module registry \
  --function is_member \
  --args 0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b <ADDRESS>
```

### Join Community
```bash
sui client call \
  --package 0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2 \
  --module registry \
  --function join_community \
  --args 0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b 0x6 \
  --gas-budget 10000000
```

### Get Total Members
```bash
sui client call \
  --package 0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2 \
  --module registry \
  --function get_total_members \
  --args 0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b
```

## Upgrade Instructions

To upgrade the contract, you need:
1. The UpgradeCap object ID (see above)
2. Access to the deployer address
3. New compiled package

```bash
# Build the updated contract
cd contracts/community_registry
sui move build

# Create upgrade transaction
sui client upgrade \
  --upgrade-capability 0xbd8a966a583849490166f5da62f92909f4f21c1d04aeed5dee2e0688a429d0dd \
  --gas-budget 100000000

# Note: You must be signed in as the deployer address (0x010030...)
```

## Important Notes

### UpgradeCap Location
- **Current Owner:** `0x010030a0afc40b6d8fe99cee368cab5652baa0d36b7be60a9b017d5228c0bdfd`
- **How to Transfer:** Use `sui client transfer` if you need to move it
- **Security:** Never share this object ID publicly or transfer to untrusted addresses

### Backup Recommendations
1. Export deployer address private key and store securely
2. Document the UpgradeCap object ID in multiple secure locations
3. Consider using a multi-sig wallet for production deployments

### Testnet vs Mainnet
This deployment is on **Testnet**. For mainnet:
- Re-deploy using `--network mainnet`
- Update all references in codebase
- Update `.env` and config files
- Test thoroughly before announcing

## Explorer Links

- **Package:** https://testnet.suivision.xyz/package/0xffb8f17c91212d170cb0fee4128b8b44277bfd19af040590cfae08c1abd2bbd2
- **Registry Object:** https://testnet.suivision.xyz/object/0x7bf988f34c98d5b69d60264083c581d90fa97c51e902846bed491c0f6bf9b80b
- **UpgradeCap:** https://testnet.suivision.xyz/object/0xbd8a966a583849490166f5da62f92909f4f21c1d04aeed5dee2e0688a429d0dd
- **Deploy Transaction:** https://testnet.suivision.xyz/txblock/5VzTox1hRX4feF9gzWoUUPcMLY5YWmMauYqiu6UrKap5

## Questions?

If you need to:
- Upgrade the contract → You need access to deployer address
- Transfer UpgradeCap → Use `sui client transfer <upgrade-cap-id> <new-owner-address>`
- Pause registry → Need AdminCap from deployer address
- Query members → Use view functions (anyone can call)
