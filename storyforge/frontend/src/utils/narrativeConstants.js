/**
 * narrativeConstants.js
 * Narrative thread categories and configurations for About Last Night
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx for better maintainability
 * and reusability across components.
 */

// Narrative thread categories for About Last Night
export const NARRATIVE_THREADS = {
  'Marcus Investigation': {
    color: 'error',
    icon: '🕵️',
    description: 'Central murder mystery investigation',
    priority: 'critical'
  },
  'Corporate Intrigue': {
    color: 'warning', 
    icon: '🏢',
    description: 'Business conflicts and company secrets',
    priority: 'high'
  },
  'Personal Relationships': {
    color: 'info',
    icon: '💕',
    description: 'Character relationships and personal conflicts',
    priority: 'high'
  },
  'Memory Economy': {
    color: 'secondary',
    icon: '🧠',
    description: 'Memory tokens and their distribution',
    priority: 'medium'
  },
  'Social Dynamics': {
    color: 'success',
    icon: '👥',
    description: 'Group interactions and social tensions',
    priority: 'medium'
  },
  'Technology & Innovation': {
    color: 'primary',
    icon: '🔬',
    description: 'AI development and tech themes',
    priority: 'medium'
  }
};

// Keywords for auto-categorizing narrative threads
export const THREAD_KEYWORDS = {
  'Marcus Investigation': ['marcus', 'murder', 'death', 'investigate', 'detective', 'evidence', 'crime', 'victim'],
  'Corporate Intrigue': ['company', 'business', 'funding', 'investor', 'corporate', 'ceo', 'startup', 'venture'],
  'Personal Relationships': ['relationship', 'marriage', 'affair', 'love', 'divorce', 'partner', 'romantic', 'personal'],
  'Memory Economy': ['memory', 'token', 'rfid', 'value', 'collect', 'economic', 'reward'],
  'Social Dynamics': ['group', 'social', 'friend', 'enemy', 'conflict', 'alliance', 'tension', 'interaction'],
  'Technology & Innovation': ['ai', 'artificial', 'intelligence', 'tech', 'innovation', 'development', 'research', 'algorithm']
};

// Coherence scoring thresholds and configurations
export const COHERENCE_THRESHOLDS = {
  // Thread coherence scoring
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  POOR: 40,
  CRITICAL: 25,
  
  // Minimum items per thread for balanced narrative
  MIN_CHARACTERS_PER_THREAD: 2,
  MIN_ELEMENTS_PER_THREAD: 3,
  MIN_PUZZLES_PER_THREAD: 1,
  MIN_TIMELINE_EVENTS_PER_THREAD: 2,
  
  // Connection strength weights
  KEYWORD_MATCH_WEIGHT: 1,
  DESCRIPTION_MATCH_WEIGHT: 2,
  EXPLICIT_THREAD_WEIGHT: 5,
  
  // Gap detection thresholds
  MAX_THREAD_IMBALANCE: 0.3, // 30% imbalance between threads
  MIN_CROSS_THREAD_CONNECTIONS: 2,
  MAX_ISOLATED_CHARACTERS: 1
};

// Recommendation message templates
export const RECOMMENDATION_TEMPLATES = {
  THREAD_IMBALANCE: 'Thread imbalance detected: "{thread}" has {count} items vs average of {average}',
  ISOLATED_CHARACTERS: 'Character isolation risk: {count} characters have minimal thread connections',
  MISSING_CONNECTIONS: 'Weak narrative coherence: {thread1} and {thread2} need more connecting elements',
  LOW_ENGAGEMENT: 'Low engagement potential: {thread} thread needs more interactive elements',
  PRODUCTION_READY: 'Production concern: {thread} thread has {ready}/{total} production-ready elements'
};

// Thread priority ordering for analysis and display
export const THREAD_PRIORITIES = ['critical', 'high', 'medium', 'low'];

// Export thread names for easy iteration
export const THREAD_NAMES = Object.keys(NARRATIVE_THREADS);

// Helper function to get thread configuration
export const getThreadConfig = (threadName) => {
  return NARRATIVE_THREADS[threadName] || null;
};

// Helper function to get all threads by priority
export const getThreadsByPriority = (priority) => {
  return Object.entries(NARRATIVE_THREADS)
    .filter(([_, config]) => config.priority === priority)
    .map(([name, _]) => name);
};