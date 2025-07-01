import { useMemo } from 'react';
import { getConstant } from './useGameConstants';

const useMemoryEconomyAnalysis = (memoryElementsData, charactersData, puzzlesData, gameConstants) => {
  return useMemo(() => {
    if (!memoryElementsData || !charactersData || !puzzlesData || !gameConstants) return {
      processedMemoryData: [],
      economyStats: { totalTokens: 0, completedTokens: 0, totalValue: 0 },
      pathDistribution: { 'Black Market': 0, 'Detective': 0, 'Third Path': 0, 'Unassigned': 0 },
      productionStatus: { toDesign: 0, toBuild: 0, ready: 0 },
      balanceAnalysis: { issues: [], recommendations: [] }
    };

    const processedMemoryData = memoryElementsData.map(element => {
      const properties = element.properties || {};
      const valueRating = properties.sf_value_rating;
      const memoryType = properties.sf_memory_type;

      // Use backend-calculated values instead of recalculating
      const baseValueAmount = element.baseValueAmount || 0;
      const typeMultiplierValue = element.typeMultiplierValue || 1;
      const finalCalculatedValue = element.finalCalculatedValue || 0;

      // Enhanced discovery analysis
      let discoveredVia = 'Direct Discovery';
      let resolutionPath = 'Unassigned';
      
      if (element.rewardedByPuzzle && element.rewardedByPuzzle.length > 0) {
        discoveredVia = `Puzzle: ${element.rewardedByPuzzle[0].name || element.rewardedByPuzzle[0].puzzle}`;
        // Try to infer resolution path from puzzle themes or related characters
        const puzzle = puzzlesData.find(p => p.id === element.rewardedByPuzzle[0].id);
        if (puzzle?.resolutionPaths && puzzle.resolutionPaths.length > 0) {
          resolutionPath = puzzle.resolutionPaths[0];
        }
      } else if (element.timelineEvent && element.timelineEvent.length > 0) {
        discoveredVia = `Event: ${element.timelineEvent[0].name || element.timelineEvent[0].description}`;
      }

      // Production status analysis
      const status = properties.status || 'Unknown';
      const productionStage = status === 'To Design' ? 'design' :
                             status === 'To Build' ? 'build' :
                             status === 'Ready' || status === 'Complete' ? 'ready' : 'unknown';

      return {
        ...element,
        id: element.id,
        name: element.name,
        parsed_sf_rfid: properties.parsed_sf_rfid,
        sf_value_rating: valueRating,
        baseValueAmount,
        sf_memory_type: memoryType,
        typeMultiplierValue,
        finalCalculatedValue,
        discoveredVia,
        resolutionPath,
        productionStage,
        status
      };
    });

    // Calculate economy statistics
    const totalTokens = processedMemoryData.length;
    const completedTokens = processedMemoryData.filter(token => 
      token.status === 'Ready' || token.status === 'Complete'
    ).length;
    const totalValue = processedMemoryData.reduce((sum, token) => sum + token.finalCalculatedValue, 0);

    // Path distribution analysis
    const pathDistribution = processedMemoryData.reduce((acc, token) => {
      acc[token.resolutionPath] = (acc[token.resolutionPath] || 0) + 1;
      return acc;
    }, { 'Black Market': 0, 'Detective': 0, 'Third Path': 0, 'Unassigned': 0 });

    // Production status tracking
    const productionStatus = processedMemoryData.reduce((acc, token) => {
      if (token.productionStage === 'design') acc.toDesign++;
      else if (token.productionStage === 'build') acc.toBuild++;
      else if (token.productionStage === 'ready') acc.ready++;
      return acc;
    }, { toDesign: 0, toBuild: 0, ready: 0 });

    // Balance analysis using game constants
    const issues = [];
    const recommendations = [];
    
    const targetTokens = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);
    const minTokens = getConstant(gameConstants, 'MEMORY_VALUE.MIN_TOKEN_COUNT', 50);
    const maxTokens = getConstant(gameConstants, 'MEMORY_VALUE.MAX_TOKEN_COUNT', 60);
    const balanceThreshold = getConstant(gameConstants, 'MEMORY_VALUE.BALANCE_WARNING_THRESHOLD', 0.3);
    
    if (totalTokens < minTokens) {
      issues.push(`Token count below target (${targetTokens} tokens)`);
      recommendations.push('Add more memory tokens to reach economy target');
    } else if (totalTokens > maxTokens) {
      issues.push('Token count above target - may overwhelm players');
      recommendations.push('Consider reducing token count or increasing variety');
    }
    
    if (pathDistribution['Unassigned'] > totalTokens * balanceThreshold) {
      issues.push('Too many unassigned tokens');
      recommendations.push('Assign tokens to resolution paths for better balance');
    }
    
    const maxPath = Math.max(...Object.values(pathDistribution));
    const minPath = Math.min(...Object.values(pathDistribution));
    if (maxPath - minPath > totalTokens * 0.4) {
      issues.push('Unbalanced path distribution');
      recommendations.push('Redistribute tokens more evenly across paths');
    }
    
    if (productionStatus.ready < totalTokens * 0.7) {
      issues.push('Production behind schedule');
      recommendations.push('Prioritize completion of memory tokens in design/build phases');
    }

    return {
      processedMemoryData,
      economyStats: { totalTokens, completedTokens, totalValue },
      pathDistribution,
      productionStatus,
      balanceAnalysis: { issues, recommendations }
    };
  }, [memoryElementsData, charactersData, puzzlesData, gameConstants]);
};

export default useMemoryEconomyAnalysis;