import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';

// Simple test component with hardcoded nodes
const TestGraph = () => {
  const nodes = [
    {
      id: '1',
      data: { label: 'Character 1' },
      position: { x: 100, y: 100 },
      style: {
        background: '#2196f3',
        color: 'white',
        border: '2px solid #1976d2',
        borderRadius: '50%',
        width: 80,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },
    {
      id: '2',
      data: { label: 'Character 2' },
      position: { x: 300, y: 100 },
      style: {
        background: '#4caf50',
        color: 'white',
        border: '2px solid #388e3c',
        borderRadius: '50%',
        width: 80,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }
  ];

  const edges = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      style: { stroke: '#90caf9', strokeWidth: 2 }
    }
  ];

  return (
    <div style={{ width: '100%', height: '400px', background: '#1a1a1a' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant="dots" gap={12} size={1} color="#333" />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default TestGraph;