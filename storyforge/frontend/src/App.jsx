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
import Elements from './pages/Elements';
import ElementDetail from './pages/ElementDetail';
import MemoryEconomyPage from './pages/MemoryEconomyPage'; // Import MemoryEconomyPage
import NotFound from './pages/NotFound';
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
        
        {/* Elements routes */}
        <Route path="/elements" element={<Elements />} />
        <Route path="/elements/:id" element={<ElementDetail />} />

        {/* Memory Economy Page Route */}
        <Route path="/memory-economy" element={<MemoryEconomyPage />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

export default App; 