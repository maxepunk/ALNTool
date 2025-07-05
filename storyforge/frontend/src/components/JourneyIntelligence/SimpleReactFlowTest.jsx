import React from 'react';
import { ReactFlow } from '@xyflow/react';
import { Box, Typography } from '@mui/material';

const SimpleReactFlowTest = () => {
  const nodes = [
    {
      id: '1',
      type: 'default',
      data: { label: 'Test Node 1' },
      position: { x: 100, y: 100 }
    },
    {
      id: '2',
      type: 'default',
      data: { label: 'Test Node 2' },
      position: { x: 300, y: 100 }
    }
  ];

  const edges = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'smoothstep'
    }
  ];

  return (
    <Box sx={{ width: '100%', height: '400px', border: '2px solid red', position: 'relative' }}>
      <Typography sx={{ position: 'absolute', top: 0, left: 0, zIndex: 10, background: 'white', p: 1 }}>
        ReactFlow Test - Should show 2 nodes
      </Typography>
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        fitView
      />
    </Box>
  );
};

export default SimpleReactFlowTest;