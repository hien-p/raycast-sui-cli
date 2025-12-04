# Quick Start Testing Guide

## Prerequisites
- Sui CLI installed and configured
- At least one Sui address in your wallet
- Some SUI tokens for testing (use faucet on testnet/devnet)

## Start the Server

```bash
# Navigate to project root
cd /Users/harryphan/Documents/dev/personal/raycast_sui_cli

# Start the development server
npm run dev:server

# Server will start on http://localhost:3001
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Sui CLI Web - Local Server                               ║
║                                                               ║
║   Server running at: http://localhost:3001                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Test Endpoints

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

Expected:
```json
{"status":"ok","timestamp":"2025-12-04T..."}
```

### 2. Get Active Address
```bash
curl http://localhost:3001/api/addresses/active
```

Expected:
```json
{"success":true,"data":{"address":"0x..."}}
```

Save this address for next tests:
```bash
export MY_ADDRESS="0x..." # Your active address
export RECIPIENT="0x..."  # A recipient address (can be another of your addresses)
```

---

## Transfer Tests

### 3. Get Transferable Coins
```bash
curl http://localhost:3001/api/transfers/sui/coins/$MY_ADDRESS
```

Expected:
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

### 4. Dry Run Transfer (Gas Estimation)
```bash
curl -X POST http://localhost:3001/api/transfers/sui/dry-run \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$RECIPIENT\",
    \"amount\": \"0.1\"
  }"
```

Expected:
```json
{
  "success": true,
  "data": {
    "estimatedGas": "1000000",
    "effects": {...}
  }
}
```

### 5. Transfer SUI (REAL TRANSACTION)
**⚠️ This will actually transfer funds!**

```bash
curl -X POST http://localhost:3001/api/transfers/sui \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$RECIPIENT\",
    \"amount\": \"0.1\"
  }"
```

Expected:
```json
{
  "success": true,
  "data": {
    "digest": "...",
    "gasUsed": "..."
  }
}
```

### 6. Get Transferable Objects
```bash
curl http://localhost:3001/api/transfers/objects/$MY_ADDRESS
```

Expected:
```json
{
  "success": true,
  "data": [
    {
      "objectId": "0x...",
      "type": "0x2::...",
      "owner": "0x...",
      "digest": "..."
    }
  ]
}
```

### 7. Verify Object Ownership
```bash
# Replace OBJECT_ID with an object from previous step
export OBJECT_ID="0x..."

curl -X POST http://localhost:3001/api/transfers/verify-ownership \
  -H "Content-Type: application/json" \
  -d "{
    \"objectId\": \"$OBJECT_ID\",
    \"address\": \"$MY_ADDRESS\"
  }"
```

Expected:
```json
{
  "success": true,
  "data": {
    "isOwner": true
  }
}
```

---

## Key Management Tests

### 8. Get Export Warning
```bash
curl http://localhost:3001/api/keys/export-warning
```

Expected:
```json
{
  "success": true,
  "data": {
    "warning": "⚠️ CRITICAL SECURITY WARNING ⚠️\n..."
  }
}
```

### 9. Export Private Key (SENSITIVE!)
**⚠️ This exports your REAL private key!**

```bash
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$MY_ADDRESS\",
    \"confirmationCode\": \"EXPORT MY KEY\"
  }"
```

Expected:
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

**Test wrong confirmation code:**
```bash
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$MY_ADDRESS\",
    \"confirmationCode\": \"wrong code\"
  }"
```

Expected:
```json
{
  "success": false,
  "error": "Invalid confirmation code. You must type \"EXPORT MY KEY\" exactly."
}
```

### 10. Test Export Rate Limiting
Try exporting 4 times in a row (4th should fail):

```bash
# Try 1
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$MY_ADDRESS\",\"confirmationCode\":\"EXPORT MY KEY\"}"

# Try 2
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$MY_ADDRESS\",\"confirmationCode\":\"EXPORT MY KEY\"}"

# Try 3
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$MY_ADDRESS\",\"confirmationCode\":\"EXPORT MY KEY\"}"

# Try 4 - Should FAIL with rate limit error
curl -X POST http://localhost:3001/api/keys/export \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$MY_ADDRESS\",\"confirmationCode\":\"EXPORT MY KEY\"}"
```

4th request should return:
```json
{
  "success": false,
  "error": "Rate limit exceeded. You can only export 3 keys per hour. Try again in X minutes."
}
```

### 11. Import Key (Test Mode)
**⚠️ Only use test mnemonics/keys!**

For testing, you can:
1. Create a new test address with Sui CLI
2. Export its mnemonic
3. Import it back

```bash
# Get a test mnemonic (you need to have one from creating a test address)
export TEST_MNEMONIC="word1 word2 word3 ... word12"

curl -X POST http://localhost:3001/api/keys/import \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"mnemonic\",
    \"input\": \"$TEST_MNEMONIC\",
    \"keyScheme\": \"ed25519\",
    \"alias\": \"test-import\"
  }"
```

Expected:
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "alias": "test-import"
  }
}
```

### 12. Check Duplicate Address
```bash
curl -X POST http://localhost:3001/api/keys/check-duplicate \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$MY_ADDRESS\"
  }"
```

Expected:
```json
{
  "success": true,
  "data": {
    "isDuplicate": true
  }
}
```

---

## Error Testing

### Test Invalid Address Format
```bash
curl -X POST http://localhost:3001/api/transfers/sui \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"invalid_address\",
    \"amount\": \"0.1\"
  }"
```

Expected:
```json
{
  "success": false,
  "error": "to: Invalid Sui address format (expected 0x + 64 hex chars)"
}
```

### Test Invalid Amount
```bash
curl -X POST http://localhost:3001/api/transfers/sui \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$RECIPIENT\",
    \"amount\": \"-1\"
  }"
```

Expected:
```json
{
  "success": false,
  "error": "Amount must be a positive number"
}
```

### Test Invalid Mnemonic
```bash
curl -X POST http://localhost:3001/api/keys/import \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"mnemonic\",
    \"input\": \"only five words here oops\",
    \"keyScheme\": \"ed25519\"
  }"
```

Expected:
```json
{
  "success": false,
  "error": "Invalid mnemonic word count. Expected 12, 15, 18, 21, or 24 words, got 5"
}
```

---

## Complete Test Script

Save this as `test-all.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "=== Sui CLI Web API Testing ==="
echo ""

# Get active address
echo "1. Getting active address..."
RESPONSE=$(curl -s $BASE_URL/addresses/active)
MY_ADDRESS=$(echo $RESPONSE | grep -o '0x[a-fA-F0-9]\{64\}')
echo "   Active address: $MY_ADDRESS"
echo ""

# Get coins
echo "2. Getting transferable coins..."
curl -s $BASE_URL/transfers/sui/coins/$MY_ADDRESS | jq
echo ""

# Get objects
echo "3. Getting transferable objects..."
curl -s $BASE_URL/transfers/objects/$MY_ADDRESS | jq
echo ""

# Get export warning
echo "4. Getting export warning..."
curl -s $BASE_URL/keys/export-warning | jq -r '.data.warning'
echo ""

# Test invalid amount
echo "5. Testing invalid amount (should fail)..."
curl -s -X POST $BASE_URL/transfers/sui \
  -H "Content-Type: application/json" \
  -d '{"to":"0x1234","amount":"-1"}' | jq
echo ""

# Test invalid confirmation code
echo "6. Testing invalid confirmation code (should fail)..."
curl -s -X POST $BASE_URL/keys/export \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$MY_ADDRESS\",\"confirmationCode\":\"wrong\"}" | jq
echo ""

echo "=== All tests completed ==="
```

Run it:
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## Monitoring Logs

Watch server logs in real-time:
```bash
# In the terminal where server is running, you'll see:
[INFO] GET /api/transfers/sui/coins/0x...
[INFO] POST /api/transfers/sui
[ERROR] Transfer SUI failed: ...
[INFO] POST /api/keys/export
```

---

## Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
lsof -ti:3001

# Kill process if needed
lsof -ti:3001 | xargs kill -9

# Restart server
npm run dev:server
```

### "Sui CLI not found" error
```bash
# Check Sui installation
sui --version

# If not installed, install it:
cargo install --locked --git https://github.com/MystenLabs/sui.git sui
```

### "No active address" error
```bash
# Create a new address
sui client new-address ed25519

# Switch to it
sui client switch --address 0x...
```

### "Insufficient funds" error
```bash
# Get testnet tokens
sui client faucet --url https://faucet.testnet.sui.io/v2/gas

# Check balance
sui client balance
```

---

## Next Steps

Once backend is tested and working:
1. Start implementing frontend UI components
2. Integrate with CommandPalette
3. Add transaction history
4. Add notifications/toasts
5. Deploy to production

---

## Security Reminders

- ⚠️ Never share exported private keys
- ⚠️ Only use test addresses for testing
- ⚠️ Don't commit private keys to git
- ⚠️ Be cautious with real funds on mainnet
- ⚠️ Always dry-run transfers first

---

**Happy Testing! 🚀**
