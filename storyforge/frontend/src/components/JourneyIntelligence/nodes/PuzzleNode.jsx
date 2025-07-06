/**
 * PuzzleNode - Custom ReactFlow node for puzzle entities
 * Displays as a square with puzzle information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const PuzzleNode = memo(({ data, selected }) => {
  // Use visualState from data
  const visualState = data.visualState || {};
  const opacity = visualState.opacity || 1;
  const scale = visualState.scale || 1;
  const blur = visualState.blur || 0;
  const isBackground = visualState.isBackground || false;
  
  // Get puzzle metadata
  const difficulty = data.difficulty || 'Unknown';
  const rewardCount = data.rewardIds?.length || 0;
  
  // Get dynamic size from node data, fallback to default
  const baseSize = data.size || 120;
  const nodeSize = baseSize * scale;
  
  // Build tooltip content
  const tooltipContent = [
    `Name: ${data.puzzle || data.name || 'Unknown'}`,
    `Difficulty: ${difficulty}`,
    data.status ? `Status: ${data.status}` : null,
    rewardCount > 0 ? `Rewards: ${rewardCount} items` : null,
    data.requiredElements?.length > 0 ? `Required Elements: ${data.requiredElements.length}` : null,
    data.requiredElements?.length > 1 ? 'Requires collaboration' : null,
    data.description ? `Description: ${data.description}` : null
  ].filter(Boolean).join('\n');
  
  return (
    <div
      title={tooltipContent}
      style={{
        width: nodeSize,
        height: nodeSize,
        borderRadius: 8,
        border: `${visualState.isSelected ? 3 : 2}px solid ${visualState.isSelected ? '#f57c00' : visualState.isConnected ? '#ff9800' : '#f59e0b'}`,
        backgroundColor: isBackground ? '#0a0a0a' : '#1a1a1a',
        boxShadow: visualState.isSelected ? '0 0 20px rgba(245, 124, 0, 0.8)' : visualState.isConnected ? '0 0 10px rgba(255, 152, 0, 0.5)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        transition: 'all 0.3s ease',
        cursor: isBackground ? 'default' : 'pointer',
        position: 'relative',
        color: '#ffffff',
        pointerEvents: isBackground ? 'none' : 'auto'
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
          fontSize: `${28 * scale}px`,
          marginBottom: 4,
          opacity: isBackground ? 0.5 : 1
        }}
      >
        🧩
      </div>
      
      {/* Puzzle name - hide when hideLabel is true */}
      {!data.hideLabel && (
        <>
          <div
            style={{
              fontSize: `${12 * scale}px`,
              textAlign: 'center',
              maxWidth: nodeSize - 35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingLeft: 8,
              paddingRight: 8,
              fontWeight: visualState.isSelected ? 'bold' : 'normal'
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
        </>
      )}
      
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