import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const GapDetailPopup = ({ gap }) => {
  if (!gap) return null;

  // Destructure with fallback for potentially missing fields to prevent runtime errors
  const { start_minute = 0, end_minute = 0, severity = 'N/A' } = gap;
  const duration = end_minute - start_minute;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: '100%', // Position above the indicator
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px', // Some spacing between indicator and popup
        padding: '12px',
        zIndex: 1000, // Increased zIndex to ensure visibility above other elements like headers
        minWidth: '250px', // Adjusted minWidth for better content display
        maxWidth: '350px', // Added maxWidth to prevent overly wide popups
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderRadius: '8px', // Softer edges
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Enhanced shadow for better depth
        // Prevent text selection during hover interaction
        userSelect: 'none',
      }}
    >
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Gap Details
      </Typography>
      <Box>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Time: {start_minute}m - {end_minute}m
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Duration: {duration} minutes
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          Severity: <Typography component="span" sx={{ fontWeight: 'bold', color: severity === 'High' ? 'error.main' : severity === 'Medium' ? 'warning.main' : 'success.main' }}>{severity}</Typography>
        </Typography>
        {/* Example of how to add more details if they become available */}
        {/* <Typography variant="body2">Type: {gap.type || 'N/A'}</Typography> */}
      </Box>
    </Paper>
  );
};

export default GapDetailPopup;
