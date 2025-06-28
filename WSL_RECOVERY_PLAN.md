# 🛡️ WSL Recovery & Testing Plan (Playwright-Aware)

> **Created**: 2025-06-14  
> **Purpose**: Recovery guide for WSL crashes and safe development/testing configuration  
> **Context**: System crashed due to memory exhaustion + unsafe network binding (`--host 0.0.0.0`)

## 🚨 Critical Issues That Caused the Crash

1. **Memory Crisis**: WSL had only 580Mi available out of 1.9Gi total RAM
2. **Unsafe Network Binding**: `--host 0.0.0.0` exposed dev server to ALL interfaces
3. **Process Duplication**: Multiple MCP server instances consuming memory
4. **No Swap Space**: 0B swap configured = instant crash on memory exhaustion
5. **Cross-filesystem penalty**: Project in `/mnt/c/` has slower performance

## Phase 1: Immediate Memory & Process Cleanup (5 mins)

### 1. Clean duplicate processes:
```bash
# Kill duplicate MCP servers but keep one of each type
ps aux | grep playwright-mcp | awk '{print $2}' | sort -nr | tail -n +2 | xargs -r kill -TERM
ps aux | grep notion | awk '{print $2}' | sort -nr | tail -n +2 | xargs -r kill -TERM
```

### 2. Configure WSL resources (Windows PowerShell as Admin):
```powershell
# Create .wslconfig with safe settings
@"
[wsl2]
memory=4GB
swap=2GB
processors=2
localhostForwarding=true
networkingMode=NAT
"@ | Out-File -FilePath "$env:USERPROFILE\.wslconfig" -Encoding UTF8

wsl --shutdown
# Wait 10 seconds before restarting
```

## Phase 2: Safe Frontend Access Strategy (10 mins)

### A. Development Access (Manual Testing)

```bash
# Backend (already running on 3001)
cd /mnt/c/Users/spide/Documents/GitHub/ALNTool/storyforge/backend
# Verify it's running: curl http://localhost:3001/health

# Frontend - Use Vite's safe defaults
cd /mnt/c/Users/spide/Documents/GitHub/ALNTool/storyforge/frontend
npm run dev  # NO --host flag!
```

**Access Methods** (in order of safety):

1. **WSL IP Method**: 
   ```bash
   # Get WSL IP
   ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
   # Access via: http://[WSL-IP]:5173
   ```

2. **localhost with WSL2 magic**: `http://localhost:5173`

3. **Windows Port Proxy** (if needed):
   ```powershell
   # Run in Windows PowerShell as Admin
   $wslIp = wsl hostname -I
   netsh interface portproxy add v4tov4 listenport=5173 listenaddress=127.0.0.1 connectport=5173 connectaddress=$wslIp
   ```

### B. Playwright Testing Configuration

1. **Create safe test config** (`vite.config.test.js`):
   ```javascript
   import { defineConfig } from 'vite';
   
   export default defineConfig({
     server: {
       host: 'localhost',  // Bind to loopback only
       port: 5174,        // Different port for tests
       strictPort: true,
       hmr: {
         host: 'localhost'
       }
     }
   });
   ```

2. **Configure Playwright for WSL** (`playwright.config.js`):
   ```javascript
   export default defineConfig({
     use: {
       baseURL: 'http://localhost:5174',
       headless: true,  // Required in WSL without display
       viewport: { width: 1280, height: 720 },
       ignoreHTTPSErrors: true,
       video: 'retain-on-failure'
     },
     
     webServer: {
       command: 'npm run dev -- --config vite.config.test.js',
       port: 5174,
       timeout: 120 * 1000,
       reuseExistingServer: !process.env.CI
     }
   });
   ```

## Phase 3: Playwright Browser Installation (15 mins)

### Option 1: Headless-Only Testing (RECOMMENDED)
```bash
# Install dependencies for headless Chromium
sudo apt update
sudo apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libasound2

# Install Chromium for Playwright
cd /mnt/c/Users/spide/Documents/GitHub/ALNTool/storyforge/frontend
npx playwright install chromium
```

