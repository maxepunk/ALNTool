/**
 * Production-ready logger utility
 * 
 * Replaces console.* statements with environment-aware logging
 * - Development: Shows logs in console with prefixes
 * - Production: Silently handles or sends to monitoring service
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Production monitoring integration placeholder
const sendToMonitoring = (level, message, ...args) => {
  // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
  // For now, we silently discard in production
  if (isDevelopment) {
    console.warn('[MONITORING]', level, message, ...args);
  }
};

const logger = {
  /**
   * Debug information - only shown in development
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * General information - shown in development, stored in production
   */
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    } else {
      sendToMonitoring('info', message, ...args);
    }
  },

  /**
   * Warning conditions - shown in development, sent to monitoring in production
   */
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    } else {
      sendToMonitoring('warn', message, ...args);
    }
  },

  /**
   * Error conditions - always logged, sent to monitoring in production
   */
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args);
    } else {
      // Errors should always be captured, even in production
      console.error(`[ERROR] ${message}`, ...args);
      sendToMonitoring('error', message, ...args);
    }
  },

  /**
   * Critical system information - always shown
   */
  system: (message, ...args) => {
    console.log(`[SYSTEM] ${message}`, ...args);
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
  },

  /**
   * Group logs together - only in development
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(`[GROUP] ${label}`);
    }
  },

  /**
   * End log group - only in development
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table output - only in development
   */
  table: (data) => {
    if (isDevelopment && console.table) {
      console.table(data);
    }
  }
};

export default logger;