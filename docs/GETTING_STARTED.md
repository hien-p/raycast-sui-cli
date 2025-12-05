# Getting Started with Sui CLI Web

Sui CLI Web is a beautiful, Raycast-inspired web interface for managing your local Sui blockchain CLI. This guide will help you get up and running quickly.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Windows](#windows)
- [First Launch](#first-launch)
- [Initial Setup](#initial-setup)
- [Next Steps](#next-steps)

---

## Prerequisites

Before installing Sui CLI Web, ensure you have the following:

1. **Node.js 18 or higher** - Required for running the local server
2. **Sui CLI** - The official Sui blockchain command-line interface
3. **Terminal/Command Line** - Basic familiarity with terminal commands

---

## Installation

### macOS

#### Step 1: Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Resource:** [Homebrew Installation Guide](https://brew.sh)

#### Step 2: Install Node.js

```bash
brew install node
```

Verify installation:
```bash
node --version  # Should show v18.0.0 or higher
```

#### Step 3: Install Sui CLI

```bash
brew install sui
```

Verify installation:
```bash
sui --version
```

**Resource:** [Official Sui Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)

#### Step 4: Start the Local Server

```bash
npx sui-cli-web
```

**Note:** Keep this terminal window running. The server must be active for the web interface to function.

#### Step 5: Open the Web Interface

Navigate to: **https://www.harriweb3.dev**

---

### Linux

#### Step 1: Install Prerequisites

For Ubuntu/Debian:
```bash
sudo apt-get update && sudo apt-get install curl git-all cmake gcc libssl-dev pkg-config libclang-dev libpq-dev build-essential
```

For Fedora:
```bash
sudo dnf install curl git cmake gcc openssl-devel pkg-config clang-devel postgresql-devel
```

For Arch Linux:
```bash
sudo pacman -S curl git cmake gcc openssl pkg-config clang postgresql-libs
```

#### Step 2: Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the on-screen instructions. After installation, reload your shell:
```bash
source $HOME/.cargo/env
```

**Resource:** [Rust Installation Guide](https://www.rust-lang.org/tools/install)

#### Step 3: Install Node.js

Using NodeSource for Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

For other distributions, visit: [NodeJS Downloads](https://nodejs.org/en/download/package-manager)

Verify installation:
```bash
node --version  # Should show v18.0.0 or higher
```

#### Step 4: Install Sui CLI

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

**Note:** This may take 10-30 minutes depending on your system.

Add Sui to your PATH (if not automatically added):
```bash
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify installation:
```bash
sui --version
```

**Resource:** [Official Sui Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)

#### Step 5: Start the Local Server

```bash
npx sui-cli-web
```

**Note:** Keep this terminal running.

#### Step 6: Open the Web Interface

Navigate to: **https://www.harriweb3.dev**

---

### Windows

#### Step 1: Install Chocolatey (if not already installed)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Resource:** [Chocolatey Installation Guide](https://chocolatey.org/install)

#### Step 2: Install Node.js

In PowerShell (Admin):
```powershell
choco install nodejs-lts
```

**Note:** Restart PowerShell after installation.

Verify installation:
```powershell
node --version  # Should show v18.0.0 or higher
```

#### Step 3: Install Sui CLI

In PowerShell (Admin):
```powershell
choco install sui
```

**Alternative:** If Chocolatey doesn't have the latest Sui CLI, you can:
1. Install Rust: `choco install rust`
2. Install Sui via Cargo: `cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui`

**Note:** Restart PowerShell after installation.

Verify installation:
```powershell
sui --version
```

**Resource:** [Official Sui Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)

#### Step 4: Start the Local Server

In PowerShell (normal user, not Admin):
```powershell
npx sui-cli-web
```

**Note:** Keep this PowerShell window running.

#### Step 5: Open the Web Interface

Navigate to: **https://www.harriweb3.dev**

---

## First Launch

### Connection Check

When you first open the web interface, it will attempt to connect to your local server at `localhost:3001`.

**If connected successfully:**
- You'll see the landing page with a "Launch CLI" button
- Press **Enter** or click the button to proceed

**If connection fails:**
- The setup instructions page will appear
- Follow the OS-specific installation steps
- Click "Try Connection" or press **Enter** to retry

### Initial Sui CLI Configuration

If this is your first time using Sui CLI, you'll need to create a wallet:

1. The server will prompt you to create a new address
2. **Important:** Save your recovery phrase securely
3. Never share your recovery phrase with anyone

---

## Initial Setup

### 1. Create Your First Address

After launching the CLI web interface:

1. Navigate to **Manage Addresses** from the command palette
2. Click **Create New Address**
3. Choose a key scheme (Ed25519 recommended for beginners)
4. **Save your recovery phrase immediately** - store it in a secure password manager
5. Give your address a friendly alias (e.g., "Main Wallet")

### 2. Switch Network (Optional)

The default network is typically testnet. To switch:

1. Open the command palette (or press `⌘K` / `Ctrl+K`)
2. Select **Switch Environment**
3. Choose your desired network:
   - **Testnet** - For development and testing (recommended for beginners)
   - **Mainnet** - For real transactions with real SUI
   - **Devnet** - Bleeding edge, may be unstable
   - **Localnet** - For local development

### 3. Get Test Tokens (Testnet Only)

To get free SUI tokens on testnet:

1. Make sure you're on the **testnet** network
2. Navigate to **Request Faucet**
3. Click **Request Tokens** or use one of the external faucet links
4. Wait 10-30 seconds for tokens to arrive
5. Check your balance in **Manage Addresses**

**Alternative Faucets:**
- FM Faucet
- Blockbolt Faucet
- n1stake Faucet
- Stakely Faucet
- Discord Faucet
- Developer Portal Faucet

### 4. Join the Community (Optional)

Join the Sui CLI Web community to:
- Get a tier badge based on your on-chain activity
- Track your transaction count and deployed contracts
- Earn perks as you level up

**Requirements:**
- At least 10 SUI in your wallet
- At least 10 transactions on your address

**How to Join:**
1. Navigate to **Community** from the command palette
2. Click **Join Community**
3. Confirm the transaction (costs ~0.01 SUI gas fee)
4. Receive your **Droplet** tier badge immediately

---

## Next Steps

Now that you're set up, explore these features:

1. **[Transfer SUI](USER_GUIDE.md#transfer-sui)** - Send tokens to other addresses
2. **[Gas Management](USER_GUIDE.md#gas-management)** - Split and merge gas coins
3. **[Object Explorer](USER_GUIDE.md#object-explorer)** - Browse your owned objects
4. **[Move Deploy](USER_GUIDE.md#move-development)** - Build and deploy smart contracts
5. **[Community Tiers](USER_GUIDE.md#community-features)** - Level up your membership

---

## Security Best Practices

### Private Key Safety

- **Your private keys never leave your machine** - The local server runs on your computer and talks directly to your local Sui CLI
- **Never share your recovery phrase** - This is the master key to your wallet
- **Use a password manager** - Store recovery phrases in a secure password manager, not in plain text
- **Verify the server URL** - Always ensure you're running `npx sui-cli-web-server` from npm

### Local Server Security

- **Server binds to localhost only** - No external access is possible
- **Review the code** - All code is open source: [GitHub Repository](https://github.com/hien-p/raycast-sui-cli)
- **Keep software updated** - Regularly update both Sui CLI and sui-cli-web

### Network Safety

- **Use testnet for learning** - Practice on testnet before using mainnet
- **Double-check addresses** - Always verify recipient addresses before sending
- **Start with small amounts** - Test transfers with small amounts first

---

## Support

### Resources

- **Documentation:** [User Guide](USER_GUIDE.md) | [Troubleshooting](TROUBLESHOOTING.md)
- **GitHub:** [Report Issues](https://github.com/hien-p/raycast-sui-cli/issues)
- **npm Package:** [sui-cli-web-server](https://www.npmjs.com/package/sui-cli-web-server)
- **Sui Docs:** [Official Sui Documentation](https://docs.sui.io)

### Common Issues

- **"Cannot connect to local server"** → See [Troubleshooting Guide](TROUBLESHOOTING.md#server-connection)
- **"Sui CLI is not installed"** → See [Installation](#installation)
- **"Port 3001 already in use"** → See [Troubleshooting Guide](TROUBLESHOOTING.md#port-conflicts)

---

**Ready to explore?** Head to the [User Guide](USER_GUIDE.md) for detailed feature documentation.
