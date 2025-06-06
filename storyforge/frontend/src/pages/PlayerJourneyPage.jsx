import React, { useEffect } from 'react';
import useJourneyStore from '../stores/journeyStore';
import JourneyGraphView from '../components/PlayerJourney/JourneyGraphView';
import DualLensLayout from '../components/Layout/DualLensLayout';
import { Box, Typography, Paper } from '@mui/material';

function PlayerJourneyPage() {
  const { activeCharacterId, loadJourney, journeyData } = useJourneyStore(state => ({
    activeCharacterId: state.activeCharacterId,
    loadJourney: state.loadJourney,
    journeyData: state.journeyData,
  }));

  useEffect(() => {
    // Load journey data if an active character is selected and their data isn't already loaded.
    if (activeCharacterId && !journeyData.has(activeCharacterId)) {
      loadJourney(activeCharacterId);
    }
  }, [activeCharacterId, journeyData, loadJourney]);

  if (!activeCharacterId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">No Character Selected</Typography>
        <Typography color="text.secondary">Please select a character to view their journey timeline.</Typography>
      </Box>
    );
  }

  const journeySpace = <JourneyGraphView characterId={activeCharacterId} />;
  
  // System space is kept minimal for the journey view.
  // It could be used for journey-specific analytics in the future.
  const systemSpace = (
    <Paper sx={{p: 2, height: '100%'}}>
      <Typography variant="h6">System Context</Typography>
      <Typography variant="body2" color="text.secondary">
        This space will show system-level context related to the selected character's journey.
      </Typography>
    </Paper>
  );

  return (
    <DualLensLayout
      journeySpaceContent={journeySpace}
      systemSpaceContent={systemSpace}
    />
  );
}

export default PlayerJourneyPage; 