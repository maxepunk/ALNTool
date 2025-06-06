import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import useJourneyStore from '../../stores/journeyStore';
import { api } from '../../services/api';

const CharacterSelector = () => {
  const activeCharacterId = useJourneyStore(state => state.activeCharacterId);
  const setActiveCharacterId = useJourneyStore(state => state.setActiveCharacterId);
  
  const { data: characters, isLoading, error } = useQuery(
    'characters',
    () => api.getCharacters()
  );

  const handleCharacterChange = (event) => {
    const characterId = event.target.value;
    setActiveCharacterId(characterId);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading characters...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="error">
          Error loading characters: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          No characters available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="character-selector-label">Select Character</InputLabel>
        <Select
          labelId="character-selector-label"
          value={activeCharacterId || ''}
          label="Select Character"
          onChange={handleCharacterChange}
        >
          <MenuItem value="">
            <em>-- Select a Character --</em>
          </MenuItem>
          {characters.map((character) => (
            <MenuItem key={character.id} value={character.id}>
              {character.name} ({character.tier} - {character.type})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CharacterSelector; 