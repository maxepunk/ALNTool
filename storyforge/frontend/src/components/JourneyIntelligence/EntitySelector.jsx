import React, { useState, useMemo } from 'react';
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExtensionIcon from '@mui/icons-material/Extension';
import EventIcon from '@mui/icons-material/Event';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { useAllCharacters } from '../../hooks/useCharacterJourney';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
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

const EntitySelector = () => {
  const { selectedEntity, selectEntity } = useJourneyIntelligenceStore();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Fetch all entity types
  const { data: characters = [] } = useAllCharacters();
  const { data: elements = [] } = usePerformanceElements();
  const { data: puzzles = [] } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    staleTime: 5 * 60 * 1000
  });
  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: () => api.getTimelineEvents(),
    staleTime: 5 * 60 * 1000
  });
  
  // Combine all entities into searchable options
  const allEntities = useMemo(() => {
    logger.debug('EntitySelector: Building entity list', {
      characters: characters.length,
      elements: elements.length,
      puzzles: puzzles.length,
      timelineEvents: timelineEvents.length
    });
    
    const entities = [];
    
    // Add characters
    characters.forEach(char => {
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
    elements.forEach(elem => {
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
    puzzles.forEach(puzzle => {
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
    timelineEvents.forEach(event => {
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
  }, [characters, elements, puzzles, timelineEvents]);
  
  // Filter options based on input
  const getOptionLabel = (option) => {
    if (!option) return '';
    return option.name || '';
  };
  
  // Custom filter that searches across all entity fields
  const filterOptions = (options, state) => {
    const input = state.inputValue.toLowerCase();
    if (!input) return options.slice(0, 50); // Show first 50 when no search
    
    return options
      .filter(option => option.searchText.includes(input))
      .slice(0, 50); // Limit results for performance
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
    allEntities.find(e => e.id === selectedEntity.id) || null : 
    null;
  
  return (
    <Autocomplete
      id="entity-search"
      options={allEntities}
      value={currentValue}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      getOptionLabel={getOptionLabel}
      filterOptions={filterOptions}
      groupBy={groupBy}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search entities..."
          variant="outlined"
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            maxHeight: 400,
            '& .MuiAutocomplete-listbox': {
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

export default EntitySelector;