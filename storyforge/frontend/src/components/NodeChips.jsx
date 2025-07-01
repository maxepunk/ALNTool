import React from 'react';
import PropTypes from 'prop-types';
import { Box, Chip } from '@mui/material';

const NodeChips = ({ data, entityColor, showChips, zoomOpacity = 1 }) => {
  if (!showChips || !data) return null;

  const { type, properties = {} } = data;

  // Chip generation logic
  const getNodeChips = () => {
    const chips = [];
    if (!properties || Object.keys(properties).length === 0) return chips;

    switch (type) {
      case 'Character':
        if (properties.tier) chips.push({ label: properties.tier, originalTitle: `Tier: ${properties.tier}` });
        if (properties.role) chips.push({ label: properties.role, originalTitle: `Role: ${properties.role}` });
        break;
      case 'Element':
        if (properties.basicType) chips.push({ label: properties.basicType, originalTitle: `Basic Type: ${properties.basicType}` });
        if (properties.status) chips.push({ label: properties.status, originalTitle: `Status: ${properties.status}` });
        if (properties.basicType?.toLowerCase().includes('memory') && properties.SF_RFID) {
          const rfidLabel = properties.SF_RFID.length > 8 ? `${properties.SF_RFID.substring(0,8)}…` : properties.SF_RFID;
          chips.push({ label: `RFID: ${rfidLabel}`, originalTitle: `SF_RFID: ${properties.SF_RFID}` });
        }
        break;
      case 'Puzzle':
        if (properties.timing) chips.push({ label: properties.timing, originalTitle: `Timing: ${properties.timing}` });
        break;
      case 'Timeline':
        if (properties.dateString) chips.push({ label: properties.dateString, originalTitle: properties.dateString });
        break;
      default: return chips;
    }
    return chips.map(chip => ({
      ...chip,
      displayLabel: chip.label.length > 15 ? chip.label.substring(0, 12) + '...' : chip.label,
    }));
  };

  const nodeChips = getNodeChips();

  if (nodeChips.length === 0) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 0.5, 
      justifyContent: 'center', 
      mt: 0.5, 
      maxWidth: '95%', 
      mx: 'auto', 
      opacity: zoomOpacity, 
      transition: 'opacity 0.2s' 
    }}>
      {nodeChips.map((chipInfo, index) => (
        <Chip 
          key={index}
          label={chipInfo.displayLabel}
          size="small" 
          title={chipInfo.originalTitle}
          sx={{ 
            bgcolor: `${entityColor}33`, 
            color: entityColor, 
            fontSize: '0.65rem', 
            fontWeight: 500,
            height: 18, 
            maxWidth: '100%',
            overflow: 'hidden',
            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }}
        />
      ))}
    </Box>
  );
};

NodeChips.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.string.isRequired,
    properties: PropTypes.object,
  }).isRequired,
  entityColor: PropTypes.string.isRequired,
  showChips: PropTypes.bool.isRequired,
  zoomOpacity: PropTypes.number,
};

export default NodeChips;