import React from 'react';
import { Paper, Typography, Box, CircularProgress, List, ListItem, ListItemText, Alert, Chip } from '@mui/material';
import useJourneyStore from '../../stores/journeyStore'; // Adjusted path

const ContextWorkspace = () => {
  const selectedGap = useJourneyStore(state => state.selectedGapDetails()); // Using the getter
  const suggestions = useJourneyStore(state => state.currentGapSuggestions()); // Using the getter
  const loadingSuggestions = useJourneyStore(state => state.loadingSuggestions);
  const suggestionError = useJourneyStore(state => state.suggestionError);

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 2,
        marginTop: 2,
        minHeight: '200px', // Increased minHeight
        borderTop: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Context Workspace
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {!selectedGap && (
          <Typography variant="body2" color="textSecondary">
            Select a gap in the timeline to see details and suggestions here.
          </Typography>
        )}

        {selectedGap && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Selected Gap Details:
            </Typography>
            <Typography variant="body2">
              ID: {selectedGap.id ? selectedGap.id.slice(0, 8) + '...' + selectedGap.id.slice(-8) : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Minutes: {selectedGap.start_minute} - {selectedGap.end_minute} (Duration: {selectedGap.end_minute - selectedGap.start_minute} min)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Severity: <Chip label={selectedGap.severity || 'N/A'} size="small" color={
                selectedGap.severity === 'high' ? 'error' : selectedGap.severity === 'medium' ? 'warning' : 'info'
              } />
            </Typography>

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
              Suggestions:
            </Typography>
            {loadingSuggestions && (
              <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading suggestions...</Typography>
              </Box>
            )}
            {suggestionError && (
              <Alert severity="error" sx={{ my: 1 }}>{suggestionError}</Alert>
            )}
            {!loadingSuggestions && !suggestionError && suggestions.length === 0 && (
              <Typography variant="body2" color="textSecondary">No suggestions available for this gap.</Typography>
            )}
            {!loadingSuggestions && !suggestionError && suggestions.length > 0 && (
              <List dense>
                {suggestions.map((sugg) => (
                  <ListItem key={sugg.id} disableGutters sx={{ borderBottom: '1px solid #f0f0f0', pb:1, mb:1}}>
                    <ListItemText
                      primary={sugg.description}
                      secondary={`Type: ${sugg.type}`}
                      primaryTypographyProps={{fontSize: '0.9rem'}}
                      secondaryTypographyProps={{fontSize: '0.8rem'}}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ContextWorkspace;
