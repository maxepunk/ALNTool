import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
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
import PageHeader from '../components/PageHeader';
import RelationshipMapper from '../components/RelationshipMapper';
import { api } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

function PuzzleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showMapper, setShowMapper] = useState(true);
  
  // Fetch puzzle data with the queryKey for refreshing
  const queryKey = ['puzzle', id];
  const { data: puzzle, isLoading, isFetching, error } = useQuery(
    queryKey,
    () => api.getPuzzleById(id),
    {
      enabled: !!id,
      // Keep previous data while refetching for a smoother UX
      keepPreviousData: true,
    }
  );
  
  // Fetch puzzle graph data
  const { data: puzzleGraph, isLoading: isGraphLoading } = useQuery(
    ['puzzleGraph', id],
    () => api.getPuzzleGraph(id, 2),
    { enabled: !!id }
  );
  
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Puzzle Details...</Typography>
      </Box>
    );
  }
  
  // Error state: show if an error occurred and we don't have puzzle data to display from a previous successful fetch
  if (error && !puzzle) {
    return (
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
    );
  }
  
  // If after loading and no error, puzzle is still not found
  if (!isLoading && !error && !puzzle) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="warning">Puzzle data not available or puzzle not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Puzzles
        </Button>
      </Paper>
    );
  }

  // If puzzle data exists (even if stale while refetching), render the page actions
  // isFetching will indicate background activity
  const pageActions = puzzle ? (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={isFetching ? "Refreshing..." : "Refresh Data"}>
        <span>
          <IconButton onClick={handleRefresh} disabled={isFetching} aria-label="refresh puzzle data">
            {isFetching ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={showMapper ? "Hide Relationship Map" : "Show Relationship Map"}>
        <IconButton 
          onClick={() => setShowMapper(prev => !prev)} 
          aria-label="toggle relationship map" 
          color={showMapper ? "primary" : "default"}
        >
          {showMapper ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit puzzle (Phase 3)">
        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit} size="medium">
          Edit Puzzle
        </Button>
      </Tooltip>
    </Box>
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
              {/* Required Elements Tab */}
              {activeTab === 0 && (
                <>
                  {puzzle.puzzleElements?.length > 0 ? (
                    <List dense>
                      {puzzle.puzzleElements.map((element) => {
                        if (!element || !element.id) return null;
                        return (
                          <ListItem 
                            key={element.id} 
                            button 
                            component={RouterLink}
                            to={`/elements/${element.id}`}
                            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                          >
                            <ListItemText 
                              primary={element.name || `Element ID: ${element.id}`} 
                              secondary={element.basicType ? `Type: ${element.basicType}` : 'Unknown type'} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      No required elements found.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Reward Elements Tab */}
              {activeTab === 1 && (
                <>
                  {puzzle.rewards?.length > 0 ? (
                    <List dense>
                      {puzzle.rewards.map((element) => {
                        if (!element || !element.id) return null;
                        return (
                          <ListItem 
                            key={element.id} 
                            button 
                            component={RouterLink}
                            to={`/elements/${element.id}`}
                            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                          >
                            <ListItemText 
                              primary={element.name || `Element ID: ${element.id}`} 
                              secondary={element.basicType ? `Type: ${element.basicType}` : 'Unknown type'} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      No reward elements found.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Locked Item Tab */}
              {puzzle.lockedItem && activeTab === 2 && (
                <List dense>
                  {puzzle.lockedItem.id ? (
                    <ListItem 
                      button 
                      component={RouterLink}
                      to={`/elements/${puzzle.lockedItem.id}`}
                      sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                    >
                      <ListItemText 
                        primary={puzzle.lockedItem.name || `Element ID: ${puzzle.lockedItem.id}`} 
                        secondary={puzzle.lockedItem.basicType ? `Type: ${puzzle.lockedItem.basicType}` : 'Unknown type'} 
                      />
                    </ListItem>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      Locked item data is incomplete.
                    </Typography>
                  )}
                </List>
              )}
              
              {/* Sub Puzzles Tab */}
              {puzzle.subPuzzles?.length > 0 && activeTab === (puzzle.lockedItem ? 3 : 2) && (
                <List dense>
                  {puzzle.subPuzzles.map((subPuzzle) => {
                    if (!subPuzzle || !subPuzzle.id) return null;
                    return (
                      <ListItem 
                        key={subPuzzle.id} 
                        button 
                        component={RouterLink}
                        to={`/puzzles/${subPuzzle.id}`}
                        sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                      >
                        <ListItemText 
                          primary={subPuzzle.puzzle || `Puzzle ID: ${subPuzzle.id}`} 
                          secondary={subPuzzle.timing ? `Timing: ${subPuzzle.timing}` : 'No timing specified'} 
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
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
  );
}

export default PuzzleDetail; 