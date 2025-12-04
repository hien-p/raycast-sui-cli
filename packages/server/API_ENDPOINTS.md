# Sui CLI Web - Complete API Endpoints

## Base URL
```
http://localhost:3001/api
```

---

## Transfer Endpoints

### 1. Transfer SUI
Transfer SUI tokens from active address to recipient.

**Endpoint**: `POST /transfers/sui`

**Request Body**:
```json
{
  "to": "0x...",
  "amount": "0.1",
  "coinId": "0x..." (optional),
  "gasBudget": "10000000" (optional, in MIST)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "digest": "...",
    "gasUsed": "..."
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/transfers/sui \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x123...",
    "amount": "0.5"
  }'
```

---

### 2. Dry Run Transfer SUI
Estimate gas before actual transfer.

**Endpoint**: `POST /transfers/sui/dry-run`

**Request Body**: Same as Transfer SUI

**Response**:
```json
{
  "success": true,
  "data": {
    "estimatedGas": "1000000",
    "effects": { ... }
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/transfers/sui/dry-run \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x123...",
    "amount": "0.5"
  }'
```

---

### 3. Get Transferable Coins
Get all coins available for transfer (gas coins).

**Endpoint**: `GET /transfers/sui/coins/:address`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "coinObjectId": "0x...",
      "balance": "1000000000",
      "balanceSui": "1.0000"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3001/api/transfers/sui/coins/0x123...
```

---

### 4. Transfer Object/NFT
Transfer an object or NFT to recipient.

**Endpoint**: `POST /transfers/object`

**Request Body**:
```json
{
  "to": "0x...",
  "objectId": "0x...",
  "gasBudget": "10000000" (optional)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "digest": "...",
    "gasUsed": "..."
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/transfers/object \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x123...",
    "objectId": "0xabc..."
  }'
```

---

### 5. Dry Run Transfer Object
Estimate gas before transferring object.

**Endpoint**: `POST /transfers/object/dry-run`

**Request Body**: Same as Transfer Object

**Response**:
```json
{
  "success": true,
  "data": {
    "estimatedGas": "1000000",
    "effects": { ... }
  }
}
```

---

### 6. Get Transferable Objects
Get all transferable objects (excludes coins).

**Endpoint**: `GET /transfers/objects/:address`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "objectId": "0x...",
      "type": "0x2::example::NFT",
      "owner": "0x...",
      "digest": "..."
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3001/api/transfers/objects/0x123...
```

---

### 7. Verify Object Ownership
Check if an address owns a specific object.

**Endpoint**: `POST /transfers/verify-ownership`

**Request Body**:
```json
{
  "objectId": "0x...",
  "address": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isOwner": true
  }
}
```

---

## Key Management Endpoints

### 8. Get Export Warning
Get the security warning text before exporting keys.

**Endpoint**: `GET /keys/export-warning`

**Response**:
```json
{
  "success": true,
  "data": {
    "warning": "⚠️ CRITICAL SECURITY WARNING ⚠️\n..."
  }
}
```

**Example**:
```bash
curl http://localhost:3001/api/keys/export-warning
```

---

### 9. Export Private Key
Export the private key for an address. **HIGHLY SENSITIVE**.

**Endpoint**: `POST /keys/export`

**Request Body**:
```json
{
  "address": "0x..." or "alias",
  "confirmationCode": "EXPORT MY KEY"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "privateKey": "suiprivkey...",
    "keyScheme": "ed25519",
    "publicKey": "...",
    "warning": "⚠️ CRITICAL SECURITY WARNING ⚠️\n..."
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x123...",
    "confirmationCode": "EXPORT MY KEY"
  }'
```

**Rate Limits**:
- Max 3 exports per hour per address
- If exceeded: "Rate limit exceeded. Try again in X minutes."

---

### 10. Import Key
Import a key from mnemonic or private key.

**Endpoint**: `POST /keys/import`

**Request Body**:
```json
{
  "type": "mnemonic" | "privatekey",
  "input": "word1 word2 ..." or "suiprivkey...",
  "keyScheme": "ed25519" | "secp256k1" | "secp256r1",
  "alias": "my-wallet" (optional)
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "alias": "my-wallet"
  }
}
```

**Example - Import from Mnemonic**:
```bash
curl -X POST http://localhost:3001/api/keys/import \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mnemonic",
    "input": "word1 word2 word3 ... word12",
    "keyScheme": "ed25519",
    "alias": "imported-wallet"
  }'
```

