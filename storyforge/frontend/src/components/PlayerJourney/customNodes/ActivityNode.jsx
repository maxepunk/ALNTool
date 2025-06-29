import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Typography } from '@mui/material';

const nodeStyle = {
  background: '#FFDDC1', // A light orange
  color: '#333',
  border: '1px solid #D9A077',
  borderRadius: '8px',
  padding: '10px 15px',
  fontSize: '12px',
  minWidth: '150px',
  textAlign: 'center',
};

const ActivityNode = ({ data }) => {
  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Top} />
      <Typography sx={{ fontWeight: 'bold' }}>{data.label}</Typography>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default ActivityNode; 