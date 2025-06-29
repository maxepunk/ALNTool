import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  IconButton,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Person as PersonIcon,
  Inventory as ElementIcon,
  Extension as PuzzleIcon,
  Timeline as TimelineIcon,
  Clear as ClearIcon,
  MoreVert as MoreIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useNavigate } from 'react-router-dom';

const ContextIndicator = () => {
  const {
    selectedCharacter,
    selectedElement,
    selectedPuzzle,
    selectedTimelineEvent,
    clearSelectedEntity,
    clearAllSelections,
    getSuggestedTools,
    hasSelectedEntity,
    getContextSummary
  } = useWorkflow();

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const suggestedTools = getSuggestedTools();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToolNavigation = (toolPath) => {
    navigate(toolPath);
    handleMenuClose();
  };

  if (!hasSelectedEntity) {
    return null; // Don't show when nothing is selected
  }

  const EntityChip = ({ entity, type, icon, onClear }) => (
    <Chip
      icon={icon}
      label={entity.name || entity.description || `${type} ${entity.id}`}
      variant="outlined"
      size="small"
      onDelete={() => onClear(type)}
      deleteIcon={<ClearIcon />}
      sx={{
        backgroundColor: 'primary.light',
        color: 'primary.contrastText',
        borderColor: 'primary.main',
        '& .MuiChip-deleteIcon': {
          color: 'primary.contrastText',
          '&:hover': {
            color: 'error.main'
          }
        }
      }}
    />
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        Context:
      </Typography>

      {/* Selected entities */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {selectedCharacter && (
          <EntityChip
            entity={selectedCharacter}
            type="character"
            icon={<PersonIcon fontSize="small" />}
            onClear={clearSelectedEntity}
          />
        )}

        {selectedElement && (
          <EntityChip
            entity={selectedElement}
            type="element"
            icon={<ElementIcon fontSize="small" />}
            onClear={clearSelectedEntity}
          />
        )}

        {selectedPuzzle && (
          <EntityChip
            entity={selectedPuzzle}
            type="puzzle"
            icon={<PuzzleIcon fontSize="small" />}
            onClear={clearSelectedEntity}
          />
        )}

        {selectedTimelineEvent && (
          <EntityChip
            entity={selectedTimelineEvent}
            type="timeline"
            icon={<TimelineIcon fontSize="small" />}
            onClear={clearSelectedEntity}
          />
        )}
      </Box>

      {/* Divider */}
      <Divider orientation="vertical" flexItem />

      {/* Suggested tools */}
      {suggestedTools.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary">
            Suggested:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {suggestedTools.slice(0, 2).map((tool, index) => (
              <Tooltip key={index} title={tool.reason}>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<LaunchIcon fontSize="small" />}
                  onClick={() => navigate(tool.path)}
                  sx={{
                    minWidth: 'auto',
                    fontSize: '0.7rem',
                    py: 0.5,
                    px: 1,
                    textTransform: 'none'
                  }}
                >
                  {tool.label}
                </Button>
              </Tooltip>
            ))}
            
            {suggestedTools.length > 2 && (
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ ml: 0.5 }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </>
      )}

      {/* More tools menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        {suggestedTools.slice(2).map((tool, index) => (
          <MenuItem
            key={index}
            onClick={() => handleToolNavigation(tool.path)}
          >
            <ListItemIcon>
              <LaunchIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={tool.label}
              secondary={tool.reason}
            />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { clearAllSelections(); handleMenuClose(); }}>
          <ListItemIcon>
            <ClearIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Clear all selections" />
        </MenuItem>
      </Menu>

      {/* Clear all button */}
      <Tooltip title="Clear all selections">
        <IconButton
          size="small"
          onClick={clearAllSelections}
          sx={{ ml: 'auto' }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ContextIndicator;