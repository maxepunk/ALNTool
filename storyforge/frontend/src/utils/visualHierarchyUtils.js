/**
 * Visual hierarchy utilities for graph rendering
 * Manages opacity, scale, and other visual properties based on selection state
 */

// Utility to get connected entities based on selection
export const getConnectedEntities = (selectedEntity, allNodes, characterConnections = []) => {
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

// Calculate visual properties based on selection and connections
export const calculateVisualProperties = (node, selectedEntity, connected, secondaryConnected) => {
  if (!selectedEntity) {
    // Overview mode - all nodes fully visible
    return {
      opacity: 1,
      scale: 1,
      blur: 0,
      zIndex: 1,
      className: '',
      isSelected: false,
      isConnected: false,
      isSecondaryConnected: false,
      isBackground: false
    };
  }
  
  // Focus mode - apply visual hierarchy
  if (node.id === selectedEntity.id) {
    return {
      opacity: 1,
      scale: 1.2,
      blur: 0,
      zIndex: 10,
      className: 'selected',
      isSelected: true,
      isConnected: false,
      isSecondaryConnected: false,
      isBackground: false
    };
  } else if (connected.has(node.id)) {
    return {
      opacity: 0.9,
      scale: 1,
      blur: 0,
      zIndex: 5,
      className: 'connected',
      isSelected: false,
      isConnected: true,
      isSecondaryConnected: false,
      isBackground: false
    };
  } else if (secondaryConnected.has(node.id)) {
    return {
      opacity: 0.7,
      scale: 0.9,
      blur: 0,
      zIndex: 3,
      className: 'secondary-connected',
      isSelected: false,
      isConnected: false,
      isSecondaryConnected: true,
      isBackground: false
    };
  } else {
    // Background entities
    return {
      opacity: 0.3,
      scale: 0.8,
      blur: 2,
      zIndex: 1,
      className: 'background',
      isSelected: false,
      isConnected: false,
      isSecondaryConnected: false,
      isBackground: true
    };
  }
};

// Process edges with visual hierarchy
export const calculateEdgeVisualProperties = (edge, relevantNodes, selectedEntityId) => {
  const isRelevant = relevantNodes.has(edge.source) && relevantNodes.has(edge.target);
  const isFocused = (edge.source === selectedEntityId || edge.target === selectedEntityId);
  
  return {
    opacity: isFocused ? 1 : (isRelevant ? 0.6 : 0.1),
    strokeWidth: isFocused ? 3 : 2,
    isRelevant,
    isFocused
  };
};