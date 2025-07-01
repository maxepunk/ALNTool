import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button, Box, Skeleton, CircularProgress, Typography, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import ErrorBoundary from '../components/ErrorBoundary';
import ElementDashboardCards from '../components/ElementDashboardCards';
import ElementFilters from '../components/ElementFilters';
import ElementProductionAlert from '../components/ElementProductionAlert';
import { elementTableColumns } from '../components/Elements/ElementTableColumns';
import { api } from '../services/api';
import { useGameConstants } from '../hooks/useGameConstants';
import useElementAnalytics from '../hooks/useElementAnalytics';


function Elements() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type');

  // Early return if constants are still loading
  if (constantsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Elements...</Typography>
      </Box>
    );
  }
  
  // Existing Filters
  const [elementType, setElementType] = useState(typeFromQuery || 'All Types');
  const [status, setStatus] = useState('All Statuses');
  const [firstAvailable, setFirstAvailable] = useState('All Acts'); // This might be redundant if Act Focus is used

  // New Filters State
  const [actFocusFilter, setActFocusFilter] = useState('All Acts');
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState({}); // {'Theme Name': true/false}
  const [availableMemorySets, setAvailableMemorySets] = useState([]);
  const [selectedMemorySet, setSelectedMemorySet] = useState('All Sets');
  
  // Build filters object for API (currently only supports exact matches on predefined fields)
  const apiFilters = {};
  if (elementType !== 'All Types') apiFilters.type = elementType;
  if (status !== 'All Statuses') apiFilters.status = status;
  // 'firstAvailable' is also a server-side filter, keep if still needed alongside actFocusFilter
  if (firstAvailable !== 'All Acts') apiFilters.firstAvailable = firstAvailable;
  
  const { data: elements, isLoading, error, refetch } = useQuery({
    queryKey: ['elements', apiFilters], // Use apiFilters for query key
    queryFn: () => api.getElements(apiFilters),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Effect to populate available themes and memory sets for client-side filtering
  useEffect(() => {
    if (elements) {
      const themes = new Set();
      const memorySets = new Set();
      elements.forEach(el => {
        el.properties?.themes?.forEach(theme => themes.add(theme));
        el.properties?.memorySets?.forEach(set => memorySets.add(set));
      });

      const sortedThemes = Array.from(themes).sort();
      setAvailableThemes(sortedThemes);
      // Initialize selectedThemes: all true by default
      if (Object.keys(selectedThemes).length === 0 && sortedThemes.length > 0) {
        const initialSelectedThemes = {};
        sortedThemes.forEach(theme => initialSelectedThemes[theme] = true);
        setSelectedThemes(initialSelectedThemes);
      }

      setAvailableMemorySets(Array.from(memorySets).sort());
    }
  }, [elements, selectedThemes]); // selectedThemes added to prevent re-init if already set

  const handleRowClick = (row) => {
    navigate(`/elements/${row.id}`);
  };
  
  // Filter handlers
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setElementType(newType);
    const params = new URLSearchParams();
    if (newType !== 'All Types') params.set('type', newType);
    navigate({ pathname: '/elements', search: params.toString() });
  };
  const handleStatusChange = (event) => setStatus(event.target.value);
  const handleFirstAvailableChange = (event) => setFirstAvailable(event.target.value);
  const handleActFocusChange = (event) => setActFocusFilter(event.target.value);
  const handleThemeChange = (themeName) => {
    setSelectedThemes(prev => ({ ...prev, [themeName]: !prev[themeName] }));
  };
  const handleSelectAllThemes = (selectAll) => {
    const newSelectedThemes = {};
    availableThemes.forEach(theme => newSelectedThemes[theme] = selectAll);
    setSelectedThemes(newSelectedThemes);
  };
  const handleMemorySetChange = (event) => setSelectedMemorySet(event.target.value);

  // Use the extracted analytics hook
  const elementAnalytics = useElementAnalytics(elements, gameConstants);

  const filteredElements = useMemo(() => {
    if (!elements) return [];
    let currentElements = [...elements];

    // Apply server-side fetched filters first (already handled by useQuery keying)
    // Then apply client-side filters
    if (actFocusFilter !== 'All Acts') {
      currentElements = currentElements.filter(el => el.properties?.actFocus === actFocusFilter);
    }

    const activeThemeFilters = Object.entries(selectedThemes)
      .filter(([,isSelected]) => isSelected)
      .map(([themeName]) => themeName);

    if (activeThemeFilters.length > 0) {
      currentElements = currentElements.filter(el =>
        el.properties?.themes?.some(theme => activeThemeFilters.includes(theme))
      );
    }

    if (selectedMemorySet !== 'All Sets') {
      currentElements = currentElements.filter(el =>
        el.properties?.memorySets?.includes(selectedMemorySet)
      );
    }
    return currentElements;
  }, [elements, actFocusFilter, selectedThemes, selectedMemorySet]);

  const handleAddElement = () => alert('This feature will be available in Phase 3 (Editing Capabilities)');
  
  const currentFilterCount = [elementType, status, firstAvailable, actFocusFilter, selectedMemorySet]
    .filter(f => !f.startsWith('All ')).length +
    Object.values(selectedThemes).filter(Boolean).length;

  const emptyMessage = currentFilterCount > 0
    ? "No elements match your current filter criteria."
    : "No elements found. Try adding some!";

  return (
    <div>
      <PageHeader 
        title="Element Production Hub" 
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} > Refresh </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddElement} > Add Element </Button>
          </Box>
        }
      />

      {/* Production Intelligence Dashboard */}
      {!isLoading && elements && (
        <>
          <ElementDashboardCards analytics={elementAnalytics} gameConstants={gameConstants} />
          <ElementProductionAlert issues={elementAnalytics.issues} />
        </>
      )}
      
      <ElementFilters
        elementType={elementType}
        status={status}
        firstAvailable={firstAvailable}
        actFocusFilter={actFocusFilter}
        availableThemes={availableThemes}
        selectedThemes={selectedThemes}
        availableMemorySets={availableMemorySets}
        selectedMemorySet={selectedMemorySet}
        onTypeChange={handleTypeChange}
        onStatusChange={handleStatusChange}
        onFirstAvailableChange={handleFirstAvailableChange}
        onActFocusChange={handleActFocusChange}
        onThemeChange={handleThemeChange}
        onSelectAllThemes={handleSelectAllThemes}
        onMemorySetChange={handleMemorySetChange}
        gameConstants={gameConstants}
      />
      
      {isLoading && !elements ? (
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1, mb: 1 }} />
      ) : (
        <DataTable 
          columns={elementTableColumns}
          data={filteredElements || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          initialSortBy="name"
          initialSortDirection="asc"
          emptyMessage={emptyMessage}
        />
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading elements: {error.message}
        </Alert>
      )}
    </div>
  );
}

// Wrap Elements component with ErrorBoundary for better error handling
const ElementsWithErrorBoundary = () => (
  <ErrorBoundary level="component">
    <Elements />
  </ErrorBoundary>
);

export default ElementsWithErrorBoundary;