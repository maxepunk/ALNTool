/**
 * ElementNode - Custom ReactFlow node for element entities
 * Displays as a diamond with element information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const ElementNode = memo(({ data, selected }) => {
  // Use visualState from data
  const visualState = data.visualState || {};
  const opacity = visualState.opacity || 1;
  const scale = visualState.scale || 1;
  const blur = visualState.blur || 0;
  const isBackground = visualState.isBackground || false;
  
  // Get element type and icon
  const elementType = data.type || data.basicType || 'element';
  let icon = '📦'; // Default element icon
  
  if (elementType === 'Memory Token') {
    icon = '💾';
  } else if (elementType === 'Prop') {
    icon = '🎭';
  } else if (elementType === 'Document') {
    icon = '📄';
  }
  
  // Memory value for display (if available)
  const memoryValue = data.calculated_memory_value || data.memory_value;
  
  // Dynamic size based on scale
  const baseSize = 120;
  const nodeSize = baseSize * scale;
  
  return (
    <div
      style={{
        width: nodeSize,
        height: nodeSize,
        transform: `rotate(45deg) scale(${scale})`,
        border: `${visualState.isSelected ? 3 : 2}px solid ${visualState.isSelected ? '#2e7d32' : visualState.isConnected ? '#4caf50' : '#10b981'}`,
        backgroundColor: isBackground ? '#0a0a0a' : '#1a1a1a',
        boxShadow: visualState.isSelected ? '0 0 20px rgba(46, 125, 50, 0.8)' : visualState.isConnected ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none',
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        transition: 'all 0.3s ease',
        cursor: isBackground ? 'default' : 'pointer',
        position: 'relative',
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
      
      {/* Inner content container - rotate back */}
      <div
        style={{
          transform: 'rotate(-45deg)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}
      >
        {/* Element type icon - using emoji */}
        <div
          style={{
            fontSize: `${24 * scale}px`,
            marginBottom: 4,
            opacity: isBackground ? 0.5 : 1
          }}
        >
          {icon}
        </div>
        
        {/* Element name */}
        <div
          style={{
            fontSize: `${12 * scale}px`,
            textAlign: 'center',
            maxWidth: 80 * scale,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: 4,
            paddingRight: 4,
            fontWeight: visualState.isSelected ? 'bold' : 'normal'
          }}
        >
          {data.label || data.name || 'Unknown'}
        </div>
        
        {/* Element type label */}
        <div
          style={{
            color: '#94a3b8',
            fontSize: '11px',
            marginTop: 2
          }}
        >
          {elementType}
        </div>
      </div>
      
      {/* Memory value badge for memory tokens */}
      {memoryValue && elementType === 'Memory Token' && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: '#10b981',
            color: '#ffffff',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: 'bold',
            transform: 'rotate(-45deg)'
          }}
        >
          ${memoryValue}
        </div>
      )}
      
      {/* Container indicator if element is contained */}
      {data.container_element_id && (
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%) rotate(-45deg)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#64748b'
          }}
        />
      )}
    </div>
  );
});

ElementNode.displayName = 'ElementNode';

export default ElementNode;