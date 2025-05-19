import React from 'react';
import { getBezierPath, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { Box, Typography, Tooltip } from '@mui/material';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label, // Simple label (e.g., "Owns", "Requires")
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  animated,
  data, // Should now contain { ..., contextualLabel: "Source Name (Type) Label Target Name (Type)" }
}) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate label position (e.g., 70% along the path)
  const t = 0.7; // Parameter for position along the Bezier curve (0=source, 1=target)
  const B0 = (s) => (1 - s) ** 3;
  const B1 = (s) => 3 * s * (1 - s) ** 2;
  const B2 = (s) => 3 * s ** 2 * (1 - s);
  const B3 = (s) => s ** 3;

  // Approximate point for label for a simple Bezier (cubic)
  // More accurate calculation would involve curve length parametrization
  const pathLabelX = B0(t) * sourceX + B1(t) * (sourceX) + B2(t) * (targetX) + B3(t) * targetX; 
  const pathLabelY = B0(t) * sourceY + B1(t) * (sourceY) + B2(t) * (targetY) + B3(t) * targetY;
  // This simple interpolation is not perfect for Bezier, let's use React Flow's provided labelX, labelY for now and adjust later if needed.
  // For Bezier, labelX, labelY from getBezierPath is the midpoint of the quadratic control point, which works okay.

  // For a simpler approach, let's calculate a point slightly offset from the middle for the label
  // Calculate midpoint
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  // Calculate vector from source to target
  const dX = targetX - sourceX;
  const dY = targetY - sourceY;
  // Position label 70% along this vector
  const customLabelX = sourceX + dX * 0.7;
  const customLabelY = sourceY + dY * 0.7;

  // Determine the text/tooltip for the edge label
  const edgeDisplayLabel = data?.shortLabel || label || ''; // New way: Prioritize shortLabel, fallback to original label, then empty string
  const edgeTooltip = data?.contextualLabel || label || 'Edge Connection'; // Use rich contextual label if available, fallback to original label

  // *** Add this log to inspect edge data and tooltip content ***
  // if (id) { // Log only if id is present, to reduce noise from potential temp edges
  //   console.log(`CustomEdge (ID: ${id}, Label: ${label}): data:`, data, `edgeTooltip:`, edgeTooltip);
  // }
  // Let's log more consistently for now during this specific verification phase:
  console.log(
    `CustomEdge Rendered - ID: ${id}, SimpleLabel (props.label): '${label}', EdgeDisplayLabel: '${edgeDisplayLabel}', EdgeTooltip: '${edgeTooltip}'`, 
    {
      propsLabel: label,
      propsData: data,
      // computedEdgeDisplayLabel: edgeDisplayLabel, // Redundant with above
      // computedEdgeTooltip: edgeTooltip, // Redundant with above
    }
  );
  // ***********************************************************

  // Determine stroke styling based on relationship strength
  const STRONG = new Set(["Requires", "Required For", "Rewards", "Reward From", "Unlocks", "Locked In", "Dependency"]);
  const edgeStroke = STRONG.has(edgeDisplayLabel) ? (style.stroke || '#90caf9') : (style.stroke || '#90caf9');
  const edgeOpacity = STRONG.has(edgeDisplayLabel) ? 0.85 : 0.4;
  const edgeWidth = STRONG.has(edgeDisplayLabel) ? 2 : 1;

  const mergedPathStyle = { ...style, stroke: edgeStroke, strokeWidth: edgeWidth, opacity: edgeOpacity };

  return (
    <>
      <path
        id={id}
        style={mergedPathStyle}
        className={`react-flow__edge-path ${animated ? 'animated' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {edgeDisplayLabel && (
        <EdgeLabelRenderer>
          <Tooltip title={edgeTooltip} placement="top" arrow disableInteractive>
            <Box
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${customLabelX}px,${customLabelY}px)`,
                pointerEvents: 'all',
                ...(labelBgStyle || {}),
                padding: `${labelBgPadding?.[1] || 5}px ${labelBgPadding?.[0] || 3}px`,
                borderRadius: labelBgBorderRadius || 3,
              }}
              className="nodrag nopan"
            >
              <Typography sx={{...(labelStyle || {}), userSelect: 'none'}} variant="caption">
                {edgeDisplayLabel}
              </Typography>
            </Box>
          </Tooltip>
        </EdgeLabelRenderer>
      )}
    </>
  );
} 