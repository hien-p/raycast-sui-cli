# ADR-002: Three-Tier Client-Server Architecture

## Status
Accepted

## Date
2024-01-15

## Context
Sui CLI Web needs to provide a web-based interface for Sui blockchain operations while keeping private keys secure on the user's local machine. The challenge is that:
- Browsers cannot execute CLI commands directly
- Private keys must never leave the user's machine
- The web UI should be hostable publicly (Vercel)

## Decision
Implement a three-tier architecture:

```
┌──────────────┐     HTTP/SSE      ┌──────────────┐     Subprocess     ┌──────────────┐
│   Browser    │ ←───────────────→ │ Local Server │ ←────────────────→ │   Sui CLI    │
│  (React UI)  │    localhost:3001 │  (Fastify)   │     exec/spawn     │   Binary     │
└──────────────┘                   └──────────────┘                    └──────────────┘
     Vercel                              npm                              Local only
```

Key decisions:
1. **Server runs locally** (never hosted remotely)
2. **Server published to npm** for easy installation
3. **UI hosted on Vercel** but connects to localhost
4. **Port scanning** to find running server (3001-3005, 4001-4002, 8001, 8080)

## Rationale

### Why Local Server?
- Private keys stay on user's machine
- Can execute CLI commands
- Full filesystem access for Move packages
- No server hosting costs for project

### Why Separate UI Deployment?
- Fast, global CDN delivery
- Easy updates (just push to main)
- No user installation for UI updates

### Alternatives Considered
1. **Browser extension**: Limited API access, harder to debug
2. **Electron app**: Large download, update overhead
3. **Remote server with wallet connect**: Requires wallet integration, more complex

## Consequences

### Positive
- Maximum security (keys never leave machine)
- Zero server hosting costs
- Fast UI updates via Vercel
- Works with any Sui network (testnet, devnet, localnet, mainnet)

### Negative
- Requires user to install and run local server
- Must handle disconnection gracefully
- Port scanning adds complexity
- CORS configuration needed

### Neutral
- Server versioning independent of UI

## References
- [Sui CLI Documentation](https://docs.sui.io/references/cli)
- ADR-001: Monorepo Structure
