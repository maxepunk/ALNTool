/**
 * TimelineEventNode - Custom ReactFlow node for timeline event entities
 * Displays as a distinctive shape with timeline information
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const TimelineEventNode = memo(({ data, selected }) => {
  // Determine visual state based on node className
  const isConnected = data.className?.includes('connected');
  const isSecondaryConnected = data.className?.includes('secondary-connected');
  const isBackground = data.className?.includes('background');
  
  // Calculate opacity based on visual hierarchy
  let opacity = 1;
  if (isBackground) opacity = 0.2;
  else if (isSecondaryConnected) opacity = 0.6;
  else if (isConnected) opacity = 0.9;
  
  // Get timeline metadata
  const actFocus = data.act_focus || data.actFocus || 'Unknown';
  const date = data.event_date || data.date;
  const isPast = data.is_past !== undefined ? data.is_past : true;
  
  // Get dynamic size from node data, fallback to default
  const nodeSize = data.size || 120;
  
  return (
    <div
      style={{
        width: nodeSize,
        height: nodeSize,
        borderRadius: 12,
        border: `${selected ? 3 : 2}px solid #8b5cf6`,
        borderStyle: 'dashed',
        backgroundColor: '#1a1a1a',
        boxShadow: selected ? '0 0 10px rgba(139, 92, 246, 0.8)' : 'none',
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
      
      {/* Timeline icon - use different emoji for past vs present */}
      <div
        style={{
          fontSize: '28px',
          marginBottom: 4
        }}
      >
        {isPast ? '⏰' : '📅'}
      </div>
      
      {/* Event description (truncated) */}
      <div
        style={{
          fontSize: '11px',
          textAlign: 'center',
          maxWidth: nodeSize - 40,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          paddingLeft: 8,
          paddingRight: 8,
          lineHeight: 1.3,
          marginBottom: 4
        }}
      >
        {data.label || data.description || 'Unknown Event'}
      </div>
      
      {/* Act focus indicator */}
      {actFocus !== 'Unknown' && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#8b5cf6',
            color: '#ffffff',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          {actFocus}
        </div>
      )}
      
      {/* Date indicator if available */}
      {date && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            color: '#94a3b8',
            fontSize: '10px'
          }}
        >
          {new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      )}
    </div>
  );
});

TimelineEventNode.displayName = 'TimelineEventNode';

export default TimelineEventNode;