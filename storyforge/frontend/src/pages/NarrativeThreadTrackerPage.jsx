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
  CardHeader,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemIcon,
  Tooltip,
  Switch,
  FormControlLabel,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import ExtensionIcon from '@mui/icons-material/Extension';
import MemoryIcon from '@mui/icons-material/Memory';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoIcon from '@mui/icons-material/Info';
import BookIcon from '@mui/icons-material/Book';
import ConnectingAirportsIcon from '@mui/icons-material/ConnectingAirports';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupWorkIcon from '@mui/icons-material/GroupWork';

import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

// Narrative thread categories for About Last Night
const NARRATIVE_THREADS = {
  'Marcus Investigation': {
    color: 'error',
    icon: '🕵️',
    description: 'Central murder mystery investigation',
    priority: 'critical'
  },
  'Corporate Intrigue': {
    color: 'warning', 
    icon: '🏢',
    description: 'Business conflicts and company secrets',
    priority: 'high'
  },
  'Personal Relationships': {
    color: 'info',
    icon: '💕',
    description: 'Character relationships and personal conflicts',
    priority: 'high'
  },
  'Memory Economy': {
    color: 'secondary',
    icon: '🧠',
    description: 'Memory tokens and their distribution',
    priority: 'medium'
  },
  'Social Dynamics': {
    color: 'success',
    icon: '👥',
    description: 'Group interactions and social tensions',
    priority: 'medium'
  },
  'Technology & Innovation': {
    color: 'primary',
    icon: '🔬',
    description: 'AI development and tech themes',
    priority: 'medium'
  }
};

// Keywords for auto-categorizing narrative threads
const THREAD_KEYWORDS = {
  'Marcus Investigation': ['marcus', 'murder', 'death', 'investigate', 'detective', 'evidence', 'crime', 'victim'],
  'Corporate Intrigue': ['company', 'business', 'funding', 'investor', 'corporate', 'ceo', 'startup', 'venture'],
  'Personal Relationships': ['relationship', 'marriage', 'affair', 'love', 'divorce', 'partner', 'romantic', 'personal'],
  'Memory Economy': ['memory', 'token', 'rfid', 'value', 'collect', 'economic', 'reward'],
  'Social Dynamics': ['group', 'social', 'friend', 'enemy', 'conflict', 'alliance', 'tension', 'interaction'],
  'Technology & Innovation': ['ai', 'artificial', 'intelligence', 'tech', 'innovation', 'development', 'research', 'algorithm']
};

