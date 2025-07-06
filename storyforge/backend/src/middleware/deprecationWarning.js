const logger = require('../utils/logger');

/**
 * Middleware to add deprecation warnings for old API routes
 */
function deprecationWarning(message, newEndpoint) {
  return (req, res, next) => {
    const warningMessage = `Deprecated API endpoint: ${req.method} ${req.originalUrl}. ${message} Use ${newEndpoint} instead.`;
    
    // Log the deprecation
    logger.warn(warningMessage, {
      method: req.method,
      path: req.originalUrl,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    // Add deprecation headers
    res.setHeader('X-Deprecation-Warning', warningMessage);
    res.setHeader('X-Deprecation-Date', '2024-06-01');
    res.setHeader('X-Sunset-Date', '2024-12-01');
    res.setHeader('Link', `<${newEndpoint}>; rel="successor-version"`);
    
    next();
  };
}

/**
 * Create route mapping from old to new endpoints
 */
const routeMappings = {
  // Character routes
  'GET /api/characters': 'GET /api/v2/entities/characters',
  'GET /api/characters/:id': 'GET /api/v2/entities/characters/:id',
  'GET /api/characters/with-warnings': 'GET /api/v2/warnings/characters',
  'GET /api/characters/with-sociogram-data': 'GET /api/v2/views/sociogram',
  'GET /api/character-links': 'GET /api/v2/characters/links',
  'GET /api/characters/:id/graph': 'GET /api/v2/relationships/characters/:id',
  
  // Element routes
  'GET /api/elements': 'GET /api/v2/entities/elements',
  'GET /api/elements/:id': 'GET /api/v2/entities/elements/:id',
  'GET /api/elements/with-warnings': 'GET /api/v2/warnings/elements',
  'GET /api/elements/:id/graph': 'GET /api/v2/relationships/elements/:id',
  
  // Puzzle routes
  'GET /api/puzzles': 'GET /api/v2/entities/puzzles',
  'GET /api/puzzles/:id': 'GET /api/v2/entities/puzzles/:id',
  'GET /api/puzzles/with-warnings': 'GET /api/v2/warnings/puzzles',
  'GET /api/puzzles/:id/graph': 'GET /api/v2/relationships/puzzles/:id',
  'GET /api/puzzles/:id/flow': 'GET /api/v2/analysis/puzzle-flow/:id',
  'GET /api/puzzles/:id/flowgraph': 'GET /api/v2/analysis/puzzle-graph/:id',
  
  // Timeline routes
  'GET /api/timeline': 'GET /api/v2/entities/timeline',
  'GET /api/timeline/:id': 'GET /api/v2/entities/timeline/:id',
  'GET /api/timeline/list': 'GET /api/v2/views/timeline-list',
  'GET /api/timeline/:id/graph': 'GET /api/v2/relationships/timeline/:id',
  
  // Other routes
  'GET /api/narrative-threads': 'GET /api/v2/views/narrative-threads',
  'GET /api/search': 'GET /api/v2/search',
  'POST /api/cache/clear': 'POST /api/v2/cache/clear',
  'GET /api/metadata': 'GET /api/v2/metadata',
  'GET /api/game-constants': 'GET /api/v2/constants'
};

/**
 * Apply deprecation warnings to old routes
 */
function applyDeprecationWarnings(router) {
  // Add deprecation middleware to existing routes
  router.use((req, res, next) => {
    const routeKey = `${req.method} ${req.baseUrl}${req.path}`;
    const genericRouteKey = routeKey.replace(/\/[a-f0-9-]+/g, '/:id');
    
    const newEndpoint = routeMappings[routeKey] || routeMappings[genericRouteKey];
    
    if (newEndpoint) {
      const message = 'This endpoint is deprecated and will be removed in future versions.';
      deprecationWarning(message, newEndpoint)(req, res, next);
    } else {
      next();
    }
  });
}

module.exports = {
  deprecationWarning,
  applyDeprecationWarnings,
  routeMappings
};