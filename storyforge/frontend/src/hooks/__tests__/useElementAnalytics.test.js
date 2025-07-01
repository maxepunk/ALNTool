import { renderHook } from '@testing-library/react';
import useElementAnalytics from '../useElementAnalytics';

// Mock getConstant function
const mockGetConstant = jest.fn();
jest.mock('../useGameConstants', () => ({
  getConstant: (gameConstants, key, defaultValue) => mockGetConstant(key, defaultValue)
}));

describe('useElementAnalytics', () => {
  const mockGameConstants = { /* mock constants */ };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default returns for getConstant
    mockGetConstant.mockImplementation((key, defaultValue) => {
      const constants = {
        'ELEMENTS.MEMORY_TOKEN_WARNING_THRESHOLD': 45,
        'MEMORY_VALUE.TARGET_TOKEN_COUNT': 55,
        'ELEMENTS.MEMORY_READINESS_THRESHOLD': 0.8,
        'ELEMENTS.OVERALL_READINESS_THRESHOLD': 0.7,
        'MEMORY_VALUE.MIN_TOKEN_COUNT': 50
      };
      return constants[key] || defaultValue;
    });
  });

  it('should return default analytics when elements is null', () => {
    const { result } = renderHook(() => 
      useElementAnalytics(null, mockGameConstants)
    );

    expect(result.current).toEqual({
      totalElements: 0,
      memoryTokens: { total: 0, ready: 0, inDevelopment: 0 },
      productionStatus: { ready: 0, inProgress: 0, needsWork: 0 },
      actDistribution: { 'Act 1': 0, 'Act 2': 0, 'Act 3': 0 },
      typeDistribution: {},
      issues: []
    });
  });

  it('should return default analytics when elements is empty', () => {
    const { result } = renderHook(() => 
      useElementAnalytics([], mockGameConstants)
    );

    expect(result.current).toEqual({
      totalElements: 0,
      memoryTokens: { total: 0, ready: 0, inDevelopment: 0 },
      productionStatus: { ready: 0, inProgress: 0, needsWork: 0 },
      actDistribution: { 'Act 1': 0, 'Act 2': 0, 'Act 3': 0 },
      typeDistribution: {},
      issues: [
        {
          type: 'memory-shortage',
          severity: 'warning',
          message: 'Only 0 memory tokens found (target: 55)',
          action: 'Add more memory tokens to reach target economy'
        }
      ]
    });
  });

  it('should calculate total elements correctly', () => {
    const elements = [
      { id: 1, name: 'Element 1', basicType: 'Prop' },
      { id: 2, name: 'Element 2', basicType: 'Memory Token' },
      { id: 3, name: 'Element 3', basicType: 'Character Sheet' }
    ];

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    expect(result.current.totalElements).toBe(3);
  });

  it('should identify memory tokens correctly', () => {
    const elements = [
      { id: 1, name: 'Regular Prop', basicType: 'Prop', status: 'Done' },
      { id: 2, name: 'Memory Token', basicType: 'Memory Token Video', status: 'Ready for Playtest' },
      { id: 3, name: 'Another Memory', basicType: 'Token', status: 'In development' },
      { id: 4, name: 'memory card', basicType: 'Prop', status: 'Done' } // Should match by name
    ];

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    expect(result.current.memoryTokens.total).toBe(3);
    expect(result.current.memoryTokens.ready).toBe(2);
    expect(result.current.memoryTokens.inDevelopment).toBe(1);
  });

  it('should calculate production status correctly', () => {
    const elements = [
      { id: 1, status: 'Ready for Playtest' },
      { id: 2, status: 'Done' },
      { id: 3, status: 'In development' },
      { id: 4, status: 'To Build' },
      { id: 5, status: 'Idea/Placeholder' },
      { id: 6, status: 'To Design' }
    ];

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    expect(result.current.productionStatus.ready).toBe(2);
    expect(result.current.productionStatus.inProgress).toBe(2);
    expect(result.current.productionStatus.needsWork).toBe(2);
  });

  it('should calculate act distribution correctly', () => {
    const elements = [
      { id: 1, properties: { actFocus: 'Act 1' } },
      { id: 2, properties: { actFocus: 'Act 1' } },
      { id: 3, properties: { actFocus: 'Act 2' } },
      { id: 4, properties: { actFocus: 'Act 3' } },
      { id: 5, properties: {} } // No act focus
    ];

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    expect(result.current.actDistribution).toEqual({
      'Act 1': 2,
      'Act 2': 1,
      'Act 3': 1
    });
  });

  it('should calculate type distribution correctly', () => {
    const elements = [
      { id: 1, basicType: 'Prop' },
      { id: 2, basicType: 'Prop' },
      { id: 3, basicType: 'Memory Token' },
      { id: 4, basicType: 'Character Sheet' },
      { id: 5 } // No basicType
    ];

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    expect(result.current.typeDistribution).toEqual({
      'Prop': 2,
      'Memory Token': 1,
      'Character Sheet': 1,
      'Unknown': 1
    });
  });

  it('should identify memory shortage issue', () => {
    const elements = [
      { id: 1, basicType: 'Memory Token', status: 'Done' },
      { id: 2, basicType: 'Memory Token', status: 'Done' }
    ]; // Only 2 memory tokens, below threshold of 45

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    const memoryShortageIssue = result.current.issues.find(issue => issue.type === 'memory-shortage');
    expect(memoryShortageIssue).toBeDefined();
    expect(memoryShortageIssue.message).toContain('Only 2 memory tokens found (target: 55)');
  });

  it('should identify memory production issue', () => {
    const elements = [
      { id: 1, basicType: 'Memory Token', status: 'Done' },
      { id: 2, basicType: 'Memory Token', status: 'In development' },
      { id: 3, basicType: 'Memory Token', status: 'In development' },
      { id: 4, basicType: 'Memory Token', status: 'In development' },
      { id: 5, basicType: 'Memory Token', status: 'In development' }
    ]; // 1/5 ready = 20%, below 80% threshold

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    const memoryProductionIssue = result.current.issues.find(issue => issue.type === 'memory-production');
    expect(memoryProductionIssue).toBeDefined();
    expect(memoryProductionIssue.message).toContain('4 memory tokens not ready for production');
  });

  it('should identify production readiness issue', () => {
    const elements = [
      { id: 1, status: 'Done' },
      { id: 2, status: 'In development' },
      { id: 3, status: 'In development' },
      { id: 4, status: 'In development' },
      { id: 5, status: 'In development' }
    ]; // 1/5 ready = 20%, below 70% threshold

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    const productionReadinessIssue = result.current.issues.find(issue => issue.type === 'production-readiness');
    expect(productionReadinessIssue).toBeDefined();
    expect(productionReadinessIssue.message).toContain('4 elements still in development');
  });

  it('should identify missing act focus issue', () => {
    const elements = [
      { id: 1, properties: { actFocus: 'Act 1' } },
      { id: 2, properties: {} }, // Missing act focus
      { id: 3 }, // No properties
      { id: 4, properties: { actFocus: 'Act 2' } }
    ];

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    const missingActFocusIssue = result.current.issues.find(issue => issue.type === 'missing-act-focus');
    expect(missingActFocusIssue).toBeDefined();
    expect(missingActFocusIssue.message).toContain('2 elements missing act focus assignment');
  });

  it('should not generate issues when thresholds are met', () => {
    const elements = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      basicType: i < 46 ? 'Memory Token' : 'Prop', // 46 memory tokens, above threshold
      status: 'Ready for Playtest',
      properties: { actFocus: 'Act 1' }
    }));

    const { result } = renderHook(() => 
      useElementAnalytics(elements, mockGameConstants)
    );

    expect(result.current.issues).toHaveLength(0);
  });
});