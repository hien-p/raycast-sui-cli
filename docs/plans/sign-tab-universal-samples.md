# Sign Tab - Universal Sample Generation

> **Feature**: Make Sign tab work for all users by generating samples dynamically
> **Date**: 2025-12-09
> **Status**: Planning

## Problem Statement

Current Sign tab sample transaction bytes contain a hardcoded address, meaning:
1. Only the original address owner can sign the sample
2. Other users get errors when trying to sign
3. Poor DevX - users don't understand what went wrong

## Solution

Instead of static sample bytes, provide:
1. **"Generate Sample TX" button** - Creates a real transfer TX using the selected signer's address
2. **Better explanation** - Clarify that TX bytes must be for the signing address
3. **Remove static samples** - They're misleading and don't work universally

## User Stories

1. **As a developer**, I want to generate a sample transaction for MY address so I can test signing.
2. **As a developer**, I want clear guidance on how to get transaction bytes.
3. **As a developer**, I want to understand why a transaction might fail to sign.

## Technical Requirements

### 1. Backend: Add endpoint to generate sample TX bytes

**New endpoint**: `POST /keytool/generate-sample-tx`

```typescript
// Request
{
  address: string;  // The address to create TX for
}

// Response
{
  txBytes: string;  // Base64 encoded transaction bytes
  description: string;  // What this TX does
}
```

**Implementation**:
- Use `sui client transfer-sui --serialize-unsigned-transaction`
- Transfer 1 MIST to same address (self-transfer, harmless)
- Return the serialized bytes

### 2. Frontend: Replace static samples with dynamic generation

```
┌─────────────────────────────────────────────────────┐
│ Transaction Bytes (Base64)                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ (empty or user-entered bytes)                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [ Generate Sample TX ]  ← Uses selected signer      │
│                                                     │
│ 💡 Tip: Get TX bytes using:                         │
│    sui client transfer-sui --serialize-unsigned...  │
└─────────────────────────────────────────────────────┘
```

### 3. UX Improvements

- Show spinner while generating sample
- Show success message with TX description
- Disable "Generate" if no signer selected
- Add tooltip explaining what the sample does

## File Changes

| File | Changes |
|------|---------|
| `packages/server/src/routes/keytool.ts` | Add `/generate-sample-tx` endpoint |
| `packages/server/src/services/KeytoolService.ts` | Add `generateSampleTransaction()` method |
| `packages/client/src/api/client.ts` | Add `generateSampleTx()` function |
| `packages/client/src/components/KeytoolManager/index.tsx` | Replace static samples with Generate button |

## Implementation Steps

### Step 1: Backend - Add generateSampleTransaction to KeytoolService
- Execute `sui client transfer-sui` with `--serialize-unsigned-transaction`
- Parse and return the bytes
- Handle errors gracefully

### Step 2: Backend - Add route endpoint
- POST `/keytool/generate-sample-tx`
- Validate address parameter
- Call service method

### Step 3: Frontend - Add API function
- `generateSampleTx(address: string)`
- Return `{ txBytes, description }`

### Step 4: Frontend - Update Sign tab UI
- Remove static TX_SAMPLES constant
- Add "Generate Sample TX" button
- Add loading state
- Add tip section explaining how to get TX bytes

## Verification Steps

1. [ ] Select a signer from dropdown
2. [ ] Click "Generate Sample TX"
3. [ ] Verify TX bytes are populated
4. [ ] Click "Sign Transaction"
5. [ ] Verify signature is created successfully
6. [ ] Test with different keys/addresses
7. [ ] Build passes without errors

## Success Metrics

- Any user with keys can generate and sign sample transactions
- Clear UX guidance reduces confusion
- No hardcoded addresses in codebase