**Example - Import from Private Key**:
```bash
curl -X POST http://localhost:3001/api/keys/import \
  -H "Content-Type: application/json" \
  -d '{
    "type": "privatekey",
    "input": "suiprivkey...",
    "keyScheme": "ed25519"
  }'
```

**Validation**:
- Mnemonic: Must be 12, 15, 18, 21, or 24 words
- Private Key: Must start with "suiprivkey"
- Key Scheme: Must be ed25519, secp256k1, or secp256r1

---

### 11. Check Duplicate Address
Check if an address already exists before importing.

**Endpoint**: `POST /keys/check-duplicate`

**Request Body**:
```json
{
  "address": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isDuplicate": false
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/keys/check-duplicate \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x123..."
  }'
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Codes**:
- `400` - Validation error (invalid input)
- `500` - Server error (CLI execution failed)
- `429` - Rate limit exceeded

---

## Rate Limits

| Endpoint Category | Limit |
|------------------|-------|
| Read operations (GET) | 100 requests/minute |
| Write operations (POST) | 50 requests/minute |
| Transfer operations | 50 requests/minute |
| Key export | 3 exports/hour per address |
| Key import | 50 requests/minute |

---

## Security Notes

1. **Transfer Operations**:
   - Always use dry-run before actual transfers
   - Validate recipient address format
   - Check balance before transfer
   - Gas estimation prevents insufficient funds errors

2. **Key Export**:
   - Requires exact confirmation code: "EXPORT MY KEY"
   - Rate limited to 3 exports/hour
   - Never logged or stored
   - Display warning message to user

3. **Key Import**:
   - Validate mnemonic word count
   - Validate private key format
   - Check for duplicate addresses
   - Never log sensitive input

4. **General**:
   - All sensitive operations rate-limited
   - Error messages sanitized (no file paths)
   - Private keys never appear in logs
   - Server binds to localhost only

---

## Testing Checklist

### Transfer SUI
- [ ] Transfer with default gas budget
- [ ] Transfer with specific coin ID
- [ ] Transfer with custom gas budget
- [ ] Dry run before transfer
- [ ] Get transferable coins
- [ ] Invalid amount (negative)
- [ ] Invalid recipient address
- [ ] Insufficient balance

### Transfer Object
- [ ] Transfer NFT/object
- [ ] Dry run before transfer
- [ ] Get transferable objects
- [ ] Verify ownership before transfer
- [ ] Invalid object ID
- [ ] Non-owned object

### Key Export
- [ ] Export with correct confirmation
- [ ] Export with wrong confirmation
- [ ] Export rate limit (4th request fails)
- [ ] Export with address
- [ ] Export with alias
- [ ] Get warning text first

### Key Import
- [ ] Import from 12-word mnemonic
- [ ] Import from 24-word mnemonic
- [ ] Import from private key
- [ ] Import with alias
- [ ] Invalid mnemonic (wrong word count)
- [ ] Invalid private key format
- [ ] Check duplicate before import

---

## Complete Test Script

```bash
# Set variables
BASE_URL="http://localhost:3001/api"
ADDRESS="0x..." # Your address
RECIPIENT="0x..." # Recipient address

# 1. Get transferable coins
curl $BASE_URL/transfers/sui/coins/$ADDRESS

# 2. Dry run transfer
curl -X POST $BASE_URL/transfers/sui/dry-run \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$RECIPIENT\",\"amount\":\"0.1\"}"

# 3. Transfer SUI
curl -X POST $BASE_URL/transfers/sui \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$RECIPIENT\",\"amount\":\"0.1\"}"

# 4. Get export warning
curl $BASE_URL/keys/export-warning

# 5. Export key (use with caution!)
curl -X POST $BASE_URL/keys/export \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$ADDRESS\",\"confirmationCode\":\"EXPORT MY KEY\"}"
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `services/TransferService.ts` | Transfer business logic |
| `services/KeyManagementService.ts` | Key export/import logic |
| `routes/transfer.ts` | Transfer HTTP endpoints |
| `routes/key-management.ts` | Key management endpoints |
| `shared/src/index.ts` | TypeScript types |
| `utils/validation.ts` | Input validation |

---

## Next Steps (UI Implementation)

After backend is tested and working:

1. **Transfer UI Components**:
   - TransferSUI dialog with amount input
   - TransferObject dialog with object picker
   - Gas estimation display
   - Confirmation modal

2. **Key Management UI**:
   - Export key dialog with warning
   - Import key dialog with type selector
   - Security warnings display
   - Rate limit feedback

3. **Integration**:
   - Add to CommandPalette
   - Add to sidebar menu
   - Add keyboard shortcuts
   - Add success/error toasts
