# Sui CLI Web - User Guide

Complete guide to using all features of Sui CLI Web.

## Table of Contents

1. [Command Palette](#command-palette)
2. [Address Management](#address-management)
3. [Balance & Objects](#balance--objects)
4. [Transfer SUI](#transfer-sui)
5. [Gas Management](#gas-management)
6. [Environment Switching](#environment-switching)
7. [Faucet Usage](#faucet-usage)
8. [Community Features](#community-features)
9. [Move Development](#move-development)
10. [Transaction Inspector](#transaction-inspector)

---

## Command Palette

The command palette is your central navigation hub, inspired by Raycast's design.

### Opening the Command Palette

- **Keyboard:** Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Click:** Click the search icon in the header

### Using the Command Palette

1. **Type to search** - Filter commands by name or keyword
2. **Arrow keys** - Navigate up/down through results
3. **Enter** - Execute selected command
4. **Escape** - Close the palette

### Command Categories

- **Status** - View active network and address
- **Membership** - Join community, view tier
- **Addresses** - Manage your Sui addresses
- **Environment** - Switch networks
- **Objects & Assets** - Browse owned objects
- **Gas** - Manage gas coins
- **Faucet** - Request test tokens
- **Transfer** - Send SUI and objects
- **Development** - Build and deploy Move contracts
- **Keys & Security** - Manage keypairs

---

## Address Management

Manage multiple Sui addresses from a single interface.

### Create New Address

1. Open command palette → **Manage Addresses**
2. Click **Create New Address**
3. Select key scheme:
   - **Ed25519** - Standard, recommended for most users
   - **Secp256k1** - Compatible with Ethereum wallets
   - **Secp256r1** - For hardware wallets
4. **Save your recovery phrase immediately**
5. Set an alias (e.g., "Main Wallet", "Trading")
6. Click **Create**

**Important:** Your recovery phrase is the only way to restore your wallet. Store it securely in a password manager.

### Switch Active Address

1. Navigate to **Manage Addresses**
2. Click on the address you want to activate
3. Or use the **Switch** button next to each address

**Keyboard shortcut:** Select address and press `Enter`

### View Address Details

Each address card displays:
- **Alias** - Your custom name
- **Address** - Full Sui address (0x...)
- **Balance** - Total SUI balance
- **USD Value** - Approximate value in USD
- **Tier Badge** - Community tier (if member)

### Add Notes & Labels

Keep track of your addresses:

1. Navigate to **Manage Addresses**
2. Click the **Edit** icon on any address
3. Add labels (e.g., "Personal", "Business", "Trading")
4. Add notes (e.g., "Used for NFT minting")
5. Click **Save**

### Export/Import Metadata

**Export:**
1. Navigate to **Manage Addresses**
2. Click **Export Metadata**
3. Save the JSON file to a secure location

**Import:**
1. Navigate to **Manage Addresses**
2. Click **Import Metadata**
3. Select your JSON file
4. Your aliases, labels, and notes will be restored

**Note:** This only exports metadata (labels, notes), not private keys.

---

## Balance & Objects

### View Balance

Your balance is displayed in multiple locations:
- **Command Palette** - Active address balance
- **Address List** - All address balances
- **Transfer Page** - Available balance for transfers

**Balance includes:**
- Total SUI across all coins
- USD equivalent value
- Real-time updates (15s when active, 60s when tab is hidden)

### View Owned Objects

1. Navigate to **View Objects**
2. Browse all objects owned by your active address

**Object types:**
- **Coins** - SUI and other token objects
- **NFTs** - Digital collectibles
- **Packages** - Published Move packages
- **Others** - Custom objects

**Object details:**
- Object ID
- Type
- Version
- Digest
- Owner address

### Search & Filter Objects

- **Search** - Find objects by ID or type
- **Filter by type** - Show only specific object types
- **Sort** - By creation date, type, or value

---

## Transfer SUI

Send SUI tokens to any address with built-in safety features.

### Transfer Modes

#### External Transfer
Send SUI to any Sui address outside your wallet.

#### Internal Transfer
Move SUI between your own addresses (no network fee for internal transfers within the same wallet).

#### Batch Transfer
Send SUI to multiple recipients in a single transaction.

### Making a Transfer

1. Navigate to **Transfer SUI** from command palette
2. Select transfer mode
3. **Fill in details:**
   - **To Address** - Recipient's Sui address (0x...)
   - **Amount** - SUI amount to send
   - **Select Coin** - Choose which gas coin to use
4. Click **Preview Transfer**
5. Review the transaction preview:
   - Amount to send
   - Estimated gas fee
   - Total cost (amount + gas)
6. Click **Confirm & Send**
7. Wait for transaction confirmation

### Address Book

Save frequently used addresses for quick access.

**Save an Address:**
1. Enter the recipient address in the input field
2. Add an alias (e.g., "Alice", "Exchange")
3. Click **💾 Save Address**

**Use a Saved Address:**
- Click on any saved address to auto-fill the recipient field
- Hover and click the **X** button to remove

### Recent Transfers

Your 5 most recent transfers are automatically saved for quick re-use.

### Transaction Result

After a successful transfer, you'll see:
- **Balance Before/After** - Visual representation of your balance change
- **Transaction Digest** - Unique transaction ID
- **Copy Button** - Copy digest to clipboard
- **Explorer Link** - View transaction on SuiVision

**Tip:** Always verify the transaction on a block explorer for important transfers.

### Quick Amount Buttons

Use preset amounts for faster transfers:
- 0.1 SUI
- 0.5 SUI
- 1 SUI
- 5 SUI

---

## Gas Management

Optimize your gas coins for better transaction efficiency.

### Understanding Gas Coins

In Sui, each coin is a separate object. You can have multiple SUI coins in your wallet:
- Large coins for big transfers
- Small coins for transaction fees

### View Gas Coins

1. Navigate to **Manage Gas**
2. View all your SUI coin objects:
   - Coin Object ID
   - Balance (in SUI)
   - Status

### Split Gas Coins

Split a large coin into smaller denominations.

**Use cases:**
- Create multiple small coins for many transactions
- Separate funds for different purposes
- Prepare gas for contract interactions

**How to split:**
1. Navigate to **Manage Gas**
2. Click **Split Coin**
3. Select the source coin
4. Enter split amounts (e.g., 1, 0.5, 0.3)
5. Click **Split**

**Example:**
- Start with: 10 SUI coin
- Split into: 5 SUI, 3 SUI, 2 SUI
- Result: 3 separate coin objects

### Merge Gas Coins

Combine multiple small coins into one larger coin.

**Use cases:**
- Consolidate dust (very small amounts)
- Simplify wallet management
- Prepare for large transfers

**How to merge:**
1. Navigate to **Manage Gas**
2. Click **Merge Coins**
3. Select coins to merge (multi-select)
4. Click **Merge Selected**

**Example:**
- Start with: 0.1 SUI, 0.3 SUI, 0.6 SUI (3 coins)
- After merge: 1 SUI (1 coin)

**Gas Cost:** Minimal (~0.0001 SUI per operation)

---

## Environment Switching

Switch between different Sui networks seamlessly.

### Available Networks

#### Testnet
- **Purpose:** Testing and development
- **Tokens:** Free from faucets
- **Reset:** May be reset periodically
- **Use for:** Learning, testing dApps, practice

#### Mainnet
- **Purpose:** Production use
- **Tokens:** Real SUI with monetary value
- **Permanent:** Never resets
- **Use for:** Real transactions, live dApps

#### Devnet
- **Purpose:** Bleeding-edge features
- **Tokens:** Free from faucets
- **Stability:** May be unstable
- **Use for:** Testing latest Sui features

#### Localnet
- **Purpose:** Local development
- **Tokens:** Unlimited local tokens
- **Isolation:** Completely isolated
- **Use for:** Move contract development

### Switch Networks

1. Open command palette
2. Select **Switch Environment**
3. Click on desired network
4. Wait for confirmation

**Active network indicator:**
- Shown in command palette status section
- Highlighted with green dot

### Add Custom RPC Endpoint

For advanced users who want to use custom RPC endpoints:

1. Navigate to **Switch Environment**
2. Click **Add Custom Environment**
3. Fill in details:
   - **Alias** - Friendly name (e.g., "My RPC")
   - **RPC URL** - Full RPC endpoint URL
4. Click **Add**

### Remove Custom Environment

1. Navigate to **Switch Environment**
2. Find your custom environment
3. Click **Delete** button
4. Confirm deletion

**Note:** You cannot delete default environments (mainnet, testnet, devnet, localnet).

---

## Faucet Usage

Request free SUI tokens on testnet for development and testing.

### Official Sui Faucet

1. **Ensure you're on testnet** - Check active environment
2. Navigate to **Request Faucet**
3. Your active address is automatically filled
4. Click **Request Tokens**
5. Wait 10-30 seconds
6. Check your balance

**Rate limits:**
- 1 request per address every 60 minutes
- Up to 5 SUI per request

### External Faucets

If the official faucet is unavailable or you need more tokens, try these alternatives:

#### FM Faucet
High-capacity faucet with generous limits.
- Link provided in the Faucet page

#### Blockbolt Faucet
Fast and reliable alternative faucet.

#### n1stake Faucet
Community-run faucet with good uptime.

#### Stakely Faucet
Professional validator's public faucet.

#### Discord Faucet
Request tokens via the official Sui Discord server.
- Join #faucet channel
- Use the faucet command

#### Developer Portal Faucet
Official developer portal with integrated faucet.

### Faucet Troubleshooting

**"Rate limit exceeded":**
- Wait 60 minutes before requesting again
- Try an external faucet
- Use a different address

**"Faucet is empty":**
- Try a different external faucet
- Request small amounts
- Check back later

**"Request failed":**
- Verify you're on testnet (not mainnet)
- Check your internet connection
- Ensure the server is running

---

## Community Features

Join the Sui CLI Web community and earn tier badges based on your on-chain activity.

### What is Community Membership?

A gamified on-chain identity system that:
- Tracks your Sui blockchain activity
- Rewards active users with tier upgrades
- Provides an evolving NFT tier badge
- Unlocks perks as you level up

**Everything is on-chain:**
- Your membership is an NFT on Sui blockchain
- All activity metrics are pulled from public blockchain data
- Fully transparent and verifiable

### Joining the Community

**Requirements:**
- Minimum 10 SUI in your wallet
- Minimum 10 transactions on your address
- Connected to testnet or mainnet

**How to join:**
1. Open command palette → **Community**
2. Click **Join Community**
3. Review the eligibility check
4. Confirm transaction (~0.01 SUI gas fee)
5. Receive your **Droplet 💧** tier badge

**What happens:**
- Your address is registered in the on-chain community registry
- You receive a Tier NFT (starts at Droplet)
- Your activity starts being tracked

### Tier System

The community has 4 tiers based on on-chain activity:

#### Tier 0: Droplet 💧
- **Requirement:** Join the community
- **Everyone starts here**
- **Benefits:**
  - Full CLI access
  - Activity tracking
  - Community member status
  - Track your stats

#### Tier 1: Wave 🌊
- **Requirement:** 25+ transactions OR 3+ deployed contracts
- **Active user status**
- **Benefits:**
  - Animated tier badge
  - Priority support
  - NFT card showcase
  - Enhanced profile

#### Tier 2: Tsunami 🌀
- **Requirement:** 100+ transactions OR 10+ deployed contracts
- **Power user status**
- **Benefits:**
  - Custom themes (coming soon)
  - Governance voting rights
  - Featured on leaderboard
  - Early access to features

#### Tier 3: Ocean 🌊
- **Requirement:** 500+ transactions AND admin approval
- **Elite builder status**
- **Benefits:**
  - All features unlocked
  - Community ambassador
  - Revenue share program (future)
  - Direct access to core team

### Viewing Your Profile

1. Navigate to **Membership Profile**
2. View your tier and stats:
   - **Current Tier** - Your badge level
   - **Transaction Count** - Total transactions
   - **Deployed Packages** - Smart contracts you've published
   - **Progress Bar** - Progress to next tier
   - **Time Since Join** - How long you've been a member

### Tier Progression

**Automatic upgrades:**
- Your tier is automatically calculated based on blockchain data
- No manual claim needed
- Refresh anytime to check for upgrades

**How to refresh:**
1. Navigate to **Membership Profile**
2. Click **Refresh Tier**
3. System checks your latest activity
4. Tier updates if you qualify

### Community Stats

View global community statistics:
- **Total Members** - How many users have joined
- **Tier Distribution** - Members per tier
- **Recent Joins** - Latest community members

### Benefits by Tier

| Benefit | Droplet | Wave | Tsunami | Ocean |
|---------|---------|------|---------|-------|
| CLI Access | ✅ | ✅ | ✅ | ✅ |
| Activity Tracking | ✅ | ✅ | ✅ | ✅ |
| NFT Badge | ✅ | ✅ | ✅ | ✅ |
| Animated Badge | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ | ✅ |
| Voting Rights | ❌ | ❌ | ✅ | ✅ |
| Custom Themes | ❌ | ❌ | ✅ | ✅ |
| Ambassador | ❌ | ❌ | ❌ | ✅ |

### Privacy

**What we track:**
- Your public Sui address
- Join timestamp
- On-chain transaction count (public data)
- Deployed package count (public data)

**What we DON'T track:**
- Private keys
- Transaction content
- Personal information
- Off-chain activity

All data is pulled from public blockchain records.

---

## Move Development

Build, test, and deploy Move smart contracts directly from the web interface.

### Prerequisites

- Sui CLI installed and configured
- Basic understanding of Move language
- Project directory on your local machine

### Creating a New Move Project

1. Navigate to **Move Deploy**
2. Click **New Project** tab
3. Enter project details:
   - **Project Name** - Lowercase, no spaces (e.g., "my_contract")
   - **Directory** - Where to create the project
4. Click **Create Project**

**Result:** A new Move project with standard structure:
```
my_contract/
├── Move.toml          # Package manifest
├── sources/           # Move source files
│   └── my_contract.move
└── tests/             # Test files
```

### Building a Move Package

Compile your Move code:

1. Navigate to **Move Deploy** → **Build** tab
2. Enter the **Project Path** (absolute path to your Move project)
3. Click **Build Package**
4. View build output:
   - Compilation status
   - Dependencies resolved
   - Errors or warnings

**Build options:**
- Skip dependency verification (faster, use for testing)
- Custom build directory

### Running Move Tests

Test your Move contracts before deployment:

1. Navigate to **Move Deploy** → **Test** tab
2. Enter the **Project Path**
3. (Optional) Enter a **Filter** to run specific tests
4. Click **Run Tests**

**Test results show:**
- Number of tests passed
- Number of tests failed
- Detailed failure messages
- Execution time

**Filter examples:**
- Run all tests: Leave filter empty
- Run specific test: `test_transfer`
- Run tests matching pattern: `test_*_success`

### Publishing a Move Package

Deploy your contract to the blockchain:

1. Navigate to **Move Deploy** → **Publish** tab
2. Enter the **Project Path**
3. Set **Gas Budget** (recommended: 100000000 MIST = 0.1 SUI)
4. (Optional) Check **Skip Dependency Verification**
5. Click **Publish Package**

**After successful publish:**
- **Package ID** - Your contract's unique identifier
- **Transaction Digest** - Transaction hash
- **Created Objects** - List of objects created (UpgradeCap, etc.)

**Important:** Save your Package ID and UpgradeCap object ID for future upgrades.

### Upgrading a Move Package

Update an existing published package:

1. Navigate to **Move Deploy** → **Upgrade** tab
2. Enter the **Project Path**
3. Enter the **Package ID** (from original publish)
4. Enter the **Upgrade Capability Object ID**
5. Set **Gas Budget**
6. Click **Upgrade Package**

**Upgrade requirements:**
- You must own the UpgradeCap object
- Package must be compatible (no breaking changes)

### Move Development Tips

**Best practices:**
- Always run tests before publishing
- Use testnet for initial deployments
- Keep your UpgradeCap object ID safe
- Start with small gas budgets, increase if needed

**Recommended workflow:**
1. Create project
2. Write Move code
3. Build → Fix errors → Repeat
4. Run tests → Fix failures → Repeat
5. Publish to testnet
6. Test on testnet
7. Publish to mainnet (when ready)

---

## Transaction Inspector

Advanced tool for inspecting and replaying transactions.

### Inspecting Transaction Bytecode

Analyze transaction data before execution:

1. Navigate to **Transaction Builder** → **Inspect** tab
2. Paste transaction data:
   - Base64-encoded transaction bytes
   - Or hex-encoded transaction data
3. Click **Inspect Transaction**

**Inspection shows:**
- Transaction kind
- Sender address
- Gas payment info
- Commands/operations
- Input objects
- Expected effects

**Use cases:**
- Debug transaction failures
- Understand transaction structure
- Verify transaction contents before signing

### Replaying On-Chain Transactions

Replay past transactions to understand execution:

1. Navigate to **Transaction Builder** → **Replay** tab
2. Enter the **Transaction Digest** (from block explorer)
3. Click **Replay Transaction**

**Replay shows:**
- Original transaction data
- Execution results
- Events emitted
- Object changes
- Gas used

**Use cases:**
- Understand why a transaction failed
- Learn from successful transactions
- Debug smart contract interactions
- Analyze gas usage

### Understanding Transaction Effects

**Effects include:**
- **Created Objects** - New objects created
- **Mutated Objects** - Objects that changed
- **Deleted Objects** - Objects removed
- **Events** - Blockchain events emitted
- **Gas Cost** - Total gas spent

---

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

| Action | Shortcut (Mac) | Shortcut (Windows/Linux) |
|--------|----------------|--------------------------|
| Open Command Palette | `⌘K` | `Ctrl+K` |
| Navigate Up | `↑` | `↑` |
| Navigate Down | `↓` | `↓` |
| Execute Command | `Enter` | `Enter` |
| Close Palette | `Esc` | `Esc` |
| Retry Connection | `Enter` (on setup page) | `Enter` (on setup page) |

---

## Tips & Tricks

### General Tips

1. **Use testnet first** - Always test new features on testnet before mainnet
2. **Save recovery phrases** - Use a password manager like 1Password or Bitwarden
3. **Label your addresses** - Makes tracking much easier
4. **Join the community** - Track your progress and earn perks
5. **Bookmark the web UI** - Quick access from your browser

### Performance Tips

1. **Keep server running** - Don't restart unless necessary
2. **Use recent addresses** - Faster than typing addresses manually
3. **Batch operations** - Merge gas coins together, then split as needed
4. **Cache is your friend** - Address metadata is cached locally

### Security Tips

1. **Verify addresses** - Always double-check before transferring
2. **Test with small amounts** - Send 0.1 SUI first, then larger amounts
3. **Use testnet for learning** - No risk of losing real funds
4. **Keep software updated** - Regular updates improve security
5. **Review transactions** - Check block explorer for important transfers

---

## Support & Resources

### Documentation

- [Getting Started Guide](GETTING_STARTED.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Feature Reference](FEATURES.md)

### External Resources

- [Sui Documentation](https://docs.sui.io)
- [Move Language Book](https://move-language.github.io/move/)
- [Sui GitHub](https://github.com/MystenLabs/sui)
- [Sui Discord](https://discord.gg/sui)

### Project Links

- [GitHub Repository](https://github.com/hien-p/raycast-sui-cli)
- [npm Package](https://www.npmjs.com/package/sui-cli-web-server)
- [Report Issues](https://github.com/hien-p/raycast-sui-cli/issues)

---

**Need help?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue on GitHub.
