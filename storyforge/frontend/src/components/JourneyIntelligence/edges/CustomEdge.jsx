/**
 * CustomEdge - A unified edge component for all edge types in JourneyIntelligence
 * Handles edge styling based on type and data, following ReactFlow v12 patterns
 */

import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

const CustomEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition,
  targetPosition,
  data = {}, 
  style = {},
  markerEnd,
  label
}) => {
  
  // Get the path for the edge
  const [edgePath, labelX, labelY] = getSmoothStepPath({ 
    sourceX, 
    sourceY, 
    sourcePosition,
    targetX, 
    targetY,
    targetPosition 
  });
  
  // Extract styling from the style object (already calculated in JourneyIntelligenceView)
  const {
    stroke = '#90caf9', // Brighter default color
    strokeWidth = 2,
    opacity = 0.8,
    strokeDasharray,
    ...otherStyles
  } = style;
  
  // Apply stroke color to marker if present
  const markerEndWithColor = markerEnd ? {
    ...markerEnd,
    color: stroke
  } : undefined;
  
  // Create a unique marker ID for this edge if it has an arrow
  const markerId = markerEnd ? `marker-${id}` : undefined;
  
  return (
    <>
      {/* Render SVG defs for custom colored arrow marker */}
      {markerEnd && (
        <defs>
          <marker
            id={markerId}
            markerWidth="12.5"
            markerHeight="12.5"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              stroke={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              fill={stroke}
              points="-5,-4 0,0 -5,4 -5,-4"
            />
          </marker>
        </defs>
      )}
      
      {/* Render the edge path directly with inline styles */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        strokeDasharray={strokeDasharray}
        markerEnd={markerId ? `url(#${markerId})` : undefined}
      />
      
      {/* Invisible wider path for better interaction */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      
      {(label || data?.label) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              background: '#1a1a1a',
              padding: '2px 6px',
              borderRadius: 3,
              color: '#ffffff',
              border: `1px solid ${stroke}`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan"
          >
            {label || data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;