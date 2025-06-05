import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, TextField, Button, Box, Typography } from '@mui/material';
import useJourneyStore from '../../stores/journeyStore';

const CommandBar = () => {
  const selectedTimeRange = useJourneyStore(state => state.selectedTimeRange);
  const setSelectedTimeRange = useJourneyStore(state => state.setSelectedTimeRange);

  // Local state for text fields to allow typing before submitting to store
  const [startTimeStr, setStartTimeStr] = useState(selectedTimeRange[0].toString());
  const [endTimeStr, setEndTimeStr] = useState(selectedTimeRange[1].toString());

  useEffect(() => {
    setStartTimeStr(selectedTimeRange[0].toString());
    setEndTimeStr(selectedTimeRange[1].toString());
  }, [selectedTimeRange]);

  const handleTimeChange = () => {
    let start = parseInt(startTimeStr, 10);
    let end = parseInt(endTimeStr, 10);

    // Basic validation
    if (isNaN(start) || isNaN(end)) {
      // If parsing fails, reset to current store values
      setStartTimeStr(selectedTimeRange[0].toString());
      setEndTimeStr(selectedTimeRange[1].toString());
      return;
    }

    start = Math.max(0, start); // Min start time 0
    end = Math.min(90, end);   // Max end time 90 (as per default) - this could be dynamic

    if (start > end) {
      // If start is greater than end, either alert user or reset to valid
      // For now, let's swap them or reset, here resetting local state
      setStartTimeStr(selectedTimeRange[0].toString());
      setEndTimeStr(selectedTimeRange[1].toString());
      return;
    }

    setSelectedTimeRange([start, end]);
  };

  return (
    <AppBar position="static" color="default" sx={{ mb: 2 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            sx={{  maxWidth: '250px' }} // Adjusted width
          />
          <TextField
            label="Start Time (min)"
            variant="outlined"
            size="small"
            type="number"
            value={startTimeStr}
            onChange={(e) => setStartTimeStr(e.target.value)}
            onBlur={handleTimeChange}
            onKeyPress={(e) => e.key === 'Enter' && handleTimeChange()}
            sx={{ width: '120px' }}
            inputProps={{ min: 0, max: 90 }} // Basic HTML5 validation
          />
          <TextField
            label="End Time (min)"
            variant="outlined"
            size="small"
            type="number"
            value={endTimeStr}
            onChange={(e) => setEndTimeStr(e.target.value)}
            onBlur={handleTimeChange}
            onKeyPress={(e) => e.key === 'Enter' && handleTimeChange()}
            sx={{ width: '120px' }}
            inputProps={{ min: 0, max: 90 }} // Basic HTML5 validation
          />
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push buttons to the right */}
          <Button variant="contained" color="primary" size="small">
            Quick Create
          </Button>
          <Button variant="outlined" size="small">
            Sync
          </Button>
          <Button variant="outlined" size="small">
            Export
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default CommandBar;
