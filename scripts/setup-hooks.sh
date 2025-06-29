#!/bin/bash
# Setup script to install git hooks

echo "🔧 Setting up git hooks..."

# Configure git to use our hooks directory
git config core.hooksPath .githooks

if [ $? -eq 0 ]; then
    echo "✅ Git hooks installed successfully!"
    echo "   Pre-commit hook will now:"
    echo "   - Block console.* statements"
    echo "   - Check test coverage"
    echo "   - Validate documentation accuracy"
    echo "   - Prevent future-dated claims"
    echo ""
    echo "💡 To test the hook:"
    echo "   1. Make a change to any file"
    echo "   2. git add <file>"
    echo "   3. git commit -m 'test'"
    echo ""
    echo "🚨 To bypass (emergency only):"
    echo "   git commit --no-verify"
else
    echo "❌ Failed to install git hooks"
    exit 1
fi