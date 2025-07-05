/**
 * AggregatedNode - Custom ReactFlow node for aggregated entity groups
 * Displays as a dashed rectangle with entity count
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const AggregatedNode = memo(({ data, selected }) => {
  const { label, count, entityType } = data;
  
  return (
    <div
      style={{
        position: 'relative',
        minWidth: 150,
        minHeight: 60,
        backgroundColor: '#2a2a2a',
        border: '2px dashed #64748b',
        borderRadius: 8,
        padding: 16,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        color: '#ffffff'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#333333';
        e.currentTarget.style.borderColor = '#94a3b8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2a2a2a';
        e.currentTarget.style.borderColor = '#64748b';
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
      
      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center'
        }}
      >
        {label}
      </div>
      
      {count && (
        <div
          style={{
            color: '#94a3b8',
            fontSize: '12px',
            marginTop: 4
          }}
        >
          Click to expand
        </div>
      )}
    </div>
  );
});

AggregatedNode.displayName = 'AggregatedNode';

export default AggregatedNode;