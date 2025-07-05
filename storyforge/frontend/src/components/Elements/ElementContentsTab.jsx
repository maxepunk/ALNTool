import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function ElementContentsTab({ contents = [] }) {
  if (contents.length === 0) {
    return (
      <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
        This container is empty.
      </Typography>
    );
  }

  return (
    <List dense>
      {contents.map((item) => {
        if (!item || !item.id) return null;
        return (
          <ListItem 
            key={item.id} 
            button 
            component={RouterLink}
            to={`/elements/${item.id}`}
            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
          >
            <ListItemText 
              primary={item.name || `Element ID: ${item.id}`} 
              secondary={item.basicType || null} 
            />
          </ListItem>
        );
      })}
    </List>
  );
}

export default ElementContentsTab;