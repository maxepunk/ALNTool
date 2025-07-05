import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Paper, Typography, Grid, Button
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MemoryIcon from '@mui/icons-material/Memory';
import ExtensionIcon from '@mui/icons-material/Extension';
import AssessmentIcon from '@mui/icons-material/Assessment';

const QuickActionsPanel = () => {
  return (
    <Paper sx={{ p: 3, mt: 3 }} elevation={2}>
      <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={2}>
        <Grid item>
          <Button 
            component={RouterLink} 
            to="/characters" 
            variant="outlined" 
            startIcon={<PeopleIcon />}
          >
            Manage Characters
          </Button>
        </Grid>
        <Grid item>
          <Button 
            component={RouterLink} 
            to="/memory-economy" 
            variant="outlined" 
            startIcon={<MemoryIcon />}
          >
            Memory Economy
          </Button>
        </Grid>
        <Grid item>
          <Button 
            component={RouterLink} 
            to="/character-sociogram" 
            variant="outlined" 
            startIcon={<ExtensionIcon />}
          >
            Dependency Analysis
          </Button>
        </Grid>
        <Grid item>
          <Button 
            component={RouterLink} 
            to="/" 
            variant="contained" 
            startIcon={<AssessmentIcon />}
          >
            Production Dashboard
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuickActionsPanel;