import React, { useState, useMemo } from 'react';
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
  Alert,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import PageHeader from '../components/PageHeader';
import { NARRATIVE_THREADS } from '../utils/narrativeConstants';
import { useNarrativeData, useLegacyThreadData } from '../hooks/useNarrativeData';
import { analyzeNarrativeCoherence, processLegacyNarrativeData } from '../utils/narrativeAnalysis';
import CoherenceOverview from '../components/NarrativeThread/CoherenceOverview';
import ThreadAnalysisCards from '../components/NarrativeThread/ThreadAnalysisCards';
import ThreadAnalysisSection from '../components/NarrativeThread/ThreadAnalysisSection';
import NarrativeFooter from '../components/NarrativeThread/NarrativeFooter';

function NarrativeThreadTrackerPage() {
  const [selectedThread, setSelectedThread] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [coherenceMode, setCoherenceMode] = useState(true);
  
  // Comprehensive narrative analysis data
  const { 
    data: { characters: charactersData, elements: elementsData, puzzles: puzzlesData, timelineEvents: timelineEventsData },
    isLoading,
    error: narrativeError,
    hasCompleteData
  } = useNarrativeData();
  
  // Legacy thread-specific data
  const {
    uniqueThreads,
    threadsError,
    isLoadingThreads,
    legacyData: { 
      characters: legacyCharactersData, 
      elements: legacyElementsData, 
      puzzles: legacyPuzzlesData, 
      timelineEvents: legacyTimelineEventsData 
    },
    legacyLoading: { anyLoading }
  } = useLegacyThreadData(selectedThread);

  const handleThreadChange = (event) => {
    setSelectedThread(event.target.value);
  };

  // Comprehensive Narrative Thread Analysis using utility functions
  const narrativeAnalysis = useMemo(() => {
    return analyzeNarrativeCoherence({
      characters: charactersData,
      elements: elementsData,
      puzzles: puzzlesData,
      timelineEvents: timelineEventsData
    });
  }, [charactersData, elementsData, puzzlesData, timelineEventsData]);

  // Legacy support for existing UI using utility function
  const processedNarrativeData = useMemo(() => {
    return processLegacyNarrativeData(selectedThread, {
      characters: legacyCharactersData,
      elements: legacyElementsData,
      puzzles: legacyPuzzlesData,
      timelineEvents: legacyTimelineEventsData
    });
  }, [selectedThread, legacyTimelineEventsData, legacyCharactersData, legacyElementsData, legacyPuzzlesData]);

  const renderAssociatedItem = (item, type) => {
    if (!item || !item.id || !type) return null;
    
    return (
      <ListItem key={item.id} dense component={RouterLink} to={`/${type.toLowerCase()}/${item.id}`} sx={{py:0.25, '&:hover': {bgcolor: 'action.hover', borderRadius:1}}}>
        <ListItemText
          primary={<Typography variant="body2">{item.name || item.description || item.puzzle}</Typography>}
          secondary={<Chip label={item.basicType || item.tier || item.timing || type.slice(0,-1)} size="small" variant="outlined" sx={{fontSize: '0.7rem', height: 'auto', lineHeight: 1.2, py:0.1}}/>}
        />
      </ListItem>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Narrative Thread Analysis...</Typography>
      </Box>
    );
  }

  if (narrativeError) {
    return (
      <Container maxWidth="lg" sx={{mt: 2}}>
        <Alert severity="error">Error loading data: {narrativeError?.message}</Alert>
      </Container>
    );
  }

  const { threadMaps, coherenceMetrics, storyGaps, recommendations, overallScore } = narrativeAnalysis;

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title="Narrative Thread Tracker" />
        <FormControlLabel
          control={
            <Switch 
              checked={coherenceMode} 
              onChange={(e) => setCoherenceMode(e.target.checked)}
            />
          }
          label="Story Coherence Analysis"
        />
      </Box>
      
      <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
        Monitor narrative coherence across About Last Night's story threads. Ensure all characters, elements, and puzzles contribute meaningfully to the overall narrative.
      </Typography>

      {/* Overall Narrative Health */}
      <CoherenceOverview 
        overallScore={overallScore}
        storyGaps={storyGaps}
      />

      {/* Narrative Thread Cards */}
      <ThreadAnalysisCards
        coherenceMetrics={coherenceMetrics}
        threadMaps={threadMaps}
      />

      {coherenceMode && (
        <>
          {/* Detailed Thread Analysis */}
          <ThreadAnalysisSection
            activeTab={activeTab}
            onTabChange={(e, newValue) => setActiveTab(newValue)}
            coherenceMetrics={coherenceMetrics}
            threadMaps={threadMaps}
            storyGaps={storyGaps}
            legacyThreadView={
              <Box>
                <Typography variant="h6" gutterBottom>Legacy Thread Selector</Typography>
                <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
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
                                    <List dense disablePadding>{entry.associatedCharacters.filter(item => item && item.id).map(item => renderAssociatedItem(item, 'characters'))}</List>
                                  </Grid>
                                )}
                                {entry.associatedElements.length > 0 && (
                                  <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Elements</Typography>
                                    <List dense disablePadding>{entry.associatedElements.filter(item => item && item.id).map(item => renderAssociatedItem(item, 'elements'))}</List>
                                  </Grid>
                                )}
                                {entry.associatedPuzzles.length > 0 && (
                                  <Grid item xs={12} sm={6} md={3}>
                                     <Typography variant="subtitle2" color="text.secondary">Puzzles (Related by Act)</Typography>
                                    <List dense disablePadding>{entry.associatedPuzzles.filter(item => item && item.id).map(item => renderAssociatedItem(item, 'puzzles'))}</List>
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
                                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}><List dense disablePadding>{processedNarrativeData.orphanedItems.characters.filter(item => item && item.id).map(item => renderAssociatedItem(item, 'characters'))}</List></Paper>
                                </Grid>
                              )}
                              {processedNarrativeData.orphanedItems.elements.length > 0 && (
                                <Grid item xs={12} md={4}>
                                  <Typography variant="h6" gutterBottom component="div" sx={{px:1}}>Orphaned Elements</Typography>
                                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}><List dense disablePadding>{processedNarrativeData.orphanedItems.elements.filter(item => item && item.id).map(item => renderAssociatedItem(item, 'elements'))}</List></Paper>
                                </Grid>
                              )}
                              {processedNarrativeData.orphanedItems.puzzles.length > 0 && (
                                <Grid item xs={12} md={4}>
                                  <Typography variant="h6" gutterBottom component="div" sx={{px:1}}>Orphaned Puzzles</Typography>
                                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}><List dense disablePadding>{processedNarrativeData.orphanedItems.puzzles.filter(item => item && item.id).map(item => renderAssociatedItem(item, 'puzzles'))}</List></Paper>
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
                      <Typography variant="h6" color="text.secondary" sx={{mb:1}}>Welcome to the Legacy Thread Tracker!</Typography>
                      <Typography color="text.secondary">
                          Please select a narrative thread from the dropdown above to view all associated game entities.
                      </Typography>
                      {threadsError && <Alert severity="warning" sx={{mt:2}}>Could not load narrative threads. Please try refreshing the application.</Alert>}
                  </Paper>
                )}
              </Box>
            }
          />

        </>
      )}
      
      {/* Footer Section */}
      <NarrativeFooter 
        recommendations={recommendations}
        showRecommendations={coherenceMode && recommendations.length > 0}
      />
    </Container>
  );
}

export default NarrativeThreadTrackerPage;
