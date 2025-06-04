import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Box, Typography, CircularProgress, Alert, Paper,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import PageHeader from '../components/PageHeader'; // Corrected Path
import api from '../services/api';

// Constants from Game Design Document
const VALUE_MAPPING = { 1: 100, 2: 500, 3: 1000, 4: 5000, 5: 10000 };
const TYPE_MULTIPLIERS = { Personal: 1, Business: 3, Technical: 5 };

const KEYWORDS_TECHNICAL = ["ip", "algorithm", "breakthrough", "neurobiology", "sensory triggers", "ai pattern", "neurochemical catalyst", "validation system", "protocol", "patent", "research", "data model", "encryption"];
const KEYWORDS_BUSINESS = ["deal", "corporate", "funding", "company", "market", "ledger", "investment", "ceo", "board", "acquisition", "merger", "stock", "trade secret", "client list", "supply chain"];
const KEYWORDS_PERSONAL = ["relationship", "emotion", "personal", "secret", "rumor", "affair", "family", "love", "fear", "friendship", "betrayal"];

// Helper function to infer memory category
function inferMemoryCategory(properties) {
  const textToSearch = `${properties?.name || ''} ${properties?.description || ''} ${properties?.notes || ''}`.toLowerCase();
  if (KEYWORDS_TECHNICAL.some(keyword => textToSearch.includes(keyword))) return 'Technical';
  if (KEYWORDS_BUSINESS.some(keyword => textToSearch.includes(keyword))) return 'Business';
  if (KEYWORDS_PERSONAL.some(keyword => textToSearch.includes(keyword))) return 'Personal';
  return 'Personal'; // Default
}

// Helper function to infer base value level
function inferBaseValueLevel(properties) {
  const textToSearch = `${properties?.name || ''} ${properties?.description || ''}`.toLowerCase();
  if (["core technical", "crime evidence", "blackmail", "critical vulnerability"].some(kw => textToSearch.includes(kw))) return 5;
  if (["crucial business", "deep secret", "major exploit", "strategic plan"].some(kw => textToSearch.includes(kw))) return 4;
  if (["personal revelation", "significant interaction", "contract detail"].some(kw => textToSearch.includes(kw))) return 3;
  if (["minor interaction", "rumor", "gossip", "routine report"].some(kw => textToSearch.includes(kw))) return 2;
  if (["mundane observation", "daily log", "casual note"].some(kw => textToSearch.includes(kw))) return 1;

  if (properties?.SF_RFID) {
    const match = properties.SF_RFID.match(/L(\d)/);
    if (match && match[1] && VALUE_MAPPING[parseInt(match[1])]) {
      return parseInt(match[1]);
    }
  }
  console.warn(`Could not reliably infer base value level for element: ${properties?.name || 'Unknown'}. Defaulting to Level 3.`);
  return 3;
}

