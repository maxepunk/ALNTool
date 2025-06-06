import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import useJourneyStore from '../../stores/journeyStore';

const ContextWorkspace = () => {
  const selectedNode = useJourneyStore(state => state.selectedNode);

  const renderNodeDetails = () => {
    if (!selectedNode) {
      return (
        <Typography variant="body2" color="textSecondary">
          Select a node in the journey graph to see its details.
        </Typography>
      );
    }

    // You can customize the details shown for each node type
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Selected Node Details:
        </Typography>
        <Typography variant="body2">
          ID: {selectedNode.id}
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 2 }}>
          Type: <Chip label={selectedNode.type || 'N/A'} size="small" />
        </Typography>
        <Typography variant="body2">
          Label: {selectedNode.data?.label || 'No label'}
        </Typography>
        {/* Add more details from selectedNode.data as needed */}
      </Box>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 2,
        marginTop: 2,
        minHeight: '200px',
        borderTop: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Context Workspace
      </Typography>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {renderNodeDetails()}
      </Box>
    </Paper>
  );
};

export default ContextWorkspace;
