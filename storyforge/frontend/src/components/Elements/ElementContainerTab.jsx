import { Typography, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function ElementContainerTab({ container }) {
  if (!container) {
    return (
      <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
        No container information.
      </Typography>
    );
  }

  return (
    <Typography variant="body1">
      This element is inside: {' '}
      <Chip 
        label={container.name || `Element ID: ${container.id}`} 
        component={RouterLink}
        to={`/elements/${container.id}`}
        clickable
        color="primary"
        variant="outlined"
      />
    </Typography>
  );
}

export default ElementContainerTab;