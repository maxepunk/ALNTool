import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Typography } from '@mui/material';

// Node theme configurations
const nodeThemes = {
  activity: {
    background: '#FFDDC1', // Light orange
    border: '1px solid #D9A077',
  },
  discovery: {
    background: '#C1E1FF', // Light blue
    border: '1px solid #77A0D9',
  },
  lore: {
    background: '#E1C1FF', // Light purple
    border: '1px solid #A077D9',
  },
};

const BaseNode = ({ data, theme = 'activity' }) => {
  const themeStyles = nodeThemes[theme] || nodeThemes.activity;
  
  const nodeStyle = {
    background: themeStyles.background,
    color: '#333',
    border: themeStyles.border,
    borderRadius: '8px',
    padding: '10px 15px',
    fontSize: '12px',
    minWidth: '150px',
    textAlign: 'center',
  };

  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Top} />
      <Typography sx={{ fontWeight: 'bold' }}>{data.label}</Typography>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default BaseNode;