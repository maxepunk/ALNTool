# About Last Night - Production Intelligence Tool

## Overview

This repository contains the Production Intelligence Tool for "About Last Night," an immersive murder mystery game. The tool is being evolved from the existing StoryForge foundation to provide comprehensive journey management and production capabilities.

## 🚀 Quick Start for Developers

### The 3-Document System

We use a streamlined documentation approach. You only need 3 files:

1. **📋 [QUICK_STATUS.md](./QUICK_STATUS.md)** - START HERE EVERY DAY (30 seconds)
   - Shows your current task
   - Quick progress check
   - Next steps

2. **📖 [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)** - Your main guide while coding
   - Every implementation detail
   - Exact code to write
   - File locations
   - Acceptance criteria

3. **📄 [PRODUCTION_INTELLIGENCE_TOOL_PRD.md](./PRODUCTION_INTELLIGENCE_TOOL_PRD.md)** - Reference when needed
   - UI/UX specifications
   - Architecture details
   - Feature requirements

**That's it!** See [STREAMLINED_DOCS_GUIDE.md](./STREAMLINED_DOCS_GUIDE.md) for why we simplified.

### Your Daily Workflow

```
Morning:
1. Check QUICK_STATUS.md (30 sec)
2. Open DEVELOPMENT_PLAYBOOK.md to current task
3. Code

Evening:
1. Update QUICK_STATUS.md if task done
2. Commit with milestone reference (e.g., "Complete P2.M1.3")
```

### Project Setup

```bash
# Backend setup
cd storyforge/backend
npm install
cp .env.example .env  # Add your Notion API key
npm run dev

# Frontend setup (new terminal)
cd storyforge/frontend
npm install
npm run dev

# Access application
Frontend: http://localhost:3000
Backend API: http://localhost:3001
```

## 📁 Project Structure

```
ALNTool/
├── 📚 Core Documentation (Just 3 files!)
│   ├── QUICK_STATUS.md              # Current task tracker
│   ├── DEVELOPMENT_PLAYBOOK.md      # Implementation guide  
│   └── PRODUCTION_INTELLIGENCE_TOOL_PRD.md  # Specifications
│
├── 💻 Application Code
│   └── storyforge/
│       ├── backend/                 # Node.js/Express API
│       └── frontend/                # React application
│
└── 📁 Supporting Files
    ├── SampleNotionData/            # Test data
    └── TROUBLESHOOTING.md           # Only if stuck
```

## 🎯 Current Status

**Active Task**: P1.M2.4 - Implement Journey Caching in Database
**Progress**: Phase 1 🚧 (50%) | Phase 2 🚧 (P2.M1 partially complete) | Overall ~18%

See [QUICK_STATUS.md](./QUICK_STATUS.md) for details.

## 📝 Key Development Info

- **Branch**: `feature/production-intelligence-tool`
- **Node Version**: 16+
- **Key Tech**: React, Node.js, SQLite, Zustand
- **Notion Integration**: Requires API key in `.env`

## 🆘 Getting Help

1. **First**: Check current task in DEVELOPMENT_PLAYBOOK.md
2. **If Stuck**: See TROUBLESHOOTING.md
3. **Still Stuck**: Document the issue for others

## 🎉 Why This Works

- **No Documentation Sprawl**: Just 3 focused files
- **Always Know Where You Are**: QUICK_STATUS.md
- **Always Know What To Do**: DEVELOPMENT_PLAYBOOK.md  
- **Never Lost**: Clear task progression

---

**Remember**: If you're confused, you're in the wrong document. There are only 3!
