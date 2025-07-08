// Debug script to test graph rendering issue
// Run this in the browser console to check the graph state

console.log('=== DEBUGGING GRAPH RENDERING ===');

// Check if ReactFlow is loaded
console.log('ReactFlow loaded:', typeof window.ReactFlow);

// Get the ReactFlow container
const container = document.querySelector('.react-flow');
console.log('ReactFlow container:', container);

if (container) {
  const computedStyle = window.getComputedStyle(container);
  console.log('Container styles:', {
    width: computedStyle.width,
    height: computedStyle.height,
    background: computedStyle.backgroundColor,
    position: computedStyle.position,
    overflow: computedStyle.overflow,
    display: computedStyle.display
  });
  
  // Check for transform or scale issues
  console.log('Transform:', computedStyle.transform);
  console.log('Opacity:', computedStyle.opacity);
}

// Check for viewport element
const viewport = document.querySelector('.react-flow__viewport');
console.log('Viewport element:', viewport);

if (viewport) {
  const viewportStyle = window.getComputedStyle(viewport);
  console.log('Viewport transform:', viewportStyle.transform);
}

// Check for nodes
const nodes = document.querySelectorAll('.react-flow__node');
console.log('Number of rendered nodes:', nodes.length);

if (nodes.length > 0) {
  const firstNode = nodes[0];
  const nodeStyle = window.getComputedStyle(firstNode);
  console.log('First node position:', {
    transform: nodeStyle.transform,
    position: nodeStyle.position,
    display: nodeStyle.display,
    visibility: nodeStyle.visibility,
    opacity: nodeStyle.opacity
  });
}

// Check for edges
const edges = document.querySelectorAll('.react-flow__edge');
console.log('Number of rendered edges:', edges.length);

// Check SVG element
const svg = document.querySelector('.react-flow__edges svg');
console.log('SVG element:', svg);
if (svg) {
  console.log('SVG viewBox:', svg.getAttribute('viewBox'));
  console.log('SVG dimensions:', {
    width: svg.getAttribute('width'),
    height: svg.getAttribute('height')
  });
}

// Check React component state if available
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React DevTools available - check component props/state there');
}

console.log('=== END DEBUG ===');