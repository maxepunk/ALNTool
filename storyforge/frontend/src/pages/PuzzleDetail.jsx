import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // Icon for Puzzle Flow
import PageHeader from '../components/PageHeader';
import RelationshipMapper from '../components/RelationshipMapper';
import PageActions from '../components/PuzzleDetail/PageActions';
import NarrativeImpactSection from '../components/PuzzleDetail/NarrativeImpactSection';
import TabsContent from '../components/PuzzleDetail/TabsContent';
import { api } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';

function PuzzleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showMapper, setShowMapper] = useState(true);
  
  // Fetch puzzle data with the queryKey for refreshing
  const queryKey = ['puzzle', id];
  const { data: puzzle, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () => api.getPuzzleById(id),
    enabled: !!id,
    // Keep previous data while refetching for a smoother UX
    keepPreviousData: true,
    });
  
  // Fetch puzzle graph data
  const { data: puzzleGraph, isLoading: isGraphLoading } = useQuery({
    queryKey: ['puzzleGraph', id],
    queryFn: () => api.getPuzzleGraph(id, 2),
    enabled: !!id
  });
  
  // Handler for tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Go back to puzzles list
  const handleBack = () => {
    navigate('/puzzles');
  };
  
  // Future feature: Edit puzzle (Phase 3)
  const handleEdit = () => {
    alert('This feature will be available in Phase 3 (Editing Capabilities)');
  };
  
  // Refresh puzzle data
  const handleRefresh = () => {
    queryClient.invalidateQueries(queryKey);
  };
  
  // Initial loading state: show spinner if isLoading is true AND there's no puzzle data yet
  if (isLoading && !puzzle) {
    return (
      <ErrorBoundary level="page">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
          <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Puzzle Details...</Typography>
        </Box>
      </ErrorBoundary>
    );
  }
  
  // Error state: show if an error occurred and we don't have puzzle data to display from a previous successful fetch
  if (error && !puzzle) {
    return (
      <ErrorBoundary level="page">
        <Paper sx={{ p: 3, m:1 }} elevation={3}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={handleRefresh}>Retry</Button>
          }>
            Error loading puzzle: {error.message || 'An unknown error occurred.'}
          </Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
            Back to Puzzles
          </Button>
        </Paper>
      </ErrorBoundary>
    );
  }
  
  // If after loading and no error, puzzle is still not found
  if (!isLoading && !error && !puzzle) {
    return (
      <ErrorBoundary level="page">
        <Paper sx={{ p: 3, m:1 }} elevation={3}>
          <Alert severity="warning">Puzzle data not available or puzzle not found.</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
            Back to Puzzles
          </Button>
        </Paper>
      </ErrorBoundary>
    );
  }

  // If puzzle data exists (even if stale while refetching), render the page actions
  // isFetching will indicate background activity
  const pageActions = puzzle ? (
    <PageActions
      isFetching={isFetching}
      showMapper={showMapper}
      onRefresh={handleRefresh}
      onToggleMapper={() => setShowMapper(prev => !prev)}
      onEdit={handleEdit}
      puzzleId={id}
    />
  ) : null;

  // Final fallback check
  if (!puzzle) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="info">Puzzle data is currently unavailable. Please try refreshing.</Alert>
        <Button startIcon={<RefreshIcon />} onClick={handleRefresh} sx={{ mr: 1, mt: 2 }}>Refresh</Button>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>Back to Puzzles</Button>
      </Paper>
    );
  }
  
  return (
    <ErrorBoundary level="page">
      <Box>
        <PageHeader
        title={puzzle.puzzle || "Puzzle Details"}
        breadcrumbs={[
          { name: 'Puzzles', path: '/puzzles' },
          { name: puzzle.puzzle || id },
        ]}
        action={pageActions}
      />
      
      <Grid container spacing={3}>
        {/* Puzzle overview */}
        <Grid item xs={12} md={showMapper ? 8 : 12}>
          <Paper sx={{ p: 3 }} elevation={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timing
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {puzzle.timing && (
                    <Chip
                      label={puzzle.timing}
                      color={
                        puzzle.timing === 'Act 1' ? 'primary' :
                        puzzle.timing === 'Act 2' ? 'secondary' :
                        'default'
                      }
                    />
                  )}
                </Box>
                
                {puzzle.owner && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography 
                      variant="body1" 
                      component={RouterLink}
                      to={`/characters/${puzzle.owner.id}`}
                      sx={{ mb: 2, textDecoration: 'none', color: 'primary.main' }}
                    >
                      {puzzle.owner.name}
                    </Typography>
                  </>
                )}
                
                {puzzle.narrativeThreads?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Narrative Threads
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {puzzle.narrativeThreads.map((thread, index) => (
                        <Chip 
                          key={index} 
                          label={thread} 
                          size="small" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {puzzle.assetLink && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Asset Link
                    </Typography>
                    <Link 
                      href={puzzle.assetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ mb: 2, display: 'block' }}
                    >
                      External Asset
                    </Link>
                  </>
                )}
                
                {puzzle.storyReveals && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Story Reveals
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {puzzle.storyReveals}
                    </Typography>
                  </>
                )}
                
                {puzzle.parentItem && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Parent Puzzle
                    </Typography>
                    <Typography 
                      variant="body1" 
                      component={RouterLink}
                      to={`/puzzles/${puzzle.parentItem.id}`}
                      sx={{ mb: 2, textDecoration: 'none', color: 'primary.main' }}
                    >
                      {puzzle.parentItem.puzzle}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
            
            {puzzle.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Description/Solution
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {puzzle.description}
                </Typography>
              </>
            )}
          </Paper>

          {/* Narrative Impact Section */}
          <NarrativeImpactSection puzzle={puzzle} />
        
          {/* Tabs for related content */}
          <Paper sx={{ p: 0, mt: 3 }} elevation={1}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label={`Required Elements (${puzzle.puzzleElements?.length || 0})`} />
              <Tab label={`Reward Elements (${puzzle.rewards?.length || 0})`} />
              {puzzle.lockedItem && <Tab label="Locked Item" />}
              {puzzle.subPuzzles?.length > 0 && <Tab label={`Sub Puzzles (${puzzle.subPuzzles.length})`} />}
            </Tabs>
            
            <Box sx={{ p: {xs:1.5, sm:2}, minHeight: 180, maxHeight: 300, overflowY: 'auto' }}>
              <TabsContent 
                puzzle={{
                  requiredElements: puzzle.puzzleElements,
                  rewards: puzzle.rewards,
                  lockedItem: puzzle.lockedItem,
                  subPuzzles: puzzle.subPuzzles
                }} 
                activeTab={activeTab} 
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Relationship Mapper */}
        {showMapper && (
          <Grid item xs={12} md={4}> 
            <RelationshipMapper
              title={`${puzzle.puzzle || 'Entity'}'s Map`}
              entityType="Puzzle"
              entityId={id}
              entityName={puzzle.puzzle}
              relationshipData={puzzle}
              graphData={puzzleGraph}
              isLoading={isLoading || isFetching || isGraphLoading}
            />
          </Grid>
        )}
      </Grid>
      
      {/* Back button */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Puzzles
        </Button>
      </Box>
    </Box>
    </ErrorBoundary>
  );
}

export default PuzzleDetail; 