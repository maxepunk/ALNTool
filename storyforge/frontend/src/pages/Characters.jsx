import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Button, Typography, Skeleton, Box, Tooltip, CircularProgress, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import ErrorBoundary from '../components/ErrorBoundary';
import CharacterDashboardCards from '../components/CharacterDashboardCards';
import CharacterFilters from '../components/CharacterFilters';
import ProductionIssuesAlert from '../components/ProductionIssuesAlert';
import { characterTableColumns } from '../components/Characters/CharacterTableColumns';
import { api } from '../services/api';
import { useState, useMemo } from 'react';
import { useGameConstants } from '../hooks/useGameConstants';
import useCharacterAnalytics from '../hooks/useCharacterAnalytics';


function Characters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [tierFilter, setTierFilter] = useState('All Tiers');
  const [pathFilter, setPathFilter] = useState('All Paths');

  // Early return if constants are still loading
  if (constantsLoading) {
    return (
      <ErrorBoundary level="page">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
          <CircularProgress /> <Typography sx={{ml:2}}>Loading Characters...</Typography>
        </Box>
      </ErrorBoundary>
    );
  }
  
  const filters = {};
  if (typeFilter !== 'All Types') filters.type = typeFilter;
  if (tierFilter !== 'All Tiers') filters.tier = tierFilter;
  
  const { data: characters, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['characters', filters],
    queryFn: () => api.getCharacters(filters),
    staleTime: 5 * 60 * 1000
  });

  // Use the extracted analytics hook
  const characterAnalytics = useCharacterAnalytics(characters, pathFilter, gameConstants);
  
  const handleRowClick = (row) => {
    navigate(`/characters/${row.id}`);
  };
  
  const handleAddCharacter = () => {
    // This would navigate to a create page or open a modal in Phase 3
    alert('Character creation will be available in Phase 3 (Editing Capabilities).');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries(['characters', filters]); // More targeted invalidation
    refetch();
  };
  
  // Filter characters for table display based on path filter
  const filteredCharactersForTable = useMemo(() => {
    if (!characters || pathFilter === 'All Paths') return characters || [];
    
    if (pathFilter === 'Unassigned') {
      return characters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0);
    } else {
      return characters.filter(char => char.resolutionPaths && char.resolutionPaths.includes(pathFilter));
    }
  }, [characters, pathFilter]);

  return (
    <ErrorBoundary level="page">
      <Box>
        <PageHeader 
        title="Character Production Hub" 
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isFetching}
              aria-label="Refresh characters list"
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Tooltip title="Character creation coming in Phase 3">
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddCharacter}
              >
                Add Character
              </Button>
            </Tooltip>
          </Box>
        }
      />

      {/* Production Intelligence Dashboard */}
      {!isLoading && characters && (
        <>
          <CharacterDashboardCards analytics={characterAnalytics} />
          <ProductionIssuesAlert issues={characterAnalytics.issues} />
        </>
      )}
      
      <CharacterFilters
        typeFilter={typeFilter}
        tierFilter={tierFilter}
        pathFilter={pathFilter}
        onTypeFilterChange={(e) => setTypeFilter(e.target.value)}
        onTierFilterChange={(e) => setTierFilter(e.target.value)}
        onPathFilterChange={(e) => setPathFilter(e.target.value)}
        gameConstants={gameConstants}
      />
      
      {isLoading && !characters ? ( // Show skeleton only on initial load
        <Box>
          {[...Array(5)].map((_, i) => ( // Skeleton for a few rows
            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
          ))}
        </Box>
      ) : (
        <DataTable 
          columns={characterTableColumns}
          data={filteredCharactersForTable} // Use filtered data including path filter
          isLoading={isFetching} // Use isFetching for subsequent loads
          onRowClick={handleRowClick}
          initialSortBy="name"
          initialSortDirection="asc"
          emptyMessage={
            pathFilter !== 'All Paths' || Object.keys(filters).length > 0
            ? "No characters match your current filter criteria."
            : "No characters found. Try adding some!"
          }
          searchPlaceholder="Search characters by name, logline..."
        />
      )}
      
      {error && (
         <Paper sx={{p:2, mt:2}}><Typography color="error">Error loading characters: {error.message}</Typography></Paper>
      )}
    </Box>
    </ErrorBoundary>
  );
}

// Wrap Characters component with ErrorBoundary for better error handling
const CharactersWithErrorBoundary = () => (
  <ErrorBoundary level="component">
    <Characters />
  </ErrorBoundary>
);

export default CharactersWithErrorBoundary; 