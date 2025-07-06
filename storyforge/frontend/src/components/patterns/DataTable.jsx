/**
 * DataTable - Reusable table component with sorting, filtering, and pagination
 * 
 * @component
 * @example
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     { key: 'email', label: 'Email', sortable: true },
 *     { key: 'role', label: 'Role', render: (role) => <Chip label={role} /> }
 *   ]}
 *   onRowClick={(row) => console.log(row)}
 *   searchable
 *   pageSize={10}
 * />
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  TextField,
  Box,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import PropTypes from 'prop-types';

const DataTable = ({
  data = [],
  columns = [],
  onRowClick,
  searchable = false,
  pageSize = 10,
  dense = false,
  stickyHeader = true,
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  showPagination = true,
  defaultSort = null,
  sx = {}
}) => {
  // Sorting state
  const [orderBy, setOrderBy] = useState(defaultSort?.key || '');
  const [order, setOrder] = useState(defaultSort?.direction || 'asc');
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Handle sort
  const handleSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [orderBy, order]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return columns.some(column => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return order === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, orderBy, order]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage, showPagination]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Paper sx={{ width: '100%', ...sx }}>
      {/* Search Bar */}
      {searchable && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              endAdornment: searchTerm && (
                <IconButton size="small" onClick={handleClearSearch}>
                  <Clear />
                </IconButton>
              )
            }}
          />
          <Tooltip title="Toggle filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterList />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <TableContainer>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 'bold', ...column.headerSx }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align || 'left'}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {showPagination && sortedData.length > 0 && (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Paper>
  );
};

DataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      render: PropTypes.func,
      headerSx: PropTypes.object
    })
  ).isRequired,
  onRowClick: PropTypes.func,
  searchable: PropTypes.bool,
  pageSize: PropTypes.number,
  dense: PropTypes.bool,
  stickyHeader: PropTypes.bool,
  emptyMessage: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  showPagination: PropTypes.bool,
  defaultSort: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  }),
  sx: PropTypes.object
};

export default React.memo(DataTable);