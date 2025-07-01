import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { getMemoryTokenTableColumns } from '../memoryTokenTableColumns';

// Mock RouterLink
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

describe('memoryTokenTableColumns', () => {
  const mockGameConstants = {
    RESOLUTION_PATHS: {
      THEMES: {
        'Black Market': { color: 'error' },
        'Detective': { color: 'info' },
        'Third Path': { color: 'success' }
      }
    },
    PRODUCTION_STATUS: {
      COLORS: {
        'Ready': 'success',
        'To Build': 'info',
        'To Design': 'warning',
        'Unknown': 'default'
      }
    }
  };

  it('should export function that returns columns array', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    expect(Array.isArray(columns)).toBe(true);
    expect(columns.length).toBeGreaterThan(0);
  });

  it('should return base columns when workshopMode is false', () => {
    const columns = getMemoryTokenTableColumns(false, mockGameConstants);
    const columnIds = columns.map(col => col.id);
    
    expect(columnIds).toContain('name');
    expect(columnIds).toContain('parsed_sf_rfid');
    expect(columnIds).toContain('sf_value_rating');
    expect(columnIds).toContain('baseValueAmount');
    expect(columnIds).toContain('sf_memory_type');
    expect(columnIds).toContain('typeMultiplierValue');
    expect(columnIds).toContain('finalCalculatedValue');
    expect(columnIds).toContain('discoveredVia');
    
    // Should not contain workshop-only columns
    expect(columnIds).not.toContain('resolutionPath');
    expect(columnIds).not.toContain('status');
  });

  it('should include workshop columns when workshopMode is true', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const columnIds = columns.map(col => col.id);
    
    expect(columnIds).toContain('resolutionPath');
    expect(columnIds).toContain('status');
  });

  it('should have all required column properties', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    
    columns.forEach(column => {
      expect(column).toHaveProperty('id');
      expect(column).toHaveProperty('label');
      expect(column).toHaveProperty('sortable');
      expect(column).toHaveProperty('width');
    });
  });

  it('should format name column as link', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const nameColumn = columns.find(col => col.id === 'name');
    
    expect(nameColumn).toBeDefined();
    expect(nameColumn.format).toBeDefined();
    
    const { container } = render(
      <BrowserRouter>
        {nameColumn.format('Test Memory', { id: 123 })}
      </BrowserRouter>
    );
    
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/elements/123');
    expect(link).toHaveTextContent('Test Memory');
  });

  it('should format value rating with correct chip color', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const ratingColumn = columns.find(col => col.id === 'sf_value_rating');
    
    expect(ratingColumn.format).toBeDefined();
    
    // Test different ratings
    const { container: container4 } = render(ratingColumn.format(4));
    expect(container4.querySelector('.MuiChip-colorError')).toBeInTheDocument();
    
    const { container: container3 } = render(ratingColumn.format(3));
    expect(container3.querySelector('.MuiChip-colorWarning')).toBeInTheDocument();
    
    const { container: container2 } = render(ratingColumn.format(2));
    expect(container2.querySelector('.MuiChip-colorDefault')).toBeInTheDocument();
  });

  it('should format currency values with toLocaleString', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const baseValueColumn = columns.find(col => col.id === 'baseValueAmount');
    const finalValueColumn = columns.find(col => col.id === 'finalCalculatedValue');
    
    expect(baseValueColumn.format(1000)).toBe('1,000');
    expect(finalValueColumn.format(5000)).toBe('5,000');
  });

  it('should format memory type with chip', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const typeColumn = columns.find(col => col.id === 'sf_memory_type');
    
    const { container } = render(typeColumn.format('Core Memory'));
    expect(container.querySelector('.MuiChip-outlined')).toBeInTheDocument();
    expect(container).toHaveTextContent('Core Memory');
  });

  it('should format type multiplier correctly', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const multiplierColumn = columns.find(col => col.id === 'typeMultiplierValue');
    
    expect(multiplierColumn.format(1.5)).toBe('x1.5');
    expect(multiplierColumn.format(2)).toBe('x2');
  });

  it('should format resolution path with theme color', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const pathColumn = columns.find(col => col.id === 'resolutionPath');
    
    const { container } = render(pathColumn.format('Black Market'));
    expect(container.querySelector('.MuiChip-colorError')).toBeInTheDocument();
  });

  it('should format production status with correct color', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    const statusColumn = columns.find(col => col.id === 'status');
    
    const { container } = render(statusColumn.format('Ready'));
    expect(container.querySelector('.MuiChip-colorSuccess')).toBeInTheDocument();
  });

  it('should handle null/undefined values gracefully', () => {
    const columns = getMemoryTokenTableColumns(true, mockGameConstants);
    
    const ratingColumn = columns.find(col => col.id === 'sf_value_rating');
    expect(ratingColumn.format(null)).toBe('N/A');
    
    const typeColumn = columns.find(col => col.id === 'sf_memory_type');
    expect(typeColumn.format(null)).toBe('N/A');
    
    const rfidColumn = columns.find(col => col.id === 'parsed_sf_rfid');
    expect(rfidColumn.format(null)).toBe('N/A');
  });
});