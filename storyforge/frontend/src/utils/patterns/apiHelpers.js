/**
 * API Helpers - Utilities for API requests and responses
 * 
 * @module utils/patterns/apiHelpers
 */

import { API, ERROR_MESSAGES } from './constants';

/**
 * Build query string from params object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 * 
 * @example
 * buildQueryString({ page: 1, limit: 10, search: 'test' })
 * // '?page=1&limit=10&search=test'
 */
export const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Parse error response to get user-friendly message
 * @param {Error|Response|any} error - Error object
 * @returns {string} Error message
 * 
 * @example
 * parseErrorMessage(new Error('Network error')) // 'Network error'
 * parseErrorMessage({ response: { data: { message: 'Invalid input' } } }) // 'Invalid input'
 */
export const parseErrorMessage = (error) => {
  // Axios error with response
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Axios error with response error
  if (error?.response?.data?.error) {
    return typeof error.response.data.error === 'string' 
      ? error.response.data.error 
      : error.response.data.error.message || ERROR_MESSAGES.GENERIC;
  }
  
  // Standard Error object
  if (error?.message) {
    return error.message;
  }
  
  // String error
  if (typeof error === 'string') {
    return error;
  }
  
  // Network error
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return ERROR_MESSAGES.TIMEOUT;
  }
  
  if (error?.code === 'NETWORK_ERROR' || error?.request && !error.response) {
    return ERROR_MESSAGES.NETWORK;
  }
  
  return ERROR_MESSAGES.GENERIC;
};

/**
 * Handle API response with standard format
 * @param {Response} response - API response
 * @returns {Object} Parsed response data
 * 
 * @example
 * const data = await handleApiResponse(response);
 * // Returns response.data for axios or parsed JSON for fetch
 */
export const handleApiResponse = async (response) => {
  // Axios response
  if (response.data !== undefined) {
    return response.data;
  }
  
  // Fetch API response
  if (response.json) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  }
  
  return response;
};

/**
 * Create headers object with common headers
 * @param {Object} customHeaders - Additional headers
 * @returns {Object} Headers object
 * 
 * @example
 * createHeaders({ 'X-Custom': 'value' })
 * // { 'Content-Type': 'application/json', 'X-Custom': 'value' }
 */
export const createHeaders = (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };
  
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Retry failed request with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of successful request
 * 
 * @example
 * const data = await retryRequest(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3, delay: 1000 }
 * );
 */
export const retryRequest = async (fn, options = {}) => {
  const {
    maxAttempts = API.RETRY_ATTEMPTS,
    delay = API.RETRY_DELAY,
    shouldRetry = (error) => true,
    onRetry = () => {}
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      
      onRetry(attempt, error);
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * Cancel request using AbortController
 * @returns {Object} Controller and cancel function
 * 
 * @example
 * const { controller, cancel } = createCancelToken();
 * fetch('/api/data', { signal: controller.signal });
 * // Later: cancel();
 */
export const createCancelToken = () => {
  const controller = new AbortController();
  
  return {
    controller,
    cancel: () => controller.abort(),
    signal: controller.signal
  };
};

/**
 * Transform API filters to query params
 * @param {Object} filters - Filter object
 * @returns {Object} Query parameters
 * 
 * @example
 * transformFilters({ 
 *   search: 'test', 
 *   type: ['A', 'B'], 
 *   active: true 
 * })
 * // { search: 'test', type: 'A,B', active: 'true' }
 */
export const transformFilters = (filters) => {
  const params = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    if (Array.isArray(value) && value.length > 0) {
      params[key] = value.join(',');
    } else if (typeof value === 'boolean') {
      params[key] = value.toString();
    } else if (value instanceof Date) {
      params[key] = value.toISOString();
    } else {
      params[key] = value;
    }
  });
  
  return params;
};

/**
 * Paginate array data
 * @param {Array} data - Data to paginate
 * @param {number} page - Current page (1-based)
 * @param {number} pageSize - Items per page
 * @returns {Object} Paginated data with metadata
 * 
 * @example
 * paginate(items, 2, 10)
 * // { data: [...], page: 2, pageSize: 10, total: 50, totalPages: 5 }
 */
export const paginate = (data, page = 1, pageSize = 20) => {
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: data.slice(start, end),
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Debounce API calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounceApi(searchApi, 300);
 * debouncedSearch('query');
 */
export const debounceApi = (fn, delay = 300) => {
  let timeoutId;
  let abortController;
  
  return async (...args) => {
    // Cancel previous request
    if (abortController) {
      abortController.abort();
    }
    
    // Clear previous timeout
    clearTimeout(timeoutId);
    
    // Create new abort controller
    abortController = new AbortController();
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args, { signal: abortController.signal });
          resolve(result);
        } catch (error) {
          if (error.name === 'AbortError') {
            return; // Ignore aborted requests
          }
          reject(error);
        }
      }, delay);
    });
  };
};

/**
 * Cache API responses
 * @param {string} key - Cache key
 * @param {Function} fetcher - Function to fetch data
 * @param {Object} options - Cache options
 * @returns {Promise} Cached or fresh data
 * 
 * @example
 * const data = await cacheApi(
 *   'users', 
 *   () => fetch('/api/users'),
 *   { ttl: 5 * 60 * 1000 } // 5 minutes
 * );
 */
const cache = new Map();

export const cacheApi = async (key, fetcher, options = {}) => {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutes default
    force = false 
  } = options;
  
  const cached = cache.get(key);
  const now = Date.now();
  
  if (!force && cached && (now - cached.timestamp < ttl)) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  
  return data;
};

/**
 * Clear API cache
 * @param {string} key - Specific key to clear (optional)
 * 
 * @example
 * clearCache(); // Clear all
 * clearCache('users'); // Clear specific key
 */
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Format API endpoint with base URL
 * @param {string} endpoint - API endpoint
 * @returns {string} Full URL
 * 
 * @example
 * formatEndpoint('/users') // 'http://localhost:3001/api/users'
 */
export const formatEndpoint = (endpoint) => {
  const baseUrl = API.BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Add /api prefix if not present
  if (!cleanEndpoint.startsWith('/api')) {
    return `${baseUrl}/api${cleanEndpoint}`;
  }
  
  return `${baseUrl}${cleanEndpoint}`;
};