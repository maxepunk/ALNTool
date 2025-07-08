import React from 'react';
import ReactFlow, { Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Test data with clear positions
const testNodes = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Test Node 1' },
    position: { x: 100, y: 100 },
    style: { 
      background: '#2196f3', 
      color: '#fff',
      border: '2px solid #1976d2',
      borderRadius: '8px',
      padding: '10px'
    }
  },
  {
    id: '2',
    type: 'default',
    data: { label: 'Test Node 2' },
    position: { x: 300, y: 100 },
    style: { 
      background: '#4caf50', 
      color: '#fff',
      border: '2px solid #388e3c',
      borderRadius: '8px',
      padding: '10px'
    }
  },
  {
    id: '3',
    type: 'default',
    data: { label: 'Test Node 3' },
    position: { x: 200, y: 250 },
    style: { 
      background: '#ff9800', 
      color: '#fff',
      border: '2px solid #f57c00',
      borderRadius: '8px',
      padding: '10px'
    }
  }
];

const testEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    style: { stroke: '#90caf9', strokeWidth: 2 }
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    style: { stroke: '#90caf9', strokeWidth: 2 }
  },
  {
    id: 'e3-1',
    source: '3',
    target: '1',
    type: 'smoothstep',
    style: { stroke: '#90caf9', strokeWidth: 2 }
  }
];

export default function TestMinimalGraph() {
  return (
    <div style={{ width: '100%', height: '500px', background: '#0a0a0a' }}>
      <ReactFlow 
        nodes={testNodes} 
        edges={testEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant="dots" gap={12} size={1} color="#333" />
        <Controls />
      </ReactFlow>
    </div>
  );
}