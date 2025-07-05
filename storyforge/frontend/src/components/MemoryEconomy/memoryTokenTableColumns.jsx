import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Chip } from '@mui/material';
import { getConstant } from '../../hooks/useGameConstants';

export const getMemoryTokenTableColumns = (workshopMode, gameConstants) => {
  const baseColumns = [
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
  ];

  const workshopColumns = workshopMode ? [
    {
      id: 'resolutionPath',
      label: 'Resolution Path',
      sortable: true,
      width: '10%',
      format: (value) => {
        const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
        const color = pathThemes[value]?.color || 'default';
        return <Chip label={value} size="small" color={color} variant="outlined" />;
      }
    },
    {
      id: 'status',
      label: 'Production Status',
      sortable: true,
      width: '8%',
      format: (value) => {
        const statusColors = getConstant(gameConstants, 'PRODUCTION_STATUS.COLORS', {});
        const color = statusColors[value] || statusColors['Unknown'] || 'default';
        return <Chip label={value || 'Unknown'} size="small" color={color} />;
      }
    }
  ] : [];

  return [...baseColumns, ...workshopColumns];
};