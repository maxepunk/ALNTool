import { getEntityPresentation } from './EntityPresentation';

describe('EntityPresentation', () => {
  describe('getEntityPresentation', () => {
    it('should return default presentation for unknown type', () => {
      const result = getEntityPresentation('Unknown');
      
      expect(result.color).toBe('#78909c'); // Blue Grey 400
      expect(result.contrastColor).toBe('rgba(0,0,0,0.87)');
      expect(result.icon).toBeDefined();
    });

    it('should return center node styling when isCenter is true', () => {
      const result = getEntityPresentation('Character', {}, true);
      
      expect(result.color).toBe('#673ab7'); // Deep Purple 500
      expect(result.contrastColor).toBe('#fff');
    });

    it('should return Character presentation', () => {
      const result = getEntityPresentation('Character');
      
      expect(result.color).toBe('#3f51b5'); // Indigo 500
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });

    it('should return Element presentation', () => {
      const result = getEntityPresentation('Element');
      
      expect(result.color).toBe('#00897b'); // Teal 600
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });

    it('should return Memory Element presentation', () => {
      const result = getEntityPresentation('Element', { basicType: 'Memory' });
      
      expect(result.color).toBe('#2196f3'); // Blue 500
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });

    it('should return Memory Element presentation case insensitive', () => {
      const result = getEntityPresentation('Element', { basicType: 'memory element' });
      
      expect(result.color).toBe('#2196f3'); // Blue 500
      expect(result.contrastColor).toBe('#fff');
    });

    it('should return Puzzle presentation', () => {
      const result = getEntityPresentation('Puzzle');
      
      expect(result.color).toBe('#f57c00'); // Orange 700
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });

    it('should return Timeline presentation', () => {
      const result = getEntityPresentation('Timeline');
      
      expect(result.color).toBe('#d81b60'); // Pink 600
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });

    it('should prioritize center styling over type-specific styling', () => {
      const characterResult = getEntityPresentation('Character', {}, true);
      const elementResult = getEntityPresentation('Element', {}, true);
      
      expect(characterResult.color).toBe('#673ab7');
      expect(elementResult.color).toBe('#673ab7');
      expect(characterResult.contrastColor).toBe('#fff');
      expect(elementResult.contrastColor).toBe('#fff');
    });

    it('should handle undefined properties gracefully', () => {
      const result = getEntityPresentation('Element', undefined);
      
      expect(result.color).toBe('#00897b');
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });

    it('should handle empty properties object', () => {
      const result = getEntityPresentation('Character', {});
      
      expect(result.color).toBe('#3f51b5');
      expect(result.contrastColor).toBe('#fff');
      expect(result.icon).toBeDefined();
    });
  });
});