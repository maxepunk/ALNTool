# Journey Intelligence Dependency Tree

## Critical Files - DO NOT DELETE

### Main Component
- `/src/components/JourneyIntelligenceView.jsx`

### Sub-Components (all in `/src/components/JourneyIntelligence/`)
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

### Stores
- `/src/stores/journeyIntelligenceStore.js`

### Hooks
- `/src/hooks/usePerformanceElements.js`
- `/src/hooks/useFreshElements.js`
- `/src/hooks/useCharacterJourney.js`

### Services
- `/src/services/api.js` (used by IntelligencePanel)

### Utilities
- `/src/utils/logger.js` (used by AdaptiveGraphCanvas, EconomicLayer, IntelligencePanel)
- `/src/utils/elementFields.js` (used by ContentGapsLayer, EconomicLayer)

### Test Files (in `/src/components/JourneyIntelligence/__tests__/`)
- `AdaptiveGraphCanvas.test.jsx`
- `ContentGapsLayer.test.jsx`
- `EconomicLayer.test.jsx`
- `IntelligencePanel.test.jsx`
- `ProductionIntelligenceLayer.test.jsx`
- `SocialIntelligenceLayer.test.jsx`
- `StoryIntelligenceLayer.test.jsx`

### Test Utilities
- `/src/test-utils/test-utils.js`
- `/src/test-utils/cleanup-utils.js`
- `/src/stores/__tests__/journeyIntelligenceStore.test.js`

### External Dependencies (from node_modules)
- React and React hooks
- @mui/material components (Box, Typography, Paper, Alert, Chip, etc.)
- @mui/icons-material icons
- @xyflow/react (ReactFlow and related components)
- @tanstack/react-query

### CSS Dependencies
- ReactFlow styles are imported in `/src/main.jsx` (`import '@xyflow/react/dist/style.css'`)
- No custom CSS files in JourneyIntelligence directory (uses MUI sx prop for styling)

## Dependency Analysis

### Core React/UI Libraries
- React 18
- Material-UI (@mui/material and @mui/icons-material)
- ReactFlow (@xyflow/react) - for graph visualization
- React Query (@tanstack/react-query) - for data fetching

### Data Flow Dependencies
1. **JourneyIntelligenceView** (main container)
   - Uses `journeyIntelligenceStore` for state management
   - Uses `useCharacterJourney` and `useAllCharacters` hooks for data
   - Uses `usePerformanceElements` hook for element data

2. **AdaptiveGraphCanvas**
   - Receives graphData prop from parent
   - Uses ReactFlow for visualization
   - Uses logger for debugging

3. **Intelligence Layers** (Economic, Story, Social, Production, ContentGaps)
   - Receive nodes prop from parent
   - Use `useJourneyIntelligenceStore` for active state
   - Some use `elementFields` utility
   - Some use data hooks like `usePerformanceElements`

4. **IntelligencePanel**
   - Uses `api` service directly for entity queries
   - Uses `usePerformanceElements` for element data

5. **Entity Management**
   - EntitySelector uses `journeyIntelligenceStore`
   - IntelligenceToggles uses `journeyIntelligenceStore`
   - PerformanceIndicator uses `journeyIntelligenceStore`

## Safe to Delete
Any files NOT listed above can be safely deleted without breaking Journey Intelligence functionality.

## Critical Shared Dependencies
These are used by multiple components and MUST be preserved:
1. `journeyIntelligenceStore` - Central state management
2. `api` service - Data fetching
3. `logger` utility - Debugging
4. `elementFields` utility - Element type handling
5. Data hooks - `usePerformanceElements`, `useFreshElements`, `useCharacterJourney`

## DELETION CHECKLIST

### Can Delete (Old UI Components):
- All files in `/src/pages/` EXCEPT any that route to Journey Intelligence
- All files in `/src/components/` EXCEPT `JourneyIntelligenceView.jsx` and `JourneyIntelligence/` directory
- Old stores in `/src/stores/` EXCEPT `journeyIntelligenceStore.js`
- Old hooks in `/src/hooks/` EXCEPT the three listed above

### Must Keep (Core Infrastructure):
- `/src/main.jsx` - Contains ReactFlow CSS import
- `/src/App.jsx` - Will need to update routing
- `/src/services/api.js` - Used by IntelligencePanel
- `/src/utils/logger.js` - Used by multiple components
- `/src/utils/elementFields.js` - Used by intelligence layers
- All test utilities in `/src/test-utils/`

### Must Keep (Journey Intelligence):
- Everything in `/src/components/JourneyIntelligence/`
- `/src/components/JourneyIntelligenceView.jsx`
- The three hooks and one store listed above