import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const PageActions = ({ 
  isFetching, 
  showMapper, 
  onRefresh, 
  onToggleMapper, 
  onEdit, 
  puzzleId 
}) => {
  const navigate = useNavigate();

  const handleViewFlow = () => {
    navigate(`/puzzles/${puzzleId}/flow`);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={isFetching ? "Refreshing..." : "Refresh Data"}>
        <span>
          <IconButton 
            onClick={onRefresh} 
            disabled={isFetching} 
            aria-label="refresh puzzle data"
          >
            {isFetching ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </span>
      </Tooltip>
      
      <Tooltip title={showMapper ? "Hide Relationship Map" : "Show Relationship Map"}>
        <IconButton 
          onClick={onToggleMapper} 
          aria-label="toggle relationship map" 
          color={showMapper ? "primary" : "default"}
        >
          {showMapper ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Edit puzzle (Phase 3)">
        <Button 
          variant="contained" 
          startIcon={<EditIcon />} 
          onClick={onEdit} 
          size="medium"
        >
          Edit Puzzle
        </Button>
      </Tooltip>
      
      <Tooltip title="View Puzzle Flow">
        <Button
          variant="outlined"
          startIcon={<AccountTreeIcon />}
          onClick={handleViewFlow}
          size="medium"
          sx={{ ml: 1 }}
        >
          View Flow
        </Button>
      </Tooltip>
    </Box>
  );
};

export default PageActions;