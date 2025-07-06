/**
 * LoadingStates - Reusable loading state components
 * Provides consistent loading UI across the application
 */

import React from 'react';
import { Box, Skeleton, Paper, Divider, CircularProgress, Typography } from '@mui/material';

// Intelligence Panel loading skeleton
export const IntelligencePanelSkeleton = () => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Skeleton variant="text" width="60%" height={32} />
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
    <Divider sx={{ mb: 2 }} />
    <Box data-testid="loading-skeleton">
      <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={100} />
    </Box>
  </Paper>
);

// Generic loading spinner
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
    <div data-testid="loading-skeleton">
      <CircularProgress />
    </div>
    <Typography>{message}</Typography>
  </Box>
);

// Card skeleton for list items
export const CardSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="60%" />
  </Box>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5 }) => (
  <Box>
    <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} variant="rectangular" height={30} sx={{ mb: 0.5 }} />
    ))}
  </Box>
);

export default {
  IntelligencePanelSkeleton,
  LoadingSpinner,
  CardSkeleton,
  TableSkeleton
};