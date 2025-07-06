/**
 * IntelligencePanel - Context-sensitive analysis panel
 * Shows entity-specific insights based on selected entity type
 */

import React from 'react';
import { Paper, Typography } from '@mui/material';
import logger from '../../utils/logger';

// Import custom hooks and components
import useIntelligenceData from '../../hooks/useIntelligenceData';
import { IntelligencePanelSkeleton } from '../common/LoadingStates';

// Import analysis components
import CharacterAnalysis from './analysis/CharacterAnalysis';
import ElementAnalysis from './analysis/ElementAnalysis';
import PuzzleAnalysis from './analysis/PuzzleAnalysis';
import TimelineEventAnalysis from './analysis/TimelineEventAnalysis';

// Analysis component mapping
const ANALYSIS_COMPONENTS = {
  character: CharacterAnalysis,
  element: ElementAnalysis,
  puzzle: PuzzleAnalysis,
  timeline_event: TimelineEventAnalysis
};

const IntelligencePanel = React.memo(({ entity }) => {
  const { timelineEvents, elements, puzzles, isLoading } = useIntelligenceData(entity);

  if (!entity) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          Select an entity to view detailed analysis
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return <IntelligencePanelSkeleton />;
  }

  // Get the appropriate analysis component
  const AnalysisComponent = ANALYSIS_COMPONENTS[entity.type];
  
  const content = AnalysisComponent ? (
    <AnalysisComponent 
      entity={entity}
      timelineEvents={timelineEvents}
      elements={elements}
      puzzles={puzzles}
    />
  ) : (
    <Typography variant="body1" color="text.secondary">
      Unknown entity type: {entity.type}
    </Typography>
  );

  logger.debug('IntelligencePanel: Rendering analysis', {
    entityType: entity.type,
    entityId: entity.id
  });

  return (
    <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {content}
    </Paper>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  // Only re-render if entity changes
  return prevProps.entity?.id === nextProps.entity?.id &&
         prevProps.entity?.type === nextProps.entity?.type;
});

IntelligencePanel.displayName = 'IntelligencePanel';

export default IntelligencePanel;