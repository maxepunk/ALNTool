import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Typography } from '@mui/material';

const nodeStyle = {
  background: '#C1E1FF', // A light blue
  color: '#333',
  border: '1px solid #77A0D9',
  borderRadius: '8px',
  padding: '10px 15px',
  fontSize: '12px',
  minWidth: '150px',
  textAlign: 'center',
};

const DiscoveryNode = ({ data }) => {
  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Top} />
      <Typography sx={{ fontWeight: 'bold' }}>{data.label}</Typography>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default DiscoveryNode; 