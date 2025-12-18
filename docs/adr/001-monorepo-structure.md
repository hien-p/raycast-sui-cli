# ADR-001: Monorepo Structure with npm Workspaces

## Status
Accepted

## Date
2024-01-15

## Context
Sui CLI Web consists of multiple components:
- A React frontend for the web UI
- A Fastify backend server that bridges to the local Sui CLI
- Shared TypeScript types used by both client and server
- Smart contracts deployed on Sui testnet

We needed a way to organize these components that allows:
- Shared code (types) without duplication
- Independent versioning for publishable packages (server to npm)
- Unified development experience

## Decision
Use npm workspaces with the following package structure:

```
packages/
├── client/     # React + Vite frontend (deployed to Vercel)
├── server/     # Fastify backend (published to npm as sui-cli-web-server)
├── shared/     # TypeScript types shared between client/server
contracts/
└── community_registry/  # Move smart contract (separate deploy)
```

Key decisions:
1. **npm workspaces** over alternatives (Turborepo, Nx, Lerna)
2. **Separate packages** for client, server, shared
3. **Contracts outside packages/** since they have different tooling (Move)

## Rationale

### Why npm Workspaces?
- Zero configuration overhead
- Native to Node.js ecosystem
- Sufficient for our scale (3 packages)
- No learning curve for contributors

### Alternatives Considered
1. **Turborepo**: Overkill for 3 packages, adds complexity
2. **Separate repos**: Difficult to keep types in sync
3. **Single package**: Can't publish server independently to npm

## Consequences

### Positive
- `npm run dev` starts both client and server
- Shared types update immediately across packages
- Server can be published independently (`npm publish` from server/)
- Clear separation of concerns

### Negative
- Root package.json has workspace configuration complexity
- Must be careful with dependencies (workspace vs root)
- Build order matters (shared → server → client)

### Neutral
- Contracts remain separate (Move has different toolchain)

## References
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
