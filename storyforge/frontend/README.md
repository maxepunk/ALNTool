# StoryForge Frontend

This is the frontend for StoryForge, an immersive narrative design hub that integrates with Notion workspaces.

## Prerequisites

- Node.js (v16+)
- Backend server running (see `../backend/README.md`)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── theme.js          # MUI theme configuration
├── index.html            # HTML template
└── vite.config.js        # Vite configuration
```

## Features (Phase 1: Core Setup & Read-Only Views)

- **Dashboard:** Quick overview of characters, timeline events, puzzles, and elements.
- **Characters:** List view of all characters with key information.
- **Timeline:** Timeline view of events.
- **Puzzles:** List view of all puzzles with key information.
- **Elements & Memories:** List view of all elements with type filtering.

## Features (Planned for Phase 2+)

- **Visual Relationship Mapper:** Visualize relationships between characters, events, puzzles, and elements.
- **Editing Capabilities:** Create, update, and delete characters, timeline events, puzzles, and elements.
- **Role-Specific Dashboards:** Tailored views for different team roles.
- **Playtesting Module:** Support for playtesting feedback.

## Tech Stack

- **Framework:** React
- **Bundler:** Vite
- **UI Library:** Material UI
- **State Management:** React Query + Zustand
- **Routing:** React Router
- **API Client:** Axios 