import React, { useState, useMemo } from 'react';
import { useQueries } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Alert, Paper, Grid, List, ListItem, ListItemText,
  Chip, Divider, Tabs, Tab, ListItemIcon, ListItemButton
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import PeopleIcon from '@mui/icons-material/People';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // For Unassigned

const KNOWN_RESOLUTION_PATHS = ["Black Market", "Detective", "Third Path"];
const UNASSIGNED_PATH = "Unassigned";

const ResolutionPathAnalyzerPage = () => {
  const navigate = useNavigate();
  const [selectedPathTab, setSelectedPathTab] = useState(0); // Index for Tabs

  const results = useQueries([
    { queryKey: 'allCharactersForPathAnalyzer', queryFn: () => api.getAllCharactersWithSociogramData() },
    { queryKey: 'allPuzzlesForPathAnalyzer', queryFn: () => api.getPuzzles() },
    { queryKey: 'allElementsForPathAnalyzer', queryFn: () => api.getElements() },
  ]);

  const isLoading = results.some(query => query.isLoading);
  const error = results.find(query => query.error)?.error;

  const characters = results[0]?.data || [];
  const puzzles = results[1]?.data || [];
  const elements = results[2]?.data || [];

  const pathData = useMemo(() => {
    const aggregator = {};
    [...KNOWN_RESOLUTION_PATHS, UNASSIGNED_PATH].forEach(path => {
      aggregator[path] = { count: 0, characters: [], puzzles: [], elements: [] };
    });

    characters.forEach(char => {
      const paths = char.resolutionPaths || [];
      if (paths.length === 0) {
        aggregator[UNASSIGNED_PATH].characters.push(char);
        aggregator[UNASSIGNED_PATH].count++;
      } else {
        paths.forEach(path => {
          if (aggregator[path]) {
            aggregator[path].characters.push(char);
            aggregator[path].count++;
          } else {
            // Handle unexpected path if necessary, or ignore
          }
        });
      }
    });

    puzzles.forEach(puzzle => {
      const paths = puzzle.resolutionPaths || []; // Assuming puzzles have this field from backend
      if (paths.length === 0) {
        aggregator[UNASSIGNED_PATH].puzzles.push(puzzle);
        aggregator[UNASSIGNED_PATH].count++;
      } else {
        paths.forEach(path => {
          if (aggregator[path]) {
            aggregator[path].puzzles.push(puzzle);
            aggregator[path].count++;
          }
        });
      }
    });

    elements.forEach(el => {
      const paths = el.properties?.resolutionPaths || []; // Elements have it under properties
      if (paths.length === 0) {
        aggregator[UNASSIGNED_PATH].elements.push(el);
        aggregator[UNASSIGNED_PATH].count++;
      } else {
        paths.forEach(path => {
          if (aggregator[path]) {
            aggregator[path].elements.push(el);
            aggregator[path].count++;
          }
        });
      }
    });
    return aggregator;
  }, [characters, puzzles, elements]);

  const handleTabChange = (event, newValue) => {
    setSelectedPathTab(newValue);
  };

  const allPathsForTabs = [...KNOWN_RESOLUTION_PATHS, UNASSIGNED_PATH];
  const currentSelectedPathName = allPathsForTabs[selectedPathTab];
  const currentPathData = pathData[currentSelectedPathName];

  const renderEntityList = (items, itemType, icon) => {
    if (!items || items.length === 0) {
      return <Typography color="text.secondary" sx={{pl:2, fontStyle:'italic'}}>No {itemType.toLowerCase()} contribute to this path.</Typography>;
    }
    return (
      <List dense disablePadding>
        {items.map(item => (
          <ListItemButton
            key={item.id}
            onClick={() => navigate(`/${itemType.toLowerCase()}/${item.id}`)}
            sx={{borderRadius:1}}
          >
            <ListItemIcon sx={{minWidth: 36}}>{icon}</ListItemIcon>
            <ListItemText primary={item.name || item.puzzle || item.description /* puzzles use .puzzle, timeline .description */} />
          </ListItemButton>
        ))}
      </List>
    );
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Resolution Path Data...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{m:2}}>Error loading data: {error.message || 'An unknown error occurred.'}</Alert>;
  }

  return (
    <Box sx={{ m: 2 }}>
      <PageHeader title="Resolution Path Analyzer" />

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Typography variant="h6" gutterBottom>Path Contribution Summary</Typography>
        <Grid container spacing={1}>
          {allPathsForTabs.map(pathName => (
            <Grid item xs={12} sm={6} md={3} key={pathName}>
              <Paper variant="outlined" sx={{p:1.5, textAlign:'center'}}>
                <Typography variant="subtitle1">{pathName}</Typography>
                <Typography variant="h5" color="primary">{pathData[pathName]?.count || 0}</Typography>
                <Typography variant="caption" color="text.secondary">contributing items</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={1}>
        <Tabs
          value={selectedPathTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Resolution Paths"
        >
          {allPathsForTabs.map((pathName) => (
            <Tab key={pathName} label={`${pathName} (${pathData[pathName]?.count || 0})`} />
          ))}
        </Tabs>
        <Divider />

        {currentPathData && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>Characters ({currentPathData.characters.length})</Typography>
                {renderEntityList(currentPathData.characters, 'characters', <PeopleIcon color="primary"/>)}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>Puzzles ({currentPathData.puzzles.length})</Typography>
                {renderEntityList(currentPathData.puzzles, 'puzzles', <ExtensionIcon color="success"/>)}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>Elements ({currentPathData.elements.length})</Typography>
                {renderEntityList(currentPathData.elements, 'elements', <InventoryIcon color="info"/>)}
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ResolutionPathAnalyzerPage;
