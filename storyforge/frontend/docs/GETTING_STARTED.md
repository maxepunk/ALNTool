# Getting Started with ALNTool

Welcome to About Last Night Production Intelligence Tool! This guide will help you get started with designing and validating your murder mystery game.

## Quick Overview

ALNTool helps you:
- **Design** character journeys through puzzles and timeline events
- **Validate** production readiness and identify issues
- **Balance** the memory economy and player experience

## Core Concepts

### Game Structure
- **Characters**: The players in your murder mystery (10-20 total)
- **Puzzles**: Challenges players solve to progress (~50-100 total)
- **Elements**: Physical props, clues, and items (~100-200 total)
- **Timeline Events**: Story moments that unfold during gameplay (~50-100 total)
- **Memory Tokens**: Currency players collect and spend throughout the game

### Dual-Lens Design Paradigm
- **Micro View** (Player Journey): Individual character experience design
- **Macro View** (Dashboard/Analytics): System-wide balance and production analysis

## Primary Workflow

### Step 1: Design Character Journeys
1. Navigate to **Player Journey** in the sidebar
2. Select a character from the dropdown
3. View their timeline of puzzles and events
4. Check the Experience Analysis panel for pacing issues
5. Identify gaps where players have nothing to do

### Step 2: Validate Production Readiness
1. Check **Dashboard** for system-wide alerts
2. Review **Production Metrics** for:
   - Missing dependencies
   - Resource bottlenecks
   - Social isolation risks
3. Use **Resolution Paths** to verify puzzle solvability

### Step 3: Balance Memory Economy
1. Open **Memory Economy** page
2. Review token flow across characters
3. Check for:
   - Token shortages (players can't progress)
   - Token surpluses (too many unused tokens)
   - Spending bottlenecks

## Key Pages Explained

### Dashboard
Your command center showing:
- Entity counts (characters, puzzles, elements, timeline)
- Production issues requiring attention
- Quick access to common tasks
- Memory economy overview

### Player Journey
Primary workspace for character design:
- Visual timeline of character experience
- Node types: Puzzles (green), Elements (blue), Timeline Events (purple)
- Experience flow analysis (pacing, bottlenecks, memory tokens)
- Gap identification and suggestions

### Characters
- List view of all characters
- Filter by path, act, or production status
- Click to view detailed character journey

### Puzzles
- Complete puzzle inventory
- Production status indicators
- Filter by type, path, or issues
- Dependency tracking

### Elements
- Physical props and clues inventory
- Association with puzzles
- Production readiness status

### Memory Economy
- Token flow visualization
- Balance analysis by character
- Spending pattern insights

## Common Tasks

### Adding a New Puzzle to a Character Journey
1. Currently done in Notion (data source)
2. Run sync process to update ALNTool
3. Verify in Player Journey view

### Identifying Production Issues
1. Start at Dashboard
2. Click on alert cards to see specific issues
3. Navigate to detailed views for resolution

### Checking Character Balance
1. Open Memory Economy
2. Compare token collection/spending across characters
3. Look for outliers needing adjustment

## Understanding the Visualizations

### Journey Graph Colors
- **Green nodes**: Puzzles
- **Blue nodes**: Elements/props
- **Purple nodes**: Timeline events
- **Gray edges**: Dependencies and connections

### Production Status Indicators
- **Red badges**: Critical issues
- **Yellow badges**: Warnings
- **Green checkmarks**: Production ready

## Tips for Success

1. **Start with Player Journey**: Always design from the player's perspective first
2. **Check Dashboard Daily**: Catch production issues early
3. **Balance Iteratively**: Small adjustments work better than major overhauls
4. **Use Filters**: Focus on specific paths or acts when needed
5. **Trust the Alerts**: The system identifies real production risks

## Need Help?

- Look for the info icon (ℹ️) on complex features for tooltips
- Check the specific page guides in this docs folder
- Report issues at: https://github.com/anthropics/claude-code/issues

## Next Steps

1. Explore the Dashboard to get familiar with the interface
2. Select a character and view their journey
3. Try filtering and searching features
4. Check production alerts and understand what they mean

Remember: This tool is designed for 2-3 game designers working together. It's optimized for your specific workflow, not generic project management.

---
*Last Updated: 2025-06-30*