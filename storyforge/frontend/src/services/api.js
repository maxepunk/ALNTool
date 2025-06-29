import axios from 'axios';

import logger from '../utils/logger';
// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: '/api', // Ensure this matches your BFF's proxy path if using Vite/CRA proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout to 15 seconds
});

// API endpoints
export const api = {
  // Metadata
  getDatabasesMetadata: async () => {
    const response = await apiClient.get('/metadata');
    return response.data;
  },

  // Characters
  getCharacters: async (filters = {}) => {
    const response = await apiClient.get('/characters', { params: filters });
    return response.data;
  },

  getCharacterById: async (id) => {
    const response = await apiClient.get(`/characters/${id}`);
    return response.data;
  },

  getJourneyByCharacterId: async (characterId) => {
    if (!characterId) {
      // Optionally, throw an error or return a specific response if characterId is missing
      // For now, let the backend handle missing/invalid ID, or rely on caller validation
      logger.warn('getJourneyByCharacterId called without a characterId');
    }
    const response = await apiClient.get(`/journeys/${characterId}`);
    return response.data;
  },

  getCharacterGraph: async (id, depth = 2) => {
    const response = await apiClient.get(`/characters/${id}/graph`, { params: { depth } });
    return response.data;
  },

  // Timeline
  getTimelineEvents: async (filters = {}) => {
    // Using /timeline endpoint to match backend API
    const response = await apiClient.get('/timeline', { params: filters });
    return response.data;
  },

  getTimelineEventsList: async (filters = {}) => {
    // Database-backed timeline events for dashboard
    const response = await apiClient.get('/timeline/list', { params: filters });
    return response.data;
  },

  getTimelineEventById: async (id) => {
    // Using /timeline endpoint to match backend API
    const response = await apiClient.get(`/timeline/${id}`);
    return response.data;
  },

  // Puzzles
  getPuzzles: async (filters = {}) => {
    const response = await apiClient.get('/puzzles', { params: filters });
    return response.data;
  },

  getPuzzleById: async (id) => {
    const response = await apiClient.get(`/puzzles/${id}`);
    return response.data;
  },

  // Elements
  getElements: async (filters = {}) => {
    const response = await apiClient.get('/elements', { params: filters });
    return response.data;
  },

  getElementById: async (id) => {
    const response = await apiClient.get(`/elements/${id}`);
    return response.data;
  },

  // Global search
  globalSearch: async (query) => {
    const response = await apiClient.get('/search', { params: { q: query } });
    return response.data;
  },

  getElementGraph: async (id, depth = 2) => {
    const url = `/elements/${id}/graph`;
    const params = { depth };
    logger.debug('Attempting to fetch graph data:', { url, params });
    const response = await apiClient.get(url, { params });
    return response.data;
  },

  // Sync data from Notion
  syncData: async () => {
    const response = await apiClient.post('/sync/data');
    return response.data;
  },

  // Get sync status
  getSyncStatus: async () => {
    const response = await apiClient.get('/sync/status');
    return response.data;
  },

  getPuzzleGraph: async (id, depth = 2) => {
    const response = await apiClient.get(`/puzzles/${id}/graph`, { params: { depth } });
    return response.data;
  },

  getTimelineGraph: async (id, depth = 2) => {
    const response = await apiClient.get(`/timeline/${id}/graph`, { params: { depth } });
    return response.data;
  },

  // New endpoints for "Needs Attention" data
  getPuzzlesWithWarnings: async () => {
    const response = await apiClient.get('/puzzles/with-warnings');
    return response.data;
  },

  getElementsWithWarnings: async () => {
    const response = await apiClient.get('/elements/with-warnings');
    return response.data;
  },

  // Endpoint for Puzzle Flow data
  getPuzzleFlow: async (puzzleId) => {
    if (!puzzleId) throw new Error("Puzzle ID is required for getPuzzleFlow");
    const response = await apiClient.get(`/puzzles/${puzzleId}/flow`);
    return response.data;
  },

  // Endpoint for Character Sociogram data
  getAllCharactersWithSociogramData: async () => {
    const response = await apiClient.get('/characters/with-sociogram-data');
    return response.data;
  },

  // Endpoint for unique Narrative Threads
  getAllUniqueNarrativeThreads: async () => {
    const response = await apiClient.get('/narrative-threads/unique');
    return response.data;
  },

  // Endpoint for Characters with Warnings
  getCharactersWithWarnings: async () => {
    const response = await apiClient.get('/characters/with-warnings');
    return response.data;
  },
  getPuzzleFlowGraph: async (id) => { // For graph visualization of puzzle flow
    const response = await apiClient.get(`/puzzles/${id}/flowgraph`);
    return response.data;
  },
  getUniqueNarrativeThreads: async () => {
    const response = await apiClient.get('/narrative-threads'); // Path from B023/B027
    return response.data;
  },
};

// Error interceptor for logging and potentially transforming errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error('API Error Response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        url: error.config.url,
        params: error.config.params,
      });
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('API No Response:', error.request, error.config.url);
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error('API Request Setup Error:', error.message, error.config.url);
    }
    
    // Standardize error object to be returned
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    
    return Promise.reject(customError);
  }
);

// Named exports for backward compatibility with tests
export const fetchCharacterGraphData = async (id) => {
  const response = await fetch(`/api/characters/${id}/graph`);
  if (!response.ok) {
    throw new Error(`Failed to fetch character graph data for ${id}: ${response.status}`);
  }
  return response.json();
};

export const fetchElementGraphData = async (id) => {
  const response = await fetch(`/api/elements/${id}/graph`);
  if (!response.ok) {
    throw new Error(`Failed to fetch element graph data for ${id}: ${response.status}`);
  }
  return response.json();
};

export const fetchPuzzleGraphData = async (id) => {
  const response = await fetch(`/api/puzzles/${id}/graph`);
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle graph data for ${id}: ${response.status}`);
  }
  return response.json();
};

export const fetchTimelineGraphData = async (id) => {
  const response = await fetch(`/api/timeline/${id}/graph`);
  if (!response.ok) {
    throw new Error(`Failed to fetch timeline graph data for ${id}: ${response.status}`);
  }
  return response.json();
};

export const fetchCharacters = async () => {
  const response = await fetch('/api/characters');
  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${response.status}`);
  }
  return response.json();
};

export const fetchElements = async () => {
  const response = await fetch('/api/elements');
  if (!response.ok) {
    throw new Error(`Failed to fetch elements: ${response.status}`);
  }
  return response.json();
};

export const fetchPuzzles = async () => {
  const response = await fetch('/api/puzzles');
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzles: ${response.status}`);
  }
  return response.json();
};

export const fetchTimelineEvents = async () => {
  const response = await fetch('/api/timeline');
  if (!response.ok) {
    throw new Error(`Failed to fetch timeline events: ${response.status}`);
  }
  return response.json();
};

export const fetchEntityById = async (entityType, id) => {
  const response = await fetch(`/api/${entityType}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${entityType} with id ${id}: ${response.status}`);
  }
  return response.json();
};

export const searchAll = async (query) => {
  const response = await fetch(`/api/search?q=${query}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  return response.json();
};

export { apiClient }; // Named export for apiClient
export default api; // Default export the api object with methods