function NarrativeThreadTrackerPage() {
  const [selectedThread, setSelectedThread] = useState('');
  const [uniqueThreads, setUniqueThreads] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [coherenceMode, setCoherenceMode] = useState(true);
  
  // Fetch all data needed for comprehensive narrative analysis
  const { data: charactersData, isLoading: charactersLoading, error: charactersError } = useQuery(
    'charactersForNarrativeAnalysis',
    () => api.getAllCharactersWithSociogramData({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const { data: elementsData, isLoading: elementsLoading } = useQuery(
    'elementsForNarrativeAnalysis',
    () => api.getElements({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery(
    'puzzlesForNarrativeAnalysis',
    () => api.getPuzzles({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const { data: timelineEventsData, isLoading: timelineLoading } = useQuery(
    'timelineEventsForNarrativeAnalysis',
    () => api.getTimelineEvents({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );

  // Legacy support - fetch unique narrative threads for the dropdown
  const { data: threadsData, isLoading: isLoadingThreads, error: threadsError } = useQuery(
    'uniqueNarrativeThreads',
    api.getUniqueNarrativeThreads,
    {
      onSuccess: (data) => {
        setUniqueThreads(data || []);
      },
    }
  );

  // Legacy support - fetch data for selected thread
  const { data: legacyCharactersData, isLoading: isLoadingCharacters } = useQuery(
    ['charactersByThread', selectedThread],
    () => api.getCharacters({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  const { data: legacyElementsData, isLoading: isLoadingElements } = useQuery(
    ['elementsByThread', selectedThread],
    () => api.getElements({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  const { data: legacyPuzzlesData, isLoading: isLoadingPuzzles } = useQuery(
    ['puzzlesByThread', selectedThread],
    () => api.getPuzzles({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  const { data: legacyTimelineEventsData, isLoading: isLoadingTimelineEvents } = useQuery(
    ['timelineEventsByThread', selectedThread],
    () => api.getTimelineEvents({ narrativeThreadContains: selectedThread }),
    { enabled: !!selectedThread }
  );

  const handleThreadChange = (event) => {
    setSelectedThread(event.target.value);
  };

  const isLoading = charactersLoading || elementsLoading || puzzlesLoading || timelineLoading;
  const anyLoading = isLoadingCharacters || isLoadingElements || isLoadingPuzzles || isLoadingTimelineEvents;

  // Comprehensive Narrative Thread Analysis
  const narrativeAnalysis = useMemo(() => {
    if (!charactersData || !elementsData || !puzzlesData || !timelineEventsData) return {
      threadMaps: {},
      coherenceMetrics: {},
      storyGaps: [],
      recommendations: [],
      overallScore: 0
    };

    // Auto-categorize content into narrative threads
    const threadMaps = {};
    Object.keys(NARRATIVE_THREADS).forEach(thread => {
      threadMaps[thread] = {
        characters: [],
        elements: [],
        puzzles: [],
        timelineEvents: [],
        connections: 0,
        coherenceScore: 0
      };
    });

    // Categorize characters by narrative threads
    charactersData.forEach(char => {
      const name = char.name.toLowerCase();
      const description = (char.description || '').toLowerCase();
      const content = `${name} ${description}`;
      
      Object.keys(THREAD_KEYWORDS).forEach(thread => {
        const keywords = THREAD_KEYWORDS[thread];
        const matches = keywords.filter(keyword => content.includes(keyword)).length;
        if (matches > 0) {
          threadMaps[thread].characters.push({
            ...char,
            relevanceScore: matches,
            threadConnection: keywords.filter(keyword => content.includes(keyword))
          });
        }
      });
    });

    // Categorize elements by narrative threads
    elementsData.forEach(element => {
      const name = element.name.toLowerCase();
      const description = (element.description || '').toLowerCase();
      const content = `${name} ${description}`;
      
      Object.keys(THREAD_KEYWORDS).forEach(thread => {
        const keywords = THREAD_KEYWORDS[thread];
        const matches = keywords.filter(keyword => content.includes(keyword)).length;
        if (matches > 0) {
          threadMaps[thread].elements.push({
            ...element,
            relevanceScore: matches,
            threadConnection: keywords.filter(keyword => content.includes(keyword))
          });
        }
      });
    });

    // Categorize puzzles by narrative threads
    puzzlesData.forEach(puzzle => {
      const name = puzzle.name.toLowerCase();
      const description = (puzzle.description || '').toLowerCase();
      const content = `${name} ${description}`;
      
      Object.keys(THREAD_KEYWORDS).forEach(thread => {
        const keywords = THREAD_KEYWORDS[thread];
        const matches = keywords.filter(keyword => content.includes(keyword)).length;
        if (matches > 0) {
          threadMaps[thread].puzzles.push({
            ...puzzle,
            relevanceScore: matches,
            threadConnection: keywords.filter(keyword => content.includes(keyword))
          });
        }
      });
    });

    // Categorize timeline events by narrative threads
    timelineEventsData.forEach(event => {
      const name = (event.name || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const content = `${name} ${description}`;
      
      Object.keys(THREAD_KEYWORDS).forEach(thread => {
        const keywords = THREAD_KEYWORDS[thread];
        const matches = keywords.filter(keyword => content.includes(keyword)).length;
        if (matches > 0) {
          threadMaps[thread].timelineEvents.push({
            ...event,
            relevanceScore: matches,
            threadConnection: keywords.filter(keyword => content.includes(keyword))
          });
        }
      });
    });

    // Calculate coherence metrics for each thread
    const coherenceMetrics = {};
    Object.keys(NARRATIVE_THREADS).forEach(thread => {
      const threadData = threadMaps[thread];
      const totalItems = threadData.characters.length + threadData.elements.length + 
                        threadData.puzzles.length + threadData.timelineEvents.length;
      
      // Cross-connections between different types of content
      let connections = 0;
      
      // Characters to elements connections
      threadData.characters.forEach(char => {
        threadData.elements.forEach(element => {
          if (element.ownedByCharacter && element.ownedByCharacter.some(owner => owner.id === char.id)) {
            connections++;
          }
        });
      });

      // Characters to puzzles connections
      threadData.characters.forEach(char => {
        threadData.puzzles.forEach(puzzle => {
          if (puzzle.solvedByCharacter && puzzle.solvedByCharacter.some(solver => solver.id === char.id)) {
            connections++;
          }
        });
      });

      // Elements to puzzles connections
      threadData.elements.forEach(element => {
        threadData.puzzles.forEach(puzzle => {
          if (puzzle.puzzleElements && puzzle.puzzleElements.some(pe => pe.id === element.id)) {
            connections++;
          }
        });
      });

      threadMaps[thread].connections = connections;

      // Calculate coherence score (0-100)
      const densityScore = totalItems > 0 ? Math.min(100, (connections / totalItems) * 20) : 0;
      const balanceScore = totalItems > 0 ? Math.min(100, 
        100 - Math.abs(25 - (threadData.characters.length / totalItems * 100)) -
        Math.abs(25 - (threadData.elements.length / totalItems * 100)) -
        Math.abs(25 - (threadData.puzzles.length / totalItems * 100)) -
        Math.abs(25 - (threadData.timelineEvents.length / totalItems * 100))
      ) : 0;
      
      const coherenceScore = Math.round((densityScore + balanceScore) / 2);
      threadMaps[thread].coherenceScore = coherenceScore;

      coherenceMetrics[thread] = {
        totalItems,
        connections,
        coherenceScore,
        density: totalItems > 0 ? connections / totalItems : 0,
        coverage: {
          characters: threadData.characters.length,
          elements: threadData.elements.length,
          puzzles: threadData.puzzles.length,
          timelineEvents: threadData.timelineEvents.length
        }
      };
    });

    // Identify story gaps and issues
    const storyGaps = [];
    
    Object.keys(NARRATIVE_THREADS).forEach(thread => {
      const metrics = coherenceMetrics[thread];
      const threadConfig = NARRATIVE_THREADS[thread];
      
      if (metrics.coherenceScore < 40 && threadConfig.priority === 'critical') {
        storyGaps.push({
          type: 'critical-coherence',
          thread,
          severity: 'error',
          message: `Critical narrative thread "${thread}" has low coherence (${metrics.coherenceScore}%)`,
          impact: 'Story may feel disconnected or confusing'
        });
      }
      
      if (metrics.totalItems < 3 && threadConfig.priority !== 'medium') {
        storyGaps.push({
          type: 'insufficient-content',
          thread,
          severity: 'warning',
          message: `Narrative thread "${thread}" has insufficient content (${metrics.totalItems} items)`,
          impact: 'Thread may feel underdeveloped'
        });
      }
      
      if (metrics.connections === 0 && metrics.totalItems > 0) {
        storyGaps.push({
          type: 'isolated-content',
          thread,
          severity: 'warning',
          message: `Narrative thread "${thread}" has no cross-connections`,
          impact: 'Content feels isolated from the main story'
        });
      }
    });

    // Generate recommendations
    const recommendations = [];
    
    storyGaps.forEach(gap => {
      if (gap.type === 'critical-coherence') {
        recommendations.push({
          type: 'enhance-connections',
          message: `Add more cross-references between characters, elements, and puzzles in ${gap.thread}`,
          action: `Review ${gap.thread} content and create stronger narrative links`
        });
      }
      
      if (gap.type === 'insufficient-content') {
        recommendations.push({
          type: 'expand-content',
          message: `Consider adding more elements or puzzles to strengthen ${gap.thread}`,
          action: `Design additional content that supports the ${gap.thread} narrative`
        });
      }
      
      if (gap.type === 'isolated-content') {
        recommendations.push({
          type: 'create-connections',
          message: `Link ${gap.thread} content to characters and other story elements`,
          action: `Add character ownership or puzzle relationships to ${gap.thread} elements`
        });
      }
    });

    // Calculate overall narrative coherence score
    const threadScores = Object.values(coherenceMetrics).map(m => m.coherenceScore);
    const overallScore = threadScores.length > 0 ? Math.round(threadScores.reduce((sum, score) => sum + score, 0) / threadScores.length) : 0;

    return {
      threadMaps,
      coherenceMetrics,
      storyGaps,
      recommendations,
      overallScore
    };
  }, [charactersData, elementsData, puzzlesData, timelineEventsData]);

  // Legacy support for existing UI
  const processedNarrativeData = useMemo(() => {
    if (!selectedThread || !legacyTimelineEventsData || !legacyCharactersData || !legacyElementsData || !legacyPuzzlesData) {
      return { chronologicalEntries: [], orphanedItems: { characters: [], elements: [], puzzles: [] } };
    }

    const allCharsMap = new Map(legacyCharactersData.map(c => [c.id, c]));
    const allElemsMap = new Map(legacyElementsData.map(e => [e.id, e]));
    const allPuzzlesMap = new Map(legacyPuzzlesData.map(p => [p.id, p]));

    const associatedItemIds = new Set();

    const sortedEvents = [...legacyTimelineEventsData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
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
      legacyPuzzlesData.forEach(puzzle => {
        if (puzzle.properties?.actFocus && event.properties?.actFocus && puzzle.properties.actFocus === event.properties.actFocus) {
          if (allPuzzlesMap.has(puzzle.id) && !entry.associatedPuzzles.find(p=>p.id === puzzle.id)) {
             entry.associatedPuzzles.push(allPuzzlesMap.get(puzzle.id));
             associatedItemIds.add(puzzle.id);
          }
        }
      });
      return entry;
    });

    const orphanedItems = {
      characters: legacyCharactersData.filter(c => !associatedItemIds.has(c.id)),
      elements: legacyElementsData.filter(e => !associatedItemIds.has(e.id)),
      puzzles: legacyPuzzlesData.filter(p => !associatedItemIds.has(p.id)),
    };

    return { chronologicalEntries, orphanedItems };
  }, [selectedThread, legacyTimelineEventsData, legacyCharactersData, legacyElementsData, legacyPuzzlesData]);

  const renderAssociatedItem = (item, type) => (
    <ListItem key={item.id} dense component={RouterLink} to={`/${type.toLowerCase()}/${item.id}`} sx={{py:0.25, '&:hover': {bgcolor: 'action.hover', borderRadius:1}}}>
      <ListItemText
        primary={<Typography variant="body2">{item.name || item.description || item.puzzle}</Typography>}
        secondary={<Chip label={item.basicType || item.tier || item.timing || type.slice(0,-1)} size="small" variant="outlined" sx={{fontSize: '0.7rem', height: 'auto', lineHeight: 1.2, py:0.1}}/>}
      />
    </ListItem>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Narrative Thread Analysis...</Typography>
      </Box>
    );
  }

  if (charactersError) {
    return (
      <Container maxWidth="lg" sx={{mt: 2}}>
        <Alert severity="error">Error loading data: {charactersError.message}</Alert>
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
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AutoStoriesIcon sx={{ mr: 1 }} />
          Narrative Coherence Overview
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color={overallScore >= 80 ? 'success.main' : overallScore >= 60 ? 'warning.main' : 'error.main'}>
                {overallScore}%
              </Typography>
              <Typography variant="h6" color="text.secondary">Overall Coherence</Typography>
              <LinearProgress 
                variant="determinate" 
                value={overallScore} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color={overallScore >= 80 ? 'success' : overallScore >= 60 ? 'warning' : 'error'}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color={storyGaps.length === 0 ? 'success.main' : storyGaps.length <= 3 ? 'warning.main' : 'error.main'}>
                {storyGaps.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">Story Gaps</Typography>
              <Typography variant="body2" color="text.secondary">
                {storyGaps.length === 0 ? 'No issues detected' : 'Issues need attention'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" color="info.main">
                {Object.keys(NARRATIVE_THREADS).length}
              </Typography>
              <Typography variant="h6" color="text.secondary">Active Threads</Typography>
              <Typography variant="body2" color="text.secondary">
                Narrative storylines tracked
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Narrative Thread Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.keys(NARRATIVE_THREADS).map(thread => {
          const threadConfig = NARRATIVE_THREADS[thread];
          const metrics = coherenceMetrics[thread] || {};
          const threadData = threadMaps[thread] || {};
          
          return (
            <Grid item xs={12} md={6} lg={4} key={thread}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${threadConfig.color}.light`, mr: 2 }}>
                      {threadConfig.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{thread}</Typography>
                      <Chip 
                        label={threadConfig.priority} 
                        size="small" 
                        color={threadConfig.priority === 'critical' ? 'error' : threadConfig.priority === 'high' ? 'warning' : 'default'}
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {threadConfig.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Coherence Score</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.coherenceScore || 0}
                      sx={{ mb: 1, height: 6, borderRadius: 3 }}
                      color={metrics.coherenceScore >= 70 ? 'success' : metrics.coherenceScore >= 50 ? 'warning' : 'error'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {metrics.coherenceScore || 0}% • {metrics.connections || 0} connections
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Tooltip title="Characters involved">
                        <Chip 
                          icon={<PeopleIcon />}
                          label={threadData.characters?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Elements connected">
                        <Chip 
                          icon={<MemoryIcon />}
                          label={threadData.elements?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Puzzles related">
                        <Chip 
                          icon={<ExtensionIcon />}
                          label={threadData.puzzles?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Timeline events">
                        <Chip 
                          icon={<TimelineIcon />}
                          label={threadData.timelineEvents?.length || 0}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {coherenceMode && (
        <>
          {/* Detailed Thread Analysis */}
          <Paper sx={{ mb: 3 }} elevation={2}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Thread Details" />
              <Tab label="Story Gaps" />
              <Tab label="Content Distribution" />
              <Tab label="Legacy Thread View" />
            </Tabs>
            
            {/* Thread Details Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Narrative Thread Analysis</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Thread</TableCell>
                        <TableCell align="right">Coherence</TableCell>
                        <TableCell align="right">Content Items</TableCell>
                        <TableCell align="right">Connections</TableCell>
                        <TableCell align="right">Priority</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(NARRATIVE_THREADS).map(thread => {
                        const threadConfig = NARRATIVE_THREADS[thread];
                        const metrics = coherenceMetrics[thread] || {};
                        
                        return (
                          <TableRow key={thread}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: `${threadConfig.color}.light`, mr: 2, width: 32, height: 32 }}>
                                  {threadConfig.icon}
                                </Avatar>
                                {thread}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`${metrics.coherenceScore || 0}%`}
                                color={metrics.coherenceScore >= 70 ? 'success' : metrics.coherenceScore >= 50 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{metrics.totalItems || 0}</TableCell>
                            <TableCell align="right">{metrics.connections || 0}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={threadConfig.priority}
                                color={threadConfig.priority === 'critical' ? 'error' : threadConfig.priority === 'high' ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {metrics.coherenceScore >= 70 ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <WarningIcon color="warning" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* Story Gaps Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Story Gaps & Issues</Typography>
                
                {storyGaps.length === 0 ? (
                  <Alert severity="success">
                    No story gaps detected! All narrative threads have good coherence and connectivity.
                  </Alert>
                ) : (
                  <List>
                    {storyGaps.map((gap, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            <Chip 
                              label={gap.severity}
                              color={gap.severity === 'error' ? 'error' : 'warning'}
                              size="small"
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={gap.message}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Impact: {gap.impact}
                                </Typography>
                                <Chip 
                                  label={gap.thread}
                                  size="small"
                                  color={NARRATIVE_THREADS[gap.thread]?.color || 'default'}
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < storyGaps.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {/* Content Distribution Tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Content Distribution by Thread</Typography>
                
                <Grid container spacing={2}>
                  {Object.keys(NARRATIVE_THREADS).map(thread => {
                    const threadData = threadMaps[thread] || {};
                    const threadConfig = NARRATIVE_THREADS[thread];
                    
                    return (
                      <Grid item xs={12} md={6} key={thread}>
                        <Paper sx={{ p: 2 }} variant="outlined">
                          <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: `${threadConfig.color}.light`, mr: 1, width: 24, height: 24 }}>
                              {threadConfig.icon}
                            </Avatar>
                            {thread}
                          </Typography>
                          
                          <Grid container spacing={1}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">Characters:</Typography>
                              <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                                {threadData.characters?.slice(0, 4).map(char => (
                                  <Tooltip key={char.id} title={char.name}>
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                      {char.name.charAt(0)}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary">Content Summary:</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip label={`${threadData.elements?.length || 0} elements`} size="small" />
                                <Chip label={`${threadData.puzzles?.length || 0} puzzles`} size="small" />
                                <Chip label={`${threadData.timelineEvents?.length || 0} events`} size="small" />
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Legacy Thread View Tab */}
            {activeTab === 3 && (
              <Box sx={{ p: 3 }}>
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
                      <Typography variant="h6" color="text.secondary" sx={{mb:1}}>Welcome to the Legacy Thread Tracker!</Typography>
                      <Typography color="text.secondary">
                          Please select a narrative thread from the dropdown above to view all associated game entities.
                      </Typography>
                      {threadsError && <Alert severity="warning" sx={{mt:2}}>Could not load narrative threads. Please try refreshing the application.</Alert>}
                  </Paper>
                )}
              </Box>
            )}
          </Paper>

          {/* Recommendations Panel */}
          {recommendations.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="info" />
                  Story Enhancement Recommendations ({recommendations.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {recommendations.map((rec, index) => (
                  <Alert 
                    key={index} 
                    severity="info"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{rec.message}</Typography>
                    <Typography variant="caption">{rec.action}</Typography>
                  </Alert>
                ))}
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
      
      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>Story Development Tools</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/characters" 
              variant="outlined" 
              startIcon={<PeopleIcon />}
            >
              Character Development
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/elements" 
              variant="outlined" 
              startIcon={<MemoryIcon />}
            >
              Story Elements
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/puzzles" 
              variant="outlined" 
              startIcon={<ExtensionIcon />}
            >
              Puzzle Design
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/timeline" 
              variant="outlined" 
              startIcon={<TimelineIcon />}
            >
              Timeline Events
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/" 
              variant="contained" 
              startIcon={<AssessmentIcon />}
            >
              Production Dashboard
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default NarrativeThreadTrackerPage;
