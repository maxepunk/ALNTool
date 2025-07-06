/**
 * CharacterNode - Custom ReactFlow node for character entities
 * Displays as a circle with character information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const CharacterNode = memo(({ data, selected }) => {
  // Use visualState from data
  const visualState = data.visualState || {};
  const opacity = visualState.opacity || 1;
  const scale = visualState.scale || 1;
  const blur = visualState.blur || 0;
  const isBackground = visualState.isBackground || false;
  
  // Relationship count for badge (if available)
  const relationshipCount = data.relationshipCount || 0;
  
  // Get dynamic size from node data, fallback to default
  const baseSize = data.size || 120;
  const nodeSize = baseSize * scale;
  
  // Build tooltip content
  const tooltipContent = [
    `Name: ${data.name || 'Unknown'}`,
    data.tier ? `Tier: ${data.tier}` : null,
    data.logline ? `Logline: ${data.logline}` : null,
    data.actorName ? `Actor: ${data.actorName}` : null,
    relationshipCount > 0 ? `Relationships: ${relationshipCount}` : null
  ].filter(Boolean).join('\n');
  
  return (
    <div
      title={tooltipContent}
      style={{
        width: nodeSize,
        height: nodeSize,
        borderRadius: '50%',
        border: `${visualState.isSelected ? 3 : 2}px solid ${visualState.isSelected ? '#1976d2' : visualState.isConnected ? '#42a5f5' : '#3b82f6'}`,
        backgroundColor: isBackground ? '#0a0a0a' : '#1a1a1a',
        boxShadow: visualState.isSelected ? '0 0 20px rgba(25, 118, 210, 0.8)' : visualState.isConnected ? '0 0 10px rgba(66, 165, 245, 0.5)' : 'none',
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
      
      {/* Character icon - using emoji instead of MUI icon */}
      <div
        style={{
          fontSize: `${28 * scale}px`,
          marginBottom: 4,
          opacity: isBackground ? 0.5 : 1
        }}
      >
        👤
      </div>
      
      {/* Character name - hide when hideLabel is true */}
      {!data.hideLabel && (
        <>
          <div
            style={{
              fontSize: `${12 * scale}px`,
              textAlign: 'center',
              maxWidth: nodeSize - 20,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingLeft: 8,
              paddingRight: 8,
              fontWeight: visualState.isSelected ? 'bold' : 'normal'
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
        </>
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