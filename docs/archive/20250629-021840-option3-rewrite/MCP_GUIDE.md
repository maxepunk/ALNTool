# MCP (Model Context Protocol) Guide

> **Purpose**: Comprehensive guide for MCP servers - configuration, usage, and troubleshooting

## Overview

MCP servers provide Claude Code with additional capabilities like Notion integration, GitHub access, browser automation, and desktop control. They run automatically in the background when you start Claude Code - **no manual startup required**.

## 🚀 Quick Start

### Currently Configured Servers

| Server | Scope | Purpose | Status |
|--------|-------|---------|--------|
| **Notion** | User (All Projects) | Access Notion workspace | ✅ Active |
| **GitHub** | User (All Projects) | Interact with repositories | ✅ Active |
| **Desktop Commander** | User (All Projects) | Control desktop apps | ✅ Active |
| **Playwright** | Project (ALNTool) | Browser automation | ✅ Active |

### Quick Test Commands

```bash
# Verify servers are configured
claude mcp list

# Test each server
"Use Notion MCP to search for 'About Last Night' pages"
"Use GitHub MCP to list my recent repositories"  
"Use Desktop Commander to take a screenshot"
"Use Playwright to navigate to http://localhost:5173" # ALNTool only
```

## 📋 Server Details

### 1. Notion MCP
**Purpose**: Direct access to your Notion workspace

**Available Tools**:
- `notion_search` - Search pages and databases
- `notion_query_database` - Query specific databases  
- `notion_retrieve_page` - Read page content in Markdown
- `notion_create_page` - Create new pages
- `notion_update_page` - Update existing pages

**Usage Examples**:
```
# Search for content
Use Notion to search for pages about "character relationships"

# Query a database
Use Notion to query the Characters database and show all entries

# Read a specific page
Use Notion to retrieve the page with ID [page-id] in markdown format
```

### 2. GitHub MCP
**Purpose**: Interact with GitHub repositories

**Available Tools**:
- `search_repositories` - Find repos
- `get_file_contents` - Read files from repos
- `create_issue` / `update_issue` - Manage issues
- `create_pull_request` / `list_pull_requests` - Work with PRs
- `list_commits` - View commit history

**Usage Examples**:
```
# Search for repositories
Use GitHub to search for repositories with "claude" in the name

# Read a file
Use GitHub to get the README from anthropics/claude-code

# Create an issue
Use GitHub to create an issue titled "Bug: Character links not showing"
```

### 3. Desktop Commander
**Purpose**: Control desktop applications and automate workflows

**Available Tools**:
- `open_application` - Launch apps
- `take_screenshot` - Capture screen
- `send_keys` - Simulate keyboard input
- `click` - Simulate mouse clicks

**Usage Examples**:
```
# Take a screenshot
Use Desktop Commander to take a screenshot of the current screen

# Open an application  
Use Desktop Commander to open Visual Studio Code

# Automate a workflow
Use Desktop Commander to open Notepad and type "Hello World"
```

### 4. Playwright MCP (ALNTool Project Only)
**Purpose**: Browser automation and testing

**Available Tools**:
- `playwright_navigate` - Go to URLs
- `playwright_click` - Click elements
- `playwright_fill` - Fill form fields
- `playwright_screenshot` - Capture page
- `playwright_evaluate` - Run JavaScript

**Usage Examples**:
```
# Navigate and screenshot
Use Playwright to navigate to http://localhost:5173 and take a screenshot

# Test a feature
Use Playwright to click the "Sync Data" button and check the result

# Fill a form
Use Playwright to fill the search box with "Marcus" and submit
```

## ⚙️ Configuration

### Configuration Locations

**User-level MCPs** (All Projects):
- Windows: `C:\Users\[username]\AppData\Roaming\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Project-level MCPs** (Specific Project):
- Project root: `.mcp.json`
- Playwright config: `storyforge/frontend/playwright-mcp-config.json`

### Example Configuration

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx.cmd",
      "args": ["-y", "@suekou/mcp-notion-server"],
      "env": {
        "NOTION_API_TOKEN": "secret_...",
        "NOTION_MARKDOWN_CONVERSION": "true"
      }
    },
    "github": {
      "command": "npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    },
    "desktop-commander": {
      "command": "npx.cmd",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    }
  }
}
```

### Adding New MCP Servers

1. **Find the server**: Check npm for `@modelcontextprotocol/` packages
2. **Add to config**: Edit the appropriate config file
3. **Set environment variables**: Add any required tokens/keys
4. **Restart Claude**: Exit and restart Claude Code
5. **Verify**: Run `claude mcp list` to confirm

## 🔧 Troubleshooting

### Common Issues & Solutions

**"No MCP servers configured"**
- Solution: Restart Claude Code session
- Check: Run `claude mcp list` to verify configuration

**"Tool not available"**
- Check: Ensure you're in the right project for project-scoped servers
- Verify: Server is listed in `claude mcp list`

**API/Token Errors**
- Check: Token hasn't expired
- Verify: Token has required permissions
- Update: Edit config file with new token

**Server Disconnection**
- Check logs: `AppData\Roaming\Claude\logs\mcp-server-[name].log`
- Verify: All environment variables are set
- Restart: Exit and restart Claude Code

### Debug Commands

```bash
# List all configured servers
claude mcp list

# Get detailed info about a server
claude mcp get notion

# Check Claude logs (Windows)
dir %APPDATA%\Claude\logs\

# Check Claude logs (macOS/Linux)
ls ~/Library/Application\ Support/Claude/logs/
```

### Log File Locations
- Windows: `%APPDATA%\Claude\logs\mcp-server-[name].log`
- macOS: `~/Library/Application Support/Claude/logs/mcp-server-[name].log`

## 📚 Best Practices

1. **Be Specific**: Tell Claude which tool to use
   - ✅ "Use Notion to search for..."
   - ❌ "Search for..." (ambiguous)

2. **Provide Context**: Give enough information
   - Database IDs for Notion
   - Repository names for GitHub
   - Full URLs for Playwright

3. **Check Availability**: Ask "What MCP tools are available?"

4. **No Manual Management**: Servers start/stop automatically

5. **Backup Config**: Before editing configuration files
   ```bash
   cp claude_desktop_config.json claude_desktop_config.backup.json
   ```

## 🔒 Security Notes

- **Tokens**: Never commit tokens to version control
- **Permissions**: Grant minimal required permissions
- **Project Scope**: Use project-specific servers for sensitive operations
- **Environment Variables**: Store secrets in environment variables

## 📖 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)

Remember: MCP servers enhance Claude's capabilities but require proper configuration and security practices. Always test in safe environments first!