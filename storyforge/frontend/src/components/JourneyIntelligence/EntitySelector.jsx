import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Autocomplete, TextField, Box, Typography, Chip, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExtensionIcon from '@mui/icons-material/Extension';
import EventIcon from '@mui/icons-material/Event';
import { FixedSizeList } from 'react-window';
import debounce from 'lodash.debounce';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import logger from '../../utils/logger';

// Icons for entity types
const ENTITY_ICONS = {
  character: <PersonIcon sx={{ fontSize: 16 }} />,
  element: <InventoryIcon sx={{ fontSize: 16 }} />,
  puzzle: <ExtensionIcon sx={{ fontSize: 16 }} />,
  timeline_event: <EventIcon sx={{ fontSize: 16 }} />
};

// Entity type colors
const ENTITY_COLORS = {
  character: '#2196f3',    // Blue
  element: '#4caf50',      // Green
  puzzle: '#ff9800',       // Orange
  timeline_event: '#9c27b0' // Purple
};

// Virtual list row renderer
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const itemCount = itemData.length;
  const itemSize = 60; // Height of each item

  return (
    <div ref={ref}>
      <div {...other}>
        <FixedSizeList
          height={Math.min(itemCount * itemSize, 400)}
          width="100%"
          itemSize={itemSize}
          itemCount={itemCount}
          overscanCount={5}
          itemData={itemData}
        >
          {({ index, style, data }) => (
            <div style={style}>
              {data[index]}
            </div>
          )}
        </FixedSizeList>
      </div>
    </div>
  );
});

const EntitySelector = () => {
  const { selectedEntity, selectEntity } = useJourneyIntelligenceStore();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef(null);
  
  // Debounced search function
  const debouncedSetSearch = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
    }, 300),
    []
  );
  
  // Server-side search with pagination
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['entity-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        // Initial load - return limited set of recent/important entities
        const [characters, elements, puzzles, timelineEvents] = await Promise.all([
          api.getCharacters({ limit: 10 }),
          api.getElements({ limit: 10 }),
          api.getPuzzles({ limit: 10 }),
          api.getTimelineEvents({ limit: 10 })
        ]);
        
        return processEntities(characters, elements, puzzles, timelineEvents);
      }
      
      // Search across all entity types
      const [characters, elements, puzzles, timelineEvents] = await Promise.all([
        api.searchCharacters(debouncedSearch),
        api.searchElements(debouncedSearch),
        api.searchPuzzles(debouncedSearch),
        api.searchTimelineEvents(debouncedSearch)
      ]);
      
      return processEntities(characters, elements, puzzles, timelineEvents);
    },
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true
  });
  
  // Process entities into unified format
  const processEntities = (characters, elements, puzzles, timelineEvents) => {
    const entities = [];
    
    // Add characters
    characters?.forEach(char => {
      entities.push({
        id: char.id,
        name: char.name || 'Unnamed Character',
        type: 'character',
        entityType: 'character',
        tier: char.tier,
        logline: char.logline,
        searchText: `${char.name} ${char.tier || ''} ${char.logline || ''} character`.toLowerCase(),
        raw: char
      });
    });
    
    // Add elements
    elements?.forEach(elem => {
      entities.push({
        id: elem.id,
        name: elem.name || 'Unnamed Element',
        type: 'element',
        entityType: 'element',
        owner: elem.owner_character_name,
        container: elem.container_element_name,
        status: elem.status,
        searchText: `${elem.name} ${elem.owner_character_name || ''} ${elem.container_element_name || ''} ${elem.status || ''} element`.toLowerCase(),
        raw: elem
      });
    });
    
    // Add puzzles
    puzzles?.forEach(puzzle => {
      entities.push({
        id: puzzle.id,
        name: puzzle.name || 'Unnamed Puzzle',
        type: 'puzzle',
        entityType: 'puzzle',
        difficulty: puzzle.difficulty,
        status: puzzle.status,
        searchText: `${puzzle.name} ${puzzle.difficulty || ''} ${puzzle.status || ''} puzzle`.toLowerCase(),
        raw: puzzle
      });
    });
    
    // Add timeline events
    timelineEvents?.forEach(event => {
      entities.push({
        id: event.id,
        name: event.description || 'Unnamed Event',
        type: 'timeline_event',
        entityType: 'timeline_event',
        date: event.date,
        act_focus: event.act_focus,
        searchText: `${event.description} ${event.date || ''} ${event.act_focus || ''} timeline event`.toLowerCase(),
        raw: event
      });
    });
    
    return entities;
  };
  
  // Handle input change with debouncing
  const handleInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue);
    
    if (reason === 'input') {
      debouncedSetSearch(newInputValue);
    }
  };
  
  // Get option label
  const getOptionLabel = (option) => {
    if (!option) return '';
    return option.name || '';
  };
  
  // Group entities by type
  const groupBy = (option) => {
    const typeLabels = {
      character: 'Characters',
      element: 'Elements',
      puzzle: 'Puzzles',
      timeline_event: 'Timeline Events'
    };
    return typeLabels[option.type] || 'Other';
  };
  
  // Handle selection
  const handleChange = (event, newValue) => {
    if (newValue) {
      logger.debug('EntitySelector: Entity selected', {
        id: newValue.id,
        type: newValue.type,
        name: newValue.name
      });
      selectEntity(newValue.raw);
    } else {
      selectEntity(null);
    }
  };
  
  // Current value for controlled component
  const currentValue = selectedEntity ? 
    searchResults?.find(e => e.id === selectedEntity.id) || 
    { 
      id: selectedEntity.id, 
      name: selectedEntity.name || selectedEntity.description || 'Selected Entity',
      type: selectedEntity.type || selectedEntity.entity_type || 'unknown',
      raw: selectedEntity 
    } : 
    null;
  
  return (
    <Autocomplete
      id="entity-search"
      options={searchResults || []}
      value={currentValue}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      getOptionLabel={getOptionLabel}
      groupBy={groupBy}
      loading={isLoading}
      ListboxComponent={ListboxComponent}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search entities..."
          variant="outlined"
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
          <Box sx={{ color: ENTITY_COLORS[option.type] }}>
            {ENTITY_ICONS[option.type]}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">
              {option.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.type === 'character' && option.tier && `Tier ${option.tier}`}
              {option.type === 'element' && option.owner && `Owner: ${option.owner}`}
              {option.type === 'puzzle' && option.difficulty && `Difficulty: ${option.difficulty}`}
              {option.type === 'timeline_event' && option.act_focus && `Act: ${option.act_focus}`}
            </Typography>
          </Box>
        </Box>
      )}
      renderTags={(value, getTagProps) => (
        <Chip
          size="small"
          label={value.name}
          icon={ENTITY_ICONS[value.type]}
          sx={{ 
            backgroundColor: ENTITY_COLORS[value.type],
            color: 'white',
            '& .MuiChip-icon': { color: 'white' }
          }}
          {...getTagProps({ index: 0 })}
        />
      )}
      sx={{ 
        minWidth: 300,
        '& .MuiAutocomplete-inputRoot': {
          backgroundColor: 'background.paper'
        }
      }}
      componentsProps={{
        paper: {
          elevation: 4,
          sx: {
            '& .MuiAutocomplete-listbox': {
              padding: 0,
              '& .MuiAutocomplete-groupLabel': {
                backgroundColor: 'grey.100',
                fontWeight: 'bold',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }
            }
          }
        }
      }}
    />
  );
};

export default React.memo(EntitySelector);