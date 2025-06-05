import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

function NarrativeThreadTrackerPage() {
  const [selectedThread, setSelectedThread] = useState('');
  const [uniqueThreads, setUniqueThreads] = useState([]);

  // Fetch unique narrative threads for the dropdown
  const { data: threadsData, isLoading: isLoadingThreads, error: threadsError } = useQuery(
    'uniqueNarrativeThreads',
    api.getUniqueNarrativeThreads,
    {
      onSuccess: (data) => {
        setUniqueThreads(data || []);
      },
    }
  );

  // Fetch Characters for selected thread
  const { data: charactersData, isLoading: isLoadingCharacters, error: charactersError } = useQuery(
    ['charactersByThread', selectedThread],
    () => api.getCharacters({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  // Fetch Elements for selected thread
  const { data: elementsData, isLoading: isLoadingElements, error: elementsError } = useQuery(
    ['elementsByThread', selectedThread],
    () => api.getElements({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  // Fetch Puzzles for selected thread
  const { data: puzzlesData, isLoading: isLoadingPuzzles, error: puzzlesError } = useQuery(
    ['puzzlesByThread', selectedThread],
    () => api.getPuzzles({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  // Fetch Timeline Events for selected thread
  const { data: timelineEventsData, isLoading: isLoadingTimelineEvents, error: timelineEventsError } = useQuery(
    ['timelineEventsByThread', selectedThread],
    () => api.getTimelineEvents({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  const handleThreadChange = (event) => {
    setSelectedThread(event.target.value);
  };

  const anyLoading = isLoadingCharacters || isLoadingElements || isLoadingPuzzles || isLoadingTimelineEvents;

  const processedNarrativeData = useMemo(() => {
    if (!selectedThread || !timelineEventsData || !charactersData || !elementsData || !puzzlesData) {
      return { chronologicalEntries: [], orphanedItems: { characters: [], elements: [], puzzles: [] } };
    }

    const allCharsMap = new Map(charactersData.map(c => [c.id, c]));
    const allElemsMap = new Map(elementsData.map(e => [e.id, e]));
    const allPuzzlesMap = new Map(puzzlesData.map(p => [p.id, p]));

    const associatedItemIds = new Set();

    const sortedEvents = [...timelineEventsData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1; // Put events without valid dates at the end
      if (isNaN(dateB)) return -1;
      return dateA - dateB;
    });

    const chronologicalEntries = sortedEvents.map(event => {
      const entry = {
        type: 'TimelineEventEntry',
        event,
        associatedCharacters: [],
        associatedElements: [],
        associatedPuzzles: [],
      };

      (event.charactersInvolved || []).forEach(charRef => {
        if (allCharsMap.has(charRef.id)) {
          entry.associatedCharacters.push(allCharsMap.get(charRef.id));
          associatedItemIds.add(charRef.id);
        }
      });
      (event.memoryEvidence || []).forEach(elemRef => {
        if (allElemsMap.has(elemRef.id)) {
          entry.associatedElements.push(allElemsMap.get(elemRef.id));
          associatedItemIds.add(elemRef.id);
        }
      });
      // Simple puzzle association: if puzzle's actFocus matches event's actFocus
      puzzlesData.forEach(puzzle => {
        if (puzzle.properties?.actFocus && event.properties?.actFocus && puzzle.properties.actFocus === event.properties.actFocus) {
          if (allPuzzlesMap.has(puzzle.id) && !entry.associatedPuzzles.find(p=>p.id === puzzle.id)) { // Avoid duplicates if multiple criteria match
             entry.associatedPuzzles.push(allPuzzlesMap.get(puzzle.id));
             associatedItemIds.add(puzzle.id);
          }
        }
      });
      return entry;
    });

    const orphanedItems = {
      characters: charactersData.filter(c => !associatedItemIds.has(c.id)),
      elements: elementsData.filter(e => !associatedItemIds.has(e.id)),
      puzzles: puzzlesData.filter(p => !associatedItemIds.has(p.id)),
    };

    return { chronologicalEntries, orphanedItems };

  }, [selectedThread, timelineEventsData, charactersData, elementsData, puzzlesData]);

  const renderAssociatedItem = (item, type) => (
    <ListItem key={item.id} dense component={RouterLink} to={`/${type.toLowerCase()}/${item.id}`} sx={{py:0.25, '&:hover': {bgcolor: 'action.hover', borderRadius:1}}}>
      <ListItemText
        primary={<Typography variant="body2">{item.name || item.description || item.puzzle}</Typography>}
        secondary={<Chip label={item.basicType || item.tier || item.timing || type.slice(0,-1)} size="small" variant="outlined" sx={{fontSize: '0.7rem', height: 'auto', lineHeight: 1.2, py:0.1}}/>}
      />
    </ListItem>
  );

  return (
    <Container maxWidth="xl">
      <PageHeader title="Narrative Thread Tracker" />

      <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
        <FormControl fullWidth disabled={isLoadingThreads}>
          <InputLabel id="narrative-thread-select-label">Select Narrative Thread</InputLabel>
          <Select
            labelId="narrative-thread-select-label"
            value={selectedThread}
            label="Select Narrative Thread"
            onChange={handleThreadChange}
          >
            <MenuItem value="">
              <em>None (Select a thread to view associated entities)</em>
            </MenuItem>
            {isLoadingThreads && <MenuItem value="" disabled><CircularProgress size={20} sx={{mr:1}}/> Loading threads...</MenuItem>}
            {threadsError && <MenuItem value="" disabled><Alert severity="error" sx={{width: '100%'}}>Error loading threads: {threadsError.message}</Alert></MenuItem>}
            {uniqueThreads.map((thread) => (
              <MenuItem key={thread} value={thread}>
                {thread}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedThread && (
        <Box>
          {anyLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, my: 2 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading items for thread: "{selectedThread}"...</Typography>
            </Box>
          )}

          {!anyLoading && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{mb:2}}>Chronological Flow for "{selectedThread}"</Typography>
              {processedNarrativeData.chronologicalEntries.length === 0 && !anyLoading && (
                <Alert severity="info">No timeline events found for this narrative thread. Orphaned items might be listed below.</Alert>
              )}
              {processedNarrativeData.chronologicalEntries.map((entry, index) => (
                <Card key={entry.event.id || index} sx={{ mb: 2 }} variant="outlined">
                  <CardHeader
                    titleTypographyProps={{variant:'h6'}}
                    title={`${entry.event.description || 'Event'} (${new Date(entry.event.date).toLocaleDateString() || 'No Date'})`}
                    subheader={entry.event.properties?.actFocus ? `Act Focus: ${entry.event.properties.actFocus}` : null}
                    sx={{pb:1, bgcolor: 'rgba(255,255,255,0.03)'}}
                  />
                  <CardContent sx={{pt:1}}>
                    <Grid container spacing={2}>
                      {entry.associatedCharacters.length > 0 && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">Characters</Typography>
                          <List dense disablePadding>{entry.associatedCharacters.map(item => renderAssociatedItem(item, 'characters'))}</List>
                        </Grid>
                      )}
                      {entry.associatedElements.length > 0 && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">Elements</Typography>
                          <List dense disablePadding>{entry.associatedElements.map(item => renderAssociatedItem(item, 'elements'))}</List>
                        </Grid>
                      )}
                      {entry.associatedPuzzles.length > 0 && (
                        <Grid item xs={12} sm={6} md={3}>
                           <Typography variant="subtitle2" color="text.secondary">Puzzles (Related by Act)</Typography>
                          <List dense disablePadding>{entry.associatedPuzzles.map(item => renderAssociatedItem(item, 'puzzles'))}</List>
                        </Grid>
                      )}
                    </Grid>
                    {entry.associatedCharacters.length === 0 && entry.associatedElements.length === 0 && entry.associatedPuzzles.length === 0 && (
                        <Typography variant="caption" color="text.secondary">No directly associated items for this event within the selected thread.</Typography>
                    )}
                  </CardContent>
                </Card>
              ))}

              {(processedNarrativeData.orphanedItems.characters.length > 0 ||
                processedNarrativeData.orphanedItems.elements.length > 0 ||
                processedNarrativeData.orphanedItems.puzzles.length > 0) && (
                <Box mt={4}>
                  <Typography variant="h5" gutterBottom sx={{mb:2}}>Other Items in "{selectedThread}" (Not directly tied to a Timeline Event in this thread)</Typography>
                  <Grid container spacing={2}>
                    {processedNarrativeData.orphanedItems.characters.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom component="div" sx={{px:1}}>Orphaned Characters</Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}><List dense disablePadding>{processedNarrativeData.orphanedItems.characters.map(item => renderAssociatedItem(item, 'characters'))}</List></Paper>
                      </Grid>
                    )}
                    {processedNarrativeData.orphanedItems.elements.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom component="div" sx={{px:1}}>Orphaned Elements</Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}><List dense disablePadding>{processedNarrativeData.orphanedItems.elements.map(item => renderAssociatedItem(item, 'elements'))}</List></Paper>
                      </Grid>
                    )}
                    {processedNarrativeData.orphanedItems.puzzles.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom component="div" sx={{px:1}}>Orphaned Puzzles</Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}><List dense disablePadding>{processedNarrativeData.orphanedItems.puzzles.map(item => renderAssociatedItem(item, 'puzzles'))}</List></Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
      {!selectedThread && !isLoadingThreads && (
        <Paper sx={{p:3, mt:3, textAlign: 'center'}}>
            <Typography variant="h6" color="text.secondary" sx={{mb:1}}>Welcome to the Narrative Thread Tracker!</Typography>
            <Typography color="text.secondary">
                Please select a narrative thread from the dropdown above to view all associated game entities.
            </Typography>
            {threadsError && <Alert severity="warning" sx={{mt:2}}>Could not load narrative threads. Please try refreshing the application.</Alert>}
        </Paper>
      )}
    </Container>
  );
}

export default NarrativeThreadTrackerPage;
