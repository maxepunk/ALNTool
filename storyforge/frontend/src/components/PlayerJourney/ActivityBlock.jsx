import React from 'react';
import { Chip, Box } from '@mui/material';
import useJourneyStore from '../../stores/journeyStore';

const ActivityBlock = ({ activity }) => {
  if (!activity) {
    return null;
  }

  const setSelectedActivityDetail = useJourneyStore(state => state.setSelectedActivityDetail);
  const selectedActivity = useJourneyStore(state => state.selectedActivityDetails); // Renamed for clarity

  // Determine if this activity block is selected.
  // This assumes `activity` is either a unique string or an object with a unique `id`.
  let isSelected = false;
  if (selectedActivity && activity) {
    if (typeof activity === 'string') {
      isSelected = selectedActivity === activity;
    } else if (activity.id && selectedActivity.id) {
      isSelected = selectedActivity.id === activity.id;
    } else {
      // Fallback for objects without id: stringify and compare. Might be slow / unreliable.
      // Consider ensuring all activities have a unique ID if they are objects.
      try {
        isSelected = JSON.stringify(selectedActivity) === JSON.stringify(activity);
      } catch (e) {
        // If stringification fails (e.g. circular references, though unlikely for simple activity objects)
        isSelected = false;
      }
    }
  }

  // Assuming activity is a string or an object with a description.
  const activityLabel = typeof activity === 'string' ? activity : activity.description || 'Unknown Activity';

  const handleClick = () => {
    setSelectedActivityDetail(activity);
  };

  return (
    <Box
      sx={{
        margin: '4px 0',
        cursor: 'pointer',
        border: isSelected ? '2px solid' : '2px solid transparent', // Visual cue for selection
        borderColor: isSelected ? 'primary.main' : 'transparent', // Use theme color
        borderRadius: '16px', // Match Chip's border radius if using variant="outlined"
        padding: '1px', // To make border visible without changing layout much
        transition: 'border-color 0.2s ease-in-out', // Smooth transition for selection
        '&:hover': {
          borderColor: isSelected ? 'primary.dark' : 'grey.400', // Hover feedback
        }
      }}
      onClick={handleClick}
    >
      <Chip
        label={activityLabel}
        size="small"
        variant={isSelected ? "filled" : "outlined"} // Change variant for selection
        color="primary"
        sx={{
          height: 'auto',
          width: '100%', // Make chip fill the Box for better click area and border display
          '& .MuiChip-label': {
            display: 'block',
            whiteSpace: 'normal',
            padding: '3px 6px'
          },
        }}
      />
    </Box>
  );
};

export default ActivityBlock;
