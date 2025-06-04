import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useViewport } from '@xyflow/react'; // Added useViewport
import { Paper, Typography, Box, Chip, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import ExtensionIcon from '@mui/icons-material/Extension';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MemoryIcon from '@mui/icons-material/Memory'; // Added MemoryIcon

const getEntityPresentation = (type, properties = {}, isCenter = false) => {
  let color = '#78909c'; // Default Blue Grey 400
  let icon = <HelpOutlineIcon fontSize="inherit" />;
  let contrastColor = 'rgba(0,0,0,0.87)'; // For chips on light backgrounds

  if (isCenter) {
    color = '#673ab7'; // Deep Purple 500 for center node
    contrastColor = '#fff';
  }
  
  // Check for Memory Element first as it's a subtype of Element
  if (type === 'Element' && properties.basicType?.toLowerCase().includes('memory')) {
    color = isCenter ? color : '#2196f3'; // Blue 500 for Memory Elements
    icon = <MemoryIcon fontSize="inherit" />;
    contrastColor = '#fff';
  } else {
    switch (type) {
      case 'Character':
        color = isCenter ? color : '#3f51b5'; // Indigo 500
        icon = <PersonIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
      case 'Element': // General Elements (not Memory)
        color = isCenter ? color : '#00897b'; // Teal 600
        icon = <InventoryIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
      case 'Puzzle':
        color = isCenter ? color : '#f57c00'; // Orange 700
        icon = <ExtensionIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
      case 'Timeline':
        color = isCenter ? color : '#d81b60'; // Pink 600
        icon = <EventIcon fontSize="inherit" />;
        contrastColor = '#fff';
        break;
    }
  }
  return { color, icon, contrastColor };
};

// Tooltip Content Component (remains largely the same)
const NodeTooltipContent = ({ type, nodeData = {}, centralEntityType, label = '', isFullScreen = false }) => {
  if (!nodeData || !nodeData.properties) return label || type || 'Details';
  const props = nodeData.properties;

  const renderInfo = (key, value) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <Typography key={key} variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
        <Box component="span" sx={{ fontWeight: 'bold' }}>{key}:</Box> {String(value)}
      </Typography>
    );
  };
  let info = [];
  info.push(renderInfo('Name', props.name || label));
  info.push(renderInfo('Type', props.type));

  // Type-specific info (existing logic retained, ensure props.type is used correctly)
  if (centralEntityType === 'Character') {
    switch (props.type) { 
      case 'Character': 
        info.push(renderInfo('Tier', props.tier));
        info.push(renderInfo('Role', props.role));
        info.push(renderInfo('Logline', props.descriptionSnippet)); 
        break;
      case 'Puzzle':
        info.push(renderInfo('Timing', props.timing));
        info.push(renderInfo('Story Reveals', props.storyRevealSnippet));
        info.push(renderInfo('Owner', props.ownerName));
        break;
      case 'Element':
        info.push(renderInfo('Basic Type', props.basicType));
        info.push(renderInfo('Status', props.status));
        if (props.basicType?.toLowerCase().includes('memory') && props.SF_RFID) {
          info.push(renderInfo('SF_RFID', props.SF_RFID));
        }
        info.push(renderInfo('Owner', props.ownerName));
        break;
      case 'Timeline':
         info.push(renderInfo('Date', props.dateString));
         info.push(renderInfo('Notes', props.notesSnippet));
         break;
    }
  } else if (centralEntityType === 'Puzzle') {
    switch (props.type) {
      case 'Puzzle': 
        info.push(renderInfo('Timing', props.timing));
        info.push(renderInfo('Summary', props.statusSummary));
        info.push(renderInfo('Description', props.descriptionSnippet));
        info.push(renderInfo('Owner', props.ownerName));
        break;
      case 'Element': 
        info.push(renderInfo('Basic Type', props.basicType));
        info.push(renderInfo('Status', props.status));
        if (props.basicType?.toLowerCase().includes('memory') && props.SF_RFID) {
          info.push(renderInfo('SF_RFID', props.SF_RFID));
        }
        info.push(renderInfo('Source/Dest', props.flowSummary)); 
        info.push(renderInfo('Owner', props.ownerName));
        break;
      case 'Character': 
        info.push(renderInfo('Tier', props.tier));
        info.push(renderInfo('Role', props.role));
        break;
    }
  } else if (centralEntityType === 'Element') {
    switch (props.type) {
      case 'Element': 
        info.push(renderInfo('Basic Type', props.basicType));
        info.push(renderInfo('Status', props.status));
        if (props.basicType?.toLowerCase().includes('memory') && props.SF_RFID) {
          info.push(renderInfo('SF_RFID', props.SF_RFID));
        }
        info.push(renderInfo('Description', props.descriptionSnippet));
        info.push(renderInfo('Owner', props.ownerName));
        info.push(renderInfo('Flow', props.flowSummary));
        break;
      case 'Puzzle': 
        info.push(renderInfo('Timing', props.timing));
        info.push(renderInfo('Summary', props.statusSummary));
        info.push(renderInfo('Story Reveals', props.storyRevealSnippet));
        break;
      case 'Character': 
        info.push(renderInfo('Tier', props.tier));
        info.push(renderInfo('Role', props.role));
        break;
      case 'Timeline': 
        info.push(renderInfo('Date', props.dateString));
        info.push(renderInfo('Notes', props.notesSnippet));
        break;
    }
  } else if (centralEntityType === 'Timeline') {
     switch (props.type) {
      case 'Timeline': 
        info.push(renderInfo('Date', props.dateString));
        info.push(renderInfo('Notes', props.notesSnippet));
        info.push(renderInfo('Participants', props.participantSummary));
        break;
      case 'Character': 
        info.push(renderInfo('Tier', props.tier));
        info.push(renderInfo('Role', props.role));
        break;
      case 'Element': 
        info.push(renderInfo('Basic Type', props.basicType));
        info.push(renderInfo('Status', props.status));
        if (props.basicType?.toLowerCase().includes('memory') && props.SF_RFID) {
          info.push(renderInfo('SF_RFID', props.SF_RFID));
        }
        info.push(renderInfo('Description', props.descriptionSnippet));
        break;
     }
  }

  // Add Act Focus to tooltip if present
  if (props.actFocus) {
    info.push(renderInfo('Act Focus', props.actFocus));
  }

  if (isFullScreen && props.fullDescription && props.fullDescription !== props.descriptionSnippet) {
      info.push(<hr key="hr" style={{border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '4px 0'}} />);
      info.push(renderInfo('Full Desc', props.fullDescription));
  }
  return (
    <Box sx={{ p: 0.5, maxWidth: isFullScreen ? 450 : 300 }}> 
      {info.filter(Boolean)} 
    </Box>
  );
};

