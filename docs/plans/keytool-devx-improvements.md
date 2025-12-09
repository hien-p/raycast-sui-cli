# KeytoolManager DevX Improvements

> **Feature**: Improve Sign, Multi-Sig, and Decode tabs with better workflows and sample data
> **Date**: 2025-12-09
> **Status**: Planning

## Problem Statement

The current KeytoolManager tabs (Sign, Multi-Sig, Decode) lack:
1. **No key selection from existing keys** - Users must manually copy/paste addresses
2. **No sample data** - Developers don't know the expected input format
3. **No workflow guidance** - Steps are not clear for each operation
4. **No quick-fill options** - No way to populate from existing keystore

## User Stories

1. **As a developer**, I want to select signing keys from my keystore dropdown so I don't have to copy/paste addresses manually.

2. **As a developer**, I want to see sample input data so I understand the expected format.

3. **As a developer**, I want to use keys from my keystore for multi-sig creation with one click.

4. **As a developer**, I want to see sample transaction bytes so I can test the decode feature quickly.

5. **As a developer**, I want clear workflow guidance showing what each step does.

## Technical Requirements

### 1. Sign Tab Improvements

```
┌─────────────────────────────────────────────────────┐
│ ✍️ Sign Message                                     │
├─────────────────────────────────────────────────────┤
│ ℹ️ Sign arbitrary data with your private key.       │
│    Useful for message authentication & proofs.      │
├─────────────────────────────────────────────────────┤
│ Select Signer                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔑 my-wallet (0x1234...5678)              ▼    │ │
│ │    ed25519                                     │ │
│ └─────────────────────────────────────────────────┘ │
│ [Or enter address manually]                         │
├─────────────────────────────────────────────────────┤
│ Data to Sign                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Enter data to sign (text or hex)...            │ │
│ └─────────────────────────────────────────────────┘ │
│ Try samples: [Hello World] [Timestamp] [Random]     │
├─────────────────────────────────────────────────────┤
│             [ Sign Message ]                        │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Dropdown to select from existing keys in keystore
- Show key alias, truncated address, and scheme
- Quick sample buttons: "Hello World", current timestamp, random bytes
- Keep manual input option for flexibility
- Clear explanation of what signing does

### 2. Multi-Sig Tab Improvements

```
┌─────────────────────────────────────────────────────┐
│ 👥 Multi-Signature Address                          │
├─────────────────────────────────────────────────────┤
│ ℹ️ Create an address requiring multiple signatures.  │
│    Example: 2-of-3 multisig for team treasury.      │
├─────────────────────────────────────────────────────┤
│ Signers (min 2)                      [+ Add Signer] │
│                                                     │
│ ┌─ Signer 1 ────────────────────────────────────┐  │
│ │ [Select from keystore ▼] or [Enter manually]  │  │
│ │ Weight: [1] ▲▼                    [× Remove]  │  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ ┌─ Signer 2 ────────────────────────────────────┐  │
│ │ [Select from keystore ▼] or [Enter manually]  │  │
│ │ Weight: [1] ▲▼                    [× Remove]  │  │
│ └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│ Threshold Configuration                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Require [2] of 2 signatures (total weight: 2)  │ │
│ └─────────────────────────────────────────────────┘ │
│ Presets: [1-of-2] [2-of-2] [2-of-3]                 │
├─────────────────────────────────────────────────────┤
│ Quick Setup: [Use my first 2 keys] [Use all keys]   │
├─────────────────────────────────────────────────────┤
│          [ Create Multi-Sig Address ]               │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Dropdown to select public keys from keystore
- Visual signer cards with remove button
- Quick-fill buttons: "Use my first 2 keys", "Use all keys"
- Threshold presets: 1-of-2, 2-of-2, 2-of-3
- Clear weight visualization
- Explanation of multi-sig concept

### 3. Decode Tab Improvements

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Decode Transaction                               │
├─────────────────────────────────────────────────────┤
│ ℹ️ Decode transaction bytes to inspect the payload  │
│    before signing. Optionally verify signature.     │
├─────────────────────────────────────────────────────┤
│ Transaction Bytes (Base64)                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ AAACAg...                                       │ │
│ └─────────────────────────────────────────────────┘ │
│ Try: [Sample Transfer TX] [Sample Move Call]        │
├─────────────────────────────────────────────────────┤
│ Signature (Optional - for verification)             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ AG1...                                          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│            [ Decode Transaction ]                   │
├─────────────────────────────────────────────────────┤
│ 📋 Decoded Result                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Kind: TransferSui                               │ │
│ │ Sender: 0x1234...                               │ │
│ │ Recipients: [0xabcd...]                         │ │
│ │ Amount: 1,000,000,000 MIST (1 SUI)              │ │
│ │ Gas Budget: 10,000,000 MIST                     │ │
│ │ ✓ Signature Valid                               │ │
│ └─────────────────────────────────────────────────┘ │
│ [View Raw JSON] [Copy Result]                       │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Sample transaction buttons (transfer, move call examples)
- Structured decoded output (not just raw JSON)
- Humanized values (MIST → SUI conversion)
- Signature validation status with visual indicator
- Toggle between structured view and raw JSON
- Copy decoded result

## File Changes

| File | Changes |
|------|---------|
| `packages/client/src/components/KeytoolManager/index.tsx` | Major refactor for all 3 tabs |

## Implementation Steps

### Step 1: Add Shared State & Helpers
- Load keys on component mount (reuse across tabs)
- Add sample data constants
- Add helper functions for quick-fill

### Step 2: Improve Sign Tab
- Add key selector dropdown
- Add sample data buttons
- Add info box with explanation
- Keep manual input option

### Step 3: Improve Multi-Sig Tab
- Add key picker for each signer
- Add preset threshold buttons
- Add "Use my keys" quick-fill
- Visual signer cards

### Step 4: Improve Decode Tab
- Add sample transaction buttons
- Structure decoded output display
- Add raw JSON toggle
- Humanize values (MIST → SUI)

## Sample Data Constants

```typescript
const SIGN_SAMPLES = {
  helloWorld: 'Hello, Sui!',
  timestamp: () => `Signed at: ${new Date().toISOString()}`,
  randomHex: () => '0x' + Array.from({length: 32}, () =>
    Math.floor(Math.random() * 16).toString(16)).join(''),
};

const DECODE_SAMPLES = {
  // Minimal valid transaction bytes for testing
  transferSample: 'AAACAAgA4fU...', // truncated for plan
  moveCallSample: 'AAADAg...',
};
```

## Verification Steps

1. [ ] Sign tab shows key dropdown with all keys from keystore
2. [ ] Sample buttons populate sign data field correctly
3. [ ] Multi-sig tab allows selecting keys from dropdown
4. [ ] Quick-fill buttons work for multi-sig
5. [ ] Threshold presets work correctly
6. [ ] Decode tab shows sample transactions
7. [ ] Decoded output is structured and readable
8. [ ] Build passes without errors
9. [ ] All existing functionality still works

## Success Metrics

- Developers can complete sign workflow without copy/paste
- Multi-sig creation takes < 30 seconds with quick-fill
- Decode tab provides immediate value with samples
- Clear UX guidance reduces confusion

## Dependencies

- Existing `listKeys()` API
- Existing `signMessage()`, `createMultiSigAddress()`, `decodeTransactionKeytool()` APIs
