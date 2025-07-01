import React from 'react';
import PropTypes from 'prop-types';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  LinearProgress, Chip
} from '@mui/material';
import BalanceIcon from '@mui/icons-material/Balance';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { getConstant } from '../hooks/useGameConstants';

const PathBalanceOverview = ({ pathAnalysis, gameConstants }) => {
  const knownPaths = getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
  const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
  
  const { pathDistribution, pathResources, balanceMetrics, crossPathDependencies } = pathAnalysis;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <BalanceIcon sx={{ mr: 1 }} />
            Three-Path Balance Overview
          </Typography>
          <Grid container spacing={2}>
            {knownPaths.map(path => {
              const pathConfig = pathThemes[path] || { color: 'default', theme: 'Unknown' };
              const IconComponent = path === 'Black Market' ? AccountBalanceIcon :
                                   path === 'Detective' ? SearchIcon :
                                   path === 'Third Path' ? GroupsIcon : HelpOutlineIcon;
              const resources = pathResources[path] || {};
              
              return (
                <Grid item xs={12} md={4} key={path}>
                  <Card sx={{ height: '100%', bgcolor: `${pathConfig.color}.light`, color: `${pathConfig.color}.contrastText` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconComponent sx={{ fontSize: 28, mr: 1 }} />
                        <Box>
                          <Typography variant="h6">{path}</Typography>
                          <Typography variant="caption">{pathConfig.theme}</Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="h3" sx={{ mb: 1 }}>{resources.characters || 0}</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>Characters</Typography>
                      
                      <Grid container spacing={1} sx={{ fontSize: 'small' }}>
                        <Grid item xs={6}>
                          <Typography variant="caption">Elements: {resources.elements || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Puzzles: {resources.puzzles || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Memory: {resources.memoryTokens || 0}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption">Ready: {resources.readyElements || 0}</Typography>
                        </Grid>
                      </Grid>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={resources.elements > 0 ? (resources.readyElements / resources.elements * 100) : 0}
                        sx={{ mt: 2, height: 6, borderRadius: 3 }}
                        color="inherit"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            Balance Metrics
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Character Balance</Typography>
            <LinearProgress 
              variant="determinate" 
              value={balanceMetrics.characterBalance || 0}
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
              color={balanceMetrics.characterBalance >= 80 ? 'success' : balanceMetrics.characterBalance >= 60 ? 'warning' : 'error'}
            />
            <Typography variant="body2" color="text.secondary">
              {Math.round(balanceMetrics.characterBalance || 0)}% balanced
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Cross-Path Dependencies</Typography>
            <Chip 
              label={`${crossPathDependencies?.length || 0} dependencies`}
              color={crossPathDependencies?.length <= 5 ? 'success' : crossPathDependencies?.length <= 8 ? 'warning' : 'error'}
              icon={<SwapHorizIcon />}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>Unassigned Characters</Typography>
            <Typography variant="h4" color={pathDistribution?.['Unassigned']?.length > 0 ? 'warning.main' : 'success.main'}>
              {pathDistribution?.['Unassigned']?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need path assignment
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

PathBalanceOverview.propTypes = {
  pathAnalysis: PropTypes.shape({
    pathDistribution: PropTypes.object,
    pathResources: PropTypes.object,
    balanceMetrics: PropTypes.shape({
      characterBalance: PropTypes.number,
      crossPathComplexity: PropTypes.number
    }),
    crossPathDependencies: PropTypes.array
  }).isRequired,
  gameConstants: PropTypes.object.isRequired
};

export default PathBalanceOverview;