import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { getConstant } from '../hooks/useGameConstants';

const MemoryEconomyDashboard = ({ analytics, gameConstants }) => {
  const { economyStats, productionStatus, balanceAnalysis } = analytics;
  
  const targetTokens = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);
  const minTokens = getConstant(gameConstants, 'MEMORY_VALUE.MIN_TOKEN_COUNT', 50);
  const maxTokens = getConstant(gameConstants, 'MEMORY_VALUE.MAX_TOKEN_COUNT', 60);
  
  const tokenProgressValue = (economyStats.totalTokens / targetTokens) * 100;
  const productionProgressValue = (productionStatus.ready / economyStats.totalTokens) * 100;
  
  const isTokenCountInRange = economyStats.totalTokens >= minTokens && economyStats.totalTokens <= maxTokens;
  
  const getBalanceScore = () => {
    if (balanceAnalysis.issues.length === 0) return 'A+';
    if (balanceAnalysis.issues.length === 1) return 'B';
    return 'C';
  };
  
  const getBalanceColor = () => {
    if (balanceAnalysis.issues.length === 0) return 'success';
    return 'warning';
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MemoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Token Economy</Typography>
            </Box>
            <Typography variant="h3" color="primary">{economyStats.totalTokens}</Typography>
            <Typography variant="body2" color="text.secondary">
              of {targetTokens} target tokens
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={tokenProgressValue} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
              color={isTokenCountInRange ? 'success' : 'warning'}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Production Ready</Typography>
            </Box>
            <Typography variant="h3" color="success">{productionStatus.ready}</Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(productionProgressValue)}% complete
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={productionProgressValue} 
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
              color="success"
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Value</Typography>
            </Box>
            <Typography variant="h3" color="info">${economyStats.totalValue.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Economic potential</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Balance Score</Typography>
            </Box>
            <Typography variant="h3" color={getBalanceColor()}>
              {getBalanceScore()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {balanceAnalysis.issues.length} issues detected
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

MemoryEconomyDashboard.propTypes = {
  analytics: PropTypes.shape({
    economyStats: PropTypes.shape({
      totalTokens: PropTypes.number.isRequired,
      completedTokens: PropTypes.number.isRequired,
      totalValue: PropTypes.number.isRequired
    }).isRequired,
    productionStatus: PropTypes.shape({
      toDesign: PropTypes.number.isRequired,
      toBuild: PropTypes.number.isRequired,
      ready: PropTypes.number.isRequired
    }).isRequired,
    balanceAnalysis: PropTypes.shape({
      issues: PropTypes.arrayOf(PropTypes.string).isRequired,
      recommendations: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired
  }).isRequired,
  gameConstants: PropTypes.object.isRequired
};

export default MemoryEconomyDashboard;