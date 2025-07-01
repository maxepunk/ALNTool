import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider } from '@mui/material';

const NodeTooltipContent = ({ data }) => {
  if (!data) return null;

  const { label, type, properties } = data;
  const props = properties || {}; // Ensure props is an object

  // Helper to build property lines, avoiding errors if props is undefined
  const renderProperty = (label, value) => {
    if (value === undefined || value === null || value === '') return null;
    return <Typography key={label} variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}><Box component="span" sx={{ fontWeight: 'bold' }}>{label}:</Box> {String(value)}</Typography>;
  };

  let keyProperties = [];

  switch (type) {
    case 'Character':
      keyProperties.push(renderProperty('Tier', props.tier));
      keyProperties.push(renderProperty('Role', props.role));
      keyProperties.push(renderProperty('Primary Action Snippet', props.primaryActionSnippet));
      break;
    case 'Element':
      keyProperties.push(renderProperty('Basic Type', props.basicType));
      keyProperties.push(renderProperty('Status', props.status));
      break;
    case 'Puzzle':
      keyProperties.push(renderProperty('Timing', props.timing));
      keyProperties.push(renderProperty('Owner Name', props.ownerName));
      break;
    case 'Timeline':
      keyProperties.push(renderProperty('Date String', props.dateString));
      keyProperties.push(renderProperty('Participant Summary', props.participantSummary));
      break;
    default:
      break;
  }
  // Filter out null entries from keyProperties
  keyProperties = keyProperties.filter(Boolean);

  // Add filter-related properties
  const filterProperties = [];
  if (props.actFocus) {
    filterProperties.push(renderProperty('Act Focus', props.actFocus));
  }
  if (props.themes && props.themes.length > 0) {
    filterProperties.push(renderProperty('Themes', props.themes.join(', ')));
  }
  if (type === 'Element' && props.memorySets && props.memorySets.length > 0) {
    filterProperties.push(renderProperty('Memory Sets', props.memorySets.join(', ')));
  }
  const filteredFilterProperties = filterProperties.filter(Boolean);


  return (
    <Box sx={{ p: 1, maxWidth: 350 }}> {/* Increased maxWidth for better content display */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{props.name || label}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
        Type: {type} {props.type && props.type !== type ? `(${props.type})` : ''} {/* Display internal type if different */}
      </Typography>

      {keyProperties.length > 0 && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="overline" display="block" sx={{ lineHeight: 1.2, mb: 0.25, color: 'text.secondary' }}>Key Properties</Typography>
          {keyProperties}
        </>
      )}

      {filteredFilterProperties.length > 0 && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="overline" display="block" sx={{ lineHeight: 1.2, mb: 0.25, color: 'text.secondary' }}>Filter Attributes</Typography>
          {filteredFilterProperties}
        </>
      )}

      {props.fullDescription && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="overline" display="block" sx={{ lineHeight: 1.2, mb: 0.25, color: 'text.secondary' }}>Description</Typography>
          <Typography variant="body2" sx={{ maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {props.fullDescription}
          </Typography>
        </>
      )}
    </Box>
  );
};

NodeTooltipContent.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    properties: PropTypes.shape({
      name: PropTypes.string, // Full name often in properties
      type: PropTypes.string, // Internal type if different from general type
      tier: PropTypes.string,
      role: PropTypes.string,
      primaryActionSnippet: PropTypes.string,
      basicType: PropTypes.string,
      status: PropTypes.string,
      timing: PropTypes.string,
      ownerName: PropTypes.string,
      dateString: PropTypes.string,
      participantSummary: PropTypes.string,
      fullDescription: PropTypes.string,
      // For filter properties
      actFocus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      themes: PropTypes.arrayOf(PropTypes.string),
      memorySets: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};

export default NodeTooltipContent;