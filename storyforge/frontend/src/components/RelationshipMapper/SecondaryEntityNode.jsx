import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from '@xyflow/react';
import { Paper, Typography, Box, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import ExtensionIcon from '@mui/icons-material/Extension';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const getEntityPresentation = (type) => {
  let color = '#78909c'; // Default Blue Grey 400
  let icon = <HelpOutlineIcon fontSize="inherit" />;
  
  switch (type) {
    case 'Character':
      color = '#3f51b5'; // Indigo 500
      icon = <PersonIcon fontSize="inherit" />;
      break;
    case 'Element':
      color = '#00897b'; // Teal 600
      icon = <InventoryIcon fontSize="inherit" />;
      break;
    case 'Puzzle':
      color = '#f57c00'; // Orange 700
      icon = <ExtensionIcon fontSize="inherit" />;
      break;
    case 'Timeline': 
      color = '#d81b60'; // Pink 600
      icon = <EventIcon fontSize="inherit" />;
      break;
  }
  return { color, icon };
};

// A smaller, simpler node for second-level connections
const SecondaryEntityNode = ({ data, isConnectable, selected, centralEntityType }) => {
  const { id, type, indirect = false, properties } = data; // Assume properties might be passed for actFocus
  const nodeLabel = data.name || data.label || data.type || id || 'Unknown';
  const { color: entityColor, icon: entityIcon } = getEntityPresentation(type);
  
  const nodeAriaLabel = `Secondary Entity: ${type}: ${nodeLabel}`;
  const actFocus = data.actFocus || properties?.actFocus; // Check both data and data.properties

  // Simple tooltip content for secondary nodes
  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 250 }}>
      <Typography variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
        <Box component="span" sx={{ fontWeight: 'bold' }}>Name:</Box> {nodeLabel}
      </Typography>
      <Typography variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
        <Box component="span" sx={{ fontWeight: 'bold' }}>Type:</Box> {type}
      </Typography>
      {data.tier && (
        <Typography variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
          <Box component="span" sx={{ fontWeight: 'bold' }}>Tier:</Box> {data.tier}
        </Typography>
      )}
      {data.status && (
        <Typography variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
          <Box component="span" sx={{ fontWeight: 'bold' }}>Status:</Box> {data.status}
        </Typography>
      )}
       {data.timing && (
        <Typography variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
          <Box component="span" sx={{ fontWeight: 'bold' }}>Timing:</Box> {data.timing}
        </Typography>
      )}
      {actFocus && (
        <Typography variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
          <Box component="span" sx={{ fontWeight: 'bold' }}>Act Focus:</Box> {actFocus}
        </Typography>
      )}
    </Box>
  );

  let subtleTierStyle = {};
  if (type === 'Character' && data.tier) {
    switch (data.tier) {
      case 'Core':
        subtleTierStyle = { borderColor: `${entityColor}CC`, borderWidth: '1px' }; // Slightly more prominent border
        break;
      case 'Tertiary':
        subtleTierStyle = { borderColor: `${entityColor}66`, opacity: indirect ? 0.6 : 0.85 }; // More transparent border
        break;
      default: // Secondary
        subtleTierStyle = { borderColor: selected ? entityColor : `${entityColor}88` }; // Default as is
        break;
    }
  } else {
    subtleTierStyle = { borderColor: selected ? entityColor : `${entityColor}88` }; // Default for non-characters
  }

  const actFocusColorMap = {
    1: 'rgba(220, 50, 50, 0.7)',
    'Act1': 'rgba(220, 50, 50, 0.7)',
    'act1': 'rgba(220, 50, 50, 0.7)',
    2: 'rgba(50, 200, 50, 0.7)',
    'Act2': 'rgba(50, 200, 50, 0.7)',
    'act2': 'rgba(50, 200, 50, 0.7)',
    3: 'rgba(50, 50, 220, 0.7)',
    'Act3': 'rgba(50, 50, 220, 0.7)',
    'act3': 'rgba(50, 50, 220, 0.7)',
  };
  const actFocusDisplayColor = actFocus ? actFocusColorMap[String(actFocus)] || 'rgba(128, 128, 128, 0.5)' : null;


  return (
    // Main Tooltip wrapping the Paper for SecondaryEntityNode
    <Tooltip title={tooltipContent} placement="top" arrow disableInteractive>
      <Paper
        elevation={selected ? 5 : 2}
        sx={{
          p: 0.75,
          borderRadius: 1,
          width: 120, 
          minHeight: 32,
          borderWidth: '1px', // Base border width
          borderStyle: 'solid',
          ...subtleTierStyle, // Apply tier-specific border styles or default
          bgcolor: 'rgba(25, 25, 25, 0.8)',
          opacity: indirect && !subtleTierStyle.opacity ? 0.7 : (subtleTierStyle.opacity || 1), // Respect tier opacity if set
          transition: 'all 0.15s ease-in-out',
          transform: selected ? 'scale(1.05)' : 'scale(1)',
          position: 'relative', // For positioning Act Focus dot
          '&:hover': {
            borderColor: entityColor, // Full color on hover
            opacity: 1,
            transform: 'scale(1.03)',
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label={nodeAriaLabel}
        role="button"
        tabIndex={0}
      >
        {actFocusDisplayColor && (
          <Tooltip title={`Act Focus: ${actFocus}`} placement="top" arrow>
            <Box
              sx={{
                width: 5,
                height: 5,
                bgcolor: actFocusDisplayColor,
                borderRadius: '50%',
                position: 'absolute',
                top: 2,
                left: 2,
                border: '0.5px solid rgba(255,255,255,0.5)',
                boxShadow: `0 0 2px 0.5px ${actFocusDisplayColor}88`,
                zIndex: 1,
              }}
            />
          </Tooltip>
        )}
        <Handle 
          type="target" 
          position={Position.Top} 
          isConnectable={isConnectable} 
          style={{ background: entityColor, width: 5, height: 5, opacity: 0.7 }} 
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pl: actFocusDisplayColor ? 1 : 0 /* Adjust padding if dot is present */ }}>
          <Box sx={{ mr: 0.5, color: entityColor, fontSize: '0.9rem', lineHeight: 1 }}>
            {React.cloneElement(entityIcon, { fontSize: 'inherit' })}
          </Box>
          <Tooltip title={nodeLabel} placement="top" arrow disableInteractive>
            <Typography 
              variant="body2"
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '80px',
              }}
            >
              {nodeLabel}
            </Typography>
          </Tooltip>
        </Box>
        
        <Handle 
          type="source" 
          position={Position.Bottom} 
          isConnectable={isConnectable} 
          style={{ background: entityColor, width: 5, height: 5, opacity: 0.7 }} 
        />
      </Paper>
    </Tooltip>
  );
};

SecondaryEntityNode.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string.isRequired,
    indirect: PropTypes.bool,
    route: PropTypes.string,
    tier: PropTypes.string, // Already present
    status: PropTypes.string, // Already present
    timing: PropTypes.string, // Already present
    actFocus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Added for Act Focus
    properties: PropTypes.shape({ // If actFocus is nested under properties
        actFocus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool,
  centralEntityType: PropTypes.string,
};

export default memo(SecondaryEntityNode); 