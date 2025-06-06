import React, { useEffect, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background } from '@xyflow/react';
import useJourneyStore from '../../stores/journeyStore';
import useAutoLayout from '../../hooks/useAutoLayout';
import ActivityNode from './customNodes/ActivityNode';
import DiscoveryNode from './customNodes/DiscoveryNode';
import LoreNode from './customNodes/LoreNode';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  activityNode: ActivityNode,
  discoveryNode: DiscoveryNode,
  loreNode: LoreNode,
};

// The inner component that can use the auto-layout hook
const LayoutedGraph = ({ initialNodes, initialEdges }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const setSelectedNode = useJourneyStore(state => state.setSelectedNode);

  const layoutedNodes = useAutoLayout(initialNodes, initialEdges);

  useEffect(() => {
    // We only want to set the layouted nodes once, when the initial nodes change.
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    console.log('Selected node:', node);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};


const JourneyGraphView = ({ characterId }) => {
  const journeyGraph = useJourneyStore(state => state.journeyData.get(characterId)?.graph);

  if (!journeyGraph || !journeyGraph.nodes || !journeyGraph.edges) {
    return <div>Loading journey graph...</div>;
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlowProvider>
        <LayoutedGraph initialNodes={journeyGraph.nodes} initialEdges={journeyGraph.edges} />
      </ReactFlowProvider>
    </div>
  );
};

export default JourneyGraphView; 