NodeTooltipContent.propTypes = {
  type: PropTypes.string.isRequired, 
  nodeData: PropTypes.object, 
  centralEntityType: PropTypes.string.isRequired, 
  label: PropTypes.string, 
  isFullScreen: PropTypes.bool,
};

// Zoom thresholds for dynamic label display
const ICON_ONLY_ZOOM_THRESHOLD = 0.4;
const SHORT_LABEL_ZOOM_THRESHOLD = 0.75;
const NORMAL_LABEL_MIN_ZOOM = 1.0; // Default truncation applies at this zoom or higher

// Main Node Component
const EntityNode = ({ data, isConnectable = true, selected = false, centralEntityType, isFullScreen = false }) => { 
  const { zoom } = useViewport();
  const { id, label, type, isCenter = false, timelineEvents, properties = {}, isActualParentGroup = false } = data;
  
  const presentationType = type; 
  const actualDataType = properties?.type || type; 
  // Pass properties to getEntityPresentation for icon/color decisions (e.g. Memory elements)
  const { color: entityColor, icon: entityIcon } = getEntityPresentation(presentationType, properties, isCenter);
  
  const getNodeChips = () => {
    const chips = [];
    // Ensure properties object exists and is not empty before trying to access its members
    if (!properties || Object.keys(properties).length === 0) return chips;

    // Common chips based on actualDataType
    switch (actualDataType) {
      case 'Character':
        if (properties.tier) chips.push({ label: properties.tier, title: `Tier: ${properties.tier}` });
        if (properties.role) chips.push({ label: properties.role, title: `Role: ${properties.role}` });
        break;
      case 'Element':
        if (properties.basicType) chips.push({ label: properties.basicType, title: `Basic Type: ${properties.basicType}` });
        if (properties.status) chips.push({ label: properties.status, title: `Status: ${properties.status}` });
        // SF_RFID chip for Memory elements, with truncation
        if (properties.basicType?.toLowerCase().includes('memory') && properties.SF_RFID) {
          const rfidLabel = properties.SF_RFID.length > 8 ? `${properties.SF_RFID.substring(0,8)}…` : properties.SF_RFID;
          chips.push({ label: `RFID: ${rfidLabel}`, title: `SF_RFID: ${properties.SF_RFID}` });
        }
        break;
      case 'Puzzle':
        if (properties.timing) chips.push({ label: properties.timing, title: `Timing: ${properties.timing}` });
        break;
      case 'Timeline':
        if (properties.dateString) chips.push({ label: properties.dateString, title: properties.dateString }); 
        break;
      default: return chips;
    }
    return chips.map(chip => ({
      ...chip,
      displayLabel: chip.label.length > 15 ? chip.label.substring(0, 12) + '...' : chip.label,
    }));
  };
  
  const nodeChips = getNodeChips();
  const fullNodeName = properties?.name || label || actualDataType || id || 'Unknown';
  
  let displayedNodeLabel = '';
  let showLabel = true;

  if (zoom < ICON_ONLY_ZOOM_THRESHOLD) {
    showLabel = false; // Icon and chips will still be visible
  } else if (zoom < SHORT_LABEL_ZOOM_THRESHOLD) {
    displayedNodeLabel = fullNodeName.length > 15 ? `${fullNodeName.slice(0, 12)}…` : fullNodeName;
  } else if (zoom < NORMAL_LABEL_MIN_ZOOM) {
    displayedNodeLabel = fullNodeName.length > 22 ? `${fullNodeName.slice(0, 19)}…` : fullNodeName;
  } else { // zoom >= NORMAL_LABEL_MIN_ZOOM or for center/selected nodes
    displayedNodeLabel = fullNodeName.length > 28 ? `${fullNodeName.slice(0, 25)}…` : fullNodeName;
  }
  // Always show a more complete label for center or selected nodes if not in icon_only mode
  if ((isCenter || selected) && zoom >= ICON_ONLY_ZOOM_THRESHOLD) {
    showLabel = true;
    displayedNodeLabel = fullNodeName.length > 28 ? `${fullNodeName.slice(0, 25)}…` : fullNodeName;
  }

  const nodeAriaLabel = `${isCenter ? 'Central Entity: ' : ''}${actualDataType}: ${fullNodeName}${nodeChips.map(c => `, ${c.label}`).join('')}`;
  const tooltipContent = <NodeTooltipContent type={actualDataType} nodeData={data} centralEntityType={centralEntityType} label={fullNodeName} isFullScreen={isFullScreen} />;

  // Character Tier specific styling
  const characterTier = properties?.tier;
  let tierBorderStyle = {}; // Renamed to avoid conflict with sx properties if any
  if (actualDataType === 'Character') {
    switch (characterTier) {
      case 'Core':
        // Using a gold-like color for Core, can be adjusted. Adding subtle shadow for pop.
        tierBorderStyle = {
          borderWidth: '3px',
          borderColor: selected || isCenter ? '#ffb300' : '#ffc107', // Brighter gold when selected/center
          boxShadow: selected || isCenter ? `0 0 12px 3px #ffc10799` : `0 0 8px 2px #ffc10766`,
        };
        break;
      case 'Tertiary':
        tierBorderStyle = {
          borderStyle: 'dashed',
          borderWidth: '1.5px',
          borderColor: selected || isCenter ? entityColor : `${entityColor}99`,
        };
        break;
      case 'Secondary': // Default style for Secondary or if tier is undefined
      default:
        tierBorderStyle = {
          borderWidth: '2px',
          borderColor: selected ? entityColor : (isActualParentGroup ? entityColor + '99' : entityColor + 'aa'),
        }; // Standard border as per existing logic
        break;
    }
  } else {
    // Default border for non-Character nodes
    tierBorderStyle = {
      borderWidth: '2px',
      borderColor: selected ? entityColor : (isActualParentGroup ? entityColor + '99' : entityColor + 'aa'),
    };
  }

  // Act Focus visual cue
  const actFocus = properties?.actFocus;
  const actFocusColorMap = {
    1: 'rgba(220, 50, 50, 0.85)', // Red for Act 1 (adjusted for better visibility)
    'Act1': 'rgba(220, 50, 50, 0.85)',
    'act1': 'rgba(220, 50, 50, 0.85)', // case-insensitive
    2: 'rgba(50, 200, 50, 0.85)', // Green for Act 2
    'Act2': 'rgba(50, 200, 50, 0.85)',
    'act2': 'rgba(50, 200, 50, 0.85)',
    3: 'rgba(50, 50, 220, 0.85)', // Blue for Act 3
    'Act3': 'rgba(50, 50, 220, 0.85)',
    'act3': 'rgba(50, 50, 220, 0.85)',
    // Add more as needed
  };
  const actFocusDisplayColor = actFocus ? actFocusColorMap[actFocus] || 'rgba(128, 128, 128, 0.7)' : null;


  const hasTimeline = Array.isArray(timelineEvents) && timelineEvents.length > 0;
  const timelineTooltipContent = hasTimeline ? (
    <Box sx={{ p: 0.5 }}>
      {timelineEvents.map((ev) => (
        <Typography key={ev.id || ev.name} variant="caption" display="block">• {ev.name || ev.description || ev.title || 'Event'}</Typography>
      ))}
    </Box>
  ) : null;

  return (
    <Tooltip title={tooltipContent} placement="top" arrow disableInteractive>
      <Paper
        elevation={isCenter ? 6 : (selected ? 8 : 3)}
        sx={{
          p: isCenter ? 1.5 : 1.25,
          borderRadius: isActualParentGroup ? 2.5 : 1.5,
          width: '100%',
          height: '100%',
          minHeight: isCenter ? 60 : 50, 
          // borderStyle and borderColor will be driven by tierBorderStyle or default
          borderStyle: 'solid', // Default, can be overridden by tierBorderStyle (e.g. for dashed)
          ...tierBorderStyle, // Apply character tier border styles or default for non-characters
          // Memory Element visual cue: slightly different background if not selected/center
          bgcolor: selected 
            ? 'background.paper' 
            : isCenter 
              ? `${entityColor}4D` 
              : (actualDataType === 'Element' && properties.basicType?.toLowerCase().includes('memory'))
                ? `${entityColor}30` // Slightly different background for memory items
                : isActualParentGroup
                  ? `${entityColor}1A`
                  : `${entityColor}26`,
          transition: 'all 0.15s ease-in-out, border-color 0.15s, background-color 0.15s, box-shadow 0.15s ease-in-out', // Added box-shadow transition
          transform: selected ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            // Hover border color logic: Core characters retain gold, others use entityColor
            borderColor: (actualDataType === 'Character' && characterTier === 'Core')
                ? (selected || isCenter ? '#ffb300' : '#ffc107')
                : entityColor,
            bgcolor: selected
              ? 'background.paper'
              : isCenter
                ? `${entityColor}66`
                : (actualDataType === 'Element' && properties.basicType?.toLowerCase().includes('memory'))
                  ? `${entityColor}40` // Slightly darker on hover for memory
                  : isActualParentGroup
                    ? `${entityColor}2A`
                    : 'background.paper',
            transform: 'scale(1.03)',
            // Enhance shadow for Core characters on hover
            boxShadow: (actualDataType === 'Character' && characterTier === 'Core')
                ? (selected || isCenter ? `0 0 14px 4px #ffc107aa` : `0 0 10px 3px #ffc10788`)
                : (selected ? (theme) => theme.shadows[8] : (isActualParentGroup ? theme => theme.shadows[2] : undefined)),
          },
          display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative',
          textAlign: 'center', cursor: 'pointer',
          boxShadow: selected ? (theme) => theme.shadows[6] : (isActualParentGroup ? theme => theme.shadows[1] : undefined),
        }}
        aria-label={nodeAriaLabel} role="button" tabIndex={0}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: entityColor, width: 6, height: 6, opacity: 0.7 }} />
        
        {actFocusDisplayColor && (
          <Tooltip title={`Act Focus: ${actFocus}`} placement="top" arrow>
            <Box
              sx={{
                width: zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 5 : 7, // Slightly smaller dot at lower zoom
                height: zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 5 : 7,
                bgcolor: actFocusDisplayColor,
                borderRadius: '50%',
                position: 'absolute',
                top: zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 3 : 5, // Adjust position based on zoom
                left: zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 3 : 5,
                border: '1px solid rgba(255,255,255,0.7)', // Brighter border for better visibility
                boxShadow: `0 0 4px 1px ${actFocusDisplayColor}99`, // Subtle glow effect
                opacity: zoom < ICON_ONLY_ZOOM_THRESHOLD ? 0 : (zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 0.7 : 1), // Fade in/out with zoom
                transition: 'all 0.2s ease-in-out', // Smooth transition for size, opacity, position
                zIndex: 1, // Ensure it's above other elements if needed
              }}
            />
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5, minHeight: 24 }}>
          <Box sx={{ mr: showLabel ? 0.75 : 0, color: entityColor, fontSize: isCenter ? '1.2rem' : (zoom < ICON_ONLY_ZOOM_THRESHOLD ? '1.3rem' : '1rem'), lineHeight: 1, transition: 'font-size 0.2s' }}>
            {React.cloneElement(entityIcon, { fontSize: 'inherit' })}
          </Box>
          {showLabel && (
            <Typography 
              variant={isCenter ? "body1" : "body2"}
              sx={{ 
                fontWeight: isCenter ? 'bold' : 500,
                color: 'text.primary',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {displayedNodeLabel}
            </Typography>
          )}
        </Box>
        
        {(showLabel || zoom >= ICON_ONLY_ZOOM_THRESHOLD ) && nodeChips.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 0.5, maxWidth: '95%', mx: 'auto', opacity: zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            {nodeChips.map((chipInfo, index) => (
              <Tooltip key={index} title={chipInfo.title} placement="bottom" arrow disableInteractive>
                <Chip 
                  label={chipInfo.displayLabel}
                  size="small" 
                  sx={{ 
                    bgcolor: `${entityColor}33`, 
                    color: entityColor, 
                    fontSize: '0.65rem', fontWeight: 500,
                    height: 18, 
                    maxWidth: '100%',
                    overflow: 'hidden',
                    '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        )}
        
        {hasTimeline && (
          <Tooltip title={timelineTooltipContent} placement="top" arrow disableInteractive>
            <EventIcon fontSize="inherit" sx={{ position: 'absolute', top: 4, right: 4, color: '#d81b60' }} />
          </Tooltip>
        )}
        
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ background: entityColor, width: 6, height: 6, opacity: 0.7 }} />
      </Paper>
    </Tooltip> 
  );
};

EntityNode.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    isCenter: PropTypes.bool,
    timelineEvents: PropTypes.array,
    properties: PropTypes.shape({
      type: PropTypes.string, // Inner type, can be different from node's general type
      name: PropTypes.string,
      tier: PropTypes.string, // For Character tier styling
      role: PropTypes.string,
      basicType: PropTypes.string, // For Element type, Memory identification
      status: PropTypes.string,
      timing: PropTypes.string,
      dateString: PropTypes.string,
      SF_RFID: PropTypes.string, // For Memory elements
      actFocus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // For Act Focus styling
      descriptionSnippet: PropTypes.string,
      storyRevealSnippet: PropTypes.string,
      ownerName: PropTypes.string,
      flowSummary: PropTypes.string,
      notesSnippet: PropTypes.string,
      participantSummary: PropTypes.string,
      fullDescription: PropTypes.string,
      statusSummary: PropTypes.string,
    }),
    isActualParentGroup: PropTypes.bool,
  }).isRequired,
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool, 
  centralEntityType: PropTypes.string.isRequired, 
  isFullScreen: PropTypes.bool,
};

export default memo(EntityNode);
