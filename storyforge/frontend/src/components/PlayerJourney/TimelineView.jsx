import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, List, ListItem, ListItemText, Divider, Alert, IconButton } from '@mui/material';
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, CenterFocusStrong as CenterFocusIcon } from '@mui/icons-material';
import useJourneyStore from '../../stores/journeyStore'; // Adjusted path
import ActivityBlock from './ActivityBlock';
import GapIndicator from './GapIndicator';

const GAME_DURATION_MINUTES = 90;
const INTERVAL_MINUTES = 5;

// TimelineControls Component
const TimelineControls = ({ setZoom, setPan }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
      <IconButton onClick={() => setZoom(prevZoom => Math.min(prevZoom * 1.2, 5))} aria-label="zoom in">
        <ZoomInIcon />
      </IconButton>
      <IconButton onClick={() => setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.5))} aria-label="zoom out">
        <ZoomOutIcon />
      </IconButton>
      <IconButton onClick={() => { setZoom(1); setPan(0); }} aria-label="reset view">
        <CenterFocusIcon />
      </IconButton>
    </Box>
  );
};

const TimelineView = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0); // Horizontal offset
  const paperRef = useRef(null); // Ref for the Paper component
  const zoomableBoxRef = useRef(null); // Ref for the zoomable content Box
  const [isPanning, setIsPanning] = useState(false);
  const lastPanX = useRef(0);

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
    if (activeCharacterId && !activeJourney && loadingJourneyCharacterId !== activeCharacterId) {
      loadJourney(activeCharacterId);
    }
  }, [activeCharacterId, activeJourney, loadingJourneyCharacterId, loadJourney]);

  // Effect for Ctrl+Scroll zoom
  useEffect(() => {
    const timelinePaper = paperRef.current;
    if (!timelinePaper) return;

    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const zoomFactor = 1.1;
        if (event.deltaY < 0) { // Zoom in
          setZoom(prevZoom => Math.min(prevZoom * zoomFactor, 5));
        } else { // Zoom out
          setZoom(prevZoom => Math.max(prevZoom / zoomFactor, 0.5));
        }
      }
    };

    timelinePaper.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      timelinePaper.removeEventListener('wheel', handleWheel);
    };
  }, [setZoom]);

  // Effect for handling panning mouse events globally
  useEffect(() => {
    const zoomableElement = zoomableBoxRef.current;

    const handleMouseMoveGlobal = (event) => {
      if (!isPanning) return;
      const deltaX = event.clientX - lastPanX.current;
      setPan(prevPan => prevPan + deltaX);
      lastPanX.current = event.clientX;
    };

    const handleMouseUpGlobal = () => {
      if (!isPanning) return;
      setIsPanning(false);
      if (zoomableElement) {
        zoomableElement.style.cursor = 'grab';
      }
      document.body.style.userSelect = ''; // Re-enable text selection
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUpGlobal);
      document.body.style.userSelect = 'none'; // Disable text selection during pan
      if (zoomableElement) {
        zoomableElement.style.cursor = 'grabbing';
      }
    } else {
      if (zoomableElement) {
        zoomableElement.style.cursor = 'grab';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      document.body.style.userSelect = ''; // Ensure userSelect is reset
      if (zoomableElement) {
        zoomableElement.style.cursor = 'grab'; // Reset cursor on cleanup
      }
    };
  }, [isPanning, setPan]);


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
    <Paper ref={paperRef} elevation={2} sx={{ p: 2, overflow: 'hidden' /* Prevent Paper itself from scrolling due to zoom */ }}>
      <TimelineControls setZoom={setZoom} setPan={setPan} />
      <Typography variant="h5" gutterBottom>
        Timeline for {activeJourney.character_info?.name || activeCharacterId}
      </Typography>
      <Box sx={{ overflowX: 'auto' /* Enable horizontal scrolling for the content */ }}>
        <Box
          ref={zoomableBoxRef}
          onMouseDown={(event) => {
            // Only pan with left click; and not if clicking on a button or interactive element within
            if (event.button !== 0) return;
            // Example: prevent starting pan if clicking on an interactive child (e.g. an action button on an activity)
            // if (event.target.closest('button')) return;

            setIsPanning(true);
            lastPanX.current = event.clientX;
            // Cursor style is handled by the useEffect watching isPanning
          }}
          sx={{
            transform: `translateX(${pan}px) scaleX(${zoom})`,
            transformOrigin: 'left top',
            width: '100%',
            cursor: 'grab', // Initial cursor
            // transition: 'transform 0.05s ease-out', // Can make pan feel laggy, use with caution
          }}
        >
          <List dense sx={{
            // If content inside ListItem needs to maintain aspect ratio,
            // you might apply inverse scale to children, but for text/blocks, stretching is often fine.
            // display: 'table', // May help with width calculations if using percentage widths inside
            // tableLayout: 'fixed', // If using table display
          }}>
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
        </Box>
      </Box>
    </Paper>
  );
};

export default TimelineView;
