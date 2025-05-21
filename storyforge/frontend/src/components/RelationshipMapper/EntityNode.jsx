import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useViewport } from '@xyflow/react'; // Added useViewport
import { Paper, Typography, Box, Chip, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventIcon from '@mui/icons-material/Event';
import ExtensionIcon from '@mui/icons-material/Extension';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const getEntityPresentation = (type, isCenter = false) => {
  let color = '#78909c'; // Default Blue Grey 400
  let icon = <HelpOutlineIcon fontSize="inherit" />;
  let contrastColor = 'rgba(0,0,0,0.87)'; // For chips on light backgrounds

  if (isCenter) {
    color = '#673ab7'; // Deep Purple 500 for center node
    contrastColor = '#fff';
  }
  
  switch (type) {
    case 'Character':
      color = isCenter ? color : '#3f51b5'; // Indigo 500
      icon = <PersonIcon fontSize="inherit" />;
      contrastColor = '#fff';
      break;
    case 'Element':
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
        info.push(renderInfo('Description', props.descriptionSnippet));
        break;
     }
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
  const { id, label, type, isCenter = false, timelineEvents, properties, isActualParentGroup = false } = data; 
  
  const presentationType = type; 
  const actualDataType = properties?.type || type; 
  const { color: entityColor, icon: entityIcon } = getEntityPresentation(presentationType, isCenter);
  
  const getNodeChips = () => {
    const chips = [];
    if (!properties) return chips; 
    switch (actualDataType) {
      case 'Character':
        if (properties.tier) chips.push({ label: properties.tier, title: `Tier: ${properties.tier}` });
        if (properties.role) chips.push({ label: properties.role, title: `Role: ${properties.role}` });
        break;
      case 'Element':
        if (properties.basicType) chips.push({ label: properties.basicType, title: `Basic Type: ${properties.basicType}` });
        if (properties.status) chips.push({ label: properties.status, title: `Status: ${properties.status}` });
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
          borderRadius: isActualParentGroup ? 2.5 : 1.5, // Slightly larger radius for parent groups
          width: '100%',
          height: '100%',
          minHeight: isCenter ? 60 : 50, 
          border: `2px solid ${selected ? entityColor : (isActualParentGroup ? entityColor + '99' : entityColor + 'aa')}`,
          // Parent group gets a very subtle background, selection/center takes precedence
          bgcolor: selected 
            ? 'background.paper' 
            : isCenter 
              ? `${entityColor}4D` 
              : isActualParentGroup 
                ? `${entityColor}1A` // Subtle background for parents
                : `${entityColor}26`, 
          transition: 'all 0.15s ease-in-out, border-color 0.15s, background-color 0.15s',
          transform: selected ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            borderColor: entityColor,
            bgcolor: selected ? 'background.paper' : (isCenter ? `${entityColor}66` : (isActualParentGroup ? `${entityColor}2A` : 'background.paper')), 
            transform: 'scale(1.03)',
          },
          display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative',
          textAlign: 'center', cursor: 'pointer',
          boxShadow: selected ? (theme) => theme.shadows[6] : (isActualParentGroup ? theme => theme.shadows[1] : undefined),
        }}
        aria-label={nodeAriaLabel} role="button" tabIndex={0}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: entityColor, width: 6, height: 6, opacity: 0.7 }} />
        
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
  data: PropTypes.object.isRequired, 
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool, 
  centralEntityType: PropTypes.string.isRequired, 
  isFullScreen: PropTypes.bool,
};

export default memo(EntityNode);
