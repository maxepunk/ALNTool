/**
 * PuzzleNode - Custom ReactFlow node for puzzle entities
 * Displays as a square with puzzle information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const PuzzleNode = memo(({ data, selected }) => {
  // Determine visual state based on node className
  const isConnected = data.className?.includes('connected');
  const isSecondaryConnected = data.className?.includes('secondary-connected');
  const isBackground = data.className?.includes('background');
  
  // Calculate opacity based on visual hierarchy
  let opacity = 1;
  if (isBackground) opacity = 0.2;
  else if (isSecondaryConnected) opacity = 0.6;
  else if (isConnected) opacity = 0.9;
  
  // Get puzzle metadata
  const difficulty = data.difficulty || 'Unknown';
  const rewardCount = data.rewardIds?.length || 0;
  
  // Get dynamic size from node data, fallback to default
  const nodeSize = data.size || 120;
  
  return (
    <div
      style={{
        width: nodeSize,
        height: nodeSize,
        borderRadius: 8,
        border: `${selected ? 3 : 2}px solid #f59e0b`,
        backgroundColor: '#1a1a1a',
        boxShadow: selected ? '0 0 10px rgba(245, 158, 11, 0.8)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        color: '#ffffff'
      }}
    >
      {/* Handles - simplified without IDs */}
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      
      {/* Puzzle icon - using emoji */}
      <div
        style={{
          fontSize: '28px',
          marginBottom: 4
        }}
      >
        🧩
      </div>
      
      {/* Puzzle name */}
      <div
        style={{
          fontSize: '12px',
          textAlign: 'center',
          maxWidth: nodeSize - 35,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingLeft: 8,
          paddingRight: 8
        }}
      >
        {data.label || data.puzzle || data.name || 'Unknown'}
      </div>
      
      {/* Difficulty indicator */}
      <div
        style={{
          color: '#94a3b8',
          fontSize: '11px',
          marginTop: 4
        }}
      >
        {difficulty}
      </div>
      
      {/* Reward count badge */}
      {rewardCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#f59e0b',
            color: '#1a1a1a',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {rewardCount} ✓
        </div>
      )}
      
      {/* Collaboration indicator if puzzle requires multiple characters */}
      {data.requiredElements?.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4
          }}
        >
          {[...Array(Math.min(3, data.requiredElements.length))].map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#f59e0b'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

PuzzleNode.displayName = 'PuzzleNode';

export default PuzzleNode;