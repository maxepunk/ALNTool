import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import BuildIcon from '@mui/icons-material/Build';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getConstant } from '../hooks/useGameConstants';

const ProductionAnalysisPanels = ({ pathDistribution, productionStatus, gameConstants }) => {
  const getPathIcon = (path) => {
    switch (path) {
      case 'Black Market':
        return AccountBalanceIcon;
      case 'Detective':
        return SearchIcon;
      case 'Third Path':
        return GroupsIcon;
      default:
        return WarningIcon;
    }
  };

  const getPathTheme = (path) => {
    const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
    return pathThemes[path] || { color: 'default', icon: 'Help' };
  };

  const resolutionPaths = getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
  const allPaths = [...resolutionPaths, 'Unassigned'];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Path Distribution Analysis */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FlashOnIcon sx={{ mr: 1 }} />
            Resolution Path Distribution
          </Typography>
          <Grid container spacing={2}>
            {allPaths.map(path => {
              const theme = getPathTheme(path);
              const IconComponent = getPathIcon(path);
              
              return (
                <Grid key={path} item xs={6}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: `${theme.color}.light`, 
                    borderRadius: 1, 
                    color: `${theme.color}.contrastText` 
                  }}>
                    <IconComponent sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h5">{pathDistribution[path] || 0}</Typography>
                    <Typography variant="caption">{path}</Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Grid>

      {/* Production Pipeline */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }} elevation={2}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <BuildIcon sx={{ mr: 1 }} />
            Production Pipeline
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Badge badgeContent={productionStatus.toDesign} color="warning">
                  <DesignServicesIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary="To Design" 
                secondary={`${productionStatus.toDesign} tokens need design work`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Badge badgeContent={productionStatus.toBuild} color="info">
                  <BuildIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary="To Build" 
                secondary={`${productionStatus.toBuild} tokens in fabrication queue`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Badge badgeContent={productionStatus.ready} color="success">
                  <CheckCircleIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary="Production Ready" 
                secondary={`${productionStatus.ready} tokens completed and ready`}
              />
            </ListItem>
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

ProductionAnalysisPanels.propTypes = {
  pathDistribution: PropTypes.objectOf(PropTypes.number).isRequired,
  productionStatus: PropTypes.shape({
    toDesign: PropTypes.number.isRequired,
    toBuild: PropTypes.number.isRequired,
    ready: PropTypes.number.isRequired
  }).isRequired,
  gameConstants: PropTypes.object.isRequired
};

export default ProductionAnalysisPanels;