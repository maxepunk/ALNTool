import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function ElementPuzzlesTab({ puzzles = [], emptyMessage = "No puzzles found." }) {
  if (puzzles.length === 0) {
    return (
      <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <List dense>
      {puzzles.map((puzzle) => {
        if (!puzzle || !puzzle.id) return null;
        return (
          <ListItem 
            key={puzzle.id} 
            button 
            component={RouterLink}
            to={`/puzzles/${puzzle.id}`}
            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
          >
            <ListItemText 
              primary={puzzle.puzzleName || puzzle.name || `Puzzle ID: ${puzzle.id}`} 
              secondary={puzzle.status || null} 
            />
          </ListItem>
        );
      })}
    </List>
  );
}

export default ElementPuzzlesTab;