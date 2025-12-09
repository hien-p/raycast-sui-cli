# Advanced Sui CLI Commands Implementation Plan

> Created: 2025-12-09
> Status: In Progress

## Overview

Extend Sui CLI Web from 75% to 95%+ CLI coverage by adding advanced commands for developers, security auditors, and power users.

## User Stories

1. **As a smart contract developer**, I want to see test coverage reports so I can identify untested code paths
2. **As a security auditor**, I want to verify on-chain source matches local code to ensure contract integrity
3. **As an advanced user**, I want to query dynamic fields on objects to debug complex data structures
4. **As a developer**, I want to disassemble Move bytecode to understand compiled behavior
5. **As a multi-sig wallet user**, I want to generate and combine multi-sig signatures

## Technical Requirements

### Backend Routes to Add

| Route | CLI Command | Priority |
|-------|-------------|----------|
| `POST /api/devtools/coverage` | `sui move coverage` | HIGH |
| `POST /api/devtools/disassemble` | `sui move disassemble` | HIGH |
| `POST /api/devtools/summary` | `sui move summary` | HIGH |
| `POST /api/security/verify-source` | `sui client verify-source` | HIGH |
| `POST /api/security/verify-bytecode` | `sui client verify-bytecode-meter` | HIGH |
| `GET /api/dynamic-fields/:objectId` | `sui client dynamic-field` | MEDIUM |
| `POST /api/keytool/generate` | `sui keytool generate` | MEDIUM |
| `POST /api/keytool/sign` | `sui keytool sign` | MEDIUM |
| `POST /api/keytool/multisig-address` | `sui keytool multi-sig-address` | MEDIUM |
| `POST /api/keytool/decode-tx` | `sui keytool decode-or-verify-tx` | MEDIUM |

### File Changes

#### New Backend Files
- `packages/server/src/routes/devtools.ts`
- `packages/server/src/routes/security.ts`
- `packages/server/src/routes/dynamic-fields.ts`
- `packages/server/src/routes/keytool.ts`
- `packages/server/src/services/DevToolsService.ts`
- `packages/server/src/services/SecurityService.ts`
- `packages/server/src/services/KeytoolService.ts`

#### New Frontend Files
- `packages/client/src/components/DevTools/`
- `packages/client/src/components/SecurityTools/`
- `packages/client/src/components/DynamicFieldExplorer/`
- `packages/client/src/components/KeytoolManager/`

#### Modified Files
- `packages/server/src/index.ts` - Register new routes
- `packages/client/src/App.tsx` - Add new routes
- `packages/client/src/components/CommandPalette/` - Add command entries
- `FEATURES.md` - Update feature list

## Implementation Phases

### Phase 1: Developer Tools
1. Create DevToolsService with coverage, disassembly, summary methods
2. Create devtools routes
3. Create frontend components

### Phase 2: Security Tools
1. Create SecurityService with verify-source, verify-bytecode methods
2. Create security routes
3. Create frontend components

### Phase 3: Dynamic Fields
1. Add dynamic-fields route
2. Create DynamicFieldExplorer component

### Phase 4: Keytool
1. Create KeytoolService
2. Create keytool routes
3. Create KeytoolManager component

## Verification Steps

- [ ] All new routes return valid JSON
- [ ] Frontend components render correctly
- [ ] Error handling works for invalid inputs
- [ ] CLI commands execute successfully
- [ ] No console errors in browser
- [ ] API documentation updated

## Success Criteria

- Feature coverage: 75% → 95%+
- All tests pass
- No security vulnerabilities in key management
- Documentation complete
