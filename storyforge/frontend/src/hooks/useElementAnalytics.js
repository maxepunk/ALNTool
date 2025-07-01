import { useMemo } from 'react';
import { getConstant } from './useGameConstants';

const useElementAnalytics = (elements, gameConstants) => {
  return useMemo(() => {
    if (!elements) return {
      totalElements: 0,
      memoryTokens: { total: 0, ready: 0, inDevelopment: 0 },
      productionStatus: { ready: 0, inProgress: 0, needsWork: 0 },
      actDistribution: { 'Act 1': 0, 'Act 2': 0, 'Act 3': 0 },
      typeDistribution: {},
      issues: []
    };

    const totalElements = elements.length;

    // Memory token analysis
    const memoryElements = elements.filter(el => 
      el.basicType?.toLowerCase().includes('memory') ||
      el.name?.toLowerCase().includes('memory') ||
      el.basicType?.toLowerCase().includes('token')
    );
    const memoryTokensReady = memoryElements.filter(el => 
      el.status === 'Ready for Playtest' || el.status === 'Done'
    ).length;
    const memoryTokensInDev = memoryElements.filter(el => 
      el.status === 'In development'
    ).length;

    // Production status analysis
    const readyElements = elements.filter(el => 
      el.status === 'Ready for Playtest' || el.status === 'Done'
    ).length;
    const inProgressElements = elements.filter(el => 
      el.status === 'In development' || el.status === 'To Build'
    ).length;
    const needsWorkElements = elements.filter(el => 
      el.status === 'Idea/Placeholder' || el.status === 'To Design'
    ).length;

    // Act distribution
    const actDistribution = {
      'Act 1': elements.filter(el => el.properties?.actFocus === 'Act 1').length,
      'Act 2': elements.filter(el => el.properties?.actFocus === 'Act 2').length,
      'Act 3': elements.filter(el => el.properties?.actFocus === 'Act 3').length
    };

    // Type distribution
    const typeDistribution = {};
    elements.forEach(el => {
      const type = el.basicType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Identify production issues
    const issues = [];
    
    const memoryWarningThreshold = getConstant(gameConstants, 'ELEMENTS.MEMORY_TOKEN_WARNING_THRESHOLD', 45);
    const targetTokenCount = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);
    const memoryReadinessThreshold = getConstant(gameConstants, 'ELEMENTS.MEMORY_READINESS_THRESHOLD', 0.8);
    const overallReadinessThreshold = getConstant(gameConstants, 'ELEMENTS.OVERALL_READINESS_THRESHOLD', 0.7);

    if (memoryElements.length < memoryWarningThreshold) {
      issues.push({
        type: 'memory-shortage',
        severity: 'warning',
        message: `Only ${memoryElements.length} memory tokens found (target: ${targetTokenCount})`,
        action: 'Add more memory tokens to reach target economy'
      });
    }

    if (memoryTokensReady < memoryElements.length * memoryReadinessThreshold) {
      issues.push({
        type: 'memory-production',
        severity: 'warning',
        message: `${memoryElements.length - memoryTokensReady} memory tokens not ready for production`,
        action: 'Complete memory token production pipeline'
      });
    }

    if (readyElements < totalElements * overallReadinessThreshold) {
      issues.push({
        type: 'production-readiness',
        severity: 'info',
        message: `${totalElements - readyElements} elements still in development`,
        action: 'Focus on completing high-priority elements'
      });
    }

    const missingActFocus = elements.filter(el => !el.properties?.actFocus).length;
    if (missingActFocus > 0) {
      issues.push({
        type: 'missing-act-focus',
        severity: 'info',
        message: `${missingActFocus} elements missing act focus assignment`,
        action: 'Assign elements to specific acts for better organization'
      });
    }

    return {
      totalElements,
      memoryTokens: { 
        total: memoryElements.length, 
        ready: memoryTokensReady, 
        inDevelopment: memoryTokensInDev 
      },
      productionStatus: { 
        ready: readyElements, 
        inProgress: inProgressElements, 
        needsWork: needsWorkElements 
      },
      actDistribution,
      typeDistribution,
      issues
    };
  }, [elements, gameConstants]);
};

export default useElementAnalytics;