/**
 * AdaptiveGraphCanvas - Intelligent graph that responds to entity selection
 * 
 * Features:
 * - Focus mode: Shows only connected entities when one is selected
 * - Aggregation: Groups entities when exceeding 50-node limit
 * - Visual hierarchy: Selected → Connected → Secondary → Background
 * - Smooth transitions between states
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { Box } from '@mui/material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import logger from '../../utils/logger';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { 
  createForceSimulation, 
  runSimulation,
  calculateRadialLayout,
  applyLayoutPositions,
  applySimulationPositions,
  constrainNodesToViewport,
  getViewportBounds
} from '../../utils/layoutUtils';

// Utility to get connected entities based on selection
const getConnectedEntities = (selectedEntity, allNodes, characterConnections = []) => {
  const connected = new Set([selectedEntity.id]);
  const secondaryConnected = new Set();
  
  // Get the entity type from either entityCategory or type field
  const entityType = selectedEntity.entityCategory || selectedEntity.type;
  
  switch (entityType) {
    case 'character':
      // Get owned elements
      allNodes.forEach(node => {
        if (node.data.owner_character_id === selectedEntity.id) {
          connected.add(node.id);
          
          // Also get elements contained in owned elements
          allNodes.forEach(innerNode => {
            if (innerNode.data.container_element_id === node.id) {
              connected.add(innerNode.id);
            }
          });
        }
      });
      
      // Get connected characters (secondary connections)
      characterConnections.forEach(conn => {
        if (conn.source === selectedEntity.id) {
          secondaryConnected.add(conn.target);
        } else if (conn.target === selectedEntity.id) {
          secondaryConnected.add(conn.source);
        }
      });
      break;
      
    case 'element':
      // Add owner
      if (selectedEntity.owner_character_id) {
        connected.add(selectedEntity.owner_character_id);
      }
      
      // Add container
      if (selectedEntity.container_element_id) {
        connected.add(selectedEntity.container_element_id);
      }
      
      // Add contained elements
      allNodes.forEach(node => {
        if (node.data.container_element_id === selectedEntity.id) {
          connected.add(node.id);
        }
      });
      break;
      
    case 'puzzle':
      // Add reward elements
      if (selectedEntity.rewardIds) {
        selectedEntity.rewardIds.forEach(id => connected.add(id));
      }
      
      // Add required elements
      if (selectedEntity.requiredElements) {
        selectedEntity.requiredElements.forEach(id => connected.add(id));
      }
      break;
      
    case 'timeline_event':
      // Add revealing elements
      allNodes.forEach(node => {
        if (node.data.timeline_event_id === selectedEntity.id) {
          connected.add(node.id);
        }
      });
      break;
  }
  
  return { connected, secondaryConnected };
};

const AdaptiveGraphCanvas = ({ 
  graphData = { nodes: [], edges: [], metadata: {} },
  elements = [] // Keep for intelligence analysis
}) => {
  logger.debug('🔍 AdaptiveGraphCanvas: Rendering with', {
    nodesCount: graphData.nodes?.length || 0,
    edgesCount: graphData.edges?.length || 0,
    elementsCount: elements.length,
    nodeTypes: Object.keys(nodeTypes),
    edgeTypes: Object.keys(edgeTypes),
    sampleNodes: graphData.nodes?.slice(0, 3).map(n => ({
      id: n.id,
      type: n.type,
      position: n.position
    })),
    sampleEdges: graphData.edges?.slice(0, 3).map(e => ({
      id: e.id,
      type: e.type,
      style: e.style
    }))
  });
  
  // Debug: Log sample of node types
  if (graphData.nodes?.length > 0) {
    logger.debug('🔍 Sample node data:', graphData.nodes.slice(0, 5).map(n => ({
      id: n.id,
      type: n.data?.type,
      entityCategory: n.data?.entityCategory,
      label: n.data?.label || n.data?.name
    })));
  }
  
  const { 
    selectedEntity, 
    setSelectedEntity,
    focusMode,
    setFocusMode,
    updateNodeCount
  } = useJourneyIntelligenceStore();
  
  const [transitioning, setTransitioning] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Use nodes from graphData or handle empty state
  const allNodesData = useMemo(() => {
    // If we have pre-computed nodes from backend, use them
    if (graphData.nodes && graphData.nodes.length > 0) {
      // Normalize backend node format to our frontend expectations
      return graphData.nodes.map(node => {
        // Determine entity category WITHOUT overwriting the type field
        let entityCategory = 'unknown';
        
        // Check ID prefixes first
        if (node.id.startsWith('element-')) {
          entityCategory = 'element';
        } else if (node.id.startsWith('puzzle-')) {
          entityCategory = 'puzzle';
        } else if (node.id.startsWith('event-')) {
          entityCategory = 'timeline_event';
        } else if (node.data?.type) {
          // Check data type field to categorize
          const dataType = node.data.type;
          if (dataType === 'character') {
            entityCategory = 'character';
          } else if (dataType === 'element' || dataType === 'Memory Token' || dataType === 'Prop' || dataType === 'Document') {
            entityCategory = 'element';
          } else if (dataType === 'puzzle') {
            entityCategory = 'puzzle';
          } else if (dataType === 'timeline_event') {
            entityCategory = 'timeline_event';
          }
        }
        
        return {
          ...node,
          type: entityCategory, // Use custom node type based on entity category
          className: node.className || '', // Keep any existing className
          data: {
            ...node.data,
            // PRESERVE the original type field! Don't overwrite it
            entityCategory, // Add this for our logic without destroying type
            // Keep the original ID - don't modify it!
            // The node.id already has the correct value
          }
        };
      });
    }
    
    // In overview mode, nodes are already in graphData
    return graphData.nodes || [];
  }, [graphData.nodes]);

  // Use edges from graphData - they already have styles calculated
  const allEdgesData = useMemo(() => {
    // Edges come from JourneyIntelligenceView with styles already calculated
    return graphData.edges || [];
  }, [graphData.edges]);

  // Apply focus mode and visual hierarchy with aggregation
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const NODE_LIMIT = 50;
    const FOCUSED_NODE_LIMIT = 30; // Lower limit when an entity is selected
    
    // First apply visual hierarchy
    let processedNodes = allNodesData;
    let className = '';
    let style = {};
    let connected = new Set();
    let secondaryConnected = new Set();
    
    if (selectedEntity && focusMode !== 'overview') {
      // Get connected entities
      const characterConnections = graphData.metadata?.characterConnections || [];
      const entityConnections = getConnectedEntities(
        selectedEntity, 
        allNodesData, 
        characterConnections
      );
      connected = entityConnections.connected;
      secondaryConnected = entityConnections.secondaryConnected;
      
      // Apply visual hierarchy
      processedNodes = allNodesData.map(node => {
        let nodeClassName = '';
        let nodeStyle = {};
        
        if (node.id === selectedEntity.id) {
          nodeClassName = 'selected';
          nodeStyle.opacity = 1;
        } else if (connected.has(node.id)) {
          nodeClassName = 'connected';
          nodeStyle.opacity = 0.9;
        } else if (secondaryConnected.has(node.id)) {
          nodeClassName = 'secondary-connected';
          nodeStyle.opacity = 0.6;
        } else {
          nodeClassName = 'background';
          nodeStyle.opacity = 0.2;
        }
        
        return { 
          ...node, 
          className: `${node.className || ''} ${nodeClassName}`.trim(), 
          style: nodeStyle,
          data: {
            ...node.data,
            className: nodeClassName, // Pass visual hierarchy to custom nodes
            isSelected: node.id === selectedEntity.id,
            isConnected: connected.has(node.id),
            isSecondaryConnected: secondaryConnected.has(node.id),
            isBackground: nodeClassName === 'background'
          }
        };
      });
    } else {
      // Overview mode - preserve entity className
      processedNodes = allNodesData.map(node => ({
        ...node,
        className: node.className || '',
        style: {}
      }));
    }
    
    // Determine if we need aggregation
    const currentLimit = selectedEntity ? FOCUSED_NODE_LIMIT : NODE_LIMIT;
    // Check total element count for owner-based aggregation
    const totalElementCount = processedNodes.filter(n => n.data.entityCategory === 'element').length;
    const needsAggregation = processedNodes.length > currentLimit || 
      (selectedEntity && connected.size > 15) || // Aggregate if many connected nodes
      (selectedEntity && totalElementCount > 10); // Aggregate elements by owner when many exist
    
    if (!needsAggregation) {
      // No aggregation needed
      const relevantNodeIds = new Set([...connected, ...secondaryConnected]);
      const styledEdges = allEdgesData.map(edge => {
        const isRelevant = !selectedEntity || (relevantNodeIds.has(edge.source) && relevantNodeIds.has(edge.target));
        return {
          ...edge,
          className: isRelevant ? 'connected' : 'background',
          style: {
            ...edge.style,
            opacity: isRelevant ? 0.8 : 0.1
          }
        };
      });
      
      return { visibleNodes: processedNodes, visibleEdges: styledEdges };
    }
    
    // Aggregation needed - group nodes by type
    const nodesByType = {};
    
    // For elements, check if they have specific types (Memory Token, Prop, etc.)
    const elementNodes = processedNodes.filter(n => n.data.entityCategory === 'element');
    const hasSpecificTypes = elementNodes.some(n => n.data.type && !['element', 'character', 'puzzle', 'timeline_event'].includes(n.data.type));
    
    // Special case: when many elements without specific types and visual hierarchy matters, group by owner
    // Only group by owner when an entity is selected
    const shouldGroupByOwner = selectedEntity && elementNodes.length > 10 && !hasSpecificTypes;
    
    processedNodes.forEach(node => {
      const entityCategory = node.data.entityCategory;
      const specificType = node.data.type; // Preserved original type (e.g., "Memory Token")
      
      if (shouldGroupByOwner && entityCategory === 'element') {
        // Group elements by owner for visual hierarchy
        const ownerKey = node.data.owner_character_id || 'unowned';
        const groupKey = `elements-${ownerKey}`;
        if (!nodesByType[groupKey]) {
          nodesByType[groupKey] = [];
        }
        nodesByType[groupKey].push(node);
      } else if (entityCategory === 'element' && specificType && !['element', 'character', 'puzzle', 'timeline_event'].includes(specificType)) {
        // Group by specific element type (Memory Token, Prop, etc.)
        const elementType = specificType.toLowerCase().replace(/\s+/g, '-');
        const groupKey = `element-${elementType}`;
        if (!nodesByType[groupKey]) {
          nodesByType[groupKey] = [];
        }
        nodesByType[groupKey].push(node);
      } else if (entityCategory === 'element') {
        // Generic elements - group all together
        if (!nodesByType['element']) {
          nodesByType['element'] = [];
        }
        nodesByType['element'].push(node);
      } else {
        // For other entity types (character, puzzle, timeline_event), group by entity category
        if (!nodesByType[entityCategory]) {
          nodesByType[entityCategory] = [];
        }
        nodesByType[entityCategory].push(node);
      }
    });
    
    // Determine what to show individually vs aggregate
    const finalNodes = [];
    let currentNodeCount = 0;
    
    // Calculate how many aggregated nodes we might need
    // Be more conservative - show fewer individual nodes to ensure aggregation happens
    const typesWithNodes = Object.entries(nodesByType)
      .filter(([_, nodes]) => nodes.length > 0);
    const maxIndividualNodes = Math.max(10, NODE_LIMIT - typesWithNodes.length * 2); // Reserve space for aggregated nodes
    
    // Priority 1: Always show selected entity and secondary-connected characters
    if (selectedEntity) {
      const selectedNode = processedNodes.find(n => n.id === selectedEntity.id);
      if (selectedNode) {
        finalNodes.push(selectedNode);
        currentNodeCount++;
      }
      
      // Also show secondary-connected characters (not aggregated)
      if (selectedEntity.type === 'character' && secondaryConnected.size > 0) {
        const secondaryChars = processedNodes.filter(n => 
          n.data.entityCategory === 'character' && secondaryConnected.has(n.id)
        );
        finalNodes.push(...secondaryChars);
        currentNodeCount += secondaryChars.length;
      }
    }
    
    // Priority 2: Show connected entities if room
    if (selectedEntity && connected.size > 0 && !shouldGroupByOwner) {
      const connectedNodes = processedNodes.filter(n => connected.has(n.id) && n.id !== selectedEntity?.id);
      const availableSlots = maxIndividualNodes - currentNodeCount;
      
      // Check if connected nodes have specific element types
      const hasSpecificElementTypes = connectedNodes.some(n => 
        n.data.entityCategory === 'element' && n.data.type && !['element', 'character', 'puzzle', 'timeline_event'].includes(n.data.type)
      );
      
      // If we have many connected nodes with specific types, skip showing them individually
      // to force aggregation by type
      if (hasSpecificElementTypes && connectedNodes.length > 10) {
        // Skip individual connected nodes - they'll be aggregated
      } else if (connectedNodes.length <= availableSlots) {
        // Show all connected nodes
        finalNodes.push(...connectedNodes);
        currentNodeCount += connectedNodes.length;
      } else {
        // Too many connected nodes - show a sample from each type
        const connectedByType = {};
        connectedNodes.forEach(node => {
          let groupKey = node.data.entityCategory;
          
          // For elements with specific types, group by specific type
          if (node.data.entityCategory === 'element' && node.data.type && !['element', 'character', 'puzzle', 'timeline_event'].includes(node.data.type)) {
            const elementType = node.data.type.toLowerCase().replace(/\s+/g, '-');
            groupKey = `element-${elementType}`;
          }
          
          if (!connectedByType[groupKey]) {
            connectedByType[groupKey] = [];
          }
          connectedByType[groupKey].push(node);
        });
        
        // Distribute available slots across types
        const typesWithNodes = Object.keys(connectedByType);
        const slotsPerType = Math.floor(availableSlots / typesWithNodes.length);
        const extraSlots = availableSlots % typesWithNodes.length;
        
        // Show some nodes from each type
        typesWithNodes.forEach((type, index) => {
          const slots = Math.min(
            slotsPerType + (index < extraSlots ? 1 : 0),
            3 // Max 3 per type to ensure aggregation happens
          );
          const nodesToShow = connectedByType[type].slice(0, slots);
          finalNodes.push(...nodesToShow);
          currentNodeCount += nodesToShow.length;
        });
      }
    }
    
    // Priority 3: Show a sample of nodes from each type if not in focus mode
    // In focus mode with many connected nodes, skip samples to force aggregation
    // Also skip samples when we have owner-based grouping to ensure aggregation
    const shouldSkipSamples = (selectedEntity && connected.size > 10) || shouldGroupByOwner;
    
    if (!shouldSkipSamples) {
      const SAMPLE_SIZE_PER_TYPE = 5; // Show first 5 of each type
      
      const shownIds = new Set(finalNodes.map(n => n.id));
      
      // Check if we have element subtypes - if so, skip showing element samples to force aggregation
      const hasElementSubtypes = Object.keys(nodesByType).some(key => key.startsWith('element-'));
      
      // Always show sample nodes from each type if we have room
      Object.entries(nodesByType).forEach(([type, nodes]) => {
        // Skip element nodes if we have element subtypes (to force aggregation)
        if (hasElementSubtypes && (type === 'element' || type.startsWith('element-'))) {
          return;
        }
        
        // Skip if no nodes of this type
        if (nodes.length === 0) return;
        
        // Get nodes not already shown
        const availableNodes = nodes.filter(n => !shownIds.has(n.id));
        if (availableNodes.length === 0) return;
        
        // Calculate how many to show
        const samplesToShow = Math.min(
          SAMPLE_SIZE_PER_TYPE,
          availableNodes.length,
          Math.max(0, maxIndividualNodes - currentNodeCount)
        );
        
        if (samplesToShow > 0) {
          const sample = availableNodes.slice(0, samplesToShow);
          sample.forEach(node => {
            finalNodes.push(node);
            shownIds.add(node.id);
            currentNodeCount++;
          });
        }
      });
    }
    
    // Now create aggregated nodes for remaining entities
    Object.entries(nodesByType).forEach(([groupKey, nodes]) => {
      // Filter out nodes already shown
      const shownIds = new Set(finalNodes.map(n => n.id));
      let remainingNodes = nodes.filter(n => !shownIds.has(n.id));
      
      // In focus mode with owner-based grouping, only show groups related to selected/connected entities
      if (selectedEntity && shouldGroupByOwner && groupKey.startsWith('elements-')) {
        const ownerKey = groupKey.replace('elements-', '');
        // Only show element groups for selected or secondary-connected characters
        if (ownerKey !== 'unowned' && 
            ownerKey !== selectedEntity.id && 
            !secondaryConnected.has(ownerKey)) {
          return; // Skip this group entirely
        }
      }
      
      if (remainingNodes.length === 0) return;
      
      // Always create aggregated node if there are remaining nodes
      // This ensures we get the expected aggregation behavior
      if (remainingNodes.length > 0) {
        // Determine aggregated node ID and label based on group key
        let aggregateId;
        let label;
        let position;
        
        if (groupKey.startsWith('elements-')) {
          // Handle owner-based grouping
          const ownerKey = groupKey.replace('elements-', '');
          
          if (ownerKey === 'unowned') {
            aggregateId = 'aggregated-unowned-elements';
            label = `${remainingNodes.length} Unowned Elements`;
          } else {
            // Find character name for the owner from nodes data
            const ownerChar = allNodesData.find(n => n.id === ownerKey && n.data.entityCategory === 'character');
            const ownerName = ownerChar ? ownerChar.data.name.split(' ')[0].toLowerCase() : 'unknown';
            aggregateId = `aggregated-${ownerName}-elements`;
            label = `${remainingNodes.length} ${ownerChar ? ownerChar.data.name.split(' ')[0] : 'Unknown'}'s Elements`;
          }
          
          position = {
            x: ownerKey === 'unowned' ? 600 : 
               ownerKey === selectedEntity?.id ? 200 : 400,
            y: 300
          };
        } else if (groupKey.startsWith('element-')) {
          // Handle element subtypes
          const elementType = groupKey.replace('element-', '');
          
          // Handle pluralization properly
          let pluralType = elementType;
          if (elementType === 'memory-token') {
            pluralType = 'memory-tokens';
          } else if (elementType === 'prop') {
            pluralType = 'props';
          } else if (elementType === 'document') {
            pluralType = 'documents';
          } else {
            pluralType = `${elementType}s`;
          }
          
          aggregateId = `aggregated-${pluralType}`;
          
          // Convert kebab-case back to Title Case for label
          const typeLabel = elementType.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          label = `${remainingNodes.length} ${typeLabel}s`;
          
          // Position based on element subtype
          position = {
            x: elementType === 'memory-token' ? 250 : 
               elementType === 'prop' ? 450 : 650,
            y: 300
          };
        } else {
          // Handle regular types
          aggregateId = `aggregated-${groupKey}s`;
          label = `${remainingNodes.length} ${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}s`;
          position = {
            x: groupKey === 'character' ? 100 : 
               groupKey === 'puzzle' ? 500 : 700,
            y: 100
          };
        }
        
        // Check if this group is expanded
        const isExpanded = expandedGroups.has(aggregateId);
        
        if (isExpanded) {
          // Show individual nodes from this group (respecting node limit)
          const availableSlots = Math.max(0, currentLimit - currentNodeCount);
          const nodesToShow = Math.min(remainingNodes.length, availableSlots, 25); // Max 25 from expanded group
          
          if (nodesToShow < remainingNodes.length) {
            // Show partial expansion with sub-aggregation
            remainingNodes.slice(0, nodesToShow).forEach(node => {
              finalNodes.push(node);
              currentNodeCount++;
            });
            
            // Add a "remaining" aggregated node
            const remainingCount = remainingNodes.length - nodesToShow;
            
            // Create proper label based on group type
            let remainingLabel;
            if (groupKey === 'element-memory-token') {
              remainingLabel = `Showing ${nodesToShow} of ${remainingNodes.length} Memory Tokens`;
            } else if (groupKey === 'element-prop') {
              remainingLabel = `Showing ${nodesToShow} of ${remainingNodes.length} Props`;
            } else {
              const typeLabel = groupKey.includes('-') ? groupKey.split('-').pop() : groupKey;
              remainingLabel = `${remainingCount} more ${typeLabel}s`;
            }
            
            const remainingAggregatedNode = {
              id: `aggregated-remaining-${groupKey.replace('element-', '')}s`,
              type: 'aggregated',
              data: {
                label: remainingLabel,
                entityType: groupKey,
                count: remainingCount,
                isAggregated: true
              },
              position: { x: position.x + 100, y: position.y + 50 },
              className: 'aggregated',
              style: { opacity: 0.5 }
            };
            finalNodes.push(remainingAggregatedNode);
            currentNodeCount++;
          } else {
            // Show all nodes from the expanded group
            remainingNodes.forEach(node => {
              finalNodes.push(node);
              currentNodeCount++;
            });
          }
        } else {
          // Show aggregated node
          // Determine visual hierarchy for aggregated node
          let aggClassName = 'aggregated';
          let aggStyle = { opacity: 0.7 };
          
          // Check if any aggregated nodes are connected
          const hasConnected = remainingNodes.some(n => connected.has(n.id));
          const hasSecondaryConnected = remainingNodes.some(n => secondaryConnected.has(n.id));
          
          // Special case for owner-based grouping - check if owner is secondary-connected
          let isTertiary = false;
          if (groupKey.startsWith('elements-')) {
            const ownerKey = groupKey.replace('elements-', '');
            if (ownerKey !== 'unowned' && secondaryConnected.has(ownerKey)) {
              isTertiary = true;
            }
          }
          
          if (hasConnected) {
            aggClassName = 'aggregated connected';
            aggStyle.opacity = 0.9;
          } else if (isTertiary) {
            aggClassName = 'aggregated tertiary';
            aggStyle.opacity = 0.4;
          } else if (hasSecondaryConnected) {
            aggClassName = 'aggregated secondary-connected';
            aggStyle.opacity = 0.6;
          } else {
            aggClassName = 'aggregated background';
            aggStyle.opacity = 0.2;
          }
          
          const aggregatedNode = {
            id: aggregateId,
            type: 'aggregated',
            data: {
              label,
              entityType: groupKey,
              count: remainingNodes.length,
              isAggregated: true
            },
            position,
            className: aggClassName,
            style: aggStyle
          };
          
          finalNodes.push(aggregatedNode);
          currentNodeCount++;
        }
      }
    });
    
    // Filter edges - only show edges between visible nodes
    const visibleNodeIds = new Set(finalNodes.map(n => n.id));
    const filteredEdges = allEdgesData
      .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map(edge => {
        const isRelevant = !selectedEntity || (connected.has(edge.source) && connected.has(edge.target));
        
        // Just adjust opacity based on relevance, preserve all other styling
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: isRelevant ? (edge.style?.opacity || 0.8) : 0.1
          }
        };
      });
    
    return { visibleNodes: finalNodes, visibleEdges: filteredEdges };
  }, [selectedEntity, focusMode, allNodesData, allEdgesData, expandedGroups]);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);
  const { getViewport } = useReactFlow();
  
  // Force simulation reference
  const simulationRef = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);

  // Update nodes and edges when they change
  useEffect(() => {
    // Only update if actually different to prevent infinite loops
    setNodes(prev => {
      // Check if nodes have actually changed
      const hasChanged = prev.length !== visibleNodes.length || 
        prev.some((node, i) => 
          node.id !== visibleNodes[i]?.id || 
          node.className !== visibleNodes[i]?.className ||
          node.style?.opacity !== visibleNodes[i]?.style?.opacity
        );
      
      return hasChanged ? visibleNodes : prev;
    });
    
    setEdges(prev => {
      // Check if edges have actually changed
      const hasChanged = prev.length !== visibleEdges.length ||
        prev.some((edge, i) => 
          edge.id !== visibleEdges[i]?.id ||
          edge.className !== visibleEdges[i]?.className ||
          edge.style?.opacity !== visibleEdges[i]?.style?.opacity
        );
        
      return hasChanged ? visibleEdges : prev;
    });
  }, [visibleNodes, visibleEdges, setNodes, setEdges]);
  
  // Update node count in a separate effect to prevent loops
  useEffect(() => {
    const currentCount = useJourneyIntelligenceStore.getState().visibleNodeCount;
    if (currentCount !== visibleNodes.length) {
      updateNodeCount(visibleNodes.length);
    }
  }, [visibleNodes.length, updateNodeCount]);
  
  // Apply layout based on mode
  useEffect(() => {
    // Skip if no nodes
    if (!nodes || nodes.length === 0) return;
    
    // Stop any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    
    if (selectedEntity && focusMode !== 'overview') {
      // RADIAL LAYOUT for character focus
      const centerNode = nodes.find(n => n.id === selectedEntity.id);
      if (!centerNode) return;
      
      const positions = calculateRadialLayout(
        centerNode,
        nodes,
        edges,
        {
          width: window.innerWidth * 0.7, // Account for intelligence panel
          height: window.innerHeight - 100,
          ringSpacing: 150,
          startAngle: -Math.PI / 2
        }
      );
      
      // Apply radial positions
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const newPos = positions[node.id];
          if (newPos) {
            return {
              ...node,
              position: newPos
            };
          }
          return node;
        })
      );
    } else {
      // FORCE LAYOUT for overview mode
      // Use our new separated data architecture
      const { simulation, simulationNodes, nodeMap } = createForceSimulation(
        nodes,
        edges,
        {
          width: window.innerWidth,
          height: window.innerHeight - 100,
          nodeRepulsion: -800, // Much stronger for proper spacing
          linkDistance: 120, // Larger for 80px nodes
          centerForce: 0.05,
          collisionRadius: 40,
          alphaDecay: 0.02
        }
      );
      
      // Store simulation reference
      simulationRef.current = simulation;
      
      let frameCount = 0;
      const maxFrames = 300; // More iterations for better layout
      
      // Run simulation and update positions
      simulation.on('tick', () => {
        frameCount++;
        
        // Update every few frames to reduce re-renders
        if (frameCount % 5 === 0 || simulation.alpha() < 0.01) {
          setNodes(currentNodes => {
            // Use our immutable update helper
            const updatedNodes = applySimulationPositions(currentNodes, simulationNodes);
            
            // Only return new array if positions actually changed
            const hasChanges = updatedNodes.some((node, i) => 
              node.position.x !== currentNodes[i].position.x || 
              node.position.y !== currentNodes[i].position.y
            );
            
            return hasChanges ? updatedNodes : currentNodes;
          });
        }
        
        // Stop after max iterations or when settled
        if (frameCount >= maxFrames || simulation.alpha() < 0.001) {
          simulation.stop();
          simulationRef.current = null;
        }
      });
    }
    
    // Cleanup simulation on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [visibleNodes.length, edges.length, selectedEntity?.id, focusMode]); // Re-run when significant changes occur
  
  // Set layout ready after initial render
  useEffect(() => {
    setLayoutReady(true);
  }, []);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    logger.info('Node clicked:', { nodeId: node.id, nodeType: node.data.type });
    
    // Check if it's an aggregated node
    if (node.data.isAggregated) {
      // Toggle expanded state for this group
      setExpandedGroups(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
      return;
    }
    
    // Regular node click
    setTransitioning(true);
    setFocusMode('focused');
    
    // Create a clean entity object without graph-specific fields
    const entityData = {
      ...node.data,
      // Restore the original ID (node.id is the original, node.data.id might be modified)
      id: node.id,
      // Preserve entityCategory from node.data or use node.type as fallback
      entityCategory: node.data.entityCategory || node.type,
      // Remove graph-specific fields that were added during processing
      className: undefined,
      isSelected: undefined,
      isConnected: undefined,
      isSecondaryConnected: undefined,
      isBackground: undefined,
      size: undefined
    };
    
    // Remove undefined fields
    Object.keys(entityData).forEach(key => {
      if (entityData[key] === undefined) {
        delete entityData[key];
      }
    });
    
    setSelectedEntity(entityData);
    
    // Remove transition class after animation
    setTimeout(() => setTransitioning(false), 500);
  }, [setSelectedEntity, setFocusMode]);

  // Handle background click to return to overview
  const onPaneClick = useCallback(() => {
    logger.info('Background clicked, returning to overview');
    
    setTransitioning(true);
    setFocusMode('overview');
    setSelectedEntity(null);
    
    setTimeout(() => setTransitioning(false), 500);
  }, [setSelectedEntity, setFocusMode]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          className={`
            adaptive-graph-canvas
            ${transitioning ? 'transitioning' : ''}
            ${focusMode === 'focused' ? 'focus-mode' : ''}
          `}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      
      <style>{`
        /* Transition animations */
        .adaptive-graph-canvas.transitioning .react-flow__node {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .adaptive-graph-canvas.transitioning .react-flow__edge {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Aggregated nodes - dark theme */
        .react-flow__node.aggregated {
          background-color: #2a2a2a;
          color: #ffffff;
          border: 2px dashed #64748b;
          border-radius: 4px;
          cursor: pointer;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .react-flow__node.aggregated:hover {
          background-color: #333333;
          border-color: #94a3b8;
        }
        
        .react-flow__node.aggregated.connected {
          background-color: #1e3a5f;
          border-color: #3b82f6;
          z-index: 5;
        }
        
        .react-flow__node.aggregated.secondary-connected {
          background-color: #2e1f4f;
          border-color: #6366f1;
          z-index: 3;
        }
        
        .react-flow__node.aggregated.tertiary {
          background-color: #1f1f1f;
          border-color: #4b5563;
          z-index: 2;
        }
        
        /* Custom edge component handles all edge styling */
      `}</style>
    </Box>
  );
};

export default AdaptiveGraphCanvas;