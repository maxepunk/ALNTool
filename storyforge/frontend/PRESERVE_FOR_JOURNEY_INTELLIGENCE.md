# Files to PRESERVE for Journey Intelligence

**CRITICAL**: Do NOT delete these files - Journey Intelligence depends on them!

## Core Journey Intelligence Components
- `/src/components/JourneyIntelligenceView.jsx` - Main component
- `/src/components/JourneyIntelligence/` - ALL files in this directory:
  - `ErrorBoundary.jsx`
  - `EntitySelector.jsx`
  - `IntelligenceToggles.jsx`
  - `IntelligencePanel.jsx`
  - `AdaptiveGraphCanvas.jsx`
  - `PerformanceIndicator.jsx`
  - `EconomicLayer.jsx`
  - `StoryIntelligenceLayer.jsx`
  - `SocialIntelligenceLayer.jsx`
  - `ProductionIntelligenceLayer.jsx`
  - `ContentGapsLayer.jsx`

## Data Layer (Critical)
- `/src/stores/journeyIntelligenceStore.js` - State management
- `/src/hooks/usePerformanceElements.js` - Performance data hook
- `/src/hooks/useFreshElements.js` - Fresh data hook
- `/src/hooks/useCharacterJourney.js` - Character journey data
- `/src/services/api.js` - API service (used by many components)

## Utilities (Keep)
- `/src/utils/logger.js` - Logging utility
- `/src/utils/elementFields.js` - Element type handling

## Core Infrastructure (Keep)
- `/src/main.jsx` - Entry point (has critical ReactFlow CSS import)
- `/src/App.jsx` - Main app (we'll modify but keep)
- `/src/layouts/AppLayout.jsx` - Layout wrapper (we'll simplify but keep)

## Test Infrastructure (Keep)
- `/src/test-utils/test-utils.js` - Test utilities
- `/src/test-utils/cleanup-utils.js` - Test cleanup
- `/src/test-utils/intelligence-test-utils.js` - Intelligence test utils
- `/src/setupTests.js` - Test setup
- `/src/test-polyfills.js` - Test polyfills

## Context (Check usage)
- `/src/contexts/WorkflowContext.jsx` - May be used by Journey Intelligence

## Other (Keep)
- `/src/components/ErrorBoundary.jsx` - General error boundary
- `/src/pages/NotFound.jsx` - 404 page (still useful)

## Config Files (Keep)
- `package.json`
- `vite.config.js`
- `jest.config.cjs`
- `.env` files
- All config files in root

---

EVERYTHING ELSE CAN BE DELETED!