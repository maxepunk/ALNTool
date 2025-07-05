import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function ElementCharactersTab({ characters = [] }) {
  if (characters.length === 0) {
    return (
      <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
        No associated characters found.
      </Typography>
    );
  }

  return (
    <List dense>
      {characters.map((character) => {
        if (!character || !character.id) return null;
        return (
          <ListItem 
            key={character.id} 
            button 
            component={RouterLink}
            to={`/characters/${character.id}`}
            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
          >
            <ListItemText 
              primary={character.name || `Character ID: ${character.id}`} 
              secondary={character.tier ? `Tier: ${character.tier}` : null} 
            />
          </ListItem>
        );
      })}
    </List>
  );
}

export default ElementCharactersTab;