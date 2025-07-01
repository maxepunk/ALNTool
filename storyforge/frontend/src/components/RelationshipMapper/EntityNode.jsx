import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useViewport } from '@xyflow/react';
import { Paper, Typography, Box, Tooltip, Divider, useTheme } from '@mui/material';
import ErrorBoundary from '../ErrorBoundary';
import EventIcon from '@mui/icons-material/Event';
import { getEntityPresentation } from '../../utils/EntityPresentation';
import NodeTooltipContent from '../NodeTooltipContent';
import NodeChips from '../NodeChips';

// Renamed existing component to avoid conflict and reflect its purpose
const ContextualDetailsTooltipContent = ({ type, nodeData = {}, centralEntityType, label = '', isFullScreen = false }) => {
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

ContextualDetailsTooltipContent.propTypes = {
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
  const theme = useTheme();
  const { id, label, type, isCenter = false, timelineEvents, properties = {}, isActualParentGroup = false } = data;
  
  // Use the main 'type' for presentation, but 'properties.type' if available for more specific data.
  const presentationType = type; 
  const actualDataType = properties?.type || type; // This is the type we'll use for data lookups in tooltip
  const nodeDisplayData = { ...data, type: actualDataType, label: properties?.name || label }; // Consolidate data for tooltip

  const { color: entityColor, icon: entityIcon } = getEntityPresentation(presentationType, properties, isCenter);
  
  const fullNodeName = properties?.name || label || actualDataType || id || 'Unknown'; // Used for aria-label and potentially displayedLabel
  
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

  // Use the new NodeTooltipContent, passing the consolidated nodeDisplayData
  const tooltipContent = <NodeTooltipContent data={nodeDisplayData} />;
  // The aria-label should reflect the most accurate name and type
  const nodeAriaLabel = `${isCenter ? 'Central Entity: ' : ''}${actualDataType}: ${fullNodeName}`;

  // Character Tier specific styling
  const characterTier = properties?.tier;
  let tierBorderStyle = {};
  // Base border style - can be augmented by tier or parent group status
  let baseBorder = {
    borderWidth: '2px', // Default borderWidth
    borderColor: entityColor + 'aa', // Default border color opacity
  };

  if (isActualParentGroup && !selected && !isCenter) {
    baseBorder.borderColor = entityColor + 'CC'; // More opaque for parent group
    baseBorder.borderWidth = '2.5px'; // Slightly thicker for parent group
  }

  if (selected) { // Selected nodes always get solid entity color border
      baseBorder.borderColor = entityColor;
      baseBorder.borderWidth = '2.5px';
  }

  tierBorderStyle = { ...baseBorder }; // Start with base or parent-group specific border

  if (actualDataType === 'Character') {
    switch (characterTier) {
      case 'Core':
        tierBorderStyle = { // Core overrides most, but respects selected state for brightness
          borderWidth: '3px',
          borderColor: selected || isCenter ? '#ffb300' : '#ffc107',
          boxShadow: selected || isCenter ? `0 0 12px 3px #ffc10799` : `0 0 8px 2px #ffc10766`,
        };
        break;
      case 'Tertiary':
        tierBorderStyle.borderStyle = 'dashed'; // Add dashed to base/parent border
        tierBorderStyle.borderWidth = '1.5px'; // Tertiary is thinner
        // borderColor will be from baseBorder (which includes parent/selected logic)
        // If selected, it will be solid entityColor, if parent, slightly more opaque.
        // If just tertiary, it will be entityColor + '99' (or as per baseBorder)
        if (!selected && !isCenter) { // Ensure tertiary specific opacity if not selected/center
            tierBorderStyle.borderColor = entityColor + '99';
        }
        break;
      case 'Secondary': // Default style for Secondary or if tier is undefined
      default:
        // Uses the already established baseBorder or parentGroup border style
        // No specific overrides for Secondary other than what's in baseBorder
        break;
    }
  }
  // For non-character nodes, tierBorderStyle remains baseBorder (which includes parent/selected logic)

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
    // Main tooltip now uses the new NodeTooltipContent
    <Tooltip title={tooltipContent} placement="top" arrow disableInteractive>
      <Paper
        elevation={isCenter ? 6 : (selected ? 8 : 3)}
        sx={{
          p: isCenter ? 1.5 : 1.25,
          borderRadius: isActualParentGroup ? 3 : 1.5, // Slightly more rounded for parent groups
          width: '100%',
          height: '100%',
          minHeight: isCenter ? 60 : 50, 
          borderStyle: 'solid', // Default, tierBorderStyle can override (e.g., for dashed)
          ...tierBorderStyle, // Apply combined border styles
          bgcolor: selected 
            ? 'background.paper' // Selected nodes have standard paper background
            : isCenter 
              ? `${entityColor}4D` // Center nodes have a semi-transparent entity color background
              : (actualDataType === 'Element' && properties.basicType?.toLowerCase().includes('memory'))
                ? `${entityColor}30` // Memory elements have a specific transparent background
                : isActualParentGroup
                  ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' // More distinct, less color-tied bg for parents
                  : `${entityColor}26`, // Default node background
          transition: 'all 0.15s ease-in-out, border-color 0.15s, background-color 0.15s, box-shadow 0.15s ease-in-out',
          transform: selected ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            borderColor: (actualDataType === 'Character' && characterTier === 'Core' && !(selected || isCenter))
              ? '#ffc107' // Core character hover (non-selected, non-center)
              : (selected || isCenter ? tierBorderStyle.borderColor : entityColor), // Keep current border if selected/center, else entityColor
            bgcolor: selected
              ? 'background.paper'
              : isCenter
                ? `${entityColor}66`
                : (actualDataType === 'Element' && properties.basicType?.toLowerCase().includes('memory'))
                  ? `${entityColor}40`
                  : isActualParentGroup
                    ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
                    : 'background.paper',
            transform: 'scale(1.03)',
            boxShadow: (actualDataType === 'Character' && characterTier === 'Core')
                ? (selected || isCenter ? `0 0 14px 4px #ffc107aa` : `0 0 10px 3px #ffc10788`)
                : (selected ? (theme) => theme.shadows[8] : (isActualParentGroup ? theme => theme.shadows[3] : theme.shadows[4])), // Adjusted shadow for parents on hover
          },
          display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative',
          textAlign: 'center', cursor: 'pointer',
          boxShadow: selected
            ? (theme) => theme.shadows[6]
            : (isActualParentGroup ? (theme) => theme.shadows[2] : (isCenter ? (theme) => theme.shadows[3] : undefined)), // Adjusted base shadow for parents
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
        
        <NodeChips 
          data={{ type: actualDataType, properties }}
          entityColor={entityColor}
          showChips={(showLabel || zoom >= ICON_ONLY_ZOOM_THRESHOLD)}
          zoomOpacity={zoom < SHORT_LABEL_ZOOM_THRESHOLD ? 0.7 : 1}
        />
        
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

// Wrap EntityNode component with ErrorBoundary for better error handling
const EntityNodeWithErrorBoundary = (props) => (
  <ErrorBoundary level="component">
    <EntityNode {...props} />
  </ErrorBoundary>
);

export default memo(EntityNodeWithErrorBoundary);
