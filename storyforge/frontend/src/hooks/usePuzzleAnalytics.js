import { useMemo } from 'react';
import { getConstant } from './useGameConstants';

export const usePuzzleAnalytics = (puzzles, gameConstants) => {
  return useMemo(() => {
    if (!puzzles) {
      const emptyActDistribution = {};
      const actTypes = getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2']);
      actTypes.forEach(act => {
        emptyActDistribution[act] = 0;
      });
      emptyActDistribution['Act 3'] = 0;
      
      return {
        totalPuzzles: 0,
        collaborativePuzzles: 0,
        soloExperiences: 0,
        actDistribution: emptyActDistribution,
        narrativeDistribution: {},
        rewardAnalysis: { totalRewards: 0, avgRewardsPerPuzzle: 0 },
        ownershipAnalysis: { assigned: 0, unassigned: 0 },
        complexityDistribution: { 'High Complexity': 0, 'Medium Complexity': 0, 'Low Complexity': 0 },
        productionReadiness: { ready: 0, needsWork: 0 },
        plotCriticalAnalysis: { critical: 0, optional: 0 },
        issues: []
      };
    }

    const totalPuzzles = puzzles.length;

    // Collaboration analysis
    const collaborativePuzzles = puzzles.filter(p => 
      p.owner && p.owner.length > 1
    ).length;
    const soloExperiences = puzzles.filter(p => 
      !p.owner || p.owner.length <= 1
    ).length;

    // Act distribution analysis
    const actTypes = getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2']);
    const actDistribution = {};
    actTypes.forEach(act => {
      actDistribution[act] = puzzles.filter(p => p.properties?.actFocus === act || p.timing === act).length;
    });
    actDistribution['Act 3'] = puzzles.filter(p => p.properties?.actFocus === 'Act 3' || p.timing === 'Act 3').length;

    // Narrative distribution
    const narrativeDistribution = {};
    puzzles.forEach(p => {
      if (p.narrativeThreads && p.narrativeThreads.length > 0) {
        p.narrativeThreads.forEach(thread => {
          narrativeDistribution[thread] = (narrativeDistribution[thread] || 0) + 1;
        });
      }
    });

    // Reward economy analysis
    const totalRewards = puzzles.reduce((sum, p) => sum + (p.rewards?.length || 0), 0);
    const avgRewardsPerPuzzle = totalPuzzles > 0 ? (totalRewards / totalPuzzles).toFixed(1) : 0;

    // Ownership analysis
    const assigned = puzzles.filter(p => p.owner && p.owner.length > 0).length;
    const unassigned = totalPuzzles - assigned;

    // Complexity distribution
    const highComplexityOwnersThreshold = getConstant(gameConstants, 'PUZZLES.HIGH_COMPLEXITY_OWNERS_THRESHOLD', 1);
    const highComplexityRewardsThreshold = getConstant(gameConstants, 'PUZZLES.HIGH_COMPLEXITY_REWARDS_THRESHOLD', 2);
    const mediumComplexityRewardsThreshold = getConstant(gameConstants, 'PUZZLES.MEDIUM_COMPLEXITY_REWARDS_THRESHOLD', 1);
    
    const complexityDistribution = {
      'High Complexity': puzzles.filter(p => 
        (p.owner?.length > highComplexityOwnersThreshold) && (p.rewards?.length > highComplexityRewardsThreshold)
      ).length,
      'Medium Complexity': puzzles.filter(p => 
        (p.owner?.length === 1 && p.rewards?.length > mediumComplexityRewardsThreshold) || 
        (p.owner?.length > highComplexityOwnersThreshold && p.rewards?.length <= highComplexityRewardsThreshold)
      ).length,
      'Low Complexity': puzzles.filter(p => 
        (!p.owner || p.owner.length === 0) || 
        (!p.rewards || p.rewards.length <= mediumComplexityRewardsThreshold)
      ).length
    };

    // Production readiness analysis (like Characters pattern)
    const ready = puzzles.filter(p => 
      p.properties?.status === 'Ready' && 
      p.owner && p.owner.length > 0 &&
      p.resolutionPaths && p.resolutionPaths.length > 0
    ).length;
    const needsWork = totalPuzzles - ready;

    // Plot critical analysis (like path distribution)
    const critical = puzzles.filter(p => p.properties?.isPlotCritical === true).length;
    const optional = totalPuzzles - critical;

    // Issues analysis (following Character pattern)
    const issues = [];
    
    const missingActFocus = puzzles.filter(p => 
      !p.properties?.actFocus && !p.timing
    ).length;
    if (missingActFocus > 0) {
      issues.push({
        type: 'missing-timing',
        severity: 'warning',
        message: `${missingActFocus} puzzles missing act/timing assignment`,
        action: 'Assign puzzles to specific acts for proper flow'
      });
    }

    const unassignedWarningThreshold = getConstant(gameConstants, 'PUZZLES.UNASSIGNED_WARNING_THRESHOLD', 0.3);
    if (unassigned > totalPuzzles * unassignedWarningThreshold) {
      issues.push({
        type: 'ownership-gaps',
        severity: 'warning',
        message: `${unassigned} puzzles have no assigned characters`,
        action: 'Assign character owners to improve narrative integration'
      });
    }

    const noRewards = puzzles.filter(p => !p.rewards || p.rewards.length === 0).length;
    const noRewardsWarningThreshold = getConstant(gameConstants, 'PUZZLES.NO_REWARDS_WARNING_THRESHOLD', 0.2);
    if (noRewards > totalPuzzles * noRewardsWarningThreshold) {
      issues.push({
        type: 'reward-economy',
        severity: 'info',
        message: `${noRewards} puzzles have no rewards defined`,
        action: 'Add meaningful rewards to enhance player motivation'
      });
    }

    const noNarrativeThreads = puzzles.filter(p => !p.narrativeThreads || p.narrativeThreads.length === 0).length;
    const noNarrativeThreadsWarningThreshold = getConstant(gameConstants, 'PUZZLES.NO_NARRATIVE_THREADS_WARNING_THRESHOLD', 0.4);
    if (noNarrativeThreads > totalPuzzles * noNarrativeThreadsWarningThreshold) {
      issues.push({
        type: 'narrative-isolation',
        severity: 'info',
        message: `${noNarrativeThreads} puzzles not connected to narrative threads`,
        action: 'Link puzzles to story elements for better coherence'
      });
    }

    // Production readiness issue
    const readinessRatio = totalPuzzles > 0 ? ready / totalPuzzles : 0;
    const productionReadyThreshold = getConstant(gameConstants, 'PUZZLES.PRODUCTION_READY_THRESHOLD', 0.7);
    if (readinessRatio < productionReadyThreshold) {
      const notReadyCount = totalPuzzles - ready;
      const notReadyPercentage = ((notReadyCount / totalPuzzles) * 100).toFixed(1);
      issues.push({
        type: 'production-readiness',
        severity: 'warning',
        message: `${notReadyPercentage}% of puzzles not production ready`,
        action: 'Complete puzzle configurations and assignments'
      });
    }

    return {
      totalPuzzles,
      collaborativePuzzles,
      soloExperiences,
      actDistribution,
      narrativeDistribution,
      rewardAnalysis: { totalRewards, avgRewardsPerPuzzle },
      ownershipAnalysis: { assigned, unassigned },
      complexityDistribution,
      productionReadiness: { ready, needsWork },
      plotCriticalAnalysis: { critical, optional },
      issues
    };
  }, [puzzles, gameConstants]);
};