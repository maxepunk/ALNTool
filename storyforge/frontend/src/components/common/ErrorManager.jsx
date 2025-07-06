/**
 * ErrorManager - Centralized error display component
 * Handles different error states with appropriate UI feedback
 */

import React from 'react';
import { Box, Alert, Typography, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

const ErrorManager = ({ error, onRetry }) => {
  if (!error) return null;

  const errorMessage = error?.message || 'An unexpected error occurred';
  const errorCode = error?.code || 'UNKNOWN_ERROR';

  return (
    <Box sx={{ p: 4 }}>
      <Alert 
        severity="error" 
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          )
        }
      >
        <Typography variant="h6" gutterBottom>
          Unable to load data
        </Typography>
        <Typography variant="body2">
          {errorMessage}
        </Typography>
        {process.env.NODE_ENV === 'development' && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Error Code: {errorCode}
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorManager;