import React from 'react';
import { Chip, Typography, Box } from '@mui/material';

const ActivityBlock = ({ activity }) => {
  if (!activity) {
    return null;
  }

  // Assuming activity is a string for now as per journeyEngine.js (segment.activities.push(`Participated in event: ${event.description || event.id}`))
  // If it becomes an object, this component will need to be adjusted.
  const activityLabel = typeof activity === 'string' ? activity : activity.description || 'Unknown Activity';

  return (
    <Box sx={{ margin: '4px 0' }}>
      <Chip
        label={activityLabel}
        size="small"
        variant="outlined"
        color="primary"
        sx={{
          height: 'auto',
          '& .MuiChip-label': {
            display: 'block',
            whiteSpace: 'normal',
            padding: '3px 6px'
          }
        }}
      />
    </Box>
  );
};

export default ActivityBlock;
