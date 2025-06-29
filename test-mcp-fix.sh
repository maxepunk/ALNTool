#!/bin/bash
# Test script to verify MCP commands work with the new format

echo "Testing MCP server commands with login shell..."
echo "================================================"

# Test 1: Basic npx availability
echo -n "1. Testing npx availability: "
if wsl -e bash -l -c "which npx" > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
fi

# Test 2: GitHub MCP server
echo -n "2. Testing GitHub MCP server command: "
if wsl -e bash -l -c "npx -y @modelcontextprotocol/server-github --help" > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL (may need to install)"
fi

# Test 3: Notion MCP server
echo -n "3. Testing Notion MCP server command: "
if wsl -e bash -l -c "npx -y @notionhq/notion-mcp-server --help" > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL (may need to install)"
fi

# Test 4: Playwright MCP server with directory change
echo -n "4. Testing Playwright MCP server command: "
if wsl -e bash -l -c "cd /mnt/c/Users/spide/Documents/GitHub/ALNTool/storyforge/frontend && npx @executeautomation/playwright-mcp-server --help" > /dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
fi

echo "================================================"
echo "If all tests pass, restart Claude Desktop to apply changes."