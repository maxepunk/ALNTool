# WSL2 Development Best Practices

> Comprehensive guide for running ALNTool and other Node.js applications in WSL2 with optimal performance, networking, and process management.

## Table of Contents
1. [WSL2 Network Architecture](#wsl2-network-architecture)
2. [Port Forwarding & Access](#port-forwarding--access)
3. [Process Management](#process-management)
4. [Performance Optimization](#performance-optimization)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)
7. [Quick Reference](#quick-reference)

## WSL2 Network Architecture

### Default NAT Mode
WSL2 uses Network Address Translation (NAT) by default:
- Linux services are accessible from Windows via `localhost`
- Windows services from Linux require host IP: `ip route show | grep -i default | awk '{ print $3}'`
- WSL2 IP changes on every reboot

### Mirrored Mode (Windows 11 22H2+)
Enable for better networking experience:
```bash
# In Windows, create/edit %USERPROFILE%\.wslconfig
[wsl2]
networkingMode=mirrored
dnsTunneling=true
autoProxy=true
```

Benefits:
- IPv6 support
- Better VPN compatibility
- Direct LAN connections
- Consistent localhost access

## Port Forwarding & Access

### Automatic Port Forwarding
WSL2 automatically forwards ports to Windows. Access your services:
- From Windows: `http://localhost:[PORT]`
- From WSL2: `http://localhost:[PORT]`
- From LAN: `http://[WINDOWS_IP]:[PORT]`

### Manual Port Forwarding for External Access
For accessing from other devices on your network:

```powershell
# Run in PowerShell as Administrator
# Get WSL2 IP
wsl hostname -I

# Set up port forwarding
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=[WSL2_IP]

# Add firewall rule
New-NetFirewallRule -DisplayName "WSL2 Port 3001" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001
```

### Dynamic IP Solution
Create a PowerShell script to handle IP changes:
```powershell
$wslIp = $(wsl hostname -I).Trim()
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIp
```

## Process Management

### 1. tmux (Recommended for Development)

**Installation:**
```bash
sudo apt update && sudo apt install tmux
```

**Basic tmux Workflow:**
```bash
# Start new session with name
tmux new -s alntool

# Split window horizontally
Ctrl+b %

# Split window vertically
Ctrl+b "

# Navigate between panes
Ctrl+b [arrow keys]

# Detach from session (keeps running)
Ctrl+b d

# List sessions
tmux ls

# Reattach to session
tmux attach -t alntool

# Kill session
tmux kill-session -t alntool
```

**ALNTool tmux Setup:**
```bash
# Create session
tmux new -s alntool

# Start backend (left pane)
cd storyforge/backend
npm run dev

# Split and start frontend (right pane)
Ctrl+b %
cd ../frontend  # Note: Use full path if needed
npm run dev

# Detach when done
Ctrl+b d
```

**Important Notes:**
- Frontend configured for port 3000 in vite.config.js
- Vite auto-increments if port is taken (3000→3001→3002)
- Always check terminal output for actual port
- Script available: `./scripts/start-dev-servers.sh`

### 2. PM2 (For Production-like Persistence)

**Installation:**
```bash
npm install -g pm2
```

**Usage:**
```bash
# Start processes
pm2 start npm --name "backend" -- run dev --cwd ./storyforge/backend
pm2 start npm --name "frontend" -- run dev --cwd ./storyforge/frontend

# Management
pm2 list
pm2 logs
pm2 stop all
pm2 restart all

# Persist across reboots
pm2 startup systemd
pm2 save
```

### 3. systemd Services (For Production)

Create service files in `/etc/systemd/system/`:

**alntool-backend.service:**
```ini
[Unit]
Description=ALNTool Backend
After=network.target

[Service]
Type=simple
User=spide
WorkingDirectory=/home/spide/projects/GitHub/ALNTool/storyforge/backend
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable alntool-backend
sudo systemctl start alntool-backend
```

## Performance Optimization

### 1. File System Location (Critical!)
**Always use Linux filesystem for projects:**
- ✅ Good: `/home/username/projects/`
- ❌ Bad: `/mnt/c/Users/username/projects/`

Performance difference: 50-100x faster on Linux filesystem!

### 2. Node.js Optimization
```bash
# Use Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts

# Enable corepack for package managers
corepack enable
```

### 3. WSL2 Memory Configuration
Create `%USERPROFILE%\.wslconfig`:
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

### 4. Disable Windows Defender for WSL2 Folders
Add WSL2 directories to Windows Defender exclusions for better performance.

## Security Considerations

### 1. Firewall Rules
- Only open necessary ports
- Use Windows Defender Firewall for port management
- Consider using SSH tunneling for sensitive services

### 2. Binding Addresses
- Development: Bind to `localhost` or `127.0.0.1`
- Testing from LAN: Bind to `0.0.0.0` (be cautious)
- Production: Use proper reverse proxy (nginx)

### 3. Environment Variables
```bash
# Use .env files for secrets
# Never commit .env to git
echo ".env" >> .gitignore
```

## Troubleshooting

### Common Issues and Solutions

**1. Port Already in Use**
```bash
# Find process using port
lsof -i :3001
# or
netstat -tulpn | grep 3001

# Kill process
kill -9 [PID]
```

**Note**: Vite may automatically increment ports if configured port is in use. Check actual port in terminal output.

**2. Cannot Access from Windows Browser**
- Check if service is running: `curl http://localhost:3001`
- Verify binding address (should include 0.0.0.0 or localhost)
- Check Windows Firewall rules
- Try disabling Windows Firewall temporarily

**3. Slow Performance**
- Verify project is in Linux filesystem: `pwd` should show `/home/...`
- Check WSL2 version: `wsl --version`
- Monitor resources: `htop` or `free -h`

**4. WSL2 Crashes/Hangs**
```powershell
# In PowerShell
wsl --shutdown
wsl
```

**5. Network Issues After Windows Update**
```powershell
# Reset port proxy rules
netsh interface portproxy reset
```

**6. Script Line Ending Issues**
```bash
# Error: /bin/bash^M: bad interpreter
# Fix with sed (dos2unix not always available)
sed -i 's/\r$//' script.sh
```

**7. Frontend Port Conflicts**
```bash
# Vite may use different port than configured
# Check vite.config.js for configured port
# Watch terminal output for actual port
# Common: 3000, 3001, 3002, 5173, 5174
```

**8. tmux Commands Not Executing**
```bash
# If commands don't run in tmux panes:
# 1. Check if in correct directory
# 2. Send commands manually:
tmux send-keys -t session:window.pane "command" C-m
```

## Quick Reference

### Essential Commands

```bash
# Check WSL2 IP
hostname -I

# Check listening ports
ss -tulpn

# Test local connectivity
curl http://localhost:3001

# Monitor processes
htop

# Check systemd status
systemctl status

# View logs
journalctl -xe
```

### Development Workflow

```bash
# 1. Start tmux session
tmux new -s dev

# 2. Start backend
npm run dev

# 3. Split window (Ctrl+b %)
# 4. Start frontend
npm run dev

# 5. Detach (Ctrl+b d)
# 6. Later: tmux attach -t dev
```

### Emergency Commands

```bash
# Kill all node processes
pkill -f node

# Restart WSL2 (from PowerShell)
wsl --shutdown

# Clear port bindings (PowerShell Admin)
netsh interface portproxy reset

# Check what's using a port
lsof -i :3001
```

## Common Pitfalls to Avoid

1. **Line Ending Issues**: Scripts edited in Windows may have CRLF endings
   - Always run `sed -i 's/\r$//' script.sh` on new scripts
   - Configure your editor to use LF endings for WSL projects

2. **Port Assumptions**: Don't hardcode frontend ports
   - Vite/webpack-dev-server may auto-increment ports
   - Always check terminal output for actual URLs

3. **Path Issues in tmux**: Commands may fail if not in right directory
   - Use absolute paths when creating tmux panes
   - Or navigate explicitly after splitting

4. **Background Process with `&`**: Avoid in WSL2
   - Processes may die when terminal closes
   - Use tmux, PM2, or systemd instead

5. **Windows Defender Slowdown**: Exclude WSL directories
   - Add exclusions for better performance

## Best Practices Summary

1. **Always develop in Linux filesystem** (`/home/...`)
2. **Use tmux for development** sessions
3. **Use PM2 or systemd** for persistent services
4. **Enable mirrored networking** on Windows 11
5. **Monitor performance** with htop
6. **Keep WSL2 updated**: `wsl --update`
7. **Use .wslconfig** for resource management
8. **Backup important work** regularly
9. **Check actual ports** in terminal output
10. **Fix line endings** on scripts from Windows

---

**Last Updated**: 2024-12-14
**WSL2 Version**: 2.5.7.0