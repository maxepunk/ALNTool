import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tab,
  Tabs,
  Tooltip,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TimelineIcon from '@mui/icons-material/Timeline'; // Added
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PageHeader from '../components/PageHeader';
import RelationshipMapper from '../components/RelationshipMapper';
import { api } from '../services/api';
import useJourneyStore from '../stores/journeyStore'; // Added
import { Link as RouterLink } from 'react-router-dom';

const DetailItem = ({ label, value, chipColor, chipIcon, fullWidth = false, children }) => (
  <Grid item xs={12} sm={fullWidth ? 12 : 6} md={fullWidth ? 12 : 6}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {label}
    </Typography>
    {children ? children : (
      chipColor && value ? (
        <Chip label={value} color={chipColor} icon={chipIcon} variant="outlined" />
      ) : (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {value || <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>N/A</Typography>}
        </Typography>
      )
    )}
  </Grid>
);

const renderTabContent = (activeTab, characterData, navigate) => {
  if (!characterData) return null;

  const renderList = (items, type) => {
    if (!items || items.length === 0) {
      return <Typography color="text.secondary" sx={{textAlign:'center', pt:3, fontStyle: 'italic'}}>No {type.toLowerCase()} found.</Typography>;
    }
    return (
      <List dense>
        {items.map(item => {
          if (!item || !item.id) return null;
          let path, primaryText, secondaryText;
          switch(type) {
            case 'Elements':
              path = `/elements/${item.id}`;
              primaryText = item.name || `Element ID: ${item.id}`;
              secondaryText = `Type: ${item.basicType || 'Unknown'}`;
              break;
            case 'Timeline Events':
              path = `/timelines/${item.id}`;
              primaryText = item.name || item.description || `Event ID: ${item.id}`;
              secondaryText = item.date ? `Date: ${new Date(item.date).toLocaleDateString()}`: 'No date';
              break;
            case 'Puzzles':
              path = `/puzzles/${item.id}`;
              primaryText = item.name || item.puzzle || `Puzzle ID: ${item.id}`;
              secondaryText = `Timing: ${item.timing || 'N/A'}`;
              break;
            default: return null;
          }
          return (
            <ListItem key={item.id} button component={RouterLink} to={path} sx={{borderRadius:1, '&:hover': {bgcolor: 'action.selected'}}}>
              <ListItemText primary={primaryText} secondary={secondaryText} />
            </ListItem>
          );
        })}
      </List>
    );
  };

  switch(activeTab) {
    case 0: return renderList(characterData.ownedElements, 'Elements');
    case 1: return renderList(characterData.associatedElements, 'Elements');
    case 2: return renderList(characterData.events, 'Timeline Events');
    case 3: return renderList(characterData.puzzles, 'Puzzles');
    default: return null;
  }
};

function CharacterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setActiveCharacterId = useJourneyStore(state => state.setActiveCharacterId); // Added
  const [activeTab, setActiveTab] = useState(0);
  const [showMapper, setShowMapper] = useState(true);
  
  const queryKey = ['character', id];
  const { data: character, isLoading, isFetching, error } = useQuery(
    queryKey,
    () => api.getCharacterById(id),
    { 
      enabled: !!id,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );
  
  const { data: characterGraph, isLoading: isGraphLoading } = useQuery(
    ['characterGraph', id],
    () => api.getCharacterGraph(id, 2),
    { 
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );
  
  const handleTabChange = (event, newValue) => setActiveTab(newValue);
  const handleBack = () => navigate('/characters');
  const handleEdit = () => alert('Character editing will be available in Phase 3.');

  const handleViewPlayerJourney = () => { // Added
    setActiveCharacterId(id);
    navigate('/player-journey');
  };
  
  const handleRefresh = () => {
    queryClient.invalidateQueries(queryKey);
  };
  
  if (isLoading && !character) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Character Details...</Typography>
      </Box>
    );
  }
  
  if (error && !character) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>Retry</Button>
        }>
          Error loading character: {error.message || 'An unknown error occurred.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Characters
        </Button>
      </Paper>
    );
  }
  
  if (!isLoading && !error && !character) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="warning">Character data not available or character not found.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Characters
        </Button>
      </Paper>
    );
  }
  
  const pageActions = character ? (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
       <Tooltip title={isFetching ? "Refreshing..." : "Refresh Data"}>
        <span>
          <IconButton onClick={handleRefresh} disabled={isFetching} aria-label="refresh character data">
            {isFetching ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={showMapper ? "Hide Relationship Map" : "Show Relationship Map"}>
        <IconButton onClick={() => setShowMapper(prev => !prev)} aria-label="toggle relationship map" color={showMapper ? "primary" : "default"}>
          {showMapper ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </Tooltip>
      {/* New Button for Player Journey */}
      <Button
        variant="outlined"
        startIcon={<TimelineIcon />}
        onClick={handleViewPlayerJourney}
        size="medium"
        sx={{ ml: 1 }} // Optional margin
      >
        Player Journey
      </Button>
      {/* Existing Edit Button */}
      <Tooltip title="Edit character (Phase 3)">
        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit} size="medium">
          Edit
        </Button>
      </Tooltip>
    </Box>
  ) : null;

  if (!character) {
    return (
        <Paper sx={{ p: 3, m:1 }} elevation={3}>
            <Alert severity="info">Character data is currently unavailable. Please try refreshing.</Alert>
            <Button startIcon={<RefreshIcon />} onClick={handleRefresh} sx={{ mr: 1, mt: 2 }}>Refresh</Button>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>Back to Characters</Button>
        </Paper>
    );
  }

  return (
    <Box>
      <PageHeader
        title={character.name || "Character Details"}
        breadcrumbs={[
          { name: 'Characters', path: '/characters' },
          { name: character.name || id },
        ]}
        action={pageActions}
      />
      
      <Grid container spacing={3}>
        {showMapper ? (
          <>
            <Grid item xs={12} md={6} lg={7} xl={8}>
              <Paper sx={{ p: {xs:2, sm:2.5}, mb: 2.5 }} elevation={1}>
                <Typography variant="h5" gutterBottom sx={{mb:2, fontWeight: 500}}>Character Profile</Typography>
                <Grid container spacing={2}>
                  <DetailItem label="Type" value={character.type} 
                    chipColor={character.type === 'Player' ? 'primary' : 'secondary'}
                    chipIcon={character.type === 'Player' ? <PersonIcon /> : <SmartToyIcon />}
                  />
                  <DetailItem label="Tier" value={character.tier} 
                    chipColor={
                      character.tier === 'Core' ? 'success' : 
                      character.tier === 'Secondary' ? 'info' : 'default'
                    }
                  />
                  <DetailItem label="Connections (Count)" value={character.connections?.toString()} />
                  <DetailItem label="Primary Action" value={character.primaryAction} />
                  
                  <DetailItem label="Character Logline" value={character.logline} fullWidth />
                  
                  {character.overview && (
                    <Grid item xs={12} sx={{mt:1}}>
                      <Divider sx={{ my: 1.5 }}><Chip label="Overview & Relationships" size="small" variant="outlined"/></Divider>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', p:1.5, bgcolor: 'action.hover', borderRadius:1, whiteSpace: 'pre-wrap' }}>
                        <Typography variant="body1">{character.overview}</Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {character.emotion && (
                    <Grid item xs={12} sx={{mt:1}}>
                      <Divider sx={{ my: 1.5 }}><Chip label="Emotions" size="small" variant="outlined"/></Divider>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Emotion towards CEO & Others
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{character.emotion}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            
              <Paper sx={{ p:0 }} elevation={1}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile indicatorColor="primary" textColor="primary">
                  <Tab label={`Owned Elements (${character.ownedElements?.length || 0})`} />
                  <Tab label={`Associated Elements (${character.associatedElements?.length || 0})`} />
                  <Tab label={`Timeline Events (${character.events?.length || 0})`} />
                  <Tab label={`Puzzles (${character.puzzles?.length || 0})`} />
                </Tabs>
                
                <Box sx={{ p: {xs:1.5, sm:2}, minHeight: 180, maxHeight: 300, overflowY: 'auto' }}>
                  {renderTabContent(activeTab, character, navigate)}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6} lg={5} xl={4}> 
              <RelationshipMapper
                title={`${character.name || 'Entity'}'s Map`}
                entityType="Character"
                entityId={id}
                entityName={character.name}
                relationshipData={character}
                graphData={characterGraph}
                isLoading={isLoading || isFetching || isGraphLoading}
              />
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: {xs:2, sm:2.5}, mb: 2.5 }} elevation={1}>
              <Typography variant="h5" gutterBottom sx={{mb:2, fontWeight: 500}}>Character Profile</Typography>
              <Grid container spacing={2}>
                <DetailItem label="Type" value={character.type} 
                  chipColor={character.type === 'Player' ? 'primary' : 'secondary'}
                  chipIcon={character.type === 'Player' ? <PersonIcon /> : <SmartToyIcon />}
                />
                <DetailItem label="Tier" value={character.tier} 
                  chipColor={
                    character.tier === 'Core' ? 'success' : 
                    character.tier === 'Secondary' ? 'info' : 'default'
                  }
                />
                <DetailItem label="Connections (Count)" value={character.connections?.toString()} />
                <DetailItem label="Primary Action" value={character.primaryAction} />
                
                <DetailItem label="Character Logline" value={character.logline} fullWidth />
                
                {character.overview && (
                  <Grid item xs={12} sx={{mt:1}}>
                    <Divider sx={{ my: 1.5 }}><Chip label="Overview & Relationships" size="small" variant="outlined"/></Divider>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto', p:1.5, bgcolor: 'action.hover', borderRadius:1, whiteSpace: 'pre-wrap' }}>
                      <Typography variant="body1">{character.overview}</Typography>
                    </Box>
                  </Grid>
                )}
                
                {character.emotion && (
                  <Grid item xs={12} sx={{mt:1}}>
                    <Divider sx={{ my: 1.5 }}><Chip label="Emotions" size="small" variant="outlined"/></Divider>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Emotion towards CEO & Others
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{character.emotion}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          
            <Paper sx={{ p:0 }} elevation={1}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile indicatorColor="primary" textColor="primary">
                <Tab label={`Owned Elements (${character.ownedElements?.length || 0})`} />
                <Tab label={`Associated Elements (${character.associatedElements?.length || 0})`} />
                <Tab label={`Timeline Events (${character.events?.length || 0})`} />
                <Tab label={`Puzzles (${character.puzzles?.length || 0})`} />
              </Tabs>
              
              <Box sx={{ p: {xs:1.5, sm:2}, minHeight: 180, maxHeight: 300, overflowY: 'auto' }}>
                {renderTabContent(activeTab, character, navigate)}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Box sx={{ mt: 3, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to All Characters
        </Button>
      </Box>
    </Box>
  );
}

export default CharacterDetail; 