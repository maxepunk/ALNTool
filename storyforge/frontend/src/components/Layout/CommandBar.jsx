import React from 'react';
import { AppBar, Toolbar, TextField, Button, Box } from '@mui/material';

const CommandBar = () => {
  return (
    <AppBar position="static" color="default" sx={{ mb: 2 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, maxWidth: '300px' }}
          />
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
