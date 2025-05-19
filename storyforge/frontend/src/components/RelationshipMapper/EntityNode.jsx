import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from '@xyflow/react';
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

// Refactored Tooltip Content Component
const NodeTooltipContent = ({ type, nodeData = {}, centralEntityType, label = '', isFullScreen = false }) => {
  if (!nodeData || !nodeData.properties) return label || type || 'Details'; // Fallback, check for properties

  const props = nodeData.properties; // Access enriched data from here

  const renderInfo = (key, value) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <Typography key={key} variant="caption" display="block" sx={{ whiteSpace: 'normal' }}>
        <Box component="span" sx={{ fontWeight: 'bold' }}>{key}:</Box> {String(value)}
      </Typography>
    );
  };

  let info = [];
  info.push(renderInfo('Name', props.name || label)); // Use props.name
  info.push(renderInfo('Type', props.type)); // Use props.type (actual entity type from BFF)

  if (centralEntityType === 'Character') {
    switch (props.type) { // Switch on props.type
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

  // Conditionally show fullDescription only if in fullscreen and it's different from the snippet
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
  nodeData: PropTypes.object, // This is the full node object from React Flow, expecting a .properties field
  centralEntityType: PropTypes.string.isRequired, 
  label: PropTypes.string, 
  isFullScreen: PropTypes.bool, // Added propType
};

// Main Node Component
const EntityNode = ({ data, isConnectable = true, selected = false, centralEntityType, isFullScreen = false }) => { 
  // data is the object from React Flow. Enriched props are in data.properties
  const { id, label, type, isCenter = false, timelineEvents, properties } = data; 
  
  // const console.log(`EntityNode (${type} - ${properties?.name || label}): data.properties:`, properties);
  
  const presentationType = type; 
  const actualDataType = properties?.type || type; 

  const { color: entityColor, icon: entityIcon, contrastColor } = getEntityPresentation(presentationType, isCenter);
  
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
        // For dates, the label itself is usually sufficient and the title might be redundant or too long.
        // If dateString can be very long, we might consider a title here too.
        if (properties.dateString) chips.push({ label: properties.dateString, title: properties.dateString }); 
        break;
      default: return chips;
    }
    // Ensure chip labels are not excessively long for display, but titles are full
    return chips.map(chip => ({
      ...chip,
      displayLabel: chip.label.length > 15 ? chip.label.substring(0, 12) + '...' : chip.label, // Example truncation for display
    }));
  };
  
  const nodeChips = getNodeChips();
  // Display name should come from properties.name, fallback to label
  const fullLabel = properties?.name || label || actualDataType || id || 'Unknown';
  const nodeLabel = fullLabel.length > 28 ? `${fullLabel.slice(0,25)}…` : fullLabel;
  const nodeAriaLabel = `${isCenter ? 'Central Entity: ' : ''}${actualDataType}: ${nodeLabel}${nodeChips.map(c => `, ${c.label}`).join('')}`;

  const hasTimeline = Array.isArray(timelineEvents) && timelineEvents.length > 0;
  const timelineTooltipContent = hasTimeline ? (
    <Box sx={{ p: 0.5 }}>
      {timelineEvents.map((ev) => (
        <Typography key={ev.id || ev.name} variant="caption" display="block">
          • {ev.name || ev.description || ev.title || 'Event'}
        </Typography>
      ))}
    </Box>
  ) : null;

  // Pass the full node data (which includes .properties) and isFullScreen to NodeTooltipContent
  const tooltipContent = <NodeTooltipContent type={actualDataType} nodeData={data} centralEntityType={centralEntityType} label={nodeLabel} isFullScreen={isFullScreen} />;

  return (
    <Tooltip title={tooltipContent} placement="top" arrow disableInteractive>
      <Paper
        elevation={isCenter ? 6 : (selected ? 8 : 3)} 
        sx={{
          p: isCenter ? 1.5 : 1.25, 
          borderRadius: 1.5, 
          width: '100%', // Allow Paper to fill the width of the React Flow node wrapper
          height: '100%', // Allow Paper to fill the height of the React Flow node wrapper
          minHeight: isCenter ? 60 : 50, // Keep minHeight as a fallback or for non-parent nodes
          border: `2px solid ${selected ? entityColor : entityColor + 'aa'}`,
          bgcolor: isCenter ? `${entityColor}4D` : (selected ? 'background.paper' : `${entityColor}26`), 
          transition: 'all 0.15s ease-in-out, border-color 0.15s, background-color 0.15s',
          transform: selected ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            borderColor: entityColor,
            bgcolor: isCenter ? `${entityColor}66` : 'background.paper', 
            transform: 'scale(1.03)',
          },
          display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative',
          textAlign: 'center', cursor: 'pointer',
          boxShadow: selected ? (theme) => theme.shadows[6] : undefined,
        }}
        aria-label={nodeAriaLabel} role="button" tabIndex={0}
      >
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ background: entityColor, width: 6, height: 6, opacity: 0.7 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 /* Increased margin for chips */, minHeight: 24 }}>
          <Box sx={{ mr: 0.75, color: entityColor, fontSize: isCenter ? '1.1rem' : '1rem', lineHeight: 1 }}>
            {React.cloneElement(entityIcon, { fontSize: 'inherit' })}
          </Box>
          <Typography 
            variant={isCenter ? "body1" : "body2"}
            sx={{ 
              fontWeight: isCenter ? 'bold' : 500,
              color: 'text.primary',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {nodeLabel}
          </Typography>
        </Box>
        
        {/* Render multiple chips */}
        {nodeChips.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 0.5, maxWidth: '95%', mx: 'auto' }}>
            {nodeChips.map((chipInfo, index) => (
              <Tooltip key={index} title={chipInfo.title} placement="bottom" arrow disableInteractive>
                <Chip 
                  label={chipInfo.displayLabel} // Use the potentially truncated displayLabel
                  size="small" 
                  sx={{ 
                    bgcolor: `${entityColor}33`, 
                    color: entityColor, 
                    fontSize: '0.65rem', fontWeight: 500,
                    height: 18, 
                    // maxWidth: 'calc(50% - 4px)', // Keep for now, may need adjustment
                    maxWidth: '100%', // Allow chips to take full width if only one, or wrap if many
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
  data: PropTypes.object.isRequired, // data from React Flow, expected to have .properties for enriched data
  isConnectable: PropTypes.bool,
  selected: PropTypes.bool, 
  centralEntityType: PropTypes.string.isRequired, 
  isFullScreen: PropTypes.bool, // Added propType
};

export default memo(EntityNode); 