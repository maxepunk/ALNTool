import { characterTableColumns } from '../CharacterTableColumns';

describe('CharacterTableColumns', () => {
  it('should export table columns array', () => {
    expect(characterTableColumns).toBeDefined();
    expect(Array.isArray(characterTableColumns)).toBe(true);
    expect(characterTableColumns.length).toBeGreaterThan(0);
  });

  it('should have all required column properties', () => {
    characterTableColumns.forEach(column => {
      expect(column).toHaveProperty('id');
      expect(column).toHaveProperty('label');
      expect(typeof column.id).toBe('string');
      expect(typeof column.label).toBe('string');
    });
  });

  it('should include expected columns', () => {
    const columnIds = characterTableColumns.map(col => col.id);
    const expectedColumns = [
      'name', 'type', 'tier', 'resolutionPaths', 'act_focus', 
      'logline', 'ownedElements', 'character_links', 'events'
    ];
    
    expectedColumns.forEach(expectedId => {
      expect(columnIds).toContain(expectedId);
    });
  });

  it('should have format functions for specific columns', () => {
    const columnsWithFormat = ['type', 'tier', 'resolutionPaths', 'act_focus', 'ownedElements', 'character_links', 'events'];
    
    columnsWithFormat.forEach(columnId => {
      const column = characterTableColumns.find(col => col.id === columnId);
      expect(column).toBeDefined();
      expect(typeof column.format).toBe('function');
    });
  });

  it('should have sortable property for all columns', () => {
    characterTableColumns.forEach(column => {
      expect(column).toHaveProperty('sortable');
      expect(typeof column.sortable).toBe('boolean');
    });
  });

  it('should have width property for all columns', () => {
    characterTableColumns.forEach(column => {
      expect(column).toHaveProperty('width');
      expect(typeof column.width).toBe('string');
    });
  });
});