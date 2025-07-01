import { getConstant } from '../hooks/useGameConstants';

/**
 * Calculates comprehensive path analysis for production intelligence
 * @param {Array} characters - Character data
 * @param {Array} elements - Element data
 * @param {Array} puzzles - Puzzle data
 * @param {Array} timelineEvents - Timeline event data
 * @param {Object} gameConstants - Game configuration constants
 * @returns {Object} Analysis results with path distribution, resources, dependencies, metrics, and recommendations
 */
export function calculatePathAnalysis(characters, elements, puzzles, timelineEvents, gameConstants) {
  if (!characters || !elements || !puzzles || !timelineEvents || !gameConstants) {
    return {
      pathDistribution: {},
      pathResources: {},
      crossPathDependencies: [],
      balanceMetrics: {},
      recommendations: []
    };
  }

  // Get constants from game config
  const knownPaths = getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
  const unassignedPath = getConstant(gameConstants, 'RESOLUTION_PATHS.DEFAULT', 'Unassigned');
  const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
  const baseValues = getConstant(gameConstants, 'MEMORY_VALUE.BASE_VALUES', {});
  const typeMultipliers = getConstant(gameConstants, 'MEMORY_VALUE.TYPE_MULTIPLIERS', {});

  // Character path distribution
  const charactersWithPaths = characters.filter(char => 
    char.resolutionPaths && char.resolutionPaths.length > 0
  );
  
  const pathDistribution = {};
  knownPaths.forEach(path => {
    pathDistribution[path] = charactersWithPaths.filter(char => char.resolutionPaths.includes(path));
  });
  pathDistribution[unassignedPath] = characters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0);

  // Resource allocation per path (elements, puzzles, timeline events)
  const pathResources = {};
  knownPaths.forEach(path => {
    const pathElements = elements.filter(el => 
      el.resolutionPaths && el.resolutionPaths.includes(path)
    );
    const pathPuzzles = puzzles.filter(puzzle => 
      puzzle.resolutionPaths && puzzle.resolutionPaths.includes(path)
    );
    const pathEvents = timelineEvents.filter(event => 
      event.resolutionPaths && event.resolutionPaths.includes(path)
    );

    // Calculate memory token allocation
    const memoryTokens = pathElements.filter(el => 
      el.properties?.basicType?.toLowerCase().includes('memory') ||
      el.properties?.basicType?.toLowerCase().includes('token') ||
      el.properties?.basicType?.toLowerCase().includes('rfid')
    );

    const totalValue = pathElements.reduce((sum, el) => {
      const valueRating = el.properties?.sf_value_rating || 0;
      const memoryType = el.properties?.sf_memory_type || 'Personal';
      const baseValue = baseValues[valueRating] || 0;
      const multiplier = typeMultipliers[memoryType] || 1;
      return sum + (baseValue * multiplier);
    }, 0);

    pathResources[path] = {
      characters: pathDistribution[path]?.length || 0,
      elements: pathElements.length,
      puzzles: pathPuzzles.length,
      timelineEvents: pathEvents.length,
      memoryTokens: memoryTokens.length,
      totalValue,
      readyElements: pathElements.filter(el => 
        el.properties?.status === 'Ready' || el.properties?.status === 'Complete'
      ).length,
      elementList: pathElements,
      puzzleList: pathPuzzles,
      characterList: pathDistribution[path] || []
    };
  });

  // Cross-path dependencies analysis
  const crossPathDependencies = [];
  
  // Find shared puzzles
  puzzles.forEach(puzzle => {
    if (puzzle.resolutionPaths && puzzle.resolutionPaths.length > 1) {
      crossPathDependencies.push({
        type: 'Shared Puzzle',
        name: puzzle.name,
        paths: puzzle.resolutionPaths,
        impact: 'high',
        description: 'Puzzle accessible from multiple paths'
      });
    }
  });

  // Find character interactions across paths
  characters.forEach(char => {
    if (char.resolutionPaths && char.resolutionPaths.length > 1) {
      crossPathDependencies.push({
        type: 'Cross-Path Character',
        name: char.name,
        paths: char.resolutionPaths,
        impact: 'medium',
        description: 'Character participates in multiple resolution paths'
      });
    }
  });

  // Balance metrics calculation
  const totalCharacters = Object.values(pathDistribution).reduce((sum, chars) => sum + (chars?.length || 0), 0);
  const pathCounts = knownPaths.map(path => pathResources[path].characters);
  const maxCount = Math.max(...pathCounts);
  const minCount = Math.min(...pathCounts);
  const balanceScore = totalCharacters > 0 ? Math.max(0, 100 - ((maxCount - minCount) / totalCharacters * 100)) : 0;

  const balanceMetrics = {
    characterBalance: balanceScore,
    resourceBalance: knownPaths.reduce((acc, path) => {
      acc[path] = {
        completion: pathResources[path].elements > 0 ? 
          (pathResources[path].readyElements / pathResources[path].elements * 100) : 0,
        memoryDensity: pathResources[path].characters > 0 ? 
          (pathResources[path].memoryTokens / pathResources[path].characters) : 0
      };
      return acc;
    }, {}),
    crossPathComplexity: crossPathDependencies.length
  };

  // Generate recommendations using configurable thresholds
  const recommendations = [];
  
  // Use balance threshold from game constants or default
  const balanceThreshold = getConstant(gameConstants, 'MEMORY_VALUE.BALANCE_WARNING_THRESHOLD', 0.3) * 100; // Convert to percentage
  const balanceScore70 = 70; // Could be configured in game constants in future
  
  if (balanceScore < balanceScore70) {
    recommendations.push({
      type: 'character-balance',
      severity: 'warning',
      message: 'Character distribution is unbalanced across paths',
      action: 'Redistribute characters to achieve better path balance'
    });
  }

  const unassignedThreshold = getConstant(gameConstants, 'MEMORY_VALUE.BALANCE_WARNING_THRESHOLD', 0.3);
  if (pathDistribution[unassignedPath].length > totalCharacters * unassignedThreshold) {
    recommendations.push({
      type: 'unassigned-characters',
      severity: 'info',
      message: `${pathDistribution[unassignedPath].length} characters not assigned to resolution paths`,
      action: 'Assign characters to appropriate resolution paths'
    });
  }

  knownPaths.forEach(path => {
    const metrics = balanceMetrics.resourceBalance[path];
    const completionThreshold = 50; // Could be configured in game constants
    const memoryDensityThreshold = 2; // Could be configured in game constants
    
    if (metrics.completion < completionThreshold) {
      recommendations.push({
        type: 'production-readiness',
        severity: 'warning',
        message: `${path} path only ${Math.round(metrics.completion)}% production ready`,
        action: `Prioritize completion of ${path} path elements`
      });
    }
    
    if (metrics.memoryDensity < memoryDensityThreshold) {
      recommendations.push({
        type: 'memory-economy',
        severity: 'info',
        message: `${path} path has low memory token density (${metrics.memoryDensity.toFixed(1)} per character)`,
        action: `Consider adding more memory tokens to ${path} path`
      });
    }
  });

  const complexityThreshold = 8; // Could be configured in game constants
  if (crossPathDependencies.length > complexityThreshold) {
    recommendations.push({
      type: 'complexity',
      severity: 'warning',
      message: 'High cross-path complexity may cause production challenges',
      action: 'Review shared elements and consider simplifying dependencies'
    });
  }

  return {
    pathDistribution,
    pathResources,
    crossPathDependencies,
    balanceMetrics,
    recommendations
  };
}