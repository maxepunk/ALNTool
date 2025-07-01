import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  CircularProgress,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { visuallyHidden } from '@mui/utils'; // For screen reader text on sort labels

/**
 * Reusable data table component with sorting, pagination, and search
 * @param {Object} props - Component props
 * @param {Array} props.columns - Column definitions with {id, label, align, format, sortable, width}
 * @param {Array} props.data - Data array
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.emptyMessage - Message to display when data is empty
 * @param {Function} props.onRowClick - Function to call when a row is clicked
 * @param {string} props.initialSortBy - Default column ID to sort by
 * @param {'asc' | 'desc'} props.initialSortDirection - Default sort direction
 * @param {boolean} props.searchable - Whether to include a search bar
 */
function DataTable({ 
  columns, 
  data = [], 
  isLoading = false, 
  emptyMessage = 'No data to display',
  onRowClick,
  initialSortBy = columns.length > 0 ? columns[0].id : '',
  initialSortDirection = 'asc',
  searchable = true,
  searchPlaceholder = "Search table..."
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [searchQuery, setSearchQuery] = useState('');
  
  const sortedAndFilteredData = useMemo(() => {
    let processedData = [...(data || [])];
    
    // Filter by search query
    if (searchQuery && searchable) {
      const lowerQuery = searchQuery.toLowerCase();
      processedData = processedData.filter(item => 
        columns.some(column => {
          const value = item[column.id];
          return value?.toString().toLowerCase().includes(lowerQuery);
        })
      );
    }
    
    // Sort the data
    if (sortBy) {
      processedData.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1; // Push nulls/undefined to the end
        if (bValue === null || bValue === undefined) return -1;
        
        const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' }) * directionMultiplier;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * directionMultiplier;
        } else {
          // Fallback for mixed types or other types
          return (aValue > bValue ? 1 : -1) * directionMultiplier;
        }
      });
    }
    
    return processedData;
  }, [data, searchQuery, searchable, columns, sortBy, sortDirection]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); 
  };
  
  const handleSortRequest = (property) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); 
  };
  
  const paginatedData = sortedAndFilteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <Box data-testid="data-table">
      {searchable && (
        <Box sx={{ mb: 2, maxWidth: {sm: 400} }}> {/* Limit search bar width */}
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}
      
      <Paper 
        sx={{ width: '100%', overflow: 'hidden', mb: 2 }}
        elevation={1} // Subtle elevation
      >
        <TableContainer sx={{ maxHeight: { xs: 'calc(100vh - 300px)', md: 600 } }}> {/* Responsive max height */}
          <Table stickyHeader aria-label="data table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sortDirection={sortBy === column.id ? sortDirection : false}
                    sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: 'background.paper', // Ensure sticky header has bg
                      width: column.width, // Apply column width if specified
                    }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={sortBy === column.id}
                        direction={sortBy === column.id ? sortDirection : 'asc'}
                        onClick={() => handleSortRequest(column.id)}
                      >
                        {column.label}
                        {sortBy === column.id ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body1" sx={{mt: 1}}>Loading data...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary" variant="h6" sx={{mb:1}}>
                      {searchQuery ? 'No results match your search' : emptyMessage}
                    </Typography>
                    {searchQuery && <Typography color="text.secondary">Try adjusting your search term or filters.</Typography>}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow 
                    hover 
                    key={row.id || `row-${index}`} // Prefer row.id, fallback to index
                    data-testid={`row-${index}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : -1} // Make row focusable if clickable
                    onKeyPress={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
                    sx={{ 
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:last-child td, &:last-child th': { border: 0 } // Remove border from last row
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.format ? column.format(row[column.id], row) : row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={sortedAndFilteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton // Add for better navigation with many pages
          showLastButton
        />
      </Paper>
    </Box>
  );
}

export default DataTable; 