import React, { useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import useJourneyStore from '../../stores/journeyStore'; // Adjusted path
import ActivityBlock from './ActivityBlock';
import GapIndicator from './GapIndicator';

const GAME_DURATION_MINUTES = 90;
const INTERVAL_MINUTES = 5;

const TimelineView = () => {
  const activeCharacterId = useJourneyStore(state => state.activeCharacterId);
  const journeyData = useJourneyStore(state => state.journeyData);
  const gapsData = useJourneyStore(state => state.gaps);
  const loadingJourneyCharacterId = useJourneyStore(state => state.loadingJourneyCharacterId);
  const error = useJourneyStore(state => state.error);
  const loadJourney = useJourneyStore(state => state.loadJourney);
  const selectedTimeRange = useJourneyStore(state => state.selectedTimeRange); // Added

  const activeJourney = activeCharacterId ? journeyData.get(activeCharacterId) : null;
  const activeGaps = activeCharacterId ? gapsData.get(activeCharacterId) || [] : [];

  useEffect(() => {
    // For testing purposes, let's set an active character if none is set.
    // In a real app, this would be set by user interaction.
    // if (!activeCharacterId) {
    //   setActiveCharacterId('char_vivian_darkwood'); // Example character ID
    // }

    if (activeCharacterId && !activeJourney && loadingJourneyCharacterId !== activeCharacterId) {
      loadJourney(activeCharacterId);
    }
  }, [activeCharacterId, activeJourney, loadingJourneyCharacterId, loadJourney]);

  if (!activeCharacterId) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Select a Character</Typography>
        <Typography>Please select a character to view their journey timeline.</Typography>
      </Paper>
    );
  }

  if (loadingJourneyCharacterId === activeCharacterId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading journey for {activeCharacterId}...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography>Error loading journey: {error}</Typography>
      </Alert>
    );
  }

  if (!activeJourney) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No journey data available for {activeCharacterId}.</Typography>
        {/* Optionally, add a button to try loading again */}
      </Paper>
    );
  }

  const timeIntervals = [];
  for (let i = 0; i < GAME_DURATION_MINUTES; i += INTERVAL_MINUTES) {
    timeIntervals.push({ start: i, end: i + INTERVAL_MINUTES });
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Timeline for {activeJourney.character_info?.name || activeCharacterId}
      </Typography>
      <List dense>
        {timeIntervals.map((interval, index) => {
          // Initial filtering by the 5-minute interval block
          let segmentsInInterval = activeJourney.segments?.filter(
            segment => segment.start_minute >= interval.start && segment.start_minute < interval.end
          ) || [];

          let gapsInInterval = activeGaps.filter(
            gap => Math.max(gap.start_minute, interval.start) < Math.min(gap.end_minute, interval.end)
          );

          // Further filter by selectedTimeRange from the store
          segmentsInInterval = segmentsInInterval.filter(
            segment => segment.start_minute >= selectedTimeRange[0] && segment.start_minute < selectedTimeRange[1]
          );

          gapsInInterval = gapsInInterval.filter(
            gap => Math.max(gap.start_minute, selectedTimeRange[0]) < Math.min(gap.end_minute, selectedTimeRange[1])
          );

          // If after global filtering, this interval is entirely outside the selectedTimeRange and has no items,
          // we could potentially skip rendering it, or render it differently.
          // For now, just filter contents. The interval itself will still show.
          // We only render the list item if it's within the broad selectedTimeRange or to show empty state for it.
          // This check ensures we don't render time intervals completely outside the selected range,
          // unless those intervals are the ones that *would* contain items if not for the global filter.
          // A simpler approach is to always render the interval row and let the filtering handle content.
          // Let's stick to filtering content as requested first.

          return (
            <React.Fragment key={`interval-${interval.start}`}>
              <ListItem sx={{
                backgroundColor: index % 2 === 0 ? 'action.hover' : 'background.paper',
                py: 1,
                borderBottom: '1px solid #eee',
                display: 'flex',
                flexDirection: 'row', // Changed to row
                alignItems: 'flex-start' // Align items to the top
              }}>
                <ListItemText
                  primary={`${interval.start}-${interval.end} min`}
                  primaryTypographyProps={{ fontWeight: 'bold', width: '100px', flexShrink: 0, fontSize: '0.9rem' }} // Fixed width for time
                />
                <Box sx={{ flexGrow: 1, ml: 2 }}> {/* Box for activities and gaps */}
                  {segmentsInInterval.length === 0 && gapsInInterval.length === 0 && (
                     // Check if the interval itself is outside the selected range to hide "No recorded activity"
                    (interval.end > selectedTimeRange[0] && interval.start < selectedTimeRange[1]) ?
                      <Typography variant="caption" color="textSecondary">No recorded activity or gaps in selected range.</Typography>
                      : <Typography variant="caption" color="textSecondary">-</Typography> // Interval outside selection
                  )}
                  {segmentsInInterval.map(segment => (
                    <React.Fragment key={`segment-${segment.id}`}>
                      {segment.activities?.map((activity, actIndex) => (
                        <ActivityBlock key={`act-${segment.id}-${actIndex}`} activity={activity} type="activity" />
                      ))}
                      {segment.interactions?.map((interaction, intIndex) => (
                        <ActivityBlock key={`int-${segment.id}-${intIndex}`} activity={interaction} type="interaction" />
                      ))}
                      {segment.discoveries?.map((discovery, discIndex) => (
                        <ActivityBlock key={`disc-${segment.id}-${discIndex}`} activity={discovery} type="discovery" />
                      ))}
                    </React.Fragment>
                  ))}
                  {gapsInInterval.map(gap => (
                    <GapIndicator key={`gap-${gap.id}`} gap={gap} />
                  ))}
                </Box>
              </ListItem>
              {index < timeIntervals.length -1 && <Divider component="li" />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};

export default TimelineView;
