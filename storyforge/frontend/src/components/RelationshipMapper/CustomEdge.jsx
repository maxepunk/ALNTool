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
  const [edgePath, labelX, labelY] = getBezierPath({ // labelX, labelY are provided by React Flow for optimal label positioning
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine the text/tooltip for the edge label
  const edgeDisplayLabel = data?.shortLabel || label || '';
  const edgeTooltip = data?.contextualLabel || label || 'Edge Connection';

  // Styling an Kante basierend auf data.type (edgeCategory) und data.shortLabel (für "STRONG")
  // 1. Basis-Style von Props (gesetzt in transformToGraphElements.js)
  let finalEdgeStyle = { ...style };

  // 2. StrokeDasharray basierend auf data.type (edgeCategory)
  // Diese Kategorien werden in `transformToGraphElements.js` zugewiesen
  const edgeCategory = data?.type;
  let strokeDasharray;
  switch (edgeCategory) {
    case 'dependency': // z.B. Requires, Unlocks
      strokeDasharray = undefined; // Solid line
      break;
    case 'containment': // z.B. Contains
      strokeDasharray = '3, 3'; // Dotted
      break;
    case 'character': // Charakter-spezifische Verbindungen
      strokeDasharray = '5, 5'; // Lighter dash
      break;
    case 'timeline': // Timeline-spezifische Verbindungen
      strokeDasharray = '6, 4'; // Different dash
      break;
    case 'association': // Allgemeine Assoziationen
       strokeDasharray = '4, 4';
       break;
    default: // Fallback für 'default' oder nicht definierte Typen
      strokeDasharray = '2, 3'; // Subtle dash
      break;
  }
  if (strokeDasharray) {
    finalEdgeStyle.strokeDasharray = strokeDasharray;
  }

  // 3. Anpassungen für "STRONG" Beziehungen (basierend auf data.shortLabel)
  // Die STRONG Menge wird hier definiert. Sie sollte kritische Bezeichnungen enthalten.
  const STRONG_RELATIONSHIPS = new Set(["Requires", "Unlocks", "Required For", "Rewards", "Reward From", "Locked In", "Has Sub-Puzzle", "Sub-Puzzle Of"]);
  // "Dependency" als shortLabel ist unwahrscheinlich, aber data.type === 'dependency' wird oben behandelt.

  const isStrongRelationship = STRONG_RELATIONSHIPS.has(data?.shortLabel);

  if (isStrongRelationship) {
    finalEdgeStyle.opacity = style.opacity !== undefined ? Math.min(1, style.opacity * 1.2) : 0.95; // Slightly more opaque or default to 0.95
    // Potenzielle Erhöhung der Strichstärke für starke Beziehungen, falls gewünscht.
    // finalEdgeStyle.strokeWidth = (style.strokeWidth || 1) * 1.2; // Beispiel: 20% dicker
    // Sei vorsichtig, dies nicht zu übertreiben, da die Basisbreite bereits variiert.
  } else {
    // Standard-Opazität für nicht-starke Beziehungen, kann je nach Kategorie angepasst werden
    if (edgeCategory === 'dependency' || edgeCategory === 'containment') {
      finalEdgeStyle.opacity = style.opacity !== undefined ? style.opacity : 0.8;
    } else {
      finalEdgeStyle.opacity = style.opacity !== undefined ? style.opacity : 0.65; // Weniger wichtige Linien etwas transparenter
    }
  }
  // Ensure strokeWidth is present, defaulting if necessary.
  finalEdgeStyle.strokeWidth = finalEdgeStyle.strokeWidth || 1;


  // Logging der finalen Style-Entscheidungen (optional, für Debugging)
  // console.log(`CustomEdge (ID: ${id}) Style Decision:`,
  //   { edgeCategory, shortLabel: data?.shortLabel, isStrongRelationship, initialStyle: style, finalEdgeStyle });

  return (
    <>
      <path
        id={id}
        style={finalEdgeStyle} // Use the refined style object
        className={`react-flow__edge-path ${animated || style.animated ? 'animated' : ''}`} // Respect animated prop from style or direct prop
        d={edgePath}
        markerEnd={markerEnd}
      />
      {edgeDisplayLabel && (
        <EdgeLabelRenderer>
          <Tooltip title={edgeTooltip} placement="top" arrow disableInteractive>
            <Box
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, // Use labelX, labelY from getBezierPath
                pointerEvents: 'all',
                ...(labelBgStyle || {}), // Background style from props
                padding: `${labelBgPadding?.[1] || 5}px ${labelBgPadding?.[0] || 3}px`,
                borderRadius: labelBgBorderRadius || 3,
              }}
              className="nodrag nopan" // Standard React Flow classes to prevent dragging of label
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