const MemoryEconomyPage = () => {
  const { data: elements, isLoading, error: queryError, isError } = useQuery('allElementsForMemoryEconomy', api.getElements);

  const [orderBy, setOrderBy] = useState('finalValue');
  const [order, setOrder] = useState('desc');
  const [selectedMemorySetFilter, setSelectedMemorySetFilter] = useState("All");
  const [availableMemorySetsForFilter, setAvailableMemorySetsForFilter] = useState([]);

  const processedMemoryTokens = useMemo(() => {
    if (!elements) return [];
    const filteredTokens = elements.filter(el =>
      el.properties?.basicType?.toLowerCase().includes('memory') ||
      el.properties?.basicType?.toLowerCase().includes('token')
    );

    return filteredTokens.map(el => {
      const inferredCategory = inferMemoryCategory(el.properties);
      const baseValueLevel = inferBaseValueLevel(el.properties);
      const baseValueAmount = VALUE_MAPPING[baseValueLevel] || 0;
      const typeMultiplierValue = TYPE_MULTIPLIERS[inferredCategory] || 1;
      const finalValue = baseValueAmount * typeMultiplierValue;

      return {
        id: el.id,
        name: el.properties?.name || el.id,
        sfRfid: el.properties?.SF_RFID || 'N/A',
        descriptionSnippet: el.properties?.descriptionSnippet || el.properties?.description || '',
        originalProperties: el.properties,
        inferredCategory,
        baseValueLevel,
        baseValueAmount,
        typeMultiplierValue,
        finalValue,
        memorySets: el.properties?.memorySets || [], // Store memory sets
      };
    });
  }, [elements]);

  useEffect(() => {
    if (processedMemoryTokens) {
      const allSets = new Set();
      processedMemoryTokens.forEach(token => {
        if (token.memorySets && Array.isArray(token.memorySets)) {
          token.memorySets.forEach(set => {
            if (typeof set === 'string') {
              allSets.add(set);
            }
          });
        }
      });
      setAvailableMemorySetsForFilter(Array.from(allSets).sort());
    }
  }, [processedMemoryTokens]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = processedMemoryTokens;
    if (selectedMemorySetFilter !== "All") {
      filtered = processedMemoryTokens.filter(token =>
        token.memorySets && Array.isArray(token.memorySets) && token.memorySets.includes(selectedMemorySetFilter)
      );
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (a[orderBy] < b[orderBy]) {
        comparison = -1;
      }
      if (a[orderBy] > b[orderBy]) {
        comparison = 1;
      }
      return order === 'asc' ? comparison : -comparison;
    });
  }, [processedMemoryTokens, order, orderBy, selectedMemorySetFilter]);

  const columns = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'inferredCategory', label: 'Category', minWidth: 100 },
    { id: 'memorySets', label: 'Memory Sets', minWidth: 150, format: (setsArray) => Array.isArray(setsArray) && setsArray.length > 0 ? setsArray.join(', ') : 'N/A' },
    { id: 'baseValueLevel', label: 'Level', minWidth: 80, align: 'right', format: (value) => value },
    { id: 'baseValueAmount', label: 'Base Value ($)', minWidth: 100, align: 'right', format: (value) => value.toLocaleString() },
    { id: 'typeMultiplierValue', label: 'Multiplier', minWidth: 80, align: 'right', format: (value) => `x${value}` },
    { id: 'finalValue', label: 'Final Value ($)', minWidth: 120, align: 'right', format: (value) => value.toLocaleString() },
    { id: 'sfRfid', label: 'SF_RFID', minWidth: 100 },
  ];

  return (
    <Box sx={{ m: 2 }}>
      <PageHeader title="Memory Economy Overview" />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading Memory Elements...</Typography>
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ my: 2 }}>
          Error fetching elements: {queryError?.message || 'An unknown error occurred.'}
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          <FormControl sx={{ m: 1, minWidth: 240, mb: 2 }} size="small">
            <InputLabel id="memory-set-filter-label">Filter by Memory Set</InputLabel>
            <Select
              labelId="memory-set-filter-label"
              id="memory-set-filter-select"
              value={selectedMemorySetFilter}
              label="Filter by Memory Set"
              onChange={(e) => setSelectedMemorySetFilter(e.target.value)}
            >
              <MenuItem value="All">
                <em>All Sets</em>
              </MenuItem>
              {availableMemorySetsForFilter.map((setName) => (
                <MenuItem key={setName} value={setName}>
                  {setName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Paper sx={{ width: '100%', overflow: 'hidden', mt: 1 }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}> {/* Adjusted maxHeight */}
              <Table stickyHeader aria-label="memory tokens table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                        sortDirection={orderBy === column.id ? order : false}
                      >
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedTokens.map((token) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={token.id}>
                      {columns.map((column) => {
                        const value = token[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredAndSortedTokens.length === 0 && (
               <Typography sx={{p: 2, textAlign: 'center'}}>
                 {selectedMemorySetFilter === "All" ? "No memory tokens found." : `No memory tokens found for set: "${selectedMemorySetFilter}".`}
               </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MemoryEconomyPage;
