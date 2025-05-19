# StoryForge - Immersive Narrative Design Hub

StoryForge is a custom web-based front-end design tool for the "About Last Night" immersive experience, providing a visually intuitive, interconnected, and role-optimized environment for designing, managing, and iterating on the narrative.

## Project Structure

This project consists of two main parts:

- **Backend (BFF):** A Node.js/Express server that securely interfaces with the Notion API
- **Frontend:** A React application that provides the user interface for the tool

## Quick Start

1. Set up the backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Then add your Notion API key
   npm run dev
   ```

2. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open your browser and navigate to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Features

StoryForge provides specialized views and tools for managing the four core elements of the "About Last Night" experience:

### Characters

View and manage characters, their relationships, and their connections to timeline events, puzzles, and elements.

### Timeline

Visualize and organize the chronological events of the narrative, with connections to characters and memories/evidence.

### Puzzles

Track puzzles, their requirements, rewards, and connections to the narrative.

### Elements

Manage physical props, set dressings, and memory tokens, with filtering capabilities to focus on specific types.

## Development Phases

This project is being developed in phases:

1. **Phase 1 (Current):** Core Setup & Read-Only Views
2. **Phase 2:** Adding Interactivity & Relationship Visualization
3. **Phase 3:** Implementing Editing Capabilities
4. **Phase 4:** Advanced Features & Role-Specific Dashboards
5. **Phase 5:** Refinements, Playtesting Support & Deployment

## Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [StoryForge PRD](../StoryForge%20PR.txt) - The original project requirements document 