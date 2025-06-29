import React from 'react';
import CommandBar from './CommandBar';
import ContextWorkspace from './ContextWorkspace';
import { Box, Grid, Paper } from '@mui/material';

const DualLensLayout = ({ 
  journeySpaceContent, 
  systemSpaceContent,
  onSearch,
  onExport,
  exportData,
  exportFilename
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 2 }}>
      <CommandBar 
        onSearch={onSearch}
        onExport={onExport}
        exportData={exportData}
        exportFilename={exportFilename}
      />

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

export default DualLensLayout;
