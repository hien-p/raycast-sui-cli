# Raycast Sui CLI

A powerful Raycast extension that brings the Sui CLI to your fingertips. Manage addresses, switch networks, request test tokens, inspect objects, and build Move packages—all from Raycast's command palette.

## Features

### Address Management
- View all addresses with real-time SUI balances
- Switch active address instantly
- Create new addresses (Ed25519, Secp256k1, Secp256r1)
- View object counts and detailed coin lists
- Copy address or alias to clipboard
- Open address in Sui Explorer

### Network & Environment
- Switch between Localnet, Devnet, Testnet, and Mainnet
- Add custom RPC environments
- Remove unused environments
- View active network status at a glance

### Developer Tools
- **Faucet**: Request SUI tokens for Devnet/Testnet/Localnet with one click
- **Object Inspector**: Browse and inspect objects owned by any address
- **Transaction Inspector**: View transaction details by digest
- **Package Manager**: Build, test, publish, and upgrade Move packages
- **Gas Management**: View gas objects and manage coin splits

### Productivity Features
- **Command History**: Quick access to recently executed commands
- **Favorites**: Star frequently used commands for instant access
- **Templates**: Save and reuse parameterized command snippets
- **Keyboard-First**: Navigate everything without leaving the keyboard

## Architecture

```
UI Components (src/ui/)
    ↓
React Hooks (src/state/) → Services (src/services/)
    ↓
CLI Layer (src/cli/) → Sui CLI Binary
```

The extension follows a three-layer architecture:
- **UI Layer**: 12 React components for different views (addresses, environments, faucet, etc.)
- **State Layer**: React hooks that manage state and wrap services
- **Service Layer**: Business logic services that interact with the Sui CLI
- **CLI Layer**: Singleton executors for parsing config and running commands

## Prerequisites

1. **Raycast**: [Download here](https://www.raycast.com/)
2. **Node.js**: Version 18+
3. **Sui CLI**: Install and configure before using
   ```bash
   brew install sui
   sui client active-address  # Initialize CLI config
   ```

## Installation

### From Source

```bash
git clone https://github.com/hien-p/raycast-sui-cli.git
cd raycast-sui-cli
npm install
npm run dev
```

### From Raycast Store

Search for "Sui CLI" in the Raycast Store.

## Development

```bash
npm run dev         # Start development mode (opens Raycast)
npm run build       # Build for distribution
npm run lint        # Check code quality
npm run fix-lint    # Auto-fix linting issues
npm run publish     # Publish to Raycast store
```

## Configuration

The extension uses your existing Sui configuration at `~/.sui/sui_config/client.yaml`. No additional setup required inside Raycast.

**Troubleshooting "No active RPC URL" errors:**
```bash
sui client envs                    # Check available environments
sui client switch --env testnet    # Set active environment
```

## Project Structure

```
src/
├── cli/           # CLI execution layer (ConfigParser, SuiCliExecutor)
├── services/      # Business logic (Address, Environment, Faucet, etc.)
├── state/         # React hooks for state management
├── ui/            # React components (12 views)
└── index.tsx      # Entry point
```

## Tech Stack

- **Framework**: Raycast API
- **Language**: TypeScript
- **Config Parsing**: js-yaml
- **CLI Integration**: Sui CLI binary wrapper

## License

MIT
