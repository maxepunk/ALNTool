# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Before Starting ANY Task

You MUST complete this onboarding protocol:

1. **Read Core Documentation (in order)**
   ```bash
   # Read these files in this exact sequence:
   README.md          # Project overview & current state
   QUICK_STATUS.md    # Today's task & priorities
   DEVELOPMENT_PLAYBOOK.md  # Detailed implementation instructions
   ```

2. **Run Verification Protocol**
   ```bash
   cd storyforge/backend
   npm run verify:all
   
   # Expected output:
   # ✅ 8 migrations applied
   # ✅ Critical tables and columns present
   # ✅ Computed fields populated
   # ⚠️ Known warnings (non-blocking):
   #    - Characters with no links: Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling
   #    - 42 timeline_events missing act_focus computed field
   ```

3. **Check Current Task**
   - Current Task: **P.DEBT.3.8 - Fix Migration System**
   - Status: Technical Debt Repayment Phase
   - Feature development: PAUSED

## Project Overview

This is the **About Last Night - Production Intelligence Tool**, a comprehensive journey management and production tool for an immersive murder mystery game. The tool provides both micro (individual character paths) and macro (system-wide balance) perspectives to production teams.

**Current Status**: Technical Debt Repayment Phase - All feature development is paused until critical architectural issues are resolved.

[... rest of the existing content remains the same ...]

## Added Memories
- you can validate our findings from syncronization logs etc. by making direct queries to the notion API.
- Be RELIGIOUS about todo maintentance--updating, adding subtasks, etc. as you proceed through this complex process to ensure we remain on task thruout.
- when you start a new phase/task/subtask that requires more work than a simple action, adopt the most appropriate expert persona to methodically break it down into its subtasks in your todos before moving forward with execution.
- We are using Doc_Alignment_Scratch_Pad.md for our findings to help us along for our current Documentation and Foundation Alignment phase to preserve critical discoveries/observations/decisitons/etc. across context windows while we work on refactoring our documentation during this phase.
- keep doc_alignment_scratch_pad.md well-organized and fully optimized by reviewing it for completeness and a well-crafted structure after each and every edit.