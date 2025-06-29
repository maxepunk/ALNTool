import React, { useState, useEffect } from 'react';
import logger from '../../utils/logger';
import { 
  AppBar, 
  Toolbar, 
  TextField, 
  Button, 
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

const CommandBar = ({ onSearch, onExport, exportData, exportFilename = 'export' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Use custom debounce hook or create one inline
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Handle search with debouncing
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  // Handle sync functionality
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncMessage(null);
    
    try {
      const response = await api.syncData();
      setSyncMessage({
        type: 'success',
        text: response.message || 'Sync completed successfully'
      });
      setShowSnackbar(true);
      
      // Refresh the page data after successful sync
      if (window.location.reload) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      logger.error('Sync error:', error);
      setSyncMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Sync failed'
      });
      setShowSnackbar(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle export functionality
  const handleExport = (format) => {
    if (!onExport && !exportData) {
      logger.warn('No export handler or data provided');
      return;
    }

    let dataToExport = exportData;
    
    // If onExport is provided, use it to get the data
    if (onExport) {
      dataToExport = onExport(format);
    }

    if (!dataToExport) {
      logger.warn('No data to export');
      return;
    }

    let content, mimeType, extension;
    
    if (format === 'json') {
      content = JSON.stringify(dataToExport, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV export
      content = convertToCSV(dataToExport);
      mimeType = 'text/csv';
      extension = 'csv';
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFilename}-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSyncMessage({
      type: 'success',
      text: `Exported as ${format.toUpperCase()}`
    });
    setShowSnackbar(true);
  };

  // Convert data to CSV format
  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    // Convert each row
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle nested objects/arrays
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  // Handle Quick Create menu
  const handleQuickCreateClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleQuickCreateClose = () => {
    setAnchorEl(null);
  };

  const handleQuickCreate = (type) => {
    // For now, just show a message. Full implementation deferred.
    setSyncMessage({
      type: 'info',
      text: `Create ${type} functionality coming soon!`
    });
    setShowSnackbar(true);
    handleQuickCreateClose();
  };

  return (
    <>
      <AppBar position="static" color="default" sx={{ mb: 2 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: '250px' }}
            />
            <Box sx={{ flexGrow: 1 }} />
            
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<AddIcon />}
              onClick={handleQuickCreateClick}
            >
              Quick Create
            </Button>
            
            <Button 
              variant="outlined" 
              size="small"
              startIcon={isSyncing ? <CircularProgress size={16} /> : <SyncIcon />}
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
            
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={!exportData && !onExport}
            >
              Export
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Quick Create Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleQuickCreateClose}
      >
        <MenuItem onClick={() => handleQuickCreate('Character')}>New Character</MenuItem>
        <MenuItem onClick={() => handleQuickCreate('Element')}>New Element</MenuItem>
        <MenuItem onClick={() => handleQuickCreate('Puzzle')}>New Puzzle</MenuItem>
        <MenuItem onClick={() => handleQuickCreate('Timeline Event')}>New Timeline Event</MenuItem>
      </Menu>

      {/* Feedback Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {syncMessage && (
          <Alert 
            onClose={() => setShowSnackbar(false)} 
            severity={syncMessage.type} 
            sx={{ width: '100%' }}
          >
            {syncMessage.text}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default CommandBar;
