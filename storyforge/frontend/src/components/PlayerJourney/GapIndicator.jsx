import React, { useState } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { keyframes } from '@mui/system';
import useJourneyStore from '../../stores/journeyStore'; // Corrected path
import GapDetailPopup from './GapDetailPopup';

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
  }
`;

const GapIndicator = ({ gap }) => {
  const [isHovering, setIsHovering] = useState(false);
  const setSelectedGap = useJourneyStore(state => state.setSelectedGap);
  const selectedGap = useJourneyStore(state => state.selectedGap);

  if (!gap) {
    return null;
  }

  const { id, start_minute, end_minute, severity } = gap; // Assuming gap has an id
  const duration = end_minute - start_minute;
  const isSelected = selectedGap && selectedGap.id === id;

  let backgroundColor = '#ffebee'; // light red for low
  let textColor = '#c62828'; // dark red text
  let paperElevation = 1;
  let selectedStyle = {};

  if (severity === 'medium') {
    backgroundColor = '#ffcdd2'; // red
    textColor = '#b71c1c';
  } else if (severity === 'high') {
    backgroundColor = '#ef9a9a'; // darker red
    textColor = '#d32f2f';
  }

  if (isSelected) {
    backgroundColor = '#ffccbc'; // A slightly different shade to indicate selection with severity color
    paperElevation = 4;
    selectedStyle = {
      outline: `2px solid ${textColor}`,
      outlineOffset: '2px',
      boxShadow: `0 0 10px ${textColor}`,
    };
  }

  return (
    <Paper
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      elevation={paperElevation}
      onClick={() => setSelectedGap(gap)}
      sx={{
        p: 1,
        my: 0.5,
        backgroundColor,
        borderLeft: `5px solid ${textColor}`,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease-in-out, transform 0.1s ease-in-out',
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: `0 0 8px ${textColor}aa`,
        },
        ...selectedStyle,
        position: 'relative', // Added for positioning the popup
        animation: gap.isNew ? `${pulseAnimation} 2s infinite` : 'none', // Apply animation if gap.isNew is true
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold', color: textColor, display: 'block' }}>
        GAP ({severity}) - ID: {id ? id.slice(-6) : 'N/A'}
      </Typography>
      <Typography variant="body2" sx={{ color: textColor, fontSize: '0.8rem' }}>
        Duration: {duration} min ({start_minute}-{end_minute} min)
      </Typography>
      {/* Future: Could include suggested solutions here */}
      {isHovering && <GapDetailPopup gap={gap} />}
    </Paper>
  );
};

export default GapIndicator;
