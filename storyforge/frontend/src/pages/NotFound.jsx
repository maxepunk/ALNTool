import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100% - 64px)', // Adjust for AppBar if AppLayout context is different
        textAlign: 'center',
        p: 3,
      }}
    >
      <Paper sx={{ p: {xs:3, sm:5}, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} elevation={3}>
        <SentimentVeryDissatisfiedIcon sx={{ fontSize: '5rem', color: 'text.secondary' }} />
        <Typography variant="h1" component="h1" sx={{ fontSize: {xs: '4rem', sm:'6rem'}, fontWeight: 'bold', color: 'primary.main' }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" sx={{ mb: 1, fontWeight: 500 }}>
          Oops! Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          The page you're looking for doesn't exist, might have been moved, or you don't have permission to view it.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" color="primary" size="large">
          Return to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

export default NotFound; 