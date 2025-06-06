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

    edges.forEach((edge) => {
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