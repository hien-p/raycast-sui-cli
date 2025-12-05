# Sui CLI Web

A Raycast-style web interface for interacting with your local Sui CLI. Manage addresses, switch environments, request faucet tokens, and more - all from a beautiful web UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![npm](https://img.shields.io/npm/v/sui-cli-web-server)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

**Live**: https://www.harriweb3.dev | **NPM**: `sui-cli-web-server`

## Features

- **Address Management** - View, switch, create addresses with balance display
- **Transfer SUI** - Send SUI tokens with gas estimation
- **Gas Management** - Split and merge gas coins
- **Environment Switching** - Switch between mainnet, testnet, devnet, localnet
- **Faucet Integration** - Request test tokens directly from the UI
- **Move Development** - Build, test, publish, upgrade packages
- **Community Tiers** - Join on-chain community with tier progression
- **Transaction Inspector** - Inspect and replay transactions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Browser                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              React Web UI (Vercel)                       │    │
│  │            https://www.harriweb3.dev                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (localhost:3001)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Your Local Machine                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Local Server (Fastify)                      │    │
│  │                 npx sui-cli-web-server                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ executes                          │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Sui CLI                               │    │
│  │              ~/.sui/sui_config/client.yaml              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Your keys stay on YOUR machine.** Private keys never leave your local Sui CLI.

## Quick Start

### Prerequisites

- **Node.js 18+** installed
- **Sui CLI** installed ([Install Guide](https://docs.sui.io/build/install))

```bash
# Install Sui CLI
brew install sui                    # macOS (Homebrew)
cargo install --locked sui          # All platforms (Rust)
```

### Run

```bash
npx sui-cli-web
```

Then open: **https://www.harriweb3.dev**

### Run from Source

```bash
git clone https://github.com/hien-p/raycast-sui-cli.git
cd raycast-sui-cli
npm install
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/GETTING_STARTED.md) | Quick start guide and installation |
| [User Guide](docs/USER_GUIDE.md) | Complete user documentation |
| [Features](FEATURES.md) | Feature inventory & implementation status |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues & solutions |
| [Server API](packages/server/README.md) | Server package documentation |
| [Smart Contract](contracts/community_registry/CONTRACT_INFO.md) | Community registry contract details |

## Development

```bash
npm run dev           # Run both client & server
npm run dev:server    # Server only (port 3001)
npm run dev:client    # Client only (port 5173)
npm run build         # Build all packages
```

### Project Structure

```
packages/
├── client/     # React + Vite + TailwindCSS frontend
├── server/     # Fastify backend (npm: sui-cli-web-server)
└── shared/     # TypeScript types
```

## Troubleshooting

**Cannot connect to server?**
```bash
npx sui-cli-web-server  # Make sure server is running
```

**Sui CLI not found?**
```bash
brew install sui          # macOS
cargo install --locked sui # All platforms
```

**Port 3001 in use?**
```bash
lsof -ti:3001 | xargs kill -9  # macOS/Linux
```

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more.

## Security

- Server binds to `localhost` only - no external access
- Private keys managed by local Sui CLI
- All code is open source - [audit it](https://github.com/hien-p/raycast-sui-cli)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Live App](https://www.harriweb3.dev)
- [npm Package](https://www.npmjs.com/package/sui-cli-web-server)
- [GitHub](https://github.com/hien-p/raycast-sui-cli)
- [Sui Documentation](https://docs.sui.io)
