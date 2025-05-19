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
import EventIcon from '@mui/icons-material/Event';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PageHeader from '../components/PageHeader';
import RelationshipMapper from '../components/RelationshipMapper';
import { api } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

function TimelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showMapper, setShowMapper] = useState(true);
  
  // Fetch timeline event data with the queryKey for refreshing
  const queryKey = ['timelineEvent', id];
  const { data: event, isLoading, isFetching, error } = useQuery(
    queryKey,
    () => api.getTimelineEventById(id),
    {
      enabled: !!id,
      // Keep previous data while refetching for a smoother UX
      keepPreviousData: true,
    }
  );
  
  // Fetch timeline graph data
  const { data: timelineGraph, isLoading: isGraphLoading } = useQuery(
    ['timelineGraph', id],
    () => api.getTimelineGraph(id, 2),
    { enabled: !!id }
  );
  
  // Handler for tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Go back to timeline list
  const handleBack = () => navigate('/timelines');
  
  // Future feature: Edit timeline event (Phase 3)
  const handleEdit = () => {
    alert('This feature will be available in Phase 3 (Editing Capabilities)');
  };
  
  // Refresh timeline event data
  const handleRefresh = () => {
    queryClient.invalidateQueries(queryKey);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date provided';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };
  
  // Initial loading state: show spinner if isLoading is true AND there's no event data yet
  if (isLoading && !event) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Timeline Event...</Typography>
      </Box>
    );
  }
  
  // Error state: show if an error occurred and we don't have event data to display from a previous successful fetch
  if (error && !event) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>Retry</Button>
        }>
          Error loading timeline event: {error.message || 'An unknown error occurred.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Timelines
        </Button>
      </Paper>
    );
  }
  
  // If after loading and no error, event is still not found
  if (!isLoading && !error && !event) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="warning">Timeline event data not available or event not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Timelines
        </Button>
      </Paper>
    );
  }

  // If event data exists (even if stale while refetching), render the page actions
  // isFetching will indicate background activity
  const pageActions = event ? (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={isFetching ? "Refreshing..." : "Refresh Data"}>
        <span>
          <IconButton onClick={handleRefresh} disabled={isFetching} aria-label="refresh timeline event data">
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
      <Tooltip title="Edit event (Phase 3)">
        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit} size="medium">
          Edit Event
        </Button>
      </Tooltip>
    </Box>
  ) : null;

  // Final fallback check
  if (!event) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="info">Timeline event data is currently unavailable. Please try refreshing.</Alert>
        <Button startIcon={<RefreshIcon />} onClick={handleRefresh} sx={{ mr: 1, mt: 2 }}>Refresh</Button>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>Back to Timelines</Button>
      </Paper>
    );
  }
  
  return (
    <Box>
      <PageHeader
        title={event.description || "Timeline Event"}
        breadcrumbs={[
          { name: 'Timelines', path: '/timelines' },
          { name: event.description || id },
        ]}
        action={pageActions}
      />
      
      <Grid container spacing={3}>
        {/* Event overview */}
        <Grid item xs={12} md={showMapper ? 8 : 12}>
          <Paper sx={{ p: 3 }} elevation={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 4, mb: 3 }}>
                  {formatDate(event.date)}
                </Typography>
                
                {event.memType && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Memory Type
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={event.memType}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {/* Additional metadata could go here */}
              </Grid>
            </Grid>
            
            {event.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.notes}
                </Typography>
              </>
            )}
          </Paper>
        
          {/* Tabs for related content */}
          <Paper sx={{ p: 0, mt: 3 }} elevation={1}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label={`Characters Involved (${event.charactersInvolved?.length || 0})`} />
              <Tab label={`Memory/Evidence (${event.memoryEvidence?.length || 0})`} />
            </Tabs>
            
            <Box sx={{ p: {xs:1.5, sm:2}, minHeight: 180, maxHeight: 300, overflowY: 'auto' }}>
              {/* Characters Involved Tab */}
              {activeTab === 0 && (
                <>
                  {event.charactersInvolved?.length > 0 ? (
                    <List dense>
                      {event.charactersInvolved.map((character) => {
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
                              secondary={character.tier ? `Tier: ${character.tier}` : 'Unknown tier'} 
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>
                      No characters are involved in this event.
                    </Typography>
                  )}
                </>
              )}
              
              {/* Memory/Evidence Tab */}
              {activeTab === 1 && (
                <>
                  {event.memoryEvidence?.length > 0 ? (
                    <List dense>
                      {event.memoryEvidence.map((element) => {
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
                      No memory/evidence elements associated with this event.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Relationship Mapper */}
        {showMapper && (
          <Grid item xs={12} md={4}> 
            <RelationshipMapper
              title={`${event.description || 'Entity'}'s Map`}
              entityType="Timeline"
              entityId={id}
              entityName={event.description}
              relationshipData={event}
              graphData={timelineGraph}
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
          Back to Timelines
        </Button>
      </Box>
    </Box>
  );
}

export default TimelineDetail; 