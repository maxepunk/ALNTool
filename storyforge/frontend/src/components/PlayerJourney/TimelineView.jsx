import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, CircularProgress, Typography, Slider, IconButton, Tooltip, Alert, Divider } from '@mui/material';
import useJourneyStore from '../../stores/journeyStore';
import ActivityBlock from './ActivityBlock';
import GapIndicator from './GapIndicator';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { useTheme } from '@mui/material/styles';

const TimelineRuler = ({ duration, zoom }) => {
  const theme = useTheme();
  const markers = [];
  const interval = zoom < 1.5 ? 15 : (zoom < 3 ? 5 : 1);

  for (let minute = 0; minute <= duration; minute += interval) {
    markers.push(
      <Box
        key={minute}
        sx={{
          position: 'absolute',
          left: `${(minute / duration) * 100}%`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pr: '1px', 
        }}
      >
        <Typography variant="caption" sx={{ userSelect: 'none', color: theme.palette.text.secondary }}>
          {minute}'
        </Typography>
        <Box sx={{
          width: '1px',
          flexGrow: 1,
          bgcolor: minute % 15 === 0 ? theme.palette.divider : theme.palette.action.hover,
        }} />
      </Box>
    );
  }
  return <Box sx={{ position: 'relative', height: '30px', mb: 2 }}>{markers}</Box>;
};

function TimelineView({ characterId }) {
  const theme = useTheme();

  // State for zoom and pan
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [pan, setPan] = useState(0); // 0 to 100
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(0);
  const timelineContainerRef = useRef(null);

  // Get relevant data and actions from the store
  const { 
    journeyData, 
    gaps, 
    loadingJourneyCharacterId, 
    error, 
    loadJourney,
    clearJourneyData,
  } = useJourneyStore(state => ({
    journeyData: state.journeyData,
    gaps: state.gaps,
    loadingJourneyCharacterId: state.loadingJourneyCharacterId,
    error: state.error,
    loadJourney: state.loadJourney,
    clearJourneyData: state.clearJourneyData,
  }));
  
  // Derived state
  const isLoading = loadingJourneyCharacterId === characterId;
  const journey = journeyData.get(characterId);
  const journeyGaps = gaps.get(characterId) || [];
  
  // Effect to load journey data when the characterId prop changes
  useEffect(() => {
    const isLoaded = journeyData.has(characterId);
    const isLoading = loadingJourneyCharacterId === characterId;

    if (characterId && !isLoaded && !isLoading) {
      loadJourney(characterId);
    }
    
    // Cleanup function to clear data for this character when component unmounts or ID changes
    return () => {
      if (characterId) {
        // Optional: decide if you want to clear data on unmount.
        // This could be useful if you want fresh data every time,
        // but can be inefficient if the user toggles views frequently.
        // clearJourneyData(characterId);
      }
    };
  }, [characterId, journeyData, loadingJourneyCharacterId, loadJourney]);

  // Zoom and Pan handlers
  const handleZoom = (newZoom) => {
    const clampedZoom = Math.max(1, Math.min(newZoom, 5));
    setZoom(clampedZoom);
  };
  
  const handlePan = (event) => {
    if (isPanning && timelineContainerRef.current) {
      const delta = event.clientX - panStart;
      const newPan = pan + (delta / timelineContainerRef.current.clientWidth) * 100 * zoom;
      setPan(Math.max(0, Math.min(newPan, 100 * (zoom - 1))));
      setPanStart(event.clientX);
    }
  };

  const startPanning = (event) => {
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart(event.clientX);
      timelineContainerRef.current.style.cursor = 'grabbing';
    }
  };
  
  const stopPanning = () => {
    if (isPanning) {
      setIsPanning(false);
      if (timelineContainerRef.current) {
          timelineContainerRef.current.style.cursor = 'grab';
      }
    }
  };
  
  // Effect for mouse events for panning
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', handlePan);
      container.addEventListener('mouseup', stopPanning);
      container.addEventListener('mouseleave', stopPanning);
      return () => {
        container.removeEventListener('mousemove', handlePan);
        container.removeEventListener('mouseup', stopPanning);
        container.removeEventListener('mouseleave', stopPanning);
      };
    }
  }, [isPanning, pan, panStart, zoom]);

  const resetView = () => {
    setZoom(1);
    setPan(0);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: '100%' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Journey for {characterId}...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
        <Alert severity="error" sx={{m: 2}}>
            Failed to load journey: {error}
        </Alert>
    );
  }

  if (!journey) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: '100%' }}>
        <Typography>No journey data available for this character.</Typography>
      </Box>
    );
  }

  const { segments } = journey;

  return (
    <Paper 
      ref={timelineContainerRef}
      onMouseDown={startPanning}
      sx={{ 
        p: 3, 
        height: 'calc(100vh - 150px)', 
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        cursor: zoom > 1 ? 'grab' : 'default'
      }}
      elevation={2}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" component="h2">
              {journey.character_info?.name || 'Player Journey'}
          </Typography>
          <Box>
            <Tooltip title="Zoom In">
              <IconButton onClick={() => handleZoom(zoom * 1.2)}><ZoomInIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={() => handleZoom(zoom / 1.2)}><ZoomOutIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Reset View">
              <IconButton onClick={resetView}><CenterFocusStrongIcon /></IconButton>
            </Tooltip>
          </Box>
      </Box>
      <Divider sx={{mb: 2}} />
      <Box sx={{ height: 'calc(100% - 80px)', overflowX: 'auto', overflowY: 'hidden' }}>
        <Box
            sx={{
              width: `${zoom * 100}%`,
              height: '100%',
              position: 'relative',
              transform: `translateX(-${pan / zoom}%)`,
              transition: isPanning ? 'none' : 'transform 0.2s ease-out',
            }}
          >
          <TimelineRuler duration={90} zoom={zoom} />
          <Box sx={{ position: 'relative', height: 'calc(100% - 50px)' }}>
            {/* Render Gaps */}
            {journeyGaps.map((gap) => (
              <GapIndicator key={gap.id} gap={gap} duration={90} />
            ))}
            
            {/* Render Segments and Activities */}
            {segments.map((segment) => {
              const activities = [
                ...(segment.activities || []),
                ...(segment.interactions || []),
                ...(segment.discoveries || []),
              ];

              return (
                <Box key={`segment-${segment.start_minute}`} sx={{
                  position: 'absolute',
                  left: `${(segment.start_minute / 90) * 100}%`,
                  width: `${((segment.end_minute - segment.start_minute) / 90) * 100}%`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}>
                  {activities.map((activity, activityIndex) => (
                    <ActivityBlock key={`${activity}-${activityIndex}`} activity={{ description: activity }} />
                  ))}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default TimelineView;
