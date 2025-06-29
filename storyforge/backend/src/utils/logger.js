/**
 * Production-ready logger utility for Backend
 * 
 * Replaces console.* statements with environment-aware logging
 * - Development: Shows logs in console with prefixes and timestamps
 * - Production: Structured logging with proper levels
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Timestamp helper
const getTimestamp = () => {
  return new Date().toISOString();
};

// Production monitoring integration placeholder
const sendToMonitoring = (level, message, ...args) => {
  // TODO: Integrate with monitoring service (Winston, Pino, etc.)
  // For now, we use structured console output in production
  const logEntry = {
    timestamp: getTimestamp(),
    level: level.toUpperCase(),
    message,
    data: args.length > 0 ? args : undefined
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
};

const logger = {
  /**
   * Debug information - only shown in development
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[${getTimestamp()}] [DEBUG] ${message}`, ...args);
    }
  },

  /**
   * General information - shown in development, structured in production
   */
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`[${getTimestamp()}] [INFO] ${message}`, ...args);
    } else {
      sendToMonitoring('info', message, ...args);
    }
  },

  /**
   * Warning conditions - shown in development, structured in production
   */
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[${getTimestamp()}] [WARN] ${message}`, ...args);
    } else {
      sendToMonitoring('warn', message, ...args);
    }
  },

  /**
   * Error conditions - always logged with full context
   */
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[${getTimestamp()}] [ERROR] ${message}`, ...args);
    } else {
      sendToMonitoring('error', message, ...args);
    }
  },

  /**
   * Critical system information - always shown with timestamp
   */
  system: (message, ...args) => {
    console.log(`[${getTimestamp()}] [SYSTEM] ${message}`, ...args);
  },

  /**
   * Database operations - only shown in development
   */
  db: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[${getTimestamp()}] [DB] ${message}`, ...args);
    }
  },

  /**
   * API requests - only shown in development
   */
  api: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[${getTimestamp()}] [API] ${message}`, ...args);
    }
  },

  /**
   * Sync operations - only shown in development
   */
  sync: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[${getTimestamp()}] [SYNC] ${message}`, ...args);
    }
  },

  /**
   * Performance timing - only shown in development
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(`[TIMER] ${label}`);
    }
  },

  /**
   * End performance timing - only shown in development
   */
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(`[TIMER] ${label}`);
    }
  }
};

module.exports = logger;