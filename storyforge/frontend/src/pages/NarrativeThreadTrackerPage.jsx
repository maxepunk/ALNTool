import React, { useState, useEffect } from 'react';
import { useQuery, useQueries } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Alert, Paper, Grid, List, ListItem, ListItemText,
  FormControl, InputLabel, Select, MenuItem, ListItemIcon, ListItemButton, Divider
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import PeopleIcon from '@mui/icons-material/People';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import TimelineIcon from '@mui/icons-material/Timeline';

const NarrativeThreadTrackerPage = () => {
  const navigate = useNavigate();
  const [selectedThread, setSelectedThread] = useState('');

  const { data: availableThreads, isLoading: threadsLoading, error: threadsError } = useQuery(
    'uniqueNarrativeThreads',
    api.getAllUniqueNarrativeThreads,
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const results = useQueries(
    selectedThread ? [
      { queryKey: ['charactersByThread', selectedThread], queryFn: () => api.getCharacters({ narrativeThreadContains: selectedThread }), enabled: !!selectedThread },
      { queryKey: ['elementsByThread', selectedThread], queryFn: () => api.getElements({ narrativeThreadContains: selectedThread }), enabled: !!selectedThread },
      { queryKey: ['puzzlesByThread', selectedThread], queryFn: () => api.getPuzzles({ narrativeThreadContains: selectedThread }), enabled: !!selectedThread },
      { queryKey: ['timelineEventsByThread', selectedThread], queryFn: () => api.getTimelineEvents({ narrativeThreadContains: selectedThread }), enabled: !!selectedThread },
    ] : [] // Don't run queries if no thread is selected
  );

  const charactersQuery = results.find(r => r.queryKey[0] === 'charactersByThread') || {};
  const elementsQuery = results.find(r => r.queryKey[0] === 'elementsByThread') || {};
  const puzzlesQuery = results.find(r => r.queryKey[0] === 'puzzlesByThread') || {};
  const timelineEventsQuery = results.find(r => r.queryKey[0] === 'timelineEventsByThread') || {};

  const isLoadingEntities = selectedThread ? results.some(query => query.isLoading) : false;
  const entityError = results.find(query => query.error)?.error;

  const handleThreadChange = (event) => {
    setSelectedThread(event.target.value);
  };

  const renderEntityList = (items, type, icon) => {
    if (!items || items.length === 0) {
      return <Typography color="text.secondary" sx={{pl:2, fontStyle:'italic'}}>No {type.toLowerCase()} found for this thread.</Typography>;
    }
    return (
      <List dense disablePadding>
        {items.map(item => (
          <ListItemButton key={item.id} onClick={() => navigate(`/${type.toLowerCase()}/${item.id}`)} sx={{borderRadius:1}}>
            <ListItemIcon sx={{minWidth: 36}}>{icon}</ListItemIcon>
            <ListItemText primary={item.name || item.puzzle || item.description} />
          </ListItemButton>
        ))}
      </List>
    );
  };

  return (
    <Box sx={{ m: 2 }}>
      <PageHeader title="Narrative Thread Tracker" />

      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="narrative-thread-select-label">Select Narrative Thread</InputLabel>
          <Select
            labelId="narrative-thread-select-label"
            value={selectedThread}
            label="Select Narrative Thread"
            onChange={handleThreadChange}
            disabled={threadsLoading || !!threadsError}
          >
            <MenuItem value="">
              <em>Select a Thread...</em>
            </MenuItem>
            {(availableThreads || []).map((thread) => (
              <MenuItem key={thread} value={thread}>
                {thread}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {threadsLoading && <CircularProgress size={20} sx={{mt:1}}/>}
        {threadsError && <Alert severity="error" sx={{mt:1}}>Error loading narrative threads: {threadsError.message}</Alert>}
        {!threadsLoading && !threadsError && (!availableThreads || availableThreads.length === 0) && (
          <Typography color="text.secondary" sx={{mt:1, textAlign: 'center'}}>No narrative threads found in the project.</Typography>
        )}
      </Paper>

      {!selectedThread && !threadsLoading && !threadsError && availableThreads && availableThreads.length > 0 && (
        <Typography sx={{textAlign: 'center', mt: 2, color: 'text.secondary'}}>
          Please select a narrative thread to view associated entities.
        </Typography>
      )}

      {selectedThread && (
        isLoadingEntities ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading entities for "{selectedThread}"...</Typography>
          </Box>
        ) : entityError ? (
          <Alert severity="error" sx={{mt: 2}}>Error loading entities: {entityError.message}</Alert>
        ) : (
          <Grid container spacing={2} sx={{mt: 1}}>
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{p:2, height:'100%'}} elevation={2}>
                <Typography variant="h6" gutterBottom>Characters ({charactersQuery.data?.length || 0})</Typography>
                <Divider sx={{mb:1}}/>
                {renderEntityList(charactersQuery.data, 'characters', <PeopleIcon color="primary"/>)}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{p:2, height:'100%'}} elevation={2}>
                <Typography variant="h6" gutterBottom>Elements ({elementsQuery.data?.length || 0})</Typography>
                 <Divider sx={{mb:1}}/>
                {renderEntityList(elementsQuery.data, 'elements', <InventoryIcon color="info"/>)}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{p:2, height:'100%'}} elevation={2}>
                <Typography variant="h6" gutterBottom>Puzzles ({puzzlesQuery.data?.length || 0})</Typography>
                 <Divider sx={{mb:1}}/>
                {renderEntityList(puzzlesQuery.data, 'puzzles', <ExtensionIcon color="success"/>)}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Paper sx={{p:2, height:'100%'}} elevation={2}>
                <Typography variant="h6" gutterBottom>Timeline Events ({timelineEventsQuery.data?.length || 0})</Typography>
                 <Divider sx={{mb:1}}/>
                {renderEntityList(timelineEventsQuery.data, 'timeline', <TimelineIcon color="secondary"/>)}
              </Paper>
            </Grid>
          </Grid>
        )
      )}
    </Box>
  );
};

export default NarrativeThreadTrackerPage;
