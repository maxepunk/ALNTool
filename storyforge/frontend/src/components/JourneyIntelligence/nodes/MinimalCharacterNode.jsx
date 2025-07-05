import React from 'react';
import { Handle, Position } from '@xyflow/react';

const MinimalCharacterNode = ({ data }) => {
  return (
    <div style={{
      background: '#1a1a1a',
      border: '2px solid #3b82f6',
      borderRadius: '50%',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      textAlign: 'center',
      padding: '10px'
    }}>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div>{data.label || 'Character'}</div>
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

export default MinimalCharacterNode;