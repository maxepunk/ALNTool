import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import {
  Box, Typography, CircularProgress, Alert, Paper, Drawer, IconButton, Chip, List, ListItem, ListItemText, Divider, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '../components/PageHeader';
import EntityNode from '../components/RelationshipMapper/EntityNode'; // Re-using EntityNode
import CustomEdge from '../components/RelationshipMapper/CustomEdge'; // Re-using CustomEdge
import { api } from '../services/api';
import { getDagreLayout } from '../components/RelationshipMapper/layoutUtils'; // For initial layout if needed, though default might be better
import { Link as RouterLink, useNavigate } from 'react-router-dom';


const nodeTypes = {
  characterNode: (props) => <EntityNode {...props} centralEntityType="Character" isFullScreen={false} />, // Adapt EntityNode
};

const edgeTypes = {
  custom: CustomEdge, // Using the existing custom edge
};

const CharacterSociogramPage = () => {
  const navigate = useNavigate();
  const { data: charactersData, isLoading, error } = useQuery(
    'allCharactersSociogram',
    api.getAllCharactersWithSociogramData
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  const graphElements = useMemo(() => {
    if (!charactersData) return { nodes: [], edges: [] };

    const newNodes = charactersData.map(char => ({
      id: char.id,
      type: 'characterNode', // Use the adapted EntityNode or a new CharacterGraphNode
      position: { x: Math.random() * 800, y: Math.random() * 600 }, // Random initial positions
      data: {
        id: char.id,
        label: char.name,
        type: 'Character', // For EntityNode
        properties: char, // Pass all character data for EntityNode and detail panel
        // specific data for EntityNode if needed:
        name: char.name,
        tier: char.tier,
        characterType: char.type, // Player/NPC
        logline: char.logline,
        actFocus: char.actFocus,
        themes: char.themes || [],
        resolutionPaths: char.resolutionPaths || [],
        linkedCharacters: char.linkedCharacters || [],
      },
    }));

    const newEdges = [];
    const edgeSet = new Set(); // To avoid duplicate edges (A->B and B->A if data is bidirectional)

    charactersData.forEach(char => {
      if (char.linkedCharacters) {
        char.linkedCharacters.forEach(linkedChar => {
          const sourceId = char.id;
          const targetId = linkedChar.id;
          const edgeIdSorted = [sourceId, targetId].sort().join('-');
          const edgeIdDirect = `${sourceId}-${targetId}`;

          if (!edgeSet.has(edgeIdSorted)) {
            newEdges.push({
              id: edgeIdDirect,
              source: sourceId,
              target: targetId,
              type: 'custom', // Use custom edge for potential future styling
              label: 'linked', // Generic label for now
              data: { type: 'default', shortLabel: 'linked' }, // For CustomEdge styling
              markerEnd: { type: MarkerType.ArrowClosed },
            });
            edgeSet.add(edgeIdSorted);
          }
        });
      }
    });

    // Apply layout (optional - React Flow's default may be good for sociograms)
    // For a more structured initial layout, Dagre could be used, but might not be ideal for sociograms.
    // const { nodes: layoutedNodes, edges: layoutedEdges } = getDagreLayout(newNodes, newEdges, { direction: 'TB' });
    // return { nodes: layoutedNodes, edges: layoutedEdges };
    return { nodes: newNodes, edges: newEdges };

  }, [charactersData]);

  useEffect(() => {
    if (graphElements) {
      setNodes(graphElements.nodes);
      setEdges(graphElements.edges);
    }
  }, [graphElements, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedCharacter(node.data.properties); // data.properties contains the full char object
    setIsDetailPanelOpen(true);
  }, []);

  const closeDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedCharacter(null);
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Character Relationship Data...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{m:2}}>Error loading data: {error.message || 'An unknown error occurred.'}</Alert>;
  }

  if (!charactersData) {
    return <Alert severity="info" sx={{m:2}}>No character data available to display the sociogram.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 32px)', m: -2 /* Offset AppLayout padding */ }}>
      <PageHeader title="Dependency Choreographer - Character Interactions" />
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>
      <Drawer anchor="right" open={isDetailPanelOpen} onClose={closeDetailPanel}>
        <Box sx={{ width: 350, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:1}}>
            <Typography variant="h6">Character Details</Typography>
            <IconButton onClick={closeDetailPanel}><CloseIcon /></IconButton>
          </Box>
          <Divider sx={{mb:2}}/>
          {selectedCharacter && (
            <>
              <Typography variant="h5" gutterBottom>{selectedCharacter.name}</Typography>
              <Chip label={`Tier: ${selectedCharacter.tier || 'N/A'}`} size="small" sx={{mb:1}}
                color={selectedCharacter.tier === 'Core' ? 'success' : selectedCharacter.tier === 'Secondary' ? 'info' : 'default'}/>
              <Chip label={`Type: ${selectedCharacter.type || 'N/A'}`} size="small" sx={{mb:1, ml:1}}
                color={selectedCharacter.type === 'Player' ? 'primary' : 'secondary'} />

              <Typography variant="subtitle2" sx={{mt:2}}>Logline:</Typography>
              <Typography variant="body2" paragraph>{selectedCharacter.logline || 'N/A'}</Typography>

              <Typography variant="subtitle2" sx={{mt:1}}>Act Focus:</Typography>
              <Typography variant="body2" paragraph>{selectedCharacter.actFocus || 'N/A'}</Typography>

              <Typography variant="subtitle2" sx={{mt:1}}>Themes:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {(selectedCharacter.themes && selectedCharacter.themes.length > 0) ? selectedCharacter.themes.map(theme => (
                  <Chip key={theme} label={theme} size="small" variant="outlined" />
                )) : <Typography variant="caption">N/A</Typography>}
              </Box>

              <Typography variant="subtitle2" sx={{mt:1}}>Resolution Paths:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {(selectedCharacter.resolutionPaths && selectedCharacter.resolutionPaths.length > 0) ? selectedCharacter.resolutionPaths.map(path => (
                  <Chip key={path} label={path} size="small" color="secondary" variant="outlined" />
                )) : <Typography variant="caption">N/A</Typography>}
              </Box>

              <Typography variant="subtitle2" sx={{mt:1}}>Linked Characters:</Typography>
              {(selectedCharacter.linkedCharacters && selectedCharacter.linkedCharacters.length > 0) ? (
                <List dense disablePadding>
                  {selectedCharacter.linkedCharacters.map(lc => (
                    <ListItem key={lc.id} disablePadding>
                      <ListItemButton component={RouterLink} to={`/characters/${lc.id}`} onClick={closeDetailPanel}>
                        <ListItemText primary={lc.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="caption">N/A</Typography>}

              <Button component={RouterLink} to={`/characters/${selectedCharacter.id}`} sx={{mt:2}} variant="outlined" onClick={closeDetailPanel}>
                View Full Detail Page
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default CharacterSociogramPage;
