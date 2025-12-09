# Sui CLI Web - Features Inventory

> Complete feature list with implementation status
> Last updated: 2025-12-09

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
| Developer Tools | ✅ Complete |
| Security Tools | ✅ Complete |
| Dynamic Fields | ✅ Complete |
| Key Management | ✅ Complete |

**Overall**: ~95% of Sui CLI features | **API Reference**: See [API_REFERENCE.md](API_REFERENCE.md)

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
- **Chain Identifier Display** (`sui client chain-identifier`) - Shows chain ID with network detection

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

### 8. Transaction Inspector & PTB Builder
**Component**: [TransactionBuilder](packages/client/src/components/TransactionBuilder/)

- Inspect transaction bytecode
- View execution results & events
- Replay on-chain transactions
- **Execute Pre-Signed TX** (`sui client execute-signed-tx`) - For hardware wallet users
- **PTB Builder** (`sui client ptb`) - Build & execute Programmable Transaction Blocks
  - Commands: split-coins, merge-coins, transfer-objects, move-call, assign, make-move-vec
  - Dry-run & Preview modes

### 9. Developer Tools
**Component**: [DevTools](packages/client/src/components/DevTools/)

- **Test Coverage Analysis** (`sui move coverage`)
  - Summary, Source Code, Bytecode, LCOV modes
  - Auto-detect modules from package sources
  - Smart validation: module name required for source/bytecode modes
  - Prerequisite tip: run `sui move test --coverage` first
- **Module Disassembly** (`sui move disassemble`)
  - View bytecode from .mv files
  - Debug info and bytecode map options
- **Package Summary** (`sui move summary`)
  - Generate from local source or on-chain package ID
  - JSON/YAML output formats

### 10. Security Tools (NEW)
**Component**: [SecurityTools](packages/client/src/components/SecurityTools/)

- Source verification (`sui client verify-source`)
- Bytecode meter verification (`sui client verify-bytecode-meter`)
- Transaction decoding & signature verification (`sui keytool decode-or-verify-tx`)
- Meter usage visualization

### 11. Dynamic Fields Explorer (NEW)
**Component**: [DynamicFieldExplorer](packages/client/src/components/DynamicFieldExplorer/)

- Query dynamic fields on objects (`sui client dynamic-field`)
- Pagination support
- Expandable field details
- Copy-to-clipboard functionality

### 12. Key Management (NEW)
**Component**: [KeytoolManager](packages/client/src/components/KeytoolManager/)

- List keys in keystore (`sui keytool list`)
- Generate keypairs (`sui keytool generate`)
- Sign messages (`sui keytool sign`)
- Create multi-sig addresses (`sui keytool multi-sig-address`)
- Decode transactions (`sui keytool decode-or-verify-tx`)
- Secure mnemonic handling (shown once, requires acknowledgment)

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
│   ├── DevTools/             ✅ NEW
│   ├── SecurityTools/        ✅ NEW
│   ├── DynamicFieldExplorer/ ✅ NEW
│   ├── KeytoolManager/       ✅ NEW
│   └── CommandPalette/       ✅
│
└── server/src/
    ├── routes/
    │   ├── devtools.ts       # Coverage, disassembly, summary
    │   ├── security.ts       # Verify source/bytecode, decode TX
    │   ├── dynamic-fields.ts # Dynamic field queries
    │   └── keytool.ts        # Key generation, signing, multi-sig
    └── services/
        ├── AddressService.ts
        ├── TransferService.ts
        ├── TierService.ts
        ├── CommunityService.ts
        ├── KeytoolService.ts        # NEW
        └── dev/
            ├── MoveService.ts
            ├── PackageService.ts
            ├── InspectorService.ts
            ├── DevToolsService.ts   # NEW
            └── SecurityService.ts   # NEW
```

---

## Quick Links

- **Live**: https://www.harriweb3.dev
- **NPM**: `sui-cli-web-server`
- **Contract**: `0xffb8...` (testnet)
- **API Docs**: [API_REFERENCE.md](API_REFERENCE.md)
- **User Guide**: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
