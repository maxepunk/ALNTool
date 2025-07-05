/**
 * ElementNode - Custom ReactFlow node for element entities
 * Displays as a diamond with element information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const ElementNode = memo(({ data, selected }) => {
  // Determine visual state based on node className
  const isConnected = data.className?.includes('connected');
  const isSecondaryConnected = data.className?.includes('secondary-connected');
  const isBackground = data.className?.includes('background');
  
  // Calculate opacity based on visual hierarchy
  let opacity = 1;
  if (isBackground) opacity = 0.2;
  else if (isSecondaryConnected) opacity = 0.6;
  else if (isConnected) opacity = 0.9;
  
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
  
  return (
    <div
      style={{
        width: 120,
        height: 120,
        transform: 'rotate(45deg)',
        border: `${selected ? 3 : 2}px solid #10b981`,
        backgroundColor: '#1a1a1a',
        boxShadow: selected ? '0 0 10px rgba(16, 185, 129, 0.8)' : 'none',
        opacity,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
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
            fontSize: '24px',
            marginBottom: 4
          }}
        >
          {icon}
        </div>
        
        {/* Element name */}
        <div
          style={{
            fontSize: '12px',
            textAlign: 'center',
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: 4,
            paddingRight: 4
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