import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useReactFlow } from '@xyflow/react';

// Very lightweight convex-hull approximation: axis-aligned bounding box with rounded corners
export const ClusterHull = memo(function ClusterHull({ hub, childrenNodes, color = '#ccc', padding = 30 }) {
  if (!hub || childrenNodes.length === 0) return null;

  const { getViewport } = useReactFlow();
  const { x: tx, y: ty, zoom } = getViewport();
  // Collect points
  const pts = [hub, ...childrenNodes].map(n => ({ x: n.position.x + (n.style?.width||170)/2, y: n.position.y + (n.style?.height||60)/2 }));
  const xs = pts.map(p=>p.x);
  const ys = pts.map(p=>p.y);
  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding;
  const maxY = Math.max(...ys) + padding;

  const width = maxX - minX;
  const height = maxY - minY;

  // convert graph coords -> screen coords
  const screenLeft = minX * zoom + tx;
  const screenTop  = minY * zoom + ty;
  const screenWidth = width * zoom;
  const screenHeight = height * zoom;

  return (
    <Box
      sx={{
        position:'absolute',
        left:screenLeft,
        top:screenTop,
        width:screenWidth,
        height:screenHeight,
        border: '5px solid red',
        backgroundColor: 'rgba(255,0,0,0.2)',
        borderRadius:8,
        pointerEvents:'none',
        zIndex:1000,
      }}
    />
  );
});

ClusterHull.propTypes = {
  hub: PropTypes.object.isRequired,
  childrenNodes: PropTypes.array.isRequired,
  color: PropTypes.string,
  padding: PropTypes.number,
}; 