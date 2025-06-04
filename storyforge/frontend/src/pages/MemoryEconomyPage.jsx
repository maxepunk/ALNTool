import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Box, Container, CircularProgress, Typography, Paper, Alert, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { api } from '../services/api';

const VALUE_RATING_MAP = {
  1: 100,
  2: 500,
  3: 1000,
  4: 5000,
  5: 10000,
};

const TYPE_MULTIPLIER_MAP = {
  Personal: 1,
  Business: 3,
  Technical: 5,
};

const MEMORY_TYPE_KEYWORDS = ['memory', 'rfid', 'corrupted']; // For client-side filtering

function MemoryEconomyPage() {
  const { data: memoryElementsData, isLoading, error } = useQuery(
    'memoryTypeElementsForEconomy', // Updated queryKey to reflect filtered data
    () => api.getElements({ filterGroup: 'memoryTypes' }), // Fetch only memory-type elements
    { staleTime: 5 * 60 * 1000 }
  );

  const processedMemoryData = useMemo(() => {
    if (!memoryElementsData) return [];

    // Client-side filtering for MEMORY_TYPE_KEYWORDS is no longer needed as server handles it.
    // const memoryElements = memoryElementsData.filter(element =>
    //   element.basicType && MEMORY_TYPE_KEYWORDS.some(keyword => element.basicType.toLowerCase().includes(keyword))
    // );

    return memoryElementsData.map(element => { // Process data directly from the filtered API response
      const properties = element.properties || {};
      const valueRating = properties.sf_value_rating; // From B030
      const memoryType = properties.sf_memory_type;   // From B030

      const baseValueAmount = VALUE_RATING_MAP[valueRating] || 0;
      const typeMultiplierValue = TYPE_MULTIPLIER_MAP[memoryType] || 1;
      const finalCalculatedValue = baseValueAmount * typeMultiplierValue;

      let discoveredVia = 'N/A';
      // The element data from api.getElements() now includes rich relation data due to map...WithNames functions
      if (element.rewardedByPuzzle && element.rewardedByPuzzle.length > 0) {
        discoveredVia = `Puzzle: ${element.rewardedByPuzzle[0].name || element.rewardedByPuzzle[0].puzzle}`; // puzzle title prop might be 'puzzle'
      } else if (element.timelineEvent && element.timelineEvent.length > 0) {
        // timelineEvent relation on Element maps to an array of {id, name (description)}
        discoveredVia = `Event: ${element.timelineEvent[0].name || element.timelineEvent[0].description}`;
      }


      return {
        ...element,
        id: element.id,
        name: element.name,
        parsed_sf_rfid: properties.parsed_sf_rfid, // From B030 (via properties)
        sf_value_rating: valueRating,
        baseValueAmount,
        sf_memory_type: memoryType,
        typeMultiplierValue,
        finalCalculatedValue,
        discoveredVia,
      };
    });
  }, [allElements]);

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Memory Name',
      sortable: true,
      width: '25%',
      format: (value, row) => <RouterLink to={`/elements/${row.id}`}>{value}</RouterLink>
    },
    {
      id: 'parsed_sf_rfid',
      label: 'RFID',
      sortable: true,
      width: '10%',
      format: (value) => value || 'N/A'
    },
    {
      id: 'sf_value_rating',
      label: 'Value Rating',
      sortable: true,
      align: 'center',
      width: '10%',
      format: (value) => value ? <Chip label={value} size="small" color={value >=4 ? "error" : value === 3 ? "warning" : "default"}/> : 'N/A'
    },
    {
      id: 'baseValueAmount',
      label: 'Base Value ($)',
      sortable: true,
      align: 'right',
      width: '10%',
      format: (value) => value.toLocaleString()
    },
    {
      id: 'sf_memory_type',
      label: 'Memory Type',
      sortable: true,
      width: '10%',
      format: (value) => value ? <Chip label={value} size="small" variant="outlined" /> : 'N/A'
    },
    {
      id: 'typeMultiplierValue',
      label: 'Multiplier',
      sortable: true,
      align: 'center',
      width: '10%',
      format: (value) => `x${value}`
    },
    {
      id: 'finalCalculatedValue',
      label: 'Final Value ($)',
      sortable: true,
      align: 'right',
      width: '10%',
      format: (value) => value.toLocaleString()
    },
    {
      id: 'discoveredVia',
      label: 'Discovered Via',
      sortable: true,
      width: '15%',
      format: (value) => value || 'N/A'
    }
  ], []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Memory Economy Data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{mt: 2}}>
        <Alert severity="error">Error loading element data: {error.message}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <PageHeader title="Memory Economy Dashboard" />
      <Paper sx={{ p: { xs: 1, sm: 2 } }} elevation={2}>
        {processedMemoryData.length === 0 && !isLoading && (
            <Alert severity="info" sx={{mb: 2}}>No memory-type elements found with economic data.</Alert>
        )}
        <DataTable
          columns={columns}
          data={processedMemoryData}
          isLoading={isLoading}
          initialSortBy="finalCalculatedValue"
          initialSortDirection="desc"
          emptyMessage="No memory elements match the current criteria."
        />
      </Paper>
    </Container>
  );
}

export default MemoryEconomyPage;
