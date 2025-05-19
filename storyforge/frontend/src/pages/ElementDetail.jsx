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

function ElementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showMapper, setShowMapper] = useState(true);
  
  // Fetch element data with the queryKey for refreshing
  const queryKey = ['element', id];
  const { data: element, isLoading, isFetching, error } = useQuery(
    queryKey,
    () => api.getElementById(id),
    {
      enabled: !!id,
      // Keep previous data while refetching for a smoother UX
      keepPreviousData: true,
    }
  );
  
  // Fetch element graph data
  const { data: elementGraph, isLoading: isGraphLoading } = useQuery(
    ['elementGraph', id],
    () => api.getElementGraph(id, 2),
    { enabled: !!id }
  );
  
  // Handler for tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Go back to elements list
  const handleBack = () => {
    navigate('/elements');
  };
  
  // Future feature: Edit element (Phase 3)
  const handleEdit = () => {
    alert('This feature will be available in Phase 3 (Editing Capabilities)');
  };
  
  // Refresh element data
  const handleRefresh = () => {
    queryClient.invalidateQueries(queryKey);
  };
  
  // Initial loading state: show spinner if isLoading is true AND there's no element data yet
  if (isLoading && !element) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Element Details...</Typography>
      </Box>
    );
  }
  
  // Error state: show if an error occurred and we don't have element data to display from a previous successful fetch
  if (error && !element) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>Retry</Button>
        }>
          Error loading element: {error.message || 'An unknown error occurred.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Elements
        </Button>
      </Paper>
    );
  }
  
  // If after loading and no error, element is still not found
  if (!isLoading && !error && !element) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="warning">Element data not available or element not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Elements
        </Button>
      </Paper>
    );
  }

  // If element data exists (even if stale while refetching), render the page actions
  // isFetching will indicate background activity
  const pageActions = element ? (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={isFetching ? "Refreshing..." : "Refresh Data"}>
        <span>
          <IconButton onClick={handleRefresh} disabled={isFetching} aria-label="refresh element data">
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
      <Tooltip title="Edit element (Phase 3)">
        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit} size="medium">
          Edit Element
        </Button>
      </Tooltip>
    </Box>
  ) : null;

  // Final fallback check
  if (!element) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="info">Element data is currently unavailable. Please try refreshing.</Alert>
        <Button startIcon={<RefreshIcon />} onClick={handleRefresh} sx={{ mr: 1, mt: 2 }}>Refresh</Button>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>Back to Elements</Button>
      </Paper>
    );
  }

  // Helper to check if this is a memory-type element
  const isMemoryType = element.basicType?.includes('Memory') || 
                       element.basicType?.includes('Corrupted');
  
  return (
    <Box>
      <PageHeader
        title={element.name || "Element Details"}
        breadcrumbs={[
          { name: 'Elements', path: '/elements' },
          { name: element.name || id },
        ]}
        action={pageActions}
      />
      
      <Grid container spacing={3}>
        {/* Element overview */}
        <Grid item xs={12} md={showMapper ? 8 : 12}>
          <Paper sx={{ p: 3 }} elevation={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Basic Type
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {element.basicType && (
                    <Chip
                      label={element.basicType}
                      color={
                        isMemoryType ? 'secondary' :
                        element.basicType === 'Prop' ? 'primary' :
                        element.basicType === 'Clue' ? 'success' :
                        'default'
                      }
                    />
                  )}
                </Box>
                
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {element.status && (
                    <Chip
                      label={element.status}
                      color={
                        element.status === 'Ready for Playtest' ? 'success' :
                        element.status === 'Done' ? 'primary' :
                        element.status === 'In development' ? 'warning' :
                        element.status === 'Needs Repair' ? 'error' :
                        'default'
                      }
                    />
                  )}
                </Box>
                
                <Typography variant="subtitle2" color="text.secondary">
                  First Available
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {element.firstAvailable || <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>Not specified</Typography>}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                {element.owner && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography 
                      variant="body1" 
                      component={RouterLink}
                      to={`/characters/${element.owner.id}`}
                      sx={{ mb: 2, textDecoration: 'none', color: 'primary.main' }}
                    >
                      {element.owner.name}
                    </Typography>
                  </>
                )}
                
                {element.contentLink && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Content Link
                    </Typography>
                    <Link 
                      href={element.contentLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ mb: 2, display: 'block' }}
                    >
                      External Content
                    </Link>
                  </>
                )}
                
                {isMemoryType && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" 
                      sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                      Memory Data
                    </Typography>
                    <Box sx={{ mb: 2, mt: 1 }}>
                      {/* This would be enhanced in future to parse and display specific memory attributes */}
                      <Typography variant="body2">
                        This is a memory-type element. Additional memory-specific data 
                        can be found in the description.
                      </Typography>
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
            
            {element.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Description/Text
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {element.description}
                </Typography>
              </>
            )}
            
            {element.productionNotes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Production/Puzzle Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {element.productionNotes}
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
              <Tab label={`Associated Characters (${element.associatedCharacters?.length || 0})`} />
              <Tab label={`Timeline Events (${element.timelineEvents?.length || 0})`} />
              <Tab label={`Required For Puzzles (${element.requiredFor?.length || 0})`} />
              <Tab label={`Rewarded By Puzzles (${element.rewardedBy?.length || 0})`} />
              {element.container && <Tab label="Container" />}
              {element.contents?.length > 0 && <Tab label={`Contents (${element.contents.length})`} />}
            </Tabs>
            
            <Box sx={{ p: {xs:1.5, sm:2}, minHeight: 180, maxHeight: 300, overflowY: 'auto' }}>
              {/* Associated Characters Tab */}
              {activeTab === 0 && (
                <>
                  {element.associatedCharacters?.length > 0 ? (
                    <List dense>
                      {element.associatedCharacters.map((character) => {
                        if (!character || !character.id) return null;
                        return (
                          <ListItem 
                            key={character.id} 
                            button 
                            component={RouterLink}
                            to={`/characters/${character.id}`}
                            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                          >
                            <ListItemText 
                              primary={character.name || `Character ID: ${character.id}`} 
                              secondary={character.tier ? `Tier: ${character.tier}` : null} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      No associated characters found.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Timeline Events Tab */}
              {activeTab === 1 && (
                <>
                  {element.timelineEvents?.length > 0 ? (
                    <List dense>
                      {element.timelineEvents.map((event) => {
                        if (!event || !event.id) return null;
                        return (
                          <ListItem 
                            key={event.id} 
                            button 
                            component={RouterLink}
                            to={`/timelines/${event.id}`}
                            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                          >
                            <ListItemText 
                              primary={event.description || `Event ID: ${event.id}`} 
                              secondary={event.date ? `Date: ${new Date(event.date).toLocaleDateString()}` : 'No date'} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      No timeline events found.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Required For Puzzles Tab */}
              {activeTab === 2 && (
                <>
                  {element.requiredFor?.length > 0 ? (
                    <List dense>
                      {element.requiredFor.map((puzzle) => {
                        if (!puzzle || !puzzle.id) return null;
                        return (
                          <ListItem 
                            key={puzzle.id} 
                            button 
                            component={RouterLink}
                            to={`/puzzles/${puzzle.id}`}
                            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                          >
                            <ListItemText 
                              primary={puzzle.puzzle || `Puzzle ID: ${puzzle.id}`} 
                              secondary={puzzle.timing ? `Timing: ${puzzle.timing}` : 'No timing specified'} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      This element is not required for any puzzles.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Rewarded By Puzzles Tab */}
              {activeTab === 3 && (
                <>
                  {element.rewardedBy?.length > 0 ? (
                    <List dense>
                      {element.rewardedBy.map((puzzle) => {
                        if (!puzzle || !puzzle.id) return null;
                        return (
                          <ListItem 
                            key={puzzle.id} 
                            button 
                            component={RouterLink}
                            to={`/puzzles/${puzzle.id}`}
                            sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                          >
                            <ListItemText 
                              primary={puzzle.puzzle || `Puzzle ID: ${puzzle.id}`} 
                              secondary={puzzle.timing ? `Timing: ${puzzle.timing}` : 'No timing specified'} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      This element is not rewarded by any puzzles.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Container Tab */}
              {element.container && activeTab === 4 && (
                <List dense>
                  {element.container.id ? (
                    <ListItem 
                      button 
                      component={RouterLink}
                      to={`/elements/${element.container.id}`}
                      sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                    >
                      <ListItemText 
                        primary={element.container.name || `Container ID: ${element.container.id}`} 
                        secondary={`Container: ${element.container.basicType || 'Unknown type'}`} 
                      />
                    </ListItem>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      Container data is incomplete.
                    </Typography>
                  )}
                </List>
              )}
              
              {/* Contents Tab */}
              {element.contents?.length > 0 && activeTab === (element.container ? 5 : 4) && (
                <List dense>
                  {element.contents.map((content) => {
                    if (!content || !content.id) return null;
                    return (
                      <ListItem 
                        key={content.id} 
                        button 
                        component={RouterLink}
                        to={`/elements/${content.id}`}
                        sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}
                      >
                        <ListItemText 
                          primary={content.name || `Element ID: ${content.id}`} 
                          secondary={content.basicType ? `Type: ${content.basicType}` : 'Unknown type'} 
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
              title={`${element.name || 'Entity'}'s Map`}
              entityType="Element"
              entityId={id}
              entityName={element.name}
              relationshipData={element}
              graphData={elementGraph}
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
          Back to Elements
        </Button>
      </Box>
    </Box>
  );
}

export default ElementDetail; 