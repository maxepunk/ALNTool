# About Last Night - Production Intelligence Tool

## Overview

This repository contains the Production Intelligence Tool for "About Last Night," an immersive murder mystery game. The tool is being evolved from the existing StoryForge foundation to provide comprehensive journey management and production capabilities.

## 🚀 Getting Started for Developers

### 1. Read the PRD First!
**IMPORTANT**: Before doing anything else, read the comprehensive Product Requirements Document:
- 📄 **[PRODUCTION_INTELLIGENCE_TOOL_PRD.md](./PRODUCTION_INTELLIGENCE_TOOL_PRD.md)**

This PRD is your single source of truth. It contains:
- Complete feature specifications
- Technical architecture
- Development phases
- UI/UX designs
- Implementation details

### 2. Project Structure
```
ALNTool/
├── PRODUCTION_INTELLIGENCE_TOOL_PRD.md  # START HERE - Living document
├── storyforge/                          # Main application
│   ├── backend/                         # Node.js/Express API
│   └── frontend/                        # React application
├── SampleNotionData/                    # Test data (if needed)
└── test-results/                        # Test output files
```

### 3. Development Workflow

1. **Update the PRD Progress Tracker** at the top of the PRD as you complete tasks
2. **Start with Phase 1** - Journey Infrastructure (see PRD Section 9)
3. **Commit regularly** with clear messages referencing PRD phases
4. **Test thoroughly** before moving to next phase

### 4. Quick Start Commands

```bash
# Backend setup
cd storyforge/backend
npm install
cp .env.example .env  # Add your Notion API key
npm run dev

# Frontend setup (in new terminal)
cd storyforge/frontend
npm install
npm run dev

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## 📝 Important Notes

- **Branch**: You're on `feature/production-intelligence-tool`
- **Main Documentation**: PRODUCTION_INTELLIGENCE_TOOL_PRD.md (keep it updated!)
- **Notion Integration**: Requires API key in backend `.env` file

## 🎯 Current Status

See the Development Progress Tracker at the top of [PRODUCTION_INTELLIGENCE_TOOL_PRD.md](./PRODUCTION_INTELLIGENCE_TOOL_PRD.md)

## 🤝 For Questions

If you need clarification on any aspect of the project:
1. First check the PRD - it's comprehensive
2. Review existing code in `/storyforge`
3. The PRD contains all necessary context and specifications

---

Remember: The PRD is a living document. Update it as you make progress!
