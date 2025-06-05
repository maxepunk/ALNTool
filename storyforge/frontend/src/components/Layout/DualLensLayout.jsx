import React from 'react';
import CommandBar from './CommandBar';
import ContextWorkspace from './ContextWorkspace';
import { Box, Grid, Paper } from '@mui/material';

const DualLensLayout = ({ journeySpaceContent, systemSpaceContent }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 2 }}>
      <CommandBar />

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', mb: 2 }}>
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={1} sx={{ padding: 2, flexGrow: 1, overflow: 'auto' }}>
              {journeySpaceContent}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={1} sx={{ padding: 2, flexGrow: 1, overflow: 'auto' }}>
              {systemSpaceContent}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <ContextWorkspace />
    </Box>
  );
};

// It seems I forgot to import Paper, let me add it.
export default DualLensLayout;
