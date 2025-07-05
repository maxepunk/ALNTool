/**
 * CharacterNode - Custom ReactFlow node for character entities
 * Displays as a circle with character information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const CharacterNode = memo(({ data, selected }) => {
  // Determine visual state based on node className
  const isConnected = data.className?.includes('connected');
  const isSecondaryConnected = data.className?.includes('secondary-connected');
  const isBackground = data.className?.includes('background');
  
  // Calculate opacity based on visual hierarchy
  let opacity = 1;
  if (isBackground) opacity = 0.2;
  else if (isSecondaryConnected) opacity = 0.6;
  else if (isConnected) opacity = 0.9;
  
  // Relationship count for badge (if available)
  const relationshipCount = data.relationshipCount || 0;
  
  // Get dynamic size from node data, fallback to default
  const nodeSize = data.size || 120;
  
  return (
    <div
      style={{
        width: nodeSize,
        height: nodeSize,
        borderRadius: '50%',
        border: `${selected ? 3 : 2}px solid #3b82f6`,
        backgroundColor: '#1a1a1a',
        boxShadow: selected ? '0 0 10px rgba(59, 130, 246, 0.8)' : 'none',
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
      
      {/* Character icon - using emoji instead of MUI icon */}
      <div
        style={{
          fontSize: '28px',
          marginBottom: 4
        }}
      >
        👤
      </div>
      
      {/* Character name */}
      <div
        style={{
          fontSize: '12px',
          textAlign: 'center',
          maxWidth: nodeSize - 20,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingLeft: 8,
          paddingRight: 8
        }}
      >
        {data.label || data.name || 'Unknown'}
      </div>
      
      {/* Tier indicator if available */}
      {data.tier && (
        <div
          style={{
            color: '#94a3b8',
            fontSize: '11px',
            marginTop: 4
          }}
        >
          Tier {data.tier}
        </div>
      )}
      
      {/* Relationship count badge */}
      {relationshipCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {relationshipCount}
        </div>
      )}
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';

export default CharacterNode;