### Option 2: Use System Chrome (Alternative)
```javascript
// In playwright.config.js
use: {
  launchOptions: {
    executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}
```

## Phase 4: Safe Testing Workflow

### 1. Test Script with Resource Protection (`safe-test.sh`):
```bash
#!/bin/bash
# Monitor memory before starting
echo "Memory before: $(free -h | grep Mem)"

# Check if test server already running
if lsof -i :5174 > /dev/null 2>&1; then
  echo "Test server already running on port 5174"
  exit 1
fi

# Run tests with memory limit
NODE_OPTIONS="--max-old-space-size=1024" npx playwright test

# Show memory after
echo "Memory after: $(free -h | grep Mem)"
```

### 2. Progressive Testing Approach:
```bash
# Step 1: API tests only (no browser)
npx playwright test tests/api/

# Step 2: Headless UI tests
npx playwright test tests/e2e/ --project=chromium-headless

# Step 3: Full tests (only if stable)
npx playwright test
```

## Phase 5: Monitoring & Prevention

### 1. Resource Monitor (`monitor.sh`):
```bash
#!/bin/bash
while true; do
  clear
  echo "=== WSL Resource Monitor ==="
  echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2" ("$4" free)"}')"
  echo "Swap: $(free -h | grep Swap | awk '{print $3"/"$2}')"
  echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
  echo "Node processes: $(pgrep -c node)"
  echo "Network listeners: $(ss -tlnp 2>/dev/null | grep -E ':(3000|3001|5173|5174)' | wc -l)"
  sleep 5
done
```

### 2. Development Checklist:
- ✅ Never use `--host 0.0.0.0`
- ✅ Always use headless mode for Playwright in WSL
- ✅ Monitor memory usage during tests
- ✅ Use different ports for dev vs test
- ✅ Clean up processes after testing

## Immediate Recovery Commands

```bash
# 1. Clean environment
pkill -f "playwright-mcp.*--port 333[45]"  # Kill duplicate Playwright servers

# 2. Verify servers
curl http://localhost:3001/health  # Backend check
curl http://localhost:5173  # Frontend check

# 3. Safe manual test
# Open Windows browser to http://localhost:5173

# 4. Run headless Playwright test
NODE_OPTIONS="--max-old-space-size=512" npx playwright test --project=chromium --headed=false
```

## Key Safety Rules

1. **NEVER use `--host 0.0.0.0`** - This binds to ALL network interfaces and can crash WSL
2. **Use `localhost` or `127.0.0.1`** for test servers
3. **Always use different ports** for test vs development
4. **Monitor memory during tests** - WSL has limited resources
5. **Kill test servers immediately** after use

## WSL2 Networking Quick Reference

- **Default mode (NAT)**: Windows can access WSL via localhost
- **WSL IP**: Use `hostname -I` or `ip addr show eth0`
- **Windows from WSL**: Use `ip route show | grep default | awk '{print $3}'`
- **Port forwarding**: Use `netsh` commands in Windows PowerShell

## Troubleshooting

### "This site can't be reached" from Windows browser:
1. Check if server is running: `curl http://localhost:5173`
2. Try WSL IP directly: `http://[WSL-IP]:5173`
3. Check Windows firewall settings
4. Verify `localhostForwarding=true` in `.wslconfig`

### Memory exhaustion:
1. Check current usage: `free -h`
2. Kill unnecessary processes: `ps aux | sort -k4 -r | head`
3. Increase WSL memory in `.wslconfig`
4. Enable swap space

### Playwright browser issues:
1. Use headless mode: `headless: true`
2. Install system dependencies (see Phase 3)
3. Consider using Windows Chrome executable
4. Check `npx playwright doctor`

---

This plan prioritizes **system stability** while enabling both manual testing and automated Playwright testing in WSL's constrained environment.