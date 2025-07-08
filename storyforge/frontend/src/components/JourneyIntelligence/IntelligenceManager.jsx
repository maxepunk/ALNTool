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
      {activeIntelligence.includes('economic') && <EconomicLayer nodes={nodes} />}
      {activeIntelligence.includes('story') && <StoryIntelligenceLayer nodes={nodes} />}
      {activeIntelligence.includes('social') && <SocialIntelligenceLayer nodes={nodes} />}
      {activeIntelligence.includes('production') && <ProductionIntelligenceLayer nodes={nodes} />}
      {activeIntelligence.includes('gaps') && <ContentGapsLayer nodes={nodes} />}
    </>
  );
};

export default IntelligenceLayerManager;