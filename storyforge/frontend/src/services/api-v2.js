import axios from 'axios';
import logger from '../utils/logger';
import { logApiResponse } from '../utils/apiLogger';

// Create axios instance with base URL
const baseURL = process.env.NODE_ENV === 'test' 
  ? 'http://localhost/api' 
  : '/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ===========================
// GENERIC ENTITY OPERATIONS (5)
// ===========================

const entityAPI = {
  /**
   * List entities with optional filters
   * @param {string} entityType - Type of entity (characters, elements, puzzles, timeline)
   * @param {Object} params - Query parameters for filtering
   */
  list: async (entityType, params = {}) => {
    const response = await apiClient.get(`/${entityType}`, { params });
    return response.data;
  },

  /**
   * Get a single entity by ID
   * @param {string} entityType - Type of entity
   * @param {string} id - Entity ID
   */
  get: async (entityType, id) => {
    const response = await apiClient.get(`/${entityType}/${id}`);
    return response.data;
  },

  /**
   * Create a new entity
   * @param {string} entityType - Type of entity
   * @param {Object} data - Entity data
   */
  create: async (entityType, data) => {
    const response = await apiClient.post(`/${entityType}`, data);
    return response.data;
  },

  /**
   * Update an existing entity
   * @param {string} entityType - Type of entity
   * @param {string} id - Entity ID
   * @param {Object} data - Updated entity data
   */
  update: async (entityType, id, data) => {
    const response = await apiClient.put(`/${entityType}/${id}`, data);
    return response.data;
  },

  /**
   * Delete an entity
   * @param {string} entityType - Type of entity
   * @param {string} id - Entity ID
   */
  delete: async (entityType, id) => {
    const response = await apiClient.delete(`/${entityType}/${id}`);
    return response.data;
  }
};

// ===========================
// SPECIALIZED ENDPOINTS (10)
// ===========================

const specializedAPI = {
  // 1. Sync Operations
  syncNotionData: async () => {
    const response = await apiClient.post('/sync/data');
    return response.data;
  },

  getSyncStatus: async () => {
    const response = await apiClient.get('/sync/status');
    return response.data;
  },

  // 2. Journey & Graph Operations
  getJourneyData: async (characterId) => {
    if (!characterId) {
      logger.warn('getJourneyData called without a characterId');
    }
    const response = await apiClient.get(`/journeys/${characterId}`);
    return response.data;
  },

  getEntityGraph: async (entityType, id, depth = 2) => {
    const response = await apiClient.get(`/${entityType}/${id}/graph`, { params: { depth } });
    return response.data;
  },

  // 3. Performance & Filtered Data
  getPerformanceElements: async (filterGroup) => {
    const params = filterGroup ? { filterGroup } : {};
    const response = await apiClient.get('/elements', { params });
    return response.data;
  },

  // 4. Relationships & Links
  getCharacterLinks: async () => {
    const response = await apiClient.get('/character-links');
    return response.data;
  },

  // 5. Warning & Attention Data
  getEntitiesWithWarnings: async (entityType) => {
    const response = await apiClient.get(`/${entityType}/with-warnings`);
    return response.data;
  },

  // 6. Search
  globalSearch: async (query) => {
    const response = await apiClient.get('/search', { params: { q: query } });
    return response.data;
  },

  // 7. Metadata & Constants
  getMetadata: async () => {
    const response = await apiClient.get('/metadata');
    return response.data;
  },

  getGameConstants: async () => {
    const response = await apiClient.get('/game-constants');
    return response.data;
  }
};

// ===========================
// CONSOLIDATED API OBJECT
// ===========================

export const api = {
  // Generic entity operations
  entities: entityAPI,

  // Specialized operations
  ...specializedAPI,

  // Legacy compatibility layer (to be deprecated)
  // Maps old method names to new structure
  getCharacters: (filters) => entityAPI.list('characters', filters),
  getCharacterById: (id) => entityAPI.get('characters', id),
  getElements: (filters) => entityAPI.list('elements', filters),
  getElementById: (id) => entityAPI.get('elements', id),
  getPuzzles: (filters) => entityAPI.list('puzzles', filters),
  getPuzzleById: (id) => entityAPI.get('puzzles', id),
  getTimelineEvents: (filters) => entityAPI.list('timeline', filters),
  getTimelineEventById: (id) => entityAPI.get('timeline', id),
  
  // Map specialized legacy methods
  syncData: () => specializedAPI.syncNotionData(),
  getJourneyByCharacterId: (id) => specializedAPI.getJourneyData(id),
  getCharacterGraph: (id, depth) => specializedAPI.getEntityGraph('characters', id, depth),
  getElementGraph: (id, depth) => specializedAPI.getEntityGraph('elements', id, depth),
  getPuzzleGraph: (id, depth) => specializedAPI.getEntityGraph('puzzles', id, depth),
  getTimelineGraph: (id, depth) => specializedAPI.getEntityGraph('timeline', id, depth),
  
  getCharactersWithWarnings: () => specializedAPI.getEntitiesWithWarnings('characters'),
  getElementsWithWarnings: () => specializedAPI.getEntitiesWithWarnings('elements'),
  getPuzzlesWithWarnings: () => specializedAPI.getEntitiesWithWarnings('puzzles'),
  
  getDatabasesMetadata: () => specializedAPI.getMetadata(),
  
  // Keep these specialized endpoints as-is for now
  getPuzzleFlow: async (puzzleId) => {
    if (!puzzleId) throw new Error("Puzzle ID is required for getPuzzleFlow");
    const response = await apiClient.get(`/puzzles/${puzzleId}/flow`);
    return response.data;
  },
  
  getPuzzleFlowGraph: async (id) => {
    const response = await apiClient.get(`/puzzles/${id}/flowgraph`);
    return response.data;
  },
  
  getAllCharactersWithSociogramData: async () => {
    const response = await apiClient.get('/characters/with-sociogram-data');
    return response.data;
  },
  
  getUniqueNarrativeThreads: async () => {
    const response = await apiClient.get('/narrative-threads');
    return response.data;
  },
  
  getTimelineEventsList: async (filters = {}) => {
    const response = await apiClient.get('/timeline/list', { params: filters });
    return response.data;
  },
  
  // Cache and sync management
  clearCache: async () => {
    const response = await apiClient.post('/cache/clear');
    return response.data;
  },
  
  cancelSync: async () => {
    const response = await apiClient.post('/sync/cancel');
    return response.data;
  }
};

// ===========================
// INTERCEPTORS
// ===========================

// Response interceptor for logging and standardized format handling
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
    // Log error details
    if (error.response) {
      logger.error('API Error Response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        url: error.config.url,
        params: error.config.params,
      });
    } else if (error.request) {
      logger.error('API No Response:', error.request, error.config.url);
    } else {
      logger.error('API Request Setup Error:', error.message, error.config.url);
    }
    
    // Handle standardized error format
    let customError;
    if (error.response?.data?.success === false && error.response?.data?.error) {
      customError = {
        message: error.response.data.error.message || 'An unexpected error occurred',
        status: error.response.data.error.code || error.response.status,
        details: error.response.data.error.details,
        data: error.response.data,
      };
    } else {
      customError = {
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
        status: error.response?.status,
        data: error.response?.data,
      };
    }
    
    return Promise.reject(customError);
  }
);

export { apiClient };
export default api;