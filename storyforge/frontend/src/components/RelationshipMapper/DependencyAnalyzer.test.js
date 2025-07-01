import { analyzeDependencies } from './DependencyAnalyzer';

describe('DependencyAnalyzer', () => {
  it('should export analyzeDependencies function', () => {
    expect(analyzeDependencies).toBeDefined();
    expect(typeof analyzeDependencies).toBe('function');
  });

  it('should return empty analysis for missing graphData', () => {
    const result = analyzeDependencies(null, 'Character', 'char-1');
    expect(result).toEqual({
      criticalPaths: [],
      bottlenecks: [],
      collaborationOpportunities: [],
      isolationRisks: [],
    });
  });

  it('should detect UV Light dependency chain', () => {
    const graphData = {
      nodes: [
        { id: '1', properties: { name: 'UV Flashlight' } },
        { id: '2', properties: { themes: ['UV'] } },
        { id: '3', properties: { basicType: 'uv-reactive' } },
      ],
      edges: []
    };
    
    const result = analyzeDependencies(graphData, 'Element', 'elem-1');
    expect(result.criticalPaths).toHaveLength(1);
    expect(result.criticalPaths[0].type).toBe('UV Light Chain');
    expect(result.criticalPaths[0].description).toContain('3 UV-dependent elements detected');
    expect(result.criticalPaths[0].severity).toBe('high');
  });

  it('should detect Company One-Pager dependencies', () => {
    const graphData = {
      nodes: [
        { id: '1', properties: { name: 'Company One-Pager Document' } },
        { id: '2', properties: { themes: ['Business'] } },
      ],
      edges: []
    };
    
    const result = analyzeDependencies(graphData, 'Element', 'elem-1');
    expect(result.criticalPaths).toHaveLength(1);
    expect(result.criticalPaths[0].type).toBe('Company One-Pager Network');
    expect(result.criticalPaths[0].severity).toBe('medium');
  });

  it('should detect RFID bottlenecks when > 3 RFID elements', () => {
    const graphData = {
      nodes: [
        { id: '1', properties: { basicType: 'rfid-scanner' } },
        { id: '2', properties: { name: 'RFID Tag 1' } },
        { id: '3', properties: { name: 'RFID Tag 2' } },
        { id: '4', properties: { name: 'RFID Tag 3' } },
      ],
      edges: []
    };
    
    const result = analyzeDependencies(graphData, 'Element', 'elem-1');
    expect(result.bottlenecks).toHaveLength(1);
    expect(result.bottlenecks[0].type).toBe('RFID Scanner Bottleneck');
    expect(result.bottlenecks[0].description).toContain('4 RFID elements with only 3 scanners');
  });

  it('should detect collaborative puzzles', () => {
    const graphData = {
      nodes: [
        { id: '1', type: 'Puzzle', properties: { minPlayers: 2 } },
        { id: '2', type: 'Puzzle', properties: { name: 'Collaborative Puzzle' } },
        { id: '3', type: 'Puzzle', properties: { themes: ['Collaboration'] } },
      ],
      edges: []
    };
    
    const result = analyzeDependencies(graphData, 'Puzzle', 'puzzle-1');
    expect(result.collaborationOpportunities).toHaveLength(1);
    expect(result.collaborationOpportunities[0].type).toBe('Multi-Player Puzzles');
    expect(result.collaborationOpportunities[0].description).toContain('3 puzzles require collaboration');
  });

  it('should detect isolated characters with < 2 connections', () => {
    const graphData = {
      nodes: [{ id: 'char-1', type: 'Character' }],
      edges: [{ source: 'char-1', target: 'elem-1' }] // Only 1 connection
    };
    
    const result = analyzeDependencies(graphData, 'Character', 'char-1');
    expect(result.isolationRisks).toHaveLength(1);
    expect(result.isolationRisks[0].type).toBe('Social Isolation Risk');
    expect(result.isolationRisks[0].description).toContain('Only 1 connections');
  });
});