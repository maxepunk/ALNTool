/**
 * Test utilities for intelligence layer testing
 * Provides mock entities, intelligence data, and test helpers
 */

/**
 * Creates mock entities for testing
 * @param {string} type - Entity type (character, element, puzzle, timeline)
 * @param {Object} overrides - Custom properties to override defaults
 */
export const createMockEntity = (type, overrides = {}) => {
  const defaults = {
    character: {
      id: 'char-sarah-mitchell',
      name: 'Sarah Mitchell',
      type: 'character',
      tier: 'Core',
      characterType: 'Player',
      logline: 'Victim\'s best friend seeking truth'
    },
    element: {
      id: 'elem-voice-memo',
      name: 'Victoria\'s Voice Memo',
      type: 'element',
      memoryType: 'Memory Token Audio',
      value: 5000,
      timeline_event_id: 'timeline-victoria-affair'
    },
    puzzle: {
      id: 'puzzle-jewelry-box',
      name: 'Sarah\'s Jewelry Box',
      type: 'puzzle',
      required_elements: ['elem-business-card', 'elem-combination'],
      reward_ids: ['elem-voice-memo', 'elem-paternity-test']
    },
    timeline: {
      id: 'timeline-victoria-affair',
      name: 'Marcus and Victoria\'s Affair',
      type: 'timeline',
      act_focus: 'Act 1',
      date: '2024-01-15',
      description: 'Secret relationship revealed'
    }
  };
  
  return { ...defaults[type], ...overrides };
};

/**
 * Creates mock intelligence data for an entity
 * @param {Object} entity - The entity to create intelligence for
 * @param {Array} layers - Which intelligence layers to include
 */
export const createMockIntelligence = (entity, layers = ['story', 'social']) => {
  const intelligenceTypes = {
    story: {
      narrativeImportance: 'High',
      storyConnections: 3,
      missingConnections: 1,
      revealingElements: entity.type === 'timeline' ? ['elem-voice-memo'] : [],
      timelineEvents: entity.type === 'character' ? 2 : 0,
      completionPercentage: 75
    },
    social: {
      collaborationCount: entity.type === 'character' ? 8 : 0,
      requiredCollaborators: entity.type === 'puzzle' ? ['Alex', 'Derek'] : [],
      socialLoad: entity.type === 'character' ? 'High' : 'N/A',
      averageLoad: 5,
      dependencies: []
    },
    economic: {
      tokenValue: entity.type === 'element' ? entity.value || 1000 : 0,
      pathImpact: 'Balanced',
      setBonus: entity.type === 'element' ? 'Victoria Memories' : null,
      totalPathValue: {
        detective: 45000,
        blackMarket: 48000,
        return: 'Character XP'
      }
    },
    production: {
      propsRequired: ['Physical prop needed'],
      rfidStatus: entity.type === 'element' ? 'Created' : 'N/A',
      criticalDependencies: [],
      productionReady: true
    },
    gaps: {
      contentGaps: ['Missing Act 2 resolution'],
      integrationOpportunities: ['Could connect to Derek storyline'],
      suggestedElements: ['Hotel keycard', 'Restaurant receipt'],
      priority: 'Medium'
    }
  };
  
  const intelligence = {};
  layers.forEach(layer => {
    if (intelligenceTypes[layer]) {
      intelligence[layer] = intelligenceTypes[layer];
    }
  });
  
  return intelligence;
};

/**
 * Creates a mock graph structure for testing
 * @param {number} nodeCount - Number of nodes to create
 * @param {string} focusType - Type of nodes to focus on
 */
export const createMockGraph = (nodeCount = 10, focusType = 'mixed') => {
  const nodes = [];
  const edges = [];
  
  // Create nodes based on type distribution
  const typeDistribution = {
    mixed: { character: 0.4, element: 0.3, puzzle: 0.2, timeline: 0.1 },
    character: { character: 0.7, element: 0.2, puzzle: 0.1, timeline: 0 },
    element: { character: 0.2, element: 0.6, puzzle: 0.1, timeline: 0.1 }
  };
  
  const distribution = typeDistribution[focusType] || typeDistribution.mixed;
  
  Object.entries(distribution).forEach(([type, ratio]) => {
    const count = Math.floor(nodeCount * ratio);
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `${type}-${i}`,
        type: 'custom',
        data: createMockEntity(type, { id: `${type}-${i}` }),
        position: { x: Math.random() * 800, y: Math.random() * 600 }
      });
    }
  });
  
  // Create edges between nodes
  for (let i = 0; i < Math.floor(nodeCount * 0.8); i++) {
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    const target = nodes[Math.floor(Math.random() * nodes.length)];
    if (source.id !== target.id) {
      edges.push({
        id: `edge-${i}`,
        source: source.id,
        target: target.id,
        type: 'custom'
      });
    }
  }
  
  return { nodes, edges };
};

/**
 * Mock performance metrics for testing
 */
export const mockPerformanceMetrics = {
  good: {
    renderTime: 45,
    nodeCount: 35,
    fps: 60,
    transitionTime: 250
  },
  warning: {
    renderTime: 180,
    nodeCount: 48,
    fps: 45,
    transitionTime: 450
  },
  poor: {
    renderTime: 350,
    nodeCount: 65,
    fps: 25,
    transitionTime: 800
  }
};

/**
 * Helper to simulate entity selection
 * @param {Object} store - The Zustand store
 * @param {Object} entity - Entity to select
 */
export const simulateEntitySelection = (store, entity) => {
  store.getState().selectEntity(entity);
  // Simulate the view transition
  return new Promise(resolve => setTimeout(resolve, 300));
};

/**
 * Helper to verify intelligence layer state
 * @param {Object} store - The Zustand store
 * @param {Array} expectedLayers - Expected active layers
 */
export const verifyIntelligenceLayers = (store, expectedLayers) => {
  const activeLayers = store.getState().activeIntelligence;
  return expectedLayers.every(layer => activeLayers.includes(layer));
};

/**
 * Mock intelligence calculation for testing
 * @param {Object} entity - Entity to calculate intelligence for
 * @param {Array} layers - Active intelligence layers
 */
export const calculateMockIntelligence = async (entity, layers) => {
  // Simulate async calculation
  await new Promise(resolve => setTimeout(resolve, 50));
  
  return {
    entityId: entity.id,
    timestamp: Date.now(),
    layers: createMockIntelligence(entity, layers),
    performance: {
      calculationTime: 45,
      dataSources: layers.length * 2
    }
  };
};