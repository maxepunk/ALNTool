import logger from './logger';

/**
 * API Response Logger Middleware
 * Logs all API responses in development to help diagnose integration issues
 */
export const logApiResponse = (url, response, data) => {
  // Disable logging in Jest environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
  
  // Determine if we're in development mode (Vite provides import.meta.env)
  const isDev = import.meta.env?.MODE === 'development';
  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001';
  
  if (!isDev) return;
  const endpoint = url.replace(apiUrl, '');
  
  logger.info(`API Response: ${endpoint}`, {
    status: response.status,
    ok: response.ok,
    dataShape: data ? {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data) : null,
      length: Array.isArray(data) ? data.length : null,
      sample: Array.isArray(data) && data.length > 0 ? {
        firstItem: data[0],
        firstItemKeys: Object.keys(data[0] || {})
      } : null
    } : null
  });

  // Log full response in debug mode
  logger.debug(`Full API Response: ${endpoint}`, data);
};

/**
 * Wraps fetch to automatically log responses
 */
export const fetchWithLogging = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    logApiResponse(url, response, data);
    
    // Return cloned response with data attached for convenience
    return {
      ...response,
      data,
      json: async () => data
    };
  } catch (error) {
    logger.error(`API Error: ${url}`, error);
    throw error;
  }
};

/**
 * Component boundary logger for debugging data flow
 */
export const logComponentData = (componentName, props, context = {}) => {
  // Disable logging in Jest environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
  
  // Determine if we're in development mode (Vite provides import.meta.env)
  const isDev = import.meta.env?.MODE === 'development';
  
  if (!isDev) return;

  logger.debug(`Component Data: ${componentName}`, {
    props: {
      keys: Object.keys(props),
      types: Object.entries(props).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? `array(${value.length})` : typeof value;
        return acc;
      }, {})
    },
    context,
    hasData: Object.values(props).some(v => 
      (Array.isArray(v) && v.length > 0) || 
      (v && typeof v === 'object' && Object.keys(v).length > 0)
    )
  });
};