const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const notionRoutes = require('./routes/notion');
const journeyRoutes = require('./routes/journeyRoutes');
const syncRoutes = require('./routes/syncRoutes');

// Import database migration function
const { initializeDatabase } = require('./db/database');
const GameConstants = require('./config/GameConstants');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Log HTTP requests

// Rate limiting - DISABLED FOR DEVELOPMENT to prevent 429 errors
// TODO: Re-enable with appropriate limits for production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: GameConstants.SYSTEM.RATE_LIMIT.WINDOW_MS,
    max: GameConstants.SYSTEM.RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
  app.use(limiter);
  logger.debug('Rate limiting enabled for production');
} else {
  logger.debug('Rate limiting DISABLED for development');
}

// Routes
app.use('/api', notionRoutes); // Existing Notion routes
app.use('/api', journeyRoutes); // New Journey Engine routes (e.g. /api/journeys/:characterId)
app.use('/api/sync', syncRoutes); // Data sync routes (e.g. /api/sync/data, /api/sync/status)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'StoryForge API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
  // Initialize and migrate database, but not in test environment
  if (process.env.NODE_ENV !== 'test') {
    try {
      initializeDatabase(); // This will connect and then run migrations
      logger.debug('Database ready.');

      // Only start listening if the script is executed directly (not imported as a module for testing)
      if (require.main === module) { // No need to check NODE_ENV again here
        app.listen(PORT, () => {
          logger.debug(`Server running on port ${PORT}`);
          logger.debug(`- Health check: http://localhost:${PORT}/health`);
          logger.debug(`- API endpoints: http://localhost:${PORT}/api/*`);
        });
      }
    } catch (error) {
      logger.error('Failed to initialize or migrate database:', error);
      process.exit(1); // Exit if database setup fails
    }
  } else {
    // In test environment, we might not want to auto-start the server or connect DB here.
    // Tests will typically manage their own server instance and DB connection (e.g., in-memory).
    logger.debug('Running in TEST environment. Database initialization and server auto-start skipped in index.js.');
  }
}

startServer();

module.exports = app; // Export the app for testing purposes