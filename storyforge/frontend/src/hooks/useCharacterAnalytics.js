import { useMemo } from 'react';
import { getConstant } from './useGameConstants';

const useCharacterAnalytics = (characters, pathFilter, gameConstants) => {
  return useMemo(() => {
    if (!characters) return {
      totalCharacters: 0,
      pathDistribution: {
        'Black Market': 0,
        'Detective': 0,
        'Third Path': 0,
        'Unassigned': 0
      },
      tierDistribution: {
        'Core': 0,
        'Secondary': 0,
        'Tertiary': 0
      },
      productionReadiness: { ready: 0, needsWork: 0 },
      memoryEconomy: { totalTokens: 0, avgPerCharacter: 0 },
      socialNetwork: { connected: 0, isolated: 0 },
      issues: []
    };

    // Filter characters based on path filter
    let filteredCharacters = characters;
    if (pathFilter !== 'All Paths') {
      if (pathFilter === 'Unassigned') {
        filteredCharacters = characters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0);
      } else {
        filteredCharacters = characters.filter(char => char.resolutionPaths && char.resolutionPaths.includes(pathFilter));
      }
    }

    const totalCharacters = filteredCharacters.length;

    // Path distribution analysis
    const knownPaths = getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
    const unassignedPath = getConstant(gameConstants, 'RESOLUTION_PATHS.DEFAULT', 'Unassigned');
    
    const pathDistribution = {};
    knownPaths.forEach(path => {
      pathDistribution[path] = filteredCharacters.filter(char => char.resolutionPaths?.includes(path)).length;
    });
    pathDistribution[unassignedPath] = filteredCharacters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0).length;

    // Tier distribution
    const characterTiers = getConstant(gameConstants, 'CHARACTERS.TIERS', ['Core', 'Secondary', 'Tertiary']);
    const tierDistribution = {};
    characterTiers.forEach(tier => {
      tierDistribution[tier] = filteredCharacters.filter(char => char.tier === tier).length;
    });

    // Production readiness (characters with proper path assignments and connections)
    const ready = filteredCharacters.filter(char => 
      char.resolutionPaths && char.resolutionPaths.length > 0 && 
      char.character_links && char.character_links.length > 0
    ).length;
    const needsWork = totalCharacters - ready;

    // Memory economy analysis
    const totalMemoryTokens = filteredCharacters.reduce((sum, char) => {
      const memoryTokens = char.ownedElements?.filter(el => 
        el.properties?.basicType?.toLowerCase().includes('memory') ||
        el.properties?.basicType?.toLowerCase().includes('token') ||
        el.properties?.basicType?.toLowerCase().includes('rfid')
      ) || [];
      return sum + memoryTokens.length;
    }, 0);
    const avgPerCharacter = totalCharacters > 0 ? (totalMemoryTokens / totalCharacters).toFixed(1) : 0;

    // Social network analysis
    const connected = filteredCharacters.filter(char => char.character_links && char.character_links.length > 0).length;
    const isolated = totalCharacters - connected;

    // Identify production issues
    const issues = [];
    const unassignedWarningThreshold = getConstant(gameConstants, 'CHARACTERS.UNASSIGNED_WARNING_THRESHOLD', 0.2);
    const isolatedWarningThreshold = getConstant(gameConstants, 'CHARACTERS.ISOLATED_WARNING_THRESHOLD', 0.15);
    const pathImbalanceThreshold = getConstant(gameConstants, 'CHARACTERS.PATH_IMBALANCE_THRESHOLD', 0.4);
    const memoryWarningThreshold = getConstant(gameConstants, 'ELEMENTS.MEMORY_TOKEN_WARNING_THRESHOLD', 45);
    const targetTokenCount = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);

    if (pathDistribution[unassignedPath] > totalCharacters * unassignedWarningThreshold) {
      issues.push({
        type: 'path-assignment',
        severity: 'warning',
        message: `${pathDistribution[unassignedPath]} characters need resolution path assignment`,
        action: 'Assign characters to narrative paths'
      });
    }

    if (isolated > totalCharacters * isolatedWarningThreshold) {
      issues.push({
        type: 'social-isolation',
        severity: 'warning', 
        message: `${isolated} characters have no social connections`,
        action: 'Add character relationships and interactions'
      });
    }

    const maxPath = Math.max(...Object.values(pathDistribution));
    const minPath = Math.min(...Object.values(pathDistribution));
    if (maxPath - minPath > totalCharacters * pathImbalanceThreshold) {
      issues.push({
        type: 'path-imbalance',
        severity: 'info',
        message: 'Uneven distribution across resolution paths',
        action: 'Redistribute characters for better balance'
      });
    }

    if (totalMemoryTokens < memoryWarningThreshold) {
      issues.push({
        type: 'memory-economy',
        severity: 'info',
        message: `Memory token count below target (${targetTokenCount} tokens)`,
        action: 'Add more memory tokens to character inventories'
      });
    }

    return {
      totalCharacters,
      pathDistribution,
      tierDistribution,
      productionReadiness: { ready, needsWork },
      memoryEconomy: { totalTokens: totalMemoryTokens, avgPerCharacter },
      socialNetwork: { connected, isolated },
      issues
    };
  }, [characters, pathFilter, gameConstants]);
};

export default useCharacterAnalytics;