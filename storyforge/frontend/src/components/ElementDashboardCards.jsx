import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress, Chip
} from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import MemoryIcon from '@mui/icons-material/Memory';
import BuildIcon from '@mui/icons-material/Build';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getConstant } from '../hooks/useGameConstants';

const ElementDashboardCards = ({ analytics, gameConstants }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Element Overview */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ExtensionIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Element Library</Typography>
            </Box>
            <Typography variant="h3" color="primary">{analytics.totalElements}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total game elements
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Type Breakdown:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                {Object.entries(analytics.typeDistribution).slice(0, 3).map(([type, count]) => (
                  <Chip key={type} label={`${type}: ${count}`} size="small" color="default" />
                ))}
                {Object.keys(analytics.typeDistribution).length > 3 && (
                  <Chip label={`+${Object.keys(analytics.typeDistribution).length - 3} more`} size="small" color="default" />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Memory Economy */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MemoryIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Memory Economy</Typography>
            </Box>
            <Typography variant="h3" color="secondary">{analytics.memoryTokens.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              Memory tokens in game
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(analytics.memoryTokens.total / getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55)) * 100}
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              color={analytics.memoryTokens.total >= getConstant(gameConstants, 'MEMORY_VALUE.MIN_TOKEN_COUNT', 50) ? 'success' : 'warning'}
            />
            <Typography variant="caption" color="text.secondary">
              Target: {getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55)} tokens ({analytics.memoryTokens.ready} ready)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Production Status */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BuildIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Production Status</Typography>
            </Box>
            <Typography variant="h3" color="success">{analytics.productionStatus.ready}</Typography>
            <Typography variant="body2" color="text.secondary">
              Elements ready for production
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.totalElements > 0 ? (analytics.productionStatus.ready / analytics.totalElements * 100) : 0}
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              color="success"
            />
            <Typography variant="caption" color="text.secondary">
              {analytics.productionStatus.inProgress} in progress, {analytics.productionStatus.needsWork} need work
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Act Distribution */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Act Distribution</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Act 1</Typography>
                <Typography variant="h6" color="primary">{analytics.actDistribution['Act 1']}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Act 2</Typography>
                <Typography variant="h6" color="secondary">{analytics.actDistribution['Act 2']}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Act 3</Typography>
                <Typography variant="h6" color="info">{analytics.actDistribution['Act 3']}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

ElementDashboardCards.propTypes = {
  analytics: PropTypes.shape({
    totalElements: PropTypes.number.isRequired,
    memoryTokens: PropTypes.shape({
      total: PropTypes.number.isRequired,
      ready: PropTypes.number.isRequired,
      inDevelopment: PropTypes.number.isRequired,
    }).isRequired,
    productionStatus: PropTypes.shape({
      ready: PropTypes.number.isRequired,
      inProgress: PropTypes.number.isRequired,
      needsWork: PropTypes.number.isRequired,
    }).isRequired,
    actDistribution: PropTypes.shape({
      'Act 1': PropTypes.number.isRequired,
      'Act 2': PropTypes.number.isRequired,
      'Act 3': PropTypes.number.isRequired,
    }).isRequired,
    typeDistribution: PropTypes.object.isRequired,
  }).isRequired,
  gameConstants: PropTypes.object.isRequired,
};

export default ElementDashboardCards;