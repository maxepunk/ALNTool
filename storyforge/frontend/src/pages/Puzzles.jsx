import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography, CircularProgress, Alert, Box, Button
} from '@mui/material';
import { api } from '../services/api';
import { useState, useEffect, useMemo } from 'react';
import { useGameConstants } from '../hooks/useGameConstants';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { puzzleTableColumns } from './puzzleTableColumns';
import { usePuzzleAnalytics } from '../hooks/usePuzzleAnalytics';
import PuzzleDashboardCards from '../components/PuzzleDashboardCards';
import DataTable from '../components/DataTable';
import PuzzleProductionAlert from '../components/PuzzleProductionAlert';
import PuzzleFilters from '../components/PuzzleFilters';

function Puzzles() {
  const navigate = useNavigate();

  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();

  // Early return if constants are still loading
  if (constantsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress />
        <Typography sx={{ml:2}}>Loading Puzzles...</Typography>
      </Box>
    );
  }

  const { data: puzzles, isLoading, error, refetch } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Filter state
  const [actFocusFilter, setActFocusFilter] = useState('All Acts');
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState({});
  const [availableNarrativeThreads, setAvailableNarrativeThreads] = useState([]);
  const [selectedNarrativeThread, setSelectedNarrativeThread] = useState('All Threads');

  // Production Intelligence Analytics
  const puzzleAnalytics = usePuzzleAnalytics(puzzles, gameConstants);

  const handleRowClick = (row) => navigate(`/puzzles/${row.id}`);
  const handleActFocusChange = (event) => setActFocusFilter(event.target.value);
  const handleThemeChange = (themeName) => setSelectedThemes(prev => ({ ...prev, [themeName]: !prev[themeName] }));
  const handleSelectAllThemes = (selectAll) => {
    const newSelectedThemes = {};
    availableThemes.forEach(theme => newSelectedThemes[theme] = selectAll);
    setSelectedThemes(newSelectedThemes);
  };
  const handleNarrativeThreadChange = (event) => setSelectedNarrativeThread(event.target.value);

  useEffect(() => {
    if (puzzles) {
      const themes = new Set();
      const narrativeThreads = new Set();
      puzzles.forEach(puzzle => {
        puzzle.properties?.themes?.forEach(theme => themes.add(theme));
        puzzle.narrativeThreads?.forEach(thread => narrativeThreads.add(thread));
      });

      const sortedThemes = Array.from(themes).sort();
      setAvailableThemes(sortedThemes);
      if (Object.keys(selectedThemes).length === 0 && sortedThemes.length > 0) {
        const initialSelectedThemes = {};
        sortedThemes.forEach(theme => initialSelectedThemes[theme] = true);
        setSelectedThemes(initialSelectedThemes);
      }

      setAvailableNarrativeThreads(Array.from(narrativeThreads).sort());
    }
  }, [puzzles, selectedThemes]);

  const filteredPuzzles = useMemo(() => {
    if (!puzzles) return [];
    let currentPuzzles = [...puzzles];

    if (actFocusFilter !== 'All Acts') {
      currentPuzzles = currentPuzzles.filter(p => p.properties?.actFocus === actFocusFilter || p.timing === actFocusFilter);
    }

    const activeThemeFilters = Object.entries(selectedThemes)
      .filter(([,isSelected]) => isSelected)
      .map(([themeName]) => themeName);
    if (activeThemeFilters.length > 0) {
      currentPuzzles = currentPuzzles.filter(p =>
        p.properties?.themes?.some(theme => activeThemeFilters.includes(theme))
      );
    }

    if (selectedNarrativeThread !== 'All Threads') {
      currentPuzzles = currentPuzzles.filter(p =>
        p.narrativeThreads?.includes(selectedNarrativeThread)
      );
    }
    return currentPuzzles;
  }, [puzzles, actFocusFilter, selectedThemes, selectedNarrativeThread]);

  if (error) {
    return (
      <div>
        <h1>Puzzle Design Hub</h1>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading puzzles: {error.message}
          <Button onClick={() => refetch()} sx={{ ml: 2 }}>
            <RefreshIcon sx={{ mr: 1 }} />
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1>Puzzle Design Hub</h1>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          aria-label="Refresh data"
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => alert('This feature will be available in Phase 3 (Editing Capabilities)')}
          color="primary"
        >
          Add Puzzle
        </Button>
      </Box>

      {/* Production Intelligence Dashboard */}
      {!isLoading && puzzles && (
        <PuzzleDashboardCards analytics={puzzleAnalytics} />
      )}

      {/* Filters */}
      <PuzzleFilters 
        actFocusFilter={actFocusFilter}
        onActFocusChange={handleActFocusChange}
        availableThemes={availableThemes}
        selectedThemes={selectedThemes}
        onThemeChange={handleThemeChange}
        onSelectAllThemes={handleSelectAllThemes}
        selectedNarrativeThread={selectedNarrativeThread}
        availableNarrativeThreads={availableNarrativeThreads}
        onNarrativeThreadChange={handleNarrativeThreadChange}
        gameConstants={gameConstants}
      />

      {/* Data Table */}
      {!isLoading && puzzles && (
        <DataTable
          data={filteredPuzzles}
          columns={puzzleTableColumns}
          onRowClick={handleRowClick}
          loading={isLoading}
          emptyMessage="No puzzles found."
        />
      )}

      {/* Production Issues Alert */}
      <PuzzleProductionAlert analytics={puzzleAnalytics} />
    </div>
  );
}

export default Puzzles;