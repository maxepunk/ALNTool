/**
 * IntelligenceManager - Handles intelligence layer state and rendering
 * Extracted from JourneyIntelligenceView to reduce complexity
 */

import React from 'react';
import { Box } from '@mui/material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import EconomicLayer from './EconomicLayer';
import StoryIntelligenceLayer from './StoryIntelligenceLayer';
import SocialIntelligenceLayer from './SocialIntelligenceLayer';
import ProductionIntelligenceLayer from './ProductionIntelligenceLayer';
import ContentGapsLayer from './ContentGapsLayer';

const IntelligenceLayerManager = ({ nodes }) => {
  const { activeIntelligence } = useJourneyIntelligenceStore();
  
  // Render active intelligence layers
  return (
    <>
      {activeIntelligence.economic && <EconomicLayer nodes={nodes} />}
      {activeIntelligence.story && <StoryIntelligenceLayer nodes={nodes} />}
      {activeIntelligence.social && <SocialIntelligenceLayer nodes={nodes} />}
      {activeIntelligence.production && <ProductionIntelligenceLayer nodes={nodes} />}
      {activeIntelligence.contentGaps && <ContentGapsLayer nodes={nodes} />}
    </>
  );
};

export default IntelligenceLayerManager;