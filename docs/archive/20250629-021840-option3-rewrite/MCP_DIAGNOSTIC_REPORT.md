# MCP Server Configuration Diagnostic Report
Date: June 11, 2025

## Executive Summary
- **Current Issue**: All MCP servers failing after WSL-first configuration attempt
- **Secondary Issue**: Multiple Claude instances - Cursor's Claude button opens different instance
- **Root Cause**: [To be determined through systematic investigation]
- **Recommended Solution**: [To be determined based on findings]

## Multiple Claude Instances Issue

### Observed Behavior
- When using `/ide` command in Claude Desktop and connecting to Cursor
- Clicking Claude button in Cursor opens a **different Claude instance**
- This new instance asks for theme selection (fresh profile)
- Appears to be Claude CLI in WSL vs Claude Desktop in Windows

### Evidence of Multiple Installations
1. **Claude Desktop (Windows)**: `C:\Users\spide\AppData\Local\AnthropicClaude\`
2. **Claude CLI (WSL)**: `/home/spide/.claude/local/`
3. **Different configurations**: Each has separate settings/profiles
4. **MCP servers only configured in Claude Desktop**, not CLI version

## Environment Inventory

### Windows Environment
- **Node Version**: v22.14.0 (installed at `C:\Program Files\nodejs\`)
- **NPM Version**: [Would need to check from Windows]
- **Node Tools Available**: 
  - `npx.cmd` exists at `C:\Program Files\nodejs\npx.cmd`
  - `npm.cmd` exists at `C:\Program Files\nodejs\npm.cmd`
  - `node.exe` exists at `C:\Program Files\nodejs\node.exe`
- **PATH**: [Would need to check from Windows]
- **Claude Desktop Location**: `C:\Users\spide\AppData\Local\AnthropicClaude\`

### WSL Environment  
- **Distribution**: Ubuntu 24.04.2 LTS (Noble Numbat)
- **Node Version**: v22.16.0 (via nvm at `/home/spide/.nvm/versions/node/v22.16.0`)
- **NPM Version**: 10.9.2
- **NPX Version**: 10.9.2
- **PATH**: `/home/spide/.cursor-server/bin/9f54c226145b02c8dd0771069db954e0ab5fa1b0/bin/remote-cli:/home/spide/.nvm/versions/node/v22.16.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/usr/lib/wsl/lib:/snap/bin`
- **NVM Configuration**: Lines 119-121 in ~/.bashrc:
  ```bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  ```
- **Relevant Environment Variables**: [Listing...]

**PATH Analysis**: 
- ✅ NVM node is in PATH (`/home/spide/.nvm/versions/node/v22.16.0/bin`)
- ✅ Cursor server is in PATH (first entry)
- ❓ No Windows paths integrated (might affect cross-platform execution)

**Critical Finding**: NVM requires sourcing `nvm.sh` script to work. This happens at line 120 of .bashrc. When Claude Desktop runs `wsl -e`, it might not source .bashrc properly or in time.

### Cross-Environment Configuration
- **WSLENV Settings**: Not set (empty) - This means NO environment variables are shared between Windows and WSL
- **Path Mappings**: Windows <-> WSL
- **User Context**: [Who runs what]
- **Project .env files**: Found in `/storyforge/backend/` but these are for the application, not MCP servers

**Critical Finding**: WSLENV is not configured, which means:
- Environment variables don't pass between Windows and WSL
- PATH is not shared
- API tokens in Windows env won't be available in WSL

## Configuration History

### Original Working Configuration (from backup)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "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"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\spide\\Documents"]
    },
    "notionApi": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer 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\", \"Notion-Version\": \"2022-06-28\" }"
      }
    },
    "desktop-commander": {
      "command": "npx.cmd",
      "args": ["-y", "@wonderwhy-er/desktop-commander@latest"]
    }
  }
}
```

### Current Broken Configuration  
```json
{
  "mcpServers": {
    "github": {
      "command": "wsl",
      "args": ["-e", "bash", "-l", "-c", "npx -y @modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "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"
      }
    },
    "filesystem": {
      "command": "wsl",
      "args": ["-e", "bash", "-l", "-c", "npx -y @modelcontextprotocol/server-filesystem /mnt/c/Users/spide/Documents"]
    },
    "notionApi": {
      "command": "wsl",
      "args": ["-e", "bash", "-l", "-c", "npx -y @notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer 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\", \"Notion-Version\": \"2022-06-28\" }"
      }
    },
    "desktop-commander": {
      "command": "wsl",
      "args": ["-e", "bash", "-l", "-c", "npx -y @wonderwhy-er/desktop-commander@latest"]
    },
    "playwright": {
      "command": "wsl",
      "args": ["-e", "bash", "-l", "-c", "cd /mnt/c/Users/spide/Documents/GitHub/ALNTool/storyforge/frontend && npx @executeautomation/playwright-mcp-server --config playwright-mcp-config.json"]
    }
  }
}
```

### What Changed
1. Changed all commands from `npx` to `wsl`
2. Added `bash -l -c` to load shell environment
3. Converted Windows paths to WSL paths
4. Added playwright MCP server
5. Removed project-level claude-desktop-config.json
6. Removed start-mcp-server.js wrapper script

