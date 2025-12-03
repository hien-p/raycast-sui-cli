# Sui CLI Web

A beautiful, Raycast-style web interface for interacting with the Sui blockchain via your local Sui CLI.

![Sui CLI Web](https://img.shields.io/badge/Sui-CLI%20Web-4DA2FF)
![Platform](https://img.shields.io/badge/Platform-macOS%20|%20Linux%20|%20Windows-brightgreen)

## Features

- **Raycast-inspired UI** - Beautiful, keyboard-first interface
- **Address Management** - View, switch, and create addresses
- **Environment Switching** - Easily switch between devnet, testnet, mainnet
- **Object Browser** - Browse and inspect owned objects
- **Gas Management** - View, split, and merge gas coins
- **Faucet Integration** - Request test tokens directly

---

## Quick Start (For Users)

### Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Sui CLI** installed and configured

```bash
# Install Sui CLI (choose one)
brew install sui                    # macOS (Homebrew)
cargo install --locked sui          # All platforms (Rust)
```

### Usage

**Step 1:** Start the local server (one command!)

```bash
npx sui-cli-web-server
```

**Step 2:** Open the web UI

Go to: **https://sui-cli-web.vercel.app**

That's it! The web UI will connect to your local server automatically.

> **Note:** Keep the terminal open while using the app. The server connects the web UI to your local Sui CLI.

---

## How It Works

```
┌─────────────────────────────────────────┐
│     Web Browser (Hosted UI)             │
│     https://sui-cli-web.vercel.app      │
└──────────────────┬──────────────────────┘
                   │ HTTP (localhost:3001)
                   ▼
┌─────────────────────────────────────────┐
│     Local Server (your computer)        │
│     npx sui-cli-web-server              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│     Sui CLI + ~/.sui/sui_config/        │
│     (your keys stay local!)             │
└─────────────────────────────────────────┘
```

**Your private keys never leave your computer.** The web UI only sends commands to your local server.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate list |
| `Enter` | Select item |
| `Escape` | Go back |
| Type | Search/filter |

---

## For Developers

### Local Development

```bash
# Clone the repo
git clone <repo-url>
cd sui-cli-web

# Install dependencies
npm install

# Start dev servers (both client + server)
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

### Project Structure

```
sui-cli-web/
├── packages/
│   ├── server/     # Node.js backend (Fastify)
│   ├── client/     # React frontend (Vite)
│   └── shared/     # Shared TypeScript types
```

### Deploy UI to Vercel

```bash
cd packages/client
vercel
```

### Publish Server to npm

```bash
cd packages/server
npm publish
```

---

## Troubleshooting

### "Cannot connect to local server"

Make sure the server is running:
```bash
npx sui-cli-web-server
```

### "Sui CLI is not installed"

Install Sui CLI:
```bash
# macOS
brew install sui

# Or with Cargo (all platforms)
cargo install --locked sui
```

### Port 3001 already in use

Kill the existing process:
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## Security

- **Keys stay local** - Private keys never leave your computer
- **No tracking** - The web UI doesn't collect any data
- **Open source** - Audit the code yourself

---

## License

MIT
