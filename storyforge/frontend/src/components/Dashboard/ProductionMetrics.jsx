import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';

const ProductionMetrics = ({ 
  blackMarketCount = 0, 
  detectiveCount = 0, 
  thirdPathCount = 0, 
  charactersWithPaths = [],
  gameConstants,
  getConstant = () => 3
}) => {
  const pathImbalanceThreshold = getConstant(gameConstants, 'DASHBOARD.PATH_IMBALANCE_THRESHOLD', 3);
  const maxPathCount = Math.max(blackMarketCount || 0, detectiveCount || 0, thirdPathCount || 0);
  const minPathCount = Math.min(blackMarketCount || 0, detectiveCount || 0, thirdPathCount || 0);
  const isImbalanced = maxPathCount - minPathCount > pathImbalanceThreshold;

  return (
    <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <SwapHorizIcon sx={{ mr: 1 }} />
        Three-Path Balance Monitor
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.contrastText' }}>
            <AccountBalanceIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4">{blackMarketCount || 0}</Typography>
            <Typography variant="body2">Black Market</Typography>
            <Typography variant="caption">Wealth Path</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.contrastText' }}>
            <SearchIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4">{detectiveCount || 0}</Typography>
            <Typography variant="body2">Detective</Typography>
            <Typography variant="caption">Truth Path</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1, color: 'secondary.contrastText' }}>
            <GroupsIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4">{thirdPathCount || 0}</Typography>
            <Typography variant="body2">Third Path</Typography>
            <Typography variant="caption">Community Path</Typography>
          </Box>
        </Grid>
      </Grid>
      {(charactersWithPaths?.length || 0) > 0 && (
        <Alert severity={isImbalanced ? "warning" : "success"} sx={{ mt: 2 }}>
          {isImbalanced
            ? "Path imbalance detected - consider redistributing character paths"
            : "Three paths are well balanced"}
        </Alert>
      )}
    </Paper>
  );
};

export default ProductionMetrics;