import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandBar from './CommandBar';
import { api } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  api: {
    syncData: jest.fn()
  }
}));

describe('CommandBar', () => {
  const mockOnSearch = jest.fn();
  const mockOnExport = jest.fn();
  const mockExportData = [
    { id: 1, name: 'Test Item 1', value: 100 },
    { id: 2, name: 'Test Item 2', value: 200 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  test('renders all buttons', () => {
    render(<CommandBar />);
    
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quick Create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
  });

  test('search functionality triggers callback after debounce', async () => {
    render(<CommandBar onSearch={mockOnSearch} />);
    
    const searchField = screen.getByLabelText('Search');
    await userEvent.type(searchField, 'test search');
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test search');
    }, { timeout: 500 });
  });

  test('sync button triggers API call', async () => {
    api.syncData.mockResolvedValueOnce({ message: 'Sync completed' });
    
    render(<CommandBar />);
    
    const syncButton = screen.getByRole('button', { name: /Sync/i });
    fireEvent.click(syncButton);
    
    expect(syncButton).toBeDisabled();
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.syncData).toHaveBeenCalled();
    });
  });

  test('export button creates CSV download', () => {
    render(<CommandBar exportData={mockExportData} exportFilename="test-export" />);
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('export button is disabled when no data provided', () => {
    render(<CommandBar />);
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    expect(exportButton).toBeDisabled();
  });

  test('quick create menu shows all entity types', async () => {
    render(<CommandBar />);
    
    const quickCreateButton = screen.getByRole('button', { name: /Quick Create/i });
    fireEvent.click(quickCreateButton);
    
    await waitFor(() => {
      expect(screen.getByText('New Character')).toBeInTheDocument();
      expect(screen.getByText('New Element')).toBeInTheDocument();
      expect(screen.getByText('New Puzzle')).toBeInTheDocument();
      expect(screen.getByText('New Timeline Event')).toBeInTheDocument();
    });
  });

  test('sync error shows error message', async () => {
    api.syncData.mockRejectedValueOnce(new Error('Sync failed'));
    
    render(<CommandBar />);
    
    const syncButton = screen.getByRole('button', { name: /Sync/i });
    fireEvent.click(syncButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sync failed')).toBeInTheDocument();
    });
  });
});