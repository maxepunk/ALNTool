// RED PHASE: Test the analyzeExperienceFlow utility function
// Following TDD principles - test behavior, not implementation

import { analyzeExperienceFlow } from './analyzeExperienceFlow';

describe('analyzeExperienceFlow', () => {
  const mockGameConstants = {
    EXPERIENCE_FLOW: {
      MIN_MEMORY_TOKENS: 5,
      PACING_THRESHOLD: 0.7
    }
  };

  const mockNodes = [
    { id: '1', type: 'activityNode', data: { actFocus: 'Act 1' } },
    { id: '2', type: 'discoveryNode', data: { actFocus: 'Act 2' } },
    { id: '3', type: 'discoveryNode', data: { label: 'Memory Token 1', type: 'memory' } },
    { id: '4', type: 'discoveryNode', data: { label: 'RFID Token 2' } }
  ];

  const mockEdges = [
    { source: '1', target: '2' },
    { source: '2', target: '3' }
  ];

  const mockCharacterData = {
    name: 'Test Character',
    tier: 'Core'
  };

  describe('with valid input data', () => {
    test('should return analysis object with all required properties', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(result).toHaveProperty('pacing');
      expect(result).toHaveProperty('memoryTokenFlow');
      expect(result).toHaveProperty('actTransitions');
      expect(result).toHaveProperty('bottlenecks');
      expect(result).toHaveProperty('qualityMetrics');
    });

    test('should calculate memory token metrics correctly', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(result.memoryTokenFlow).toHaveProperty('collected');
      expect(result.memoryTokenFlow).toHaveProperty('total');
      expect(result.memoryTokenFlow.collected).toBe(2); // 2 memory-related nodes in mockNodes
      expect(result.memoryTokenFlow.total).toBe(8); // Default per character
      expect(result.memoryTokenFlow.progression).toBeInstanceOf(Array);
    });

    test('should analyze act transitions', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(result.actTransitions).toHaveProperty('smooth');
      expect(result.actTransitions).toHaveProperty('issues');
      expect(typeof result.actTransitions.smooth).toBe('boolean');
      expect(Array.isArray(result.actTransitions.issues)).toBe(true);
    });

    test('should provide pacing analysis with score', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(result.pacing).toHaveProperty('score');
      expect(result.pacing).toHaveProperty('issues');
      expect(typeof result.pacing.score).toBe('number');
      expect(Array.isArray(result.pacing.issues)).toBe(true);
    });
  });

  describe('with edge cases', () => {
    test('should handle empty nodes gracefully', () => {
      const result = analyzeExperienceFlow([], mockEdges, mockCharacterData, mockGameConstants);

      expect(result.pacing.score).toBe(85); // Default score when no nodes
      expect(result.memoryTokenFlow.collected).toBe(0);
      expect(result.memoryTokenFlow.total).toBe(8); // Default per character
    });

    test('should handle missing edges gracefully', () => {
      const result = analyzeExperienceFlow(mockNodes, [], mockCharacterData, mockGameConstants);

      expect(result).toHaveProperty('bottlenecks');
      expect(Array.isArray(result.bottlenecks)).toBe(true);
    });

    test('should handle null input gracefully', () => {
      const result = analyzeExperienceFlow(null, null, mockCharacterData, mockGameConstants);

      expect(result.pacing.score).toBe(0);
      expect(result.memoryTokenFlow.collected).toBe(0);
      expect(result.memoryTokenFlow.total).toBe(0);
    });

    test('should handle missing game constants', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, {});

      // Should still return valid structure with defaults
      expect(result).toHaveProperty('pacing');
      expect(result).toHaveProperty('memoryTokenFlow');
    });
  });

  describe('analysis quality', () => {
    test('should provide quality metrics for experience balance', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(result.qualityMetrics).toHaveProperty('discoveryRatio');
      expect(result.qualityMetrics).toHaveProperty('actionRatio');
      expect(result.qualityMetrics).toHaveProperty('balance');
      expect(typeof result.qualityMetrics.discoveryRatio).toBe('number');
      expect(typeof result.qualityMetrics.actionRatio).toBe('number');
    });

    test('should detect bottlenecks in experience flow', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(Array.isArray(result.bottlenecks)).toBe(true);
    });

    test('should analyze pacing issues based on node distribution', () => {
      const result = analyzeExperienceFlow(mockNodes, mockEdges, mockCharacterData, mockGameConstants);

      expect(result.pacing).toHaveProperty('score');
      expect(result.pacing).toHaveProperty('issues');
      expect(typeof result.pacing.score).toBe('number');
      expect(Array.isArray(result.pacing.issues)).toBe(true);
    });
  });
});