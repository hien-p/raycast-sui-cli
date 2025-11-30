# Raycast Sui CLI

A powerful Raycast extension to streamline your Sui development workflow. Manage addresses, switch networks, request test tokens, and inspect objects—all without leaving your keyboard.

![Sui CLI Extension](assets/command-icon.png)

## 🚀 Features

- **Address Management**:
  - View all addresses with **real-time balances** (SUI and other coins).
  - Switch active address instantly.
  - Create new addresses (Ed25519, Secp256k1, Secp256r1).
  - View detailed insights: object counts and full coin lists.
  - Copy address/alias to clipboard.

- **Network & Environment**:
  - Switch between Localnet, Devnet, Testnet, and Mainnet.
  - Add new custom RPC environments.
  - View active network status.

- **Developer Tools**:
  - **Faucet**: Request SUI tokens for Devnet/Testnet/Localnet.
  - **Object Inspector**: Browse and inspect objects owned by an address.
  - **Package Manager**: Build, test, and publish Move packages.
  - **Templates**: Scaffold new Sui Move projects quickly.
  - **Gas Management**: View gas objects and split coins.

## 🛠 Prerequisites

Before using this extension, ensure you have the following installed:

1.  **Raycast**: [Download here](https://www.raycast.com/).
2.  **Node.js**: Version 18+ recommended.
3.  **Sui CLI**: The extension wraps the official Sui CLI.
    - Install via Homebrew: `brew install sui`
    - Or build from source.
    - **Important**: Run `sui client active-address` in your terminal once to ensure the CLI is initialized and configured.

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/raycast-sui-cli.git
    cd raycast-sui-cli
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run locally**:
    ```bash
    npm run dev
    ```
    This will open Raycast and load the extension in development mode.

## 🔧 Configuration

The extension uses your existing local Sui configuration (`~/.sui/sui_config/client.yaml`). No extra configuration is needed inside Raycast!

If you encounter "No active RPC URL" errors:
1.  Open your terminal.
2.  Run `sui client envs` to check your environments.
3.  Run `sui client switch --env <env>` to set an active environment if none is selected.

## 📝 License

MIT
