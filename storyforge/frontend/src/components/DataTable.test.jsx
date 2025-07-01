import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable';
import { puzzleTableColumns } from '../pages/puzzleTableColumns';

const mockData = [
  {
    id: 1,
    puzzle: 'Test Puzzle 1',
    properties: {
      actFocus: 'Act 1',
      themes: ['Mystery', 'Investigation']
    },
    owner: ['Detective Stone'],
    rewards: [{ id: 1, name: 'Clue Token' }],
    narrativeThreads: ['Main Mystery']
  },
  {
    id: 2,
    puzzle: 'Test Puzzle 2',
    properties: {
      actFocus: 'Act 2',
      themes: ['Crime']
    },
    owner: [],
    rewards: [],
    narrativeThreads: ['Crime Ring']
  }
];

describe('DataTable with puzzleTableColumns', () => {
  it('should render DataTable with puzzle columns', () => {
    render(
      <DataTable
        columns={puzzleTableColumns}
        data={mockData}
        onRowClick={jest.fn()}
      />
    );

    // Check if table headers are rendered
    expect(screen.getByText('Puzzle Name')).toBeInTheDocument();
    expect(screen.getByText('Act Focus')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('Owner(s)')).toBeInTheDocument();
    expect(screen.getByText('Rewards (Count)')).toBeInTheDocument();
    expect(screen.getByText('Narrative Threads')).toBeInTheDocument();
  });

  it('should render puzzle data correctly', () => {
    render(
      <DataTable
        columns={puzzleTableColumns}
        data={mockData}
        onRowClick={jest.fn()}
      />
    );

    // Check if data is formatted correctly
    expect(screen.getByText('Test Puzzle 1')).toBeInTheDocument();
    expect(screen.getByText('Test Puzzle 2')).toBeInTheDocument();
    expect(screen.getByText('Act 1')).toBeInTheDocument();
    expect(screen.getByText('Act 2')).toBeInTheDocument();
    expect(screen.getByText('Mystery, Investigation')).toBeInTheDocument();
    expect(screen.getByText('Crime')).toBeInTheDocument();
    expect(screen.getByText('Detective Stone')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Reward count
    expect(screen.getByText('0')).toBeInTheDocument(); // Reward count
    expect(screen.getByText('Main Mystery')).toBeInTheDocument();
    expect(screen.getByText('Crime Ring')).toBeInTheDocument();
  });

  it('should handle row clicks', () => {
    const handleRowClick = jest.fn();
    render(
      <DataTable
        columns={puzzleTableColumns}
        data={mockData}
        onRowClick={handleRowClick}
      />
    );

    // Click on first row
    const firstRow = screen.getByText('Test Puzzle 1').closest('tr');
    fireEvent.click(firstRow);

    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should handle empty data', () => {
    render(
      <DataTable
        columns={puzzleTableColumns}
        data={[]}
        onRowClick={jest.fn()}
        emptyMessage="No puzzles found"
      />
    );

    expect(screen.getByText('No puzzles found')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(
      <DataTable
        columns={puzzleTableColumns}
        data={mockData}
        isLoading={true}
        onRowClick={jest.fn()}
      />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should filter data with search', () => {
    render(
      <DataTable
        columns={puzzleTableColumns}
        data={mockData}
        onRowClick={jest.fn()}
        searchable={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search table...');
    fireEvent.change(searchInput, { target: { value: 'Test Puzzle 1' } });

    expect(screen.getByText('Test Puzzle 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Puzzle 2')).not.toBeInTheDocument();
  });
});