import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid, Card, CardContent, Typography, Box, Chip, LinearProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import MemoryIcon from '@mui/icons-material/Memory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';

const CharacterDashboardCards = ({ analytics }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Character Overview */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Character Roster</Typography>
            </Box>
            <Typography variant="h3" color="primary">{analytics.totalCharacters}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total characters in About Last Night
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Tier Distribution:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                <Chip label={`Core: ${analytics.tierDistribution.Core || 0}`} size="small" color="success" />
                <Chip label={`Sec: ${analytics.tierDistribution.Secondary || 0}`} size="small" color="info" />
                <Chip label={`Ter: ${analytics.tierDistribution.Tertiary || 0}`} size="small" color="default" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Three-Path Balance */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Path Balance</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />
                  <Typography variant="body2">Black Market</Typography>
                </Box>
                <Typography variant="h6" color="warning.main">{analytics.pathDistribution['Black Market'] || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
                  <Typography variant="body2">Detective</Typography>
                </Box>
                <Typography variant="h6" color="error.main">{analytics.pathDistribution['Detective'] || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon sx={{ fontSize: 16, mr: 0.5, color: 'secondary.main' }} />
                  <Typography variant="body2">Third Path</Typography>
                </Box>
                <Typography variant="h6" color="secondary.main">{analytics.pathDistribution['Third Path'] || 0}</Typography>
              </Box>
              {analytics.pathDistribution['Unassigned'] > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon sx={{ fontSize: 16, mr: 0.5, color: 'grey.500' }} />
                    <Typography variant="body2">Unassigned</Typography>
                  </Box>
                  <Typography variant="h6" color="warning.main">{analytics.pathDistribution['Unassigned'] || 0}</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Memory Economy */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MemoryIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Memory Economy</Typography>
            </Box>
            <Typography variant="h3" color="info">{analytics.memoryEconomy.totalTokens}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total memory tokens
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(analytics.memoryEconomy.totalTokens / 55) * 100}
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              color={analytics.memoryEconomy.totalTokens >= 50 ? 'success' : 'warning'}
            />
            <Typography variant="caption" color="text.secondary">
              {analytics.memoryEconomy.avgPerCharacter} avg per character
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Production Readiness */}
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssessmentIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Production Ready</Typography>
            </Box>
            <Typography variant="h3" color="success">{analytics.productionReadiness.ready}</Typography>
            <Typography variant="body2" color="text.secondary">
              Characters fully configured
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={analytics.totalCharacters > 0 ? (analytics.productionReadiness.ready / analytics.totalCharacters * 100) : 0}
              sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              color="success"
            />
            <Typography variant="caption" color="text.secondary">
              {analytics.productionReadiness.needsWork} need configuration
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

CharacterDashboardCards.propTypes = {
  analytics: PropTypes.shape({
    totalCharacters: PropTypes.number.isRequired,
    tierDistribution: PropTypes.shape({
      Core: PropTypes.number,
      Secondary: PropTypes.number,
      Tertiary: PropTypes.number,
    }).isRequired,
    pathDistribution: PropTypes.shape({
      'Black Market': PropTypes.number,
      'Detective': PropTypes.number,
      'Third Path': PropTypes.number,
      'Unassigned': PropTypes.number,
    }).isRequired,
    memoryEconomy: PropTypes.shape({
      totalTokens: PropTypes.number.isRequired,
      avgPerCharacter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
    productionReadiness: PropTypes.shape({
      ready: PropTypes.number.isRequired,
      needsWork: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export default CharacterDashboardCards;