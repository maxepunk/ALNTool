import axios from 'axios';

import logger from '../utils/logger';
import { logApiResponse } from '../utils/apiLogger';

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

  // Cache management
  clearCache: async () => {
    const response = await apiClient.post('/cache/clear');
    return response.data;
  },

  // Sync management
  cancelSync: async () => {
    const response = await apiClient.post('/sync/cancel');
    return response.data;
  },

  // Game constants
  getGameConstants: async () => {
    const response = await apiClient.get('/game-constants');
    return response.data;
  },
};

// Response interceptor for logging successful responses
apiClient.interceptors.response.use(
  (response) => {
    // Log successful API responses
    logApiResponse(response.config.url, response, response.data);
    
    // Handle standardized response format
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        // Return the data directly for successful responses
        response.data = response.data.data;
      }
    }
    
    return response;
  },
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
    
    // Handle standardized error format
    let customError;
    if (error.response?.data?.success === false && error.response?.data?.error) {
      // Use the standardized error format from backend
      customError = {
        message: error.response.data.error.message || 'An unexpected error occurred',
        status: error.response.data.error.code || error.response.status,
        details: error.response.data.error.details,
        data: error.response.data,
      };
    } else {
      // Fallback for non-standardized errors
      customError = {
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
        status: error.response?.status,
        data: error.response?.data,
      };
    }
    
    return Promise.reject(customError);
  }
);


export { apiClient }; // Named export for apiClient
export default api; // Default export the api object with methods