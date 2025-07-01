import { useMemo } from 'react';
import dagre from 'dagre';

const useAutoLayout = (nodes, edges) => {
  const layoutedNodes = useMemo(() => {
    if (nodes.length === 0) {
      return [];
    }

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    nodes.forEach((node) => {
      // Provide default dimensions, actual dimensions will be determined by the node's content
      dagreGraph.setNode(node.id, { width: 172, height: 36 });
    });

    // If no edges provided, create timeline-based edges for proper layout
    let layoutEdges = edges;
    if (edges.length === 0 && nodes.length > 1) {
      // Sort nodes by date if available, otherwise by ID
      const sortedNodes = [...nodes].sort((a, b) => {
        if (a.data?.date && b.data?.date) {
          return new Date(a.data.date) - new Date(b.data.date);
        }
        return a.id.localeCompare(b.id);
      });

      // Create linear edges for layout purposes
      layoutEdges = [];
      for (let i = 0; i < sortedNodes.length - 1; i++) {
        layoutEdges.push({
          id: `layout-edge-${i}`,
          source: sortedNodes[i].id,
          target: sortedNodes[i + 1].id
        });
      }
    }

    layoutEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      };
    });
  }, [nodes, edges]);

  return layoutedNodes;
};

export default useAutoLayout; 