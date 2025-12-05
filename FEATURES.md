# Sui CLI Web - Features Inventory

> Complete feature list with implementation status
> Last updated: 2025-12-05

## Overview

| Category | Status |
|----------|--------|
| Address Management | ✅ Complete |
| Transfer System | ✅ Complete |
| Gas Management | ✅ Complete |
| Environment/Network | ✅ Complete |
| Faucet Integration | ✅ Complete |
| Community & Tiers | ✅ Complete |
| Move Development | ✅ Complete |
| Transaction Tools | ✅ Complete |

**Overall**: ~75% of planned features | **API Reference**: See [API_REFERENCE.md](API_REFERENCE.md)

---

## Implemented Features

### 1. Address Management
**Component**: [AddressList](packages/client/src/components/AddressList/)

- Create, switch, view addresses
- Balance display (SUI + USD)
- Local metadata (labels, notes)
- Export/import metadata JSON
- Tier badges integration
- Smart polling (15s/60s)

### 2. Transfer System
**Component**: [TransferSui](packages/client/src/components/TransferSui/)

- Transfer SUI tokens with validation
- Amount input with "Max" button
- Gas estimation (dry-run)
- Transfer objects/NFTs
- Ownership verification
- Explorer links

### 3. Gas Management
**Component**: [GasList](packages/client/src/components/GasList/)

- View all gas coins
- Split coins (visual selection)
- Merge coins (multi-select)

### 4. Environment/Network
**Component**: [EnvironmentList](packages/client/src/components/EnvironmentList/)

- Switch networks (mainnet, testnet, devnet, localnet)
- Add custom RPC endpoints
- Delete custom networks

### 5. Faucet Integration
**Component**: [FaucetForm](packages/client/src/components/FaucetForm/)

- Official Sui faucet
- 7 external faucet links (FM, Blockbolt, n1stake, SuiLearn, Stakely, Discord, Web)
- Network auto-detection

### 6. Community & Tier System
**Components**: [MembershipJoin](packages/client/src/components/MembershipJoin/), [MembershipProfile](packages/client/src/components/MembershipProfile/)

- Join on-chain community registry
- 4-tier progression: Droplet → Wave → Tsunami → Ocean
- Activity tracking (tx count, contracts)
- Progress bars for next tier

### 7. Move Development
**Component**: [MoveDeploy](packages/client/src/components/MoveDeploy/)

- Build, test, create Move packages
- Publish & upgrade on-chain
- Gas budget configuration
- Build/test output display

### 8. Transaction Inspector
**Component**: [TransactionBuilder](packages/client/src/components/TransactionBuilder/)

- Inspect transaction bytecode
- View execution results & events
- Replay on-chain transactions

---

## TODO Features

### HIGH Priority
1. **Demo Videos & GIFs** - Marketing & onboarding
2. **OS Installation Guides** - Detailed Mac/Linux/Windows guides
3. **Community Quick Actions** - Progress tracker for ineligible users

### MEDIUM Priority
4. **NFT Gallery View** - Grid view with images
5. **Tier Benefits Video** - Showcase each tier
6. **Transaction History** - List, filter, pagination

### LOW Priority
7. **Leaderboard** - Global ranking by tier/activity
8. **Public Member Profiles** - View other members
9. **DeFi Integration** - Swap, staking interfaces

---

## File Structure

```
packages/
├── client/src/components/
│   ├── AddressList/          ✅
│   ├── TransferSui/          ✅
│   ├── GasList/              ✅
│   ├── EnvironmentList/      ✅
│   ├── FaucetForm/           ✅
│   ├── MembershipJoin/       ✅
│   ├── MembershipProfile/    ✅
│   ├── MoveDeploy/           ✅
│   ├── TransactionBuilder/   ✅
│   └── CommandPalette/       ✅
│
└── server/src/
    ├── routes/               # See API_REFERENCE.md
    └── services/
        ├── AddressService.ts
        ├── TransferService.ts
        ├── TierService.ts
        ├── CommunityService.ts
        └── dev/ (Move, Package, Inspector)
```

---

## Quick Links

- **Live**: https://www.harriweb3.dev
- **NPM**: `sui-cli-web-server`
- **Contract**: `0xffb8...` (testnet)
- **API Docs**: [API_REFERENCE.md](API_REFERENCE.md)
- **User Guide**: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
