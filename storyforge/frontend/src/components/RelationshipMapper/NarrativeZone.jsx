import { memo } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme } from '@mui/material/styles';

const NarrativeZone = memo(({ 
  zoneId,
  zone, 
  bounds, 
  type, 
  title, 
  isExpanded, 
  onToggle,
  isHighlighted,
  memberCount
}) => {
  const theme = useTheme();
  
  const getZoneColors = () => {
    switch(type) {
      case 'puzzle':
        return {
          bg: theme.palette.warning.main,
          border: theme.palette.warning.dark,
          header: theme.palette.warning.dark
        };
      case 'container':
        return {
          bg: theme.palette.info.main,
          border: theme.palette.info.dark,
          header: theme.palette.info.dark
        };
      case 'narrative':
        return {
          bg: theme.palette.secondary.main,
          border: theme.palette.secondary.dark,
          header: theme.palette.secondary.dark
        };
      case 'journey':
        return {
          bg: theme.palette.success.main,
          border: theme.palette.success.dark,
          header: theme.palette.success.dark
        };
      default:
        return {
          bg: theme.palette.grey[500],
          border: theme.palette.grey[700],
          header: theme.palette.grey[700]
        };
    }
  };
  
  const colors = getZoneColors();
  const opacity = isHighlighted ? 0.2 : 0.08;
  
  const zoneStyle = {
    position: 'absolute',
    left: bounds.x - 20,
    top: bounds.y - 45,
    width: bounds.width + 40,
    height: bounds.height + 65,
    backgroundColor: alpha(colors.bg, opacity),
    border: `2px ${type === 'puzzle' ? 'dashed' : 'solid'} ${alpha(colors.border, 0.3)}`,
    borderRadius: '12px',
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
    zIndex: -1,
  };
  
  return (
    <>
      {/* Zone Background */}
      <div style={zoneStyle} />
      
      {/* Zone Header */}
      <Box
        sx={{
          position: 'absolute',
          left: bounds.x - 10,
          top: bounds.y - 40,
          backgroundColor: alpha(colors.header, 0.9),
          color: 'white',
          borderRadius: '8px 8px 0 0',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          pointerEvents: 'all',
          cursor: 'pointer',
          fontSize: '0.75rem',
          boxShadow: theme.shadows[2],
          '&:hover': {
            backgroundColor: colors.header,
            boxShadow: theme.shadows[4],
          }
        }}
        onClick={() => onToggle(zoneId)}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
          ({memberCount})
        </Typography>
        <IconButton size="small" sx={{ padding: 0, color: 'inherit' }}>
          {isExpanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Box>
    </>
  );
});

NarrativeZone.displayName = 'NarrativeZone';

export default NarrativeZone;
