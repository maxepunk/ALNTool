import { elementTableColumns } from '../ElementTableColumns';

describe('ElementTableColumns', () => {
  it('should export table columns array', () => {
    expect(elementTableColumns).toBeDefined();
    expect(Array.isArray(elementTableColumns)).toBe(true);
    expect(elementTableColumns.length).toBeGreaterThan(0);
  });

  it('should have all required column properties', () => {
    elementTableColumns.forEach(column => {
      expect(column).toHaveProperty('id');
      expect(column).toHaveProperty('label');
      expect(typeof column.id).toBe('string');
      expect(typeof column.label).toBe('string');
    });
  });

  it('should include expected columns', () => {
    const columnIds = elementTableColumns.map(col => col.id);
    const expectedColumns = [
      'name', 'basicType', 'properties.actFocus', 'status', 
      'firstAvailable', 'properties.themes', 'properties.memorySets'
    ];
    
    expectedColumns.forEach(expectedId => {
      expect(columnIds).toContain(expectedId);
    });
  });

  it('should have format functions for specific columns', () => {
    const columnsWithFormat = ['basicType', 'properties.actFocus', 'status', 'properties.themes', 'properties.memorySets'];
    
    columnsWithFormat.forEach(columnId => {
      const column = elementTableColumns.find(col => col.id === columnId);
      expect(column).toBeDefined();
      expect(typeof column.format).toBe('function');
    });
  });

  it('should have sortable property for all columns', () => {
    elementTableColumns.forEach(column => {
      expect(column).toHaveProperty('sortable');
      expect(typeof column.sortable).toBe('boolean');
    });
  });

  it('should have width property for all columns', () => {
    elementTableColumns.forEach(column => {
      expect(column).toHaveProperty('width');
      expect(typeof column.width).toBe('string');
    });
  });
});