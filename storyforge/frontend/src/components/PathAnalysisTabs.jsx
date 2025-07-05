import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, Tabs, Tab, Alert, List, ListItem,
  ListItemText, ListItemIcon, Chip, Divider, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import { getConstant } from '../hooks/useGameConstants';

const PathAnalysisTabs = ({ pathAnalysis, gameConstants }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  
  const knownPaths = getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
  const unassignedPath = getConstant(gameConstants, 'RESOLUTION_PATHS.DEFAULT', 'Unassigned');
  const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
  
  const { pathDistribution, pathResources, crossPathDependencies } = pathAnalysis;

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Paper sx={{ mb: 3 }} elevation={2}>
      <Tabs value={selectedTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Resource Distribution" />
        <Tab label="Cross-Path Dependencies" />
        <Tab label="Character Assignments" />
      </Tabs>
      
      {/* Resource Distribution Tab */}
      {selectedTab === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Resource Allocation by Path</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Resolution Path</TableCell>
                  <TableCell align="right">Characters</TableCell>
                  <TableCell align="right">Elements</TableCell>
                  <TableCell align="right">Memory Tokens</TableCell>
                  <TableCell align="right">Puzzles</TableCell>
                  <TableCell align="right">Timeline Events</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Production Ready</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {knownPaths.map(path => {
                  const resources = pathResources[path] || {};
                  const pathConfig = pathThemes[path] || { color: 'default' };
                  const IconComponent = path === 'Black Market' ? AccountBalanceIcon :
                                       path === 'Detective' ? SearchIcon :
                                       path === 'Third Path' ? GroupsIcon : WarningIcon;
                  
                  return (
                    <TableRow key={path}>
                      <TableCell>
                        <Chip 
                          label={path} 
                          color={pathConfig.color}
                          icon={React.createElement(IconComponent)}
                        />
                      </TableCell>
                      <TableCell align="right">{resources.characters || 0}</TableCell>
                      <TableCell align="right">{resources.elements || 0}</TableCell>
                      <TableCell align="right">{resources.memoryTokens || 0}</TableCell>
                      <TableCell align="right">{resources.puzzles || 0}</TableCell>
                      <TableCell align="right">{resources.timelineEvents || 0}</TableCell>
                      <TableCell align="right">${(resources.totalValue || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${resources.readyElements || 0}/${resources.elements || 0}`}
                          color={resources.elements > 0 && resources.readyElements / resources.elements >= 0.7 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {/* Cross-Path Dependencies Tab */}
      {selectedTab === 1 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Cross-Path Dependencies</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Elements and characters that affect multiple resolution paths
          </Typography>
          
          {crossPathDependencies.length === 0 ? (
            <Alert severity="success">No cross-path dependencies detected. All paths are independent.</Alert>
          ) : (
            <List>
              {crossPathDependencies.map((dependency, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Chip 
                        label={dependency.type}
                        color={dependency.impact === 'high' ? 'error' : dependency.impact === 'medium' ? 'warning' : 'info'}
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={dependency.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">{dependency.description}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {dependency.paths.map(path => (
                              <Chip 
                                key={path}
                                label={path} 
                                size="small" 
                                color={pathThemes[path]?.color || 'default'}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < crossPathDependencies.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}
      
      {/* Character Assignments Tab */}
      {selectedTab === 2 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Character Path Assignments</Typography>
          
          {pathDistribution[unassignedPath]?.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {pathDistribution[unassignedPath].length} characters need resolution path assignment
            </Alert>
          )}
          
          <Grid container spacing={2}>
            {knownPaths.concat([unassignedPath]).map(path => {
              const characters = pathDistribution[path] || [];
              const pathConfig = pathThemes[path];
              const IconComponent = path === 'Black Market' ? AccountBalanceIcon :
                                   path === 'Detective' ? SearchIcon :
                                   path === 'Third Path' ? GroupsIcon : WarningIcon;
              
              return (
                <Grid item xs={12} md={6} lg={3} key={path}>
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      {pathConfig ? (
                        <>
                          <IconComponent sx={{ mr: 1, fontSize: 20 }} />
                          {path}
                        </>
                      ) : (
                        <>
                          <WarningIcon sx={{ mr: 1, fontSize: 20, color: 'warning.main' }} />
                          {path}
                        </>
                      )}
                    </Typography>
                    
                    <Typography variant="h4" color={pathConfig?.color ? `${pathConfig.color}.main` : 'warning.main'}>
                      {characters.length}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      characters assigned
                    </Typography>
                    
                    {characters.length > 0 && (
                      <Box sx={{ mt: 1, maxHeight: 150, overflowY: 'auto' }}>
                        {characters.slice(0, 5).map(char => (
                          <Chip 
                            key={char.id}
                            label={char.name}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                            component={RouterLink}
                            to={`/characters/${char.id}`}
                            clickable
                          />
                        ))}
                        {characters.length > 5 && (
                          <Typography variant="caption" color="text.secondary">
                            +{characters.length - 5} more
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

PathAnalysisTabs.propTypes = {
  pathAnalysis: PropTypes.shape({
    pathDistribution: PropTypes.object,
    pathResources: PropTypes.object,
    crossPathDependencies: PropTypes.array
  }).isRequired,
  gameConstants: PropTypes.object.isRequired
};

export default PathAnalysisTabs;