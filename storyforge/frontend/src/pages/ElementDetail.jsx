import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Custom components
import ElementDetailHeader from '../components/Elements/ElementDetailHeader';
import ElementPropertiesCard from '../components/Elements/ElementPropertiesCard';
import ElementCharactersTab from '../components/Elements/ElementCharactersTab';
import ElementTimelineTab from '../components/Elements/ElementTimelineTab';
import ElementPuzzlesTab from '../components/Elements/ElementPuzzlesTab';
import ElementContainerTab from '../components/Elements/ElementContainerTab';
import ElementContentsTab from '../components/Elements/ElementContentsTab';
import RelationshipMapper from '../components/RelationshipMapper';

// Custom hook
import { useElementData } from '../hooks/useElementData';

function ElementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showMapper, setShowMapper] = useState(true);
  
  const { 
    element, 
    elementGraph, 
    isLoading, 
    isGraphLoading, 
    isFetching, 
    error, 
    refresh 
  } = useElementData(id);
  
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
  
  // Initial loading state
  if (isLoading && !element) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Element Details...</Typography>
      </Box>
    );
  }
  
  // Error state
  if (error && !element) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={refresh}>Retry</Button>
        }>
          Error loading element: {error.message || 'An unknown error occurred.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Elements
        </Button>
      </Paper>
    );
  }
  
  // Element not found
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

  // Final fallback check
  if (!element) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="info">Element data is currently unavailable. Please try refreshing.</Alert>
        <Button color="primary" onClick={refresh} sx={{ mr: 1, mt: 2 }}>Refresh</Button>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>Back to Elements</Button>
      </Paper>
    );
  }
  
  // Calculate which tab index corresponds to Container and Contents
  let containerTabIndex = -1;
  let contentsTabIndex = -1;
  let currentTabIndex = 4; // After the 4 fixed tabs
  
  if (element.container) {
    containerTabIndex = currentTabIndex++;
  }
  if (element.contents?.length > 0) {
    contentsTabIndex = currentTabIndex;
  }
  
  return (
    <Box>
      <ElementDetailHeader
        element={element}
        id={id}
        isFetching={isFetching}
        showMapper={showMapper}
        onToggleMapper={() => setShowMapper(prev => !prev)}
        onRefresh={refresh}
        onEdit={handleEdit}
      />
      
      <Grid container spacing={3}>
        {/* Element overview */}
        <Grid item xs={12} md={showMapper ? 8 : 12}>
          <Paper sx={{ p: 3 }} elevation={1}>
            <ElementPropertiesCard element={element} />
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
              {activeTab === 0 && (
                <ElementCharactersTab characters={element.associatedCharacters} />
              )}
              
              {activeTab === 1 && (
                <ElementTimelineTab timelineEvents={element.timelineEvents} />
              )}
              
              {activeTab === 2 && (
                <ElementPuzzlesTab 
                  puzzles={element.requiredFor} 
                  emptyMessage="This element is not required for any puzzles."
                />
              )}
              
              {activeTab === 3 && (
                <ElementPuzzlesTab 
                  puzzles={element.rewardedBy} 
                  emptyMessage="This element is not rewarded by any puzzles."
                />
              )}
              
              {activeTab === containerTabIndex && (
                <ElementContainerTab container={element.container} />
              )}
              
              {activeTab === contentsTabIndex && (
                <ElementContentsTab contents={element.contents} />
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