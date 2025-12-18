# ADR-004: Modular API Client Structure

## Status
Accepted

## Date
2024-12-18

## Context
The original `api/client.ts` grew to 1130 lines, containing:
- Connection management (port scanning, health checks)
- Request utilities (fetchApi, error handling)
- 15+ domain-specific API modules (addresses, coins, inspector, etc.)

This violated Single Responsibility Principle and made the code hard to navigate and test.

## Decision
Split the monolithic client into a modular structure:

```
api/
├── core/
│   ├── connection.ts    # Port scanning, health checks (190 lines)
│   ├── request.ts       # fetchApi, apiClient utilities (160 lines)
│   └── index.ts         # Re-exports
├── services/
│   ├── addresses.ts     # Address management
│   ├── coins.ts         # Coin operations
│   ├── community.ts     # Membership, tiers
│   ├── devtools.ts      # Coverage, disassemble
│   ├── environments.ts  # Network environments
│   ├── faucet.ts        # Faucet requests
│   ├── filesystem.ts    # File browser
│   ├── inspector.ts     # Transaction inspection, PTB
│   ├── keytool.ts       # Key management
│   ├── move.ts          # Build, test
│   ├── objects.ts       # Object queries
│   ├── packages.ts      # Publish, upgrade
│   ├── security.ts      # Verify source/bytecode
│   ├── status.ts        # Server status
│   └── index.ts         # Re-exports all
├── client.ts            # Deprecated, re-exports for backward compat
└── index.ts             # Main entry point
```

## Rationale

### Why This Structure?
1. **Single Responsibility**: Each service handles one domain
2. **Tree Shaking**: Import only what you need
3. **Testability**: Smaller units easier to mock
4. **Navigation**: Find code by domain name
5. **Parallel Development**: No merge conflicts

### Migration Strategy
- `client.ts` re-exports everything for backward compatibility
- Components can migrate gradually to direct imports
- No breaking changes

## Consequences

### Positive
- Average file size: 65 lines (vs 1130)
- Faster IDE navigation
- Better code organization
- Easier to test individual services

### Negative
- More files to manage
- Import paths longer (mitigated by index re-exports)

### Neutral
- Bundle size unchanged (tree shaking works same way)

## References
- ADR-001: Monorepo Structure
- ADR-002: Client-Server Architecture
