import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, TextField, Button, Box } from '@mui/material';

const CommandBar = () => {
  return (
    <AppBar position="static" color="default" sx={{ mb: 2 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            sx={{  maxWidth: '250px' }} // Adjusted width
          />
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push buttons to the right */}
          <Button variant="contained" color="primary" size="small">
            Quick Create
          </Button>
          <Button variant="outlined" size="small">
            Sync
          </Button>
          <Button variant="outlined" size="small">
            Export
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default CommandBar;
