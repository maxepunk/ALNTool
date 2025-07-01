import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TabsContent = ({ puzzle, activeTab }) => {
  if (!puzzle) return null;

  // Required Elements Tab (activeTab === 0)
  if (activeTab === 0) {
    return (
      <Box>
        {puzzle.requiredElements?.length > 0 ? (
          <List dense>
            {puzzle.requiredElements.map((element) => {
              if (!element || !element.id) return null;
              return (
                <ListItem 
                  key={element.id} 
                  button 
                  component={RouterLink}
                  to={`/elements/${element.id}`}
                  sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.selected' } }}
                >
                  <ListItemText 
                    primary={element.name || `Element ID: ${element.id}`} 
                    secondary={element.basicType ? `Type: ${element.basicType}` : 'Unknown type'} 
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography 
            color="text.secondary" 
            sx={{ textAlign: 'center', pt: 3, fontStyle: 'italic' }}
          >
            No required elements found.
          </Typography>
        )}
      </Box>
    );
  }

  // Reward Elements Tab (activeTab === 1)
  if (activeTab === 1) {
    return (
      <Box>
        {puzzle.rewards?.length > 0 ? (
          <List dense>
            {puzzle.rewards.map((element) => {
              if (!element || !element.id) return null;
              return (
                <ListItem 
                  key={element.id} 
                  button 
                  component={RouterLink}
                  to={`/elements/${element.id}`}
                  sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.selected' } }}
                >
                  <ListItemText 
                    primary={element.name || `Element ID: ${element.id}`} 
                    secondary={element.basicType ? `Type: ${element.basicType}` : 'Unknown type'} 
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography 
            color="text.secondary" 
            sx={{ textAlign: 'center', pt: 3, fontStyle: 'italic' }}
          >
            No reward elements found.
          </Typography>
        )}
      </Box>
    );
  }

  // Locked Item Tab (activeTab === 2, only if locked item exists)
  if (puzzle.lockedItem && activeTab === 2) {
    return (
      <List dense>
        {puzzle.lockedItem.id ? (
          <ListItem 
            button 
            component={RouterLink}
            to={`/elements/${puzzle.lockedItem.id}`}
            sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.selected' } }}
          >
            <ListItemText 
              primary={puzzle.lockedItem.name || `Element ID: ${puzzle.lockedItem.id}`} 
              secondary={puzzle.lockedItem.basicType ? `Type: ${puzzle.lockedItem.basicType}` : 'Unknown type'} 
            />
          </ListItem>
        ) : (
          <Typography 
            color="text.secondary" 
            sx={{ textAlign: 'center', pt: 3, fontStyle: 'italic' }}
          >
            Locked item data is incomplete.
          </Typography>
        )}
      </List>
    );
  }

  // Sub Puzzles Tab (activeTab === 3 if locked item exists, or === 2 if no locked item)
  const subPuzzleTabIndex = puzzle.lockedItem ? 3 : 2;
  if (puzzle.subPuzzles?.length > 0 && activeTab === subPuzzleTabIndex) {
    return (
      <List dense>
        {puzzle.subPuzzles.map((subPuzzle) => {
          if (!subPuzzle || !subPuzzle.id) return null;
          return (
            <ListItem 
              key={subPuzzle.id} 
              button 
              component={RouterLink}
              to={`/puzzles/${subPuzzle.id}`}
              sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.selected' } }}
            >
              <ListItemText 
                primary={subPuzzle.puzzle || `Puzzle ID: ${subPuzzle.id}`} 
                secondary={subPuzzle.timing ? `Timing: ${subPuzzle.timing}` : 'No timing specified'} 
              />
            </ListItem>
          );
        })}
      </List>
    );
  }

  // Default fallback
  return null;
};

export default TabsContent;