import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, CircularProgress, Typography, Button } from '@mui/material';
import { useQuery } from 'react-query';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Characters from './pages/Characters';
import CharacterDetail from './pages/CharacterDetail';
import Timeline from './pages/Timeline';
import TimelineDetail from './pages/TimelineDetail';
import Puzzles from './pages/Puzzles';
import PuzzleDetail from './pages/PuzzleDetail';
import PuzzleFlowPageWrapper from './pages/PuzzleFlowPage'; // Correct import is already here
import Elements from './pages/Elements';
import ElementDetail from './pages/ElementDetail';
import MemoryEconomyPage from './pages/MemoryEconomyPage';
// import PuzzleFlowPage from './pages/PuzzleFlowPage'; // Remove redundant import
import ElementPuzzleEconomyPage from './pages/ElementPuzzleEconomyPage';
import CharacterSociogramPage from './pages/CharacterSociogramPage';
import NarrativeThreadTrackerPage from './pages/NarrativeThreadTrackerPage';
import ResolutionPathAnalyzerPage from './pages/ResolutionPathAnalyzerPage'; // Import ResolutionPathAnalyzerPage
import NotFound from './pages/NotFound';
import TimelineView from './components/PlayerJourney/TimelineView'; // Import TimelineView
import DualLensLayout from './components/Layout/DualLensLayout'; // Import DualLensLayout
import { api } from './services/api';

function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Fetch database metadata on app load
  const { data: metadata, error: metadataError } = useQuery(
    'metadata',
    () => api.getDatabasesMetadata(),
    {
      retry: 2,
      onSettled: () => {
        setInitialLoading(false);
      },
    }
  );

  // If metadata fails to load after retries, show a more persistent error
  if (metadataError && initialLoading === false) {
    return (
      <Container sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 4 
      }}>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          Connection Error
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Could not connect to the StoryForge API. Please ensure the backend server is running and accessible.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
          Error: {metadataError.message}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </Container>
    );
  }

  // Show loading spinner while initial metadata is being fetched
  if (initialLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Loading StoryForge...</Typography>
      </Box>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Characters routes */}
        <Route path="/characters" element={<Characters />} />
        <Route path="/characters/:id" element={<CharacterDetail />} />
        
        {/* Timeline routes */}
        <Route path="/timelines" element={<Timeline />} />
        <Route path="/timelines/:id" element={<TimelineDetail />} />
        
        {/* Puzzles routes */}
        <Route path="/puzzles" element={<Puzzles />} />
        <Route path="/puzzles/:id" element={<PuzzleDetail />} />
        <Route path="/puzzles/:id/flow" element={<PuzzleFlowPageWrapper />} /> {/* Corrected to use Wrapper */}
        
        {/* Elements routes */}
        <Route path="/elements" element={<Elements />} />
        <Route path="/elements/:id" element={<ElementDetail />} />

        {/* Memory Economy Page Route */}
        <Route path="/memory-economy" element={<MemoryEconomyPage />} />
        <Route path="/element-puzzle-economy" element={<ElementPuzzleEconomyPage />} />
        <Route path="/character-sociogram" element={<CharacterSociogramPage />} />
        <Route path="/narrative-thread-tracker" element={<NarrativeThreadTrackerPage />} />
        <Route path="/resolution-path-analyzer" element={<ResolutionPathAnalyzerPage />} /> {/* New Route */}
        
        {/* Route using DualLensLayout */}
        <Route
          path="/player-journey"
          element={
            <DualLensLayout
              journeySpaceContent={<TimelineView />}
              systemSpaceContent={<p style={{padding: '10px', backgroundColor: '#fefefe', border: '1px dashed #ccc', borderRadius: '4px'}}>System Space Placeholder in App.jsx (Player Journey)</p>}
            />
          }
        />

        {/* Test route for DualLensLayout */}
        <Route
          path="/dual-view-test"
          element={
            <DualLensLayout
              journeySpaceContent={<p style={{padding: '10px', backgroundColor: '#eee', border: '1px solid #ddd', borderRadius: '4px'}}>Journey Space Placeholder (Test Route)</p>}
              systemSpaceContent={<p style={{padding: '10px', backgroundColor: '#e0e0e0', border: '1px solid #d0d0d0', borderRadius: '4px'}}>System Space Placeholder (Test Route)</p>}
            />
          }
        />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

export default App; 