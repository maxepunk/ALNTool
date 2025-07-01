import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function ElementTimelineTab({ timelineEvents = [] }) {
  if (timelineEvents.length === 0) {
    return (
      <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
        No timeline events found.
      </Typography>
    );
  }

  return (
    <List dense>
      {timelineEvents.map((event) => {
        if (!event || !event.id) return null;
        return (
          <ListItem 
            key={event.id} 
            button 
            component={RouterLink}
            to={`/timelines/${event.id}`}
            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
          >
            <ListItemText 
              primary={event.description || `Event ID: ${event.id}`} 
              secondary={event.date ? `Date: ${new Date(event.date).toLocaleDateString()}` : 'No date'} 
            />
          </ListItem>
        );
      })}
    </List>
  );
}

export default ElementTimelineTab;