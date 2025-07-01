import React from 'react';
import { render } from '@testing-library/react';
import { characterTableColumns } from '../CharacterTableColumns';

describe('CharacterTableColumns - API Contract Requirements', () => {
  test('character_links column expects array field', () => {
    const column = characterTableColumns.find(col => col.id === 'character_links');
    expect(column).toBeDefined();
    
    // Test with empty data
    const emptyResult = column.format(null);
    const { container: empty } = render(emptyResult);
    expect(empty.textContent).toBe('0');
    
    // Test with array data
    const links = [
      { linked_character_id: 'id1', linked_character_name: 'Name 1' },
      { linked_character_id: 'id2', linked_character_name: 'Name 2' },
      { linked_character_id: 'id3', linked_character_name: 'Name 3' }
    ];
    const result = column.format(links);
    const { container } = render(result);
    expect(container.textContent).toBe('3');
  });

  test('ownedElements column expects array with properties.basicType', () => {
    const column = characterTableColumns.find(col => col.id === 'ownedElements');
    expect(column).toBeDefined();
    
    const elements = [
      { id: '1', properties: { basicType: 'Memory Token' } },
      { id: '2', properties: { basicType: 'RFID Tag' } },
      { id: '3', properties: { basicType: 'Document' } },
      { id: '4', properties: { basicType: 'Token' } }
    ];
    
    const result = column.format(elements);
    const { container } = render(result);
    
    // Should count 3 memory-related items (Memory Token, RFID Tag, Token)
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('of 4');
  });

  test('column IDs match expected API response fields', () => {
    const expectedFields = [
      'name',
      'type', 
      'tier',
      'resolutionPaths',
      'act_focus',
      'logline',
      'ownedElements',
      'character_links',
      'events'
    ];
    
    const columnIds = characterTableColumns.map(col => col.id);
    expectedFields.forEach(field => {
      expect(columnIds).toContain(field);
    });
  });
});