import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';

const DebugPanel = ({ graphData, loading, error }) => {
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        p: 2, 
        maxWidth: 400,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white'
      }}
    >
      <Typography variant="h6" gutterBottom>Debug Info</Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Chip 
          label={`Loading: ${loading}`} 
          color={loading ? 'warning' : 'success'} 
          size="small" 
        />
        <Chip 
          label={`Error: ${!!error}`} 
          color={error ? 'error' : 'success'} 
          size="small" 
        />
      </Box>
      
      <Typography variant="body2">
        Nodes: {graphData?.nodes?.length || 0}
      </Typography>
      <Typography variant="body2">
        Edges: {graphData?.edges?.length || 0}
      </Typography>
      
      {graphData?.nodes?.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption">First Node:</Typography>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: 200 }}>
            {JSON.stringify(graphData.nodes[0], null, 2)}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default DebugPanel;