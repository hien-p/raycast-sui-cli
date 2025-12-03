# Community Registry Deployment Guide

## Prerequisites

1. Sui CLI installed and configured
2. Active address with testnet/devnet tokens for gas

## Deployment Steps

### 1. Check Active Address

```bash
sui client active-address
```

**IMPORTANT:** Note this address! It will be the contract owner and receive the UpgradeCap.

### 2. Deploy Contract

```bash
cd contracts/community_registry
sui client publish --gas-budget 100000000
```

### 3. Save Deployment Info

After deployment, you'll see output like:

```
╭─────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                            │
│  ┌──                                                                        │
│  │ ObjectID: 0x...  <-- This is PACKAGE_ID                                 │
│  │ ObjectType: package                                                      │
│  └──                                                                        │
│  ┌──                                                                        │
│  │ ObjectID: 0x...  <-- This is REGISTRY_ID (CommunityRegistry)            │
│  │ ObjectType: 0x..::registry::CommunityRegistry                           │
│  └──                                                                        │
│  ┌──                                                                        │
│  │ ObjectID: 0x...  <-- This is UPGRADE_CAP (KEEP THIS SAFE!)              │
│  │ ObjectType: 0x2::package::UpgradeCap                                    │
│  └──                                                                        │
╰─────────────────────────────────────────────────────────────────────────────╯
```

**Update `deployment.json` with these values!**

### 4. Verify Deployment

```bash
sui client object <REGISTRY_ID>
```

## Upgrading Contract

To upgrade, you need the UpgradeCap:

```bash
sui client upgrade --upgrade-capability <UPGRADE_CAP_ID> --gas-budget 100000000
```

**WARNING:** If you lose the UpgradeCap, you cannot upgrade the contract!

## Environment Variables

Set these in your server environment:

```bash
export COMMUNITY_PACKAGE_ID="0x..."
export COMMUNITY_REGISTRY_ID="0x..."
```

Or update `deployment.json` and the server will read from there.