## Test Results

### Basic Connectivity Tests
- [ ] `wsl -e echo "hello"`
- [ ] `wsl -e bash -c "echo hello"`  
- [ ] `wsl -e bash -l -c "echo hello"`
- [ ] `wsl -e which node`
- [ ] `wsl -e bash -l -c "which node"`

### NPX Availability Tests
- [ ] From Windows CMD: `where npx`
- [ ] From Windows CMD: `npx --version`
- [ ] From WSL: `which npx`
- [ ] From WSL: `npx --version`
- [ ] Via WSL from Windows: `wsl -e bash -l -c "which npx"`

### MCP Server Tests
- [ ] Can Windows npx run MCP servers?
- [ ] Can WSL npx run MCP servers?
- [ ] Do paths resolve correctly?
- [ ] Are environment variables passed?

## Findings

### Issue 1: NVM Node Not Available When Called from Windows
- **Description**: When Claude Desktop (Windows) executes `wsl -e bash -l -c "npx ..."`, nvm hasn't initialized properly
- **Evidence**: 
  - NVM is loaded via .bashrc at line 120
  - Requires sourcing a shell script
  - PATH shows node is available AFTER initialization
- **Impact**: `npx` command not found errors

### Issue 2: Multiple Claude Instances Causing Confusion
- **Description**: Claude Desktop (Windows) and Claude CLI (WSL) are separate installations
- **Evidence**:
  - Claude Desktop at `C:\Users\spide\AppData\Local\AnthropicClaude\`
  - Claude CLI at `/home/spide/.claude/local/`
  - Cursor opens CLI version, not Desktop
- **Impact**: MCP servers only configured in one instance, settings not shared

### Issue 3: No Environment Variable Sharing
- **Description**: WSLENV not configured, preventing env var sharing between Windows and WSL
- **Evidence**: `echo $WSLENV` returns empty
- **Impact**: API tokens and other env vars not available across boundary

## Solution Options

### Option 1: Windows-Native Approach
- **Pros**:
  - Proven to work (backup config shows this)
  - Simple execution model
  - No cross-platform complexity
  - Better performance (no WSL overhead)
- **Cons**:
  - Different Node version than development
  - Requires packages to be installed in Windows
- **Implementation**: Revert to backup configuration

### Option 2: WSL-Native with Proper Init
- **Pros**:
  - Same environment as development
  - Consistent Node version
  - Linux-native tools work properly
- **Cons**:
  - Complex environment initialization
  - Performance overhead
  - Path translation issues
- **Implementation**: Fix shell initialization or use wrapper scripts

### Option 3: Hybrid Approach
- **Pros**:
  - Use best tool for each context
  - Flexibility
- **Cons**:
  - More complex to maintain
  - Inconsistent patterns
- **Implementation**: Windows for some, WSL for others

## Recommendation

Based on our findings, **Option 1: Windows-Native Approach** is strongly recommended.

### Rationale:
1. **Windows already has Node.js installed** (v22.14.0) with npx.cmd available
2. **Original configuration worked** using Windows npx directly
3. **WSL approach has multiple blockers**:
   - NVM doesn't initialize properly when called from Windows
   - No environment variable sharing (WSLENV not configured)
   - Multiple Claude instances causing confusion
   - Complex shell initialization timing issues

### Immediate Fix:
Revert to the backup configuration that uses `npx.cmd` for all MCP servers. This keeps everything in the Windows context where Claude Desktop runs.

## Implementation Plan
1. **Restore Windows-native configuration**:
   - Use backup config as template
   - Change all `wsl` commands back to `npx.cmd`
   - Use Windows paths (C:\) not WSL paths (/mnt/c/)

2. **Add Playwright MCP to Windows config**:
   ```json
   "playwright": {
     "command": "npx.cmd",
     "args": [
       "@executeautomation/playwright-mcp-server",
       "--config",
       "C:\\Users\\spide\\Documents\\GitHub\\ALNTool\\storyforge\\frontend\\playwright-mcp-config.json"
     ],
     "cwd": "C:\\Users\\spide\\Documents\\GitHub\\ALNTool\\storyforge\\frontend"
   }
   ```

3. **Test each MCP server** after configuration change

4. **For future WSL integration** (if needed):
   - Set up WSLENV properly
   - Create wrapper scripts that ensure nvm loads
   - Consider using absolute paths to node/npx
   - Test thoroughly before switching all servers

---

## Investigation Log

### Summary of Investigation Process
1. ✅ Checked WSL environment - Found Ubuntu 24.04.2 with Node v22.16.0 via nvm
2. ✅ Discovered multiple Claude instances (Desktop vs CLI)
3. ✅ Found nvm requires shell script sourcing (line 120 of .bashrc)
4. ✅ Confirmed WSLENV not set - no env var sharing
5. ✅ Verified Windows has Node.js v22.14.0 with npx.cmd available
6. ✅ Identified root cause: WSL initialization complexity when called from Windows

### Key Insight
The attempt to unify everything under WSL created more problems than it solved. Windows applications (like Claude Desktop) work best with Windows tools. The original configuration that "just worked" was actually the correct approach.