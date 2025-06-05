// Mock API service

/**
 * Simulates fetching journey data for a given character ID.
 * @param {string} characterId - The ID of the character.
 * @returns {Promise<object>} A promise that resolves to mock journey data.
 */
export const getJourney = async (characterId) => {
  console.log(`[api.js] Fetching journey for characterId: ${characterId}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let characterName = 'Unknown Character';
  const segments = [];
  const gapsData = []; // Renamed to avoid conflict with the store's 'gaps' Map key

  if (characterId === 'char1') {
    characterName = 'Sarah';
    segments.push(
      { time: '0-10min', activity: 'Wakes up, prepares for the day', type: 'activity' },
      { time: '10-15min', activity: 'Gap: Missing info', type: 'gap' }, // This will be a gap
      { time: '15-30min', activity: 'Commutes to work, listens to podcast', type: 'activity' },
      { time: '30-35min', activity: 'Interacts with colleague Mark', type: 'interaction' },
      { time: '35-45min', activity: 'Works on Project Alpha', type: 'activity' }
    );
    gapsData.push({
      id: 'gap-sarah-1',
      time: '10-15min',
      description: 'Sarah has a gap in her morning routine. What happens after she prepares for the day and before she commutes?',
      characterId: 'char1',
    });
  } else if (characterId === 'char2') {
    characterName = 'Alex';
    segments.push(
      { time: '0-5min', activity: 'Checks overnight server logs', type: 'activity' },
      { time: '5-20min', activity: 'Debugs critical issue with server X', type: 'activity' },
      { time: '20-25min', activity: 'Gap: Unaccounted time', type: 'gap' }, // This will be a gap
      { time: '25-40min', activity: 'Attends daily stand-up meeting', type: 'interaction' },
      { time: '40-50min', activity: 'Discovers a new security vulnerability', type: 'discovery' }
    );
    gapsData.push({
      id: 'gap-alex-1',
      time: '20-25min',
      description: 'Alex has unaccounted time after debugging and before the stand-up. What was Alex doing?',
      characterId: 'char2',
    });
  } else {
     segments.push({ time: '0-10min', activity: 'Default character activity', type: 'activity' });
  }

  const mockJourney = {
    id: characterId,
    name: characterName,
    segments: segments, // These are descriptive segments, not necessarily the same as TimelineView events
    gaps: gapsData,     // This is the specific gap data extracted/defined for this character
  };

  console.log(`[api.js] Returning mock journey for ${characterId}:`, mockJourney);
  return mockJourney;
};

// Placeholder for other API functions if needed later
// export const saveGapResolution = async (gapId, resolutionDetails) => { ... };

// Note: This is a simplified mock. A real API would involve HTTP requests (e.g., using axios or fetch).
// The `api` object that was in App.jsx might be for a different purpose (e.g. Notion specific API calls)
// For this subtask, we are creating a new conceptual api service for journey data.
// If this needs to be merged with an existing api service, that would be a separate step.
const api = {
    getJourney,
    // ... other methods
};

export default api;
