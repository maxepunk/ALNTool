/**
 * Test script to verify force-directed layout is working
 * Run this in the browser console to check if nodes are spreading out
 */

// Check if simulation is running
const checkSimulation = () => {
  // Get all nodes from the DOM
  const nodes = document.querySelectorAll('.react-flow__node');
  console.log('Total nodes found:', nodes.length);
  
  // Track node positions over time
  const positions = new Map();
  
  nodes.forEach(node => {
    const transform = node.style.transform;
    const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      const id = node.getAttribute('data-id');
      positions.set(id, { x, y });
    }
  });
  
  // Wait and check again
  setTimeout(() => {
    let moved = 0;
    nodes.forEach(node => {
      const transform = node.style.transform;
      const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        const id = node.getAttribute('data-id');
        const oldPos = positions.get(id);
        if (oldPos && (Math.abs(oldPos.x - x) > 1 || Math.abs(oldPos.y - y) > 1)) {
          moved++;
        }
      }
    });
    
    console.log(`Nodes that moved: ${moved}/${nodes.length}`);
    
    // Check character clustering
    const characterNodes = document.querySelectorAll('.react-flow__node[data-type="character"]');
    console.log('Character nodes:', characterNodes.length);
    
    // Calculate average distances between characters
    const charPositions = [];
    characterNodes.forEach(node => {
      const transform = node.style.transform;
      const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (match) {
        charPositions.push({
          x: parseFloat(match[1]),
          y: parseFloat(match[2]),
          id: node.getAttribute('data-id')
        });
      }
    });
    
    if (charPositions.length > 1) {
      let totalDistance = 0;
      let count = 0;
      for (let i = 0; i < charPositions.length; i++) {
        for (let j = i + 1; j < charPositions.length; j++) {
          const dist = Math.sqrt(
            Math.pow(charPositions[i].x - charPositions[j].x, 2) +
            Math.pow(charPositions[i].y - charPositions[j].y, 2)
          );
          totalDistance += dist;
          count++;
        }
      }
      const avgDistance = totalDistance / count;
      console.log('Average distance between characters:', avgDistance.toFixed(2), 'px');
      console.log('(Should be > 150px for good separation)');
    }
    
    // Check element clustering
    const elementNodes = document.querySelectorAll('.react-flow__node[data-type="element"]');
    console.log('Element nodes:', elementNodes.length);
    
    // Find elements near their owner characters
    let clustered = 0;
    elementNodes.forEach(elem => {
      const elemTransform = elem.style.transform;
      const elemMatch = elemTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (elemMatch) {
        const elemX = parseFloat(elemMatch[1]);
        const elemY = parseFloat(elemMatch[2]);
        
        // Check distance to characters
        let minDist = Infinity;
        charPositions.forEach(char => {
          const dist = Math.sqrt(
            Math.pow(elemX - char.x, 2) +
            Math.pow(elemY - char.y, 2)
          );
          minDist = Math.min(minDist, dist);
        });
        
        if (minDist < 150) { // Within clustering distance
          clustered++;
        }
      }
    });
    
    console.log(`Elements clustered near characters: ${clustered}/${elementNodes.length}`);
    console.log('(Should be high percentage for owned elements)');
    
  }, 2000);
};

// Run the check
checkSimulation();

// Also log the hook state if accessible
if (window.__REACT_FLOW_INSTANCE__) {
  console.log('ReactFlow instance found');
}