# Sui CLI Web

A Raycast-style web interface for interacting with your local Sui CLI. Manage addresses, switch environments, request faucet tokens, and more - all from a beautiful web UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![npm](https://img.shields.io/npm/v/sui-cli-web)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

## Features

- **Address Management** - View, switch, and create Sui addresses
- **Environment Switching** - Switch between mainnet, testnet, devnet, localnet
- **Faucet Integration** - Request test tokens directly from the UI
- **Gas Management** - View, split, and merge gas coins
- **Object Explorer** - Browse objects owned by your addresses
- **Keyboard Navigation** - Raycast-style keyboard shortcuts (`↑↓` navigate, `Enter` select, `Esc` back)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Browser                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              React Web UI (Vercel)                       │    │
│  │         https://client-gray-mu.vercel.app               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (localhost:3001)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Your Local Machine                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Local Server (Fastify)                      │    │
│  │                 npx sui-cli-web                          │    │
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

## Why Local Server?

**Your keys stay on YOUR machine.** We don't ask you to trust us with your private keys.

- The Web UI is just a visual interface - it cannot access your keys directly
- The local server runs on YOUR computer and talks to YOUR local Sui CLI
- Nothing is sent to external servers - all operations happen locally
- All code is open source - [audit it yourself](https://github.com/hien-p/raycast-sui-cli)

## Quick Start

### Prerequisites

- **Node.js 18+** installed
- **Sui CLI** installed and configured ([Install Guide](https://docs.sui.io/build/install))

```bash
# Install Sui CLI (choose one)
brew install sui                    # macOS (Homebrew)
cargo install --locked sui          # All platforms (Rust)
```

### Run the Local Server

```bash
npx sui-cli-web
```

Then open: **https://client-gray-mu.vercel.app**

That's it! The web UI will connect to your local server automatically.

### Alternative: Run from Source

```bash
git clone https://github.com/hien-p/raycast-sui-cli.git
cd raycast-sui-cli/sui-cli-web
npm install
npm run dev
```

## Development

### Project Structure

```
sui-cli-web/
├── packages/
│   ├── client/          # React + Vite frontend
│   │   ├── src/
│   │   │   ├── api/           # API client
│   │   │   ├── components/    # React components
│   │   │   ├── stores/        # Zustand state management
│   │   │   └── types/         # TypeScript types
│   │   └── package.json
│   │
│   ├── server/          # Fastify backend (npm: sui-cli-web)
│   │   ├── src/
│   │   │   ├── cli/           # Sui CLI executor & config parser
│   │   │   ├── routes/        # API routes
│   │   │   └── services/      # Business logic
│   │   └── package.json
│   │
│   └── shared/          # Shared types
│
└── package.json         # Root workspace
```

### Commands

```bash
# Development (runs both client & server)
npm run dev

# Run only server
npm run dev:server

# Run only client
npm run dev:client

# Build all packages
npm run build

# Clean all build artifacts
npm run clean
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | Sui CLI installation status |
| GET | `/api/addresses` | List all addresses with balances |
| GET | `/api/addresses/active` | Get active address |
| POST | `/api/addresses/switch` | Switch active address |
| POST | `/api/addresses/create` | Create new address |
| GET | `/api/addresses/:address/balance` | Get address balance |
| GET | `/api/addresses/:address/objects` | Get address objects |
| GET | `/api/addresses/:address/gas` | Get gas coins |
| POST | `/api/gas/split` | Split gas coin |
| POST | `/api/gas/merge` | Merge gas coins |
| GET | `/api/environments` | List environments |
| GET | `/api/environments/active` | Get active environment |
| POST | `/api/environments/switch` | Switch environment |
| POST | `/api/environments` | Add environment |
| DELETE | `/api/environments/:alias` | Remove environment |
| POST | `/api/faucet/request` | Request faucet tokens |

## Troubleshooting

### "Cannot connect to local server"

Make sure the server is running:
```bash
npx sui-cli-web
```

### "Sui CLI is not installed"

Install Sui CLI:
```bash
brew install sui          # macOS
cargo install --locked sui # All platforms
```

### Port 3001 already in use

```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## Security

### Verify Before You Trust

- [Review source code on GitHub](https://github.com/hien-p/raycast-sui-cli)
- [Check npm package](https://www.npmjs.com/package/sui-cli-web)
- Server only binds to `localhost` (127.0.0.1) - no external access
- All code is open source

### Security Notes

- The local server has access to your Sui CLI and can execute commands
- Only run the server on trusted machines
- Recovery phrases are never stored or transmitted to external servers

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [npm Package](https://www.npmjs.com/package/sui-cli-web)
- [GitHub Repository](https://github.com/hien-p/raycast-sui-cli)
- [Web UI](https://client-gray-mu.vercel.app)
- [Sui Documentation](https://docs.sui.io)
