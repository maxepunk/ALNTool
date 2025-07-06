/**
 * EmptyStateManager - Handles empty data states with clear CTAs
 * Provides consistent empty state UI across the application
 */

import React from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';

const EmptyStateManager = ({ onSync, onRefresh }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      gap: 3,
      p: 4
    }}>
      <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Welcome to Journey Intelligence
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          No game data found. To get started, you'll need to sync data from Notion.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>What this tool does:</strong>
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Visualizes character journeys and relationships</li>
            <li>Shows element dependencies and puzzle connections</li>
            <li>Provides design intelligence for game balancing</li>
            <li>Tracks production requirements and dependencies</li>
          </ul>
        </Alert>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={onSync}
          >
            Sync Data from Notion
          </Button>
          
          <Button 
            variant="outlined"
            onClick={onRefresh}
          >
            Refresh Data
          </Button>
          
          <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
            Need help? Check the <a href="#" style={{ color: 'inherit' }}>documentation</a> or contact support.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmptyStateManager;