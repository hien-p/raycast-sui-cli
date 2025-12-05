# Troubleshooting Guide

Common issues and solutions for Sui CLI Web.

## Table of Contents

1. [Server Connection Issues](#server-connection-issues)
2. [Sui CLI Not Found](#sui-cli-not-found)
3. [Port Conflicts](#port-conflicts)
4. [Installation Problems](#installation-problems)
5. [Transfer Issues](#transfer-issues)
6. [Gas & Balance Issues](#gas--balance-issues)
7. [Faucet Issues](#faucet-issues)
8. [Community & Tier Issues](#community--tier-issues)
9. [Move Development Issues](#move-development-issues)
10. [Browser & Performance](#browser--performance)

---

## Server Connection Issues

### "Cannot connect to local server"

**Symptoms:**
- Web UI shows setup instructions page
- Error message: "Waiting for local server connection..."

**Solutions:**

#### 1. Check if server is running

**macOS/Linux:**
```bash
ps aux | grep sui-cli-web
```

**Windows (PowerShell):**
```powershell
Get-Process | Select-String "node.*sui-cli-web-server"
```

If no process is found, start the server:
```bash
npx sui-cli-web
```

#### 2. Verify port 3001 is accessible

**Test connection:**
```bash
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{"success":true,"data":{"status":"ok"}}
```

If connection fails:
- Check firewall settings
- Verify nothing is blocking localhost access
- Try restarting the server

#### 3. Check server logs

Look for errors in the terminal where the server is running:

**Common error patterns:**
- "Port 3001 already in use" → See [Port Conflicts](#port-conflicts)
- "Sui CLI not found" → See [Sui CLI Not Found](#sui-cli-not-found)
- "Permission denied" → Run with proper permissions

#### 4. Clear browser cache

Sometimes cached data causes connection issues:

1. Open browser developer tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

Or use incognito/private mode to test.

#### 5. Restart everything

Nuclear option that often works:

1. Stop the server (Ctrl+C)
2. Close the web browser
3. Restart the server: `npx sui-cli-web-server`
4. Open browser and navigate to the web UI

---

## Sui CLI Not Found

### "Sui CLI is not installed" or "sui: command not found"

**Symptoms:**
- Server reports Sui CLI is not available
- Running `sui --version` fails

**Solutions:**

#### 1. Verify Sui CLI installation

```bash
sui --version
```

If command not found, Sui CLI is not installed. Follow installation guide for your OS:
- [macOS Installation](GETTING_STARTED.md#macos)
- [Linux Installation](GETTING_STARTED.md#linux)
- [Windows Installation](GETTING_STARTED.md#windows)

#### 2. Check PATH environment variable

**macOS/Linux:**
```bash
echo $PATH
```

Sui should be in: `~/.cargo/bin` (if installed via Cargo) or `/usr/local/bin` (if installed via Homebrew)

**Add to PATH if missing:**
```bash
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
$env:Path -split ';'
```

Add to PATH if missing:
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\YourUsername\.cargo\bin", "User")
```

#### 3. Reinstall Sui CLI

**Via Cargo (all platforms):**
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

**Via Homebrew (macOS):**
```bash
brew reinstall sui
```

**Via Chocolatey (Windows):**
```powershell
choco install sui --force
```

#### 4. Verify after installation

```bash
sui --version
which sui  # macOS/Linux
where sui  # Windows
```

---

## Port Conflicts

### "Port 3001 already in use"

**Symptoms:**
- Server fails to start
- Error: "EADDRINUSE: address already in use :::3001"

**Solutions:**

#### 1. Find process using port 3001

**macOS/Linux:**
```bash
lsof -ti:3001
```

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3001
```

#### 2. Kill the process

**macOS/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Windows (PowerShell):**
```powershell
# Get the PID from netstat output, then:
taskkill /PID <PID> /F
```

#### 3. Restart the server

```bash
npx sui-cli-web
```

#### 4. Use alternative port (advanced)

If you need port 3001 for something else:

1. Edit server configuration (if running from source)
2. Update the port in `packages/server/src/index.ts`
3. Rebuild and restart

**Note:** Web UI is hardcoded to connect to port 3001. Custom ports require modifying client code.

---

## Installation Problems

### Node.js version too old

**Symptoms:**
- Error: "Node version must be >= 18.0.0"

**Solution:**

Update Node.js to version 18 or higher:

**macOS (Homebrew):**
```bash
brew update
brew upgrade node
```

**Linux (NodeSource):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows (Chocolatey):**
```powershell
choco upgrade nodejs-lts
```

**Verify:**
```bash
node --version  # Should show v18.x.x or higher
```

### npm/npx not found

**Symptoms:**
- "npx: command not found"
- "npm: command not found"

**Solution:**

npm comes with Node.js. If missing:

1. Reinstall Node.js (includes npm)
2. Verify PATH includes npm:
   ```bash
   which npm  # macOS/Linux
   where npm  # Windows
   ```

### Cargo not found (Linux/Windows)

**Symptoms:**
- "cargo: command not found" when installing Sui CLI

**Solution:**

Install Rust and Cargo:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env  # Reload shell
```

**Verify:**
```bash
cargo --version
```

---

## Transfer Issues

### "Insufficient gas"

**Symptoms:**
- Transfer fails with "Not enough gas"
- Transaction rejected

**Solutions:**

1. **Check your balance:**
   - Navigate to Manage Addresses
   - Verify you have enough SUI

2. **Request faucet tokens (testnet):**
   - Navigate to Request Faucet
   - Click "Request Tokens"

3. **Merge gas coins:**
   - Navigate to Manage Gas
   - Merge small coins into larger ones

4. **Use a different coin:**
   - In transfer form, select a coin with higher balance

### "Invalid address"

**Symptoms:**
- Error: "Invalid Sui address"
- Transfer form rejects address

**Solutions:**

1. **Verify address format:**
   - Must start with `0x`
   - Must be 64 hexadecimal characters (after 0x)
   - Example: `0x1234567890abcdef...` (66 chars total)

2. **Copy-paste carefully:**
   - Don't include extra spaces
   - Don't truncate the address
   - Use the full address

3. **Check network:**
   - Addresses are network-specific
   - Testnet address won't work on mainnet

### Transfer stuck or pending

**Symptoms:**
- Transfer shows "Transferring..." indefinitely
- No confirmation or error

**Solutions:**

1. **Wait:** Some transactions take 30-60 seconds
2. **Check block explorer:** Verify transaction status on SuiVision
3. **Refresh page:** Sometimes UI doesn't update
4. **Check server logs:** Look for error messages

---

## Gas & Balance Issues

### Balance not updating

**Symptoms:**
- Balance shows old value
- Transfers completed but balance unchanged

**Solutions:**

1. **Wait for auto-refresh:** Balance updates every 15-60 seconds
2. **Manual refresh:** Click refresh button in address list
3. **Hard refresh browser:** Ctrl+Shift+R (or Cmd+Shift+R)
4. **Check RPC status:** Network might be slow

### "No gas coins available"

**Symptoms:**
- Cannot perform transactions
- Error: "No gas available"

**Solutions:**

1. **Get SUI tokens:**
   - Testnet: Use faucet
   - Mainnet: Purchase or receive SUI

2. **Check network:**
   - Switch to testnet if you need free tokens
   - Verify you're on correct network

3. **Merge dust:**
   - If you have many tiny coins, merge them
   - Navigate to Manage Gas → Merge

---

## Faucet Issues

### "Rate limit exceeded"

**Symptoms:**
- Faucet request rejected
- Error: "Too many requests"

**Solutions:**

1. **Wait 60 minutes:** Official faucet has 1-hour cooldown
2. **Use external faucets:** Try alternative faucets listed in UI
3. **Use different address:** Request with another address
4. **Use Discord faucet:** Join Sui Discord and use faucet command

### "Faucet is empty"

**Symptoms:**
- Faucet request fails
- Error: "Insufficient funds in faucet"

**Solutions:**

1. **Try later:** Faucets refill periodically
2. **Use alternative faucets:** Check all 6+ faucet options
3. **Request small amount:** Some faucets limit per-request amount
4. **Use Discord:** Community faucet often has more capacity

### Faucet request succeeds but no tokens received

**Solutions:**

1. **Wait 60 seconds:** Network propagation takes time
2. **Check transaction on explorer:** Verify it completed
3. **Refresh balance:** Hard refresh browser
4. **Verify network:** Ensure you're on testnet
5. **Try again:** Sometimes requests fail silently

---

## Community & Tier Issues

### "Not eligible to join community"

**Symptoms:**
- Join button disabled
- Error: "Requirements not met"

**Solutions:**

1. **Check requirements:**
   - Minimum 10 SUI balance
   - Minimum 10 transactions on address

2. **Get SUI:**
   - Use faucet (testnet)
   - Purchase (mainnet)

3. **Make transactions:**
   - Send small amounts to yourself
   - Split/merge gas coins
   - Deploy test contracts

4. **Refresh eligibility:** Click refresh to re-check

### Tier not updating

**Symptoms:**
- Made transactions but tier unchanged
- Deployed contracts but still same tier

**Solutions:**

1. **Manual refresh:** Navigate to Membership Profile → Refresh Tier
2. **Wait for blockchain indexing:** Can take 5-10 minutes
3. **Verify transaction count:** Check on block explorer
4. **Check tier requirements:** Review tier progression table

### "Already a member" error

**Symptoms:**
- Join fails with "Address already registered"

**Solutions:**

This is expected if you've already joined. To view your membership:
1. Navigate to Membership Profile
2. View your current tier and stats

---

## Move Development Issues

### Build fails with "Move.toml not found"

**Symptoms:**
- Build error: "Cannot find Move.toml"

**Solutions:**

1. **Verify project path:** Must be absolute path to project root
2. **Check project structure:** Ensure Move.toml exists
3. **Create new project:** Use New Project feature to generate structure

### "Dependency resolution failed"

**Symptoms:**
- Build fails during dependency download
- Error: "Failed to fetch dependency"

**Solutions:**

1. **Check internet connection**
2. **Verify Move.toml dependencies:** Ensure correct URLs and versions
3. **Skip verification:** Check "Skip Dependency Verification" (for testing)
4. **Clear Sui cache:**
   ```bash
   rm -rf ~/.move
   ```

### Publish fails with "Upgrade Cap not found"

**Symptoms:**
- Upgrade fails: "UpgradeCap object not found"

**Solutions:**

1. **Verify UpgradeCap object ID:** Copy from original publish transaction
2. **Check ownership:** You must own the UpgradeCap
3. **Verify network:** Must be same network as original publish
4. **Check object version:** Object might have been used/modified

### Tests fail to run

**Symptoms:**
- Test command hangs
- No test output

**Solutions:**

1. **Verify test files exist:** Check `tests/` directory
2. **Check test syntax:** Ensure tests are properly formatted
3. **Run with verbose flag:** See detailed error messages
4. **Check project path:** Must point to project root

---

## Browser & Performance

### Web UI loads slowly

**Solutions:**

1. **Check server:** Ensure localhost:3001 is responsive
2. **Clear cache:** Browser cache might be corrupted
3. **Disable extensions:** Browser extensions can slow things down
4. **Try different browser:** Test in Chrome/Firefox/Safari
5. **Check network:** Slow RPC can affect performance

### UI not responding

**Solutions:**

1. **Check JavaScript console:** Open DevTools (F12) → Console
2. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R)
3. **Clear local storage:**
   - DevTools → Application → Local Storage
   - Clear all entries for the site
4. **Restart browser**

### Memory issues with large object lists

**Solutions:**

1. **Use pagination:** Don't load all objects at once
2. **Filter objects:** Use type filters to reduce count
3. **Refresh browser:** Free up memory
4. **Increase browser memory limit** (advanced)

---

## Advanced Troubleshooting

### Enable debug mode

For detailed error messages:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages (red text)
4. Check Network tab for failed requests

### Check server logs

Server logs show detailed error information:

1. Find the terminal running `npx sui-cli-web-server`
2. Look for error messages
3. Common patterns:
   - "Error executing sui command"
   - "RPC request failed"
   - "Invalid transaction"

### Verify Sui CLI config

Check your Sui CLI configuration:

```bash
cat ~/.sui/sui_config/client.yaml
```

**Should include:**
- Active address
- Active environment
- Keystore path
- Environment RPC URLs

### Reset Sui CLI config

**Warning:** This deletes your local Sui configuration (but not your recovery phrases if backed up).

```bash
rm -rf ~/.sui/sui_config
sui client
```

Follow prompts to recreate configuration.

### Network diagnostics

Test RPC connectivity:

**Testnet:**
```bash
curl https://fullnode.testnet.sui.io:443/
```

**Mainnet:**
```bash
curl https://fullnode.mainnet.sui.io:443/
```

**Expected:** JSON-RPC response

---

## Getting Help

If you've tried everything and still have issues:

### 1. Gather information

Before asking for help, collect:
- Operating system and version
- Node.js version: `node --version`
- Sui CLI version: `sui --version`
- Server logs (copy recent errors)
- Browser console errors (F12 → Console)
- Steps to reproduce the issue

### 2. Check existing issues

Search GitHub issues: [github.com/hien-p/raycast-sui-cli/issues](https://github.com/hien-p/raycast-sui-cli/issues)

Your issue might already be reported and solved.

### 3. Create a new issue

If no existing issue matches:

1. Go to [GitHub Issues](https://github.com/hien-p/raycast-sui-cli/issues/new)
2. Use a clear title (e.g., "Transfer fails with insufficient gas on testnet")
3. Include all information from step 1
4. Describe expected vs actual behavior
5. Add screenshots if helpful

### 4. Community support

- **Sui Discord:** [discord.gg/sui](https://discord.gg/sui)
- **Sui Forum:** [forums.sui.io](https://forums.sui.io)
- **Project Discussions:** GitHub Discussions tab

---

## Preventive Maintenance

### Keep software updated

**Update Sui CLI:**
```bash
# Via Cargo
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui --force

# Via Homebrew (macOS)
brew upgrade sui
```

**Update sui-cli-web-server:**
```bash
npm update -g sui-cli-web
```

**Update Node.js:**
```bash
# macOS
brew upgrade node

# Linux (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
choco upgrade nodejs-lts
```

### Regular backups

**Backup Sui configuration:**
```bash
cp -r ~/.sui/sui_config ~/sui_config_backup_$(date +%Y%m%d)
```

**Backup recovery phrases:** Store in password manager, not on disk

### Monitor disk space

Sui data can grow large:

```bash
du -sh ~/.sui
```

If too large, consider clearing old data (be careful with keystore).

---

**Still stuck?** Open an issue on [GitHub](https://github.com/hien-p/raycast-sui-cli/issues) with detailed information.
