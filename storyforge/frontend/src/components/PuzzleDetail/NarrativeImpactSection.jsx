import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NarrativeImpactSection = ({ puzzle }) => {
  if (!puzzle) return null;

  return (
    <Paper sx={{ p: 2, mt: 3 }} elevation={1}>
      <Typography variant="h6" gutterBottom>
        Narrative Impact & Cohesion
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Story Reveals */}
      {puzzle.storyReveals && (
        <>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            color="text.primary" 
            sx={{ fontWeight: 'medium' }}
          >
            Key Story Reveals
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2, 
              whiteSpace: 'pre-wrap', 
              fontStyle: 'italic', 
              color: 'text.secondary' 
            }}
          >
            {puzzle.storyReveals}
          </Typography>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {/* Impacted Characters */}
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        color="text.primary" 
        sx={{ fontWeight: 'medium' }}
      >
        Impacted Characters
      </Typography>
      {Array.isArray(puzzle.impactedCharacters) && puzzle.impactedCharacters.length > 0 ? (
        <List dense disablePadding>
          {puzzle.impactedCharacters.map(char => (
            <ListItem key={char.id} disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to={`/characters/${char.id}`} 
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={char.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          None specified.
        </Typography>
      )}
      <Divider sx={{ my: 2 }} />

      {/* Related Timeline Events */}
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        color="text.primary" 
        sx={{ fontWeight: 'medium' }}
      >
        Related Timeline Events
      </Typography>
      {Array.isArray(puzzle.relatedTimelineEvents) && puzzle.relatedTimelineEvents.length > 0 ? (
        <List dense disablePadding>
          {puzzle.relatedTimelineEvents.map(event => (
            <ListItem key={event.id} disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to={`/timelines/${event.id}`} 
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={event.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          None specified.
        </Typography>
      )}
      <Divider sx={{ my: 2 }} />

      {/* Resolution Path Contributions */}
      <Typography 
        variant="subtitle1" 
        gutterBottom 
        color="text.primary" 
        sx={{ fontWeight: 'medium' }}
      >
        Resolution Path Contributions
      </Typography>
      {Array.isArray(puzzle.resolutionPaths) && puzzle.resolutionPaths.length > 0 ? (
        <List dense disablePadding>
          {puzzle.resolutionPaths.map(path => (
            <ListItem key={path.id} disablePadding>
              <ListItemButton sx={{ borderRadius: 1 }}>
                <ListItemText primary={path.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          None specified.
        </Typography>
      )}
    </Paper>
  );
};

export default NarrativeImpactSection;