require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const notionRoutes = require('./routes/notion');
const journeyRoutes = require('./routes/journeyRoutes');

// Import database migration function
const { runMigrations } = require('./db/migrations');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Log HTTP requests

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api', notionRoutes); // Existing Notion routes
app.use('/api', journeyRoutes); // New Journey Engine routes (e.g. /api/journeys/:characterId)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'StoryForge API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
  // Initialize and migrate database
  try {
    runMigrations(); // This will also initialize if needed
    console.log('Database ready.');

    // Only start listening if the script is executed directly (not imported as a module for testing)
    if (process.env.NODE_ENV !== 'test' && require.main === module) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`- Health check: http://localhost:${PORT}/health`);
        console.log(`- API endpoints: http://localhost:${PORT}/api/*`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize or migrate database:', error);
    process.exit(1); // Exit if database setup fails
  }
}

startServer();

module.exports = app; // Export the app for testing purposes 