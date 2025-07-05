/**
 * GameConstants.js
 * 
 * SINGLE SOURCE OF TRUTH for all game business rules and constants.
 * This eliminates duplication and ensures consistency across the entire codebase.
 * 
 * IMPORTANT: Never hardcode these values elsewhere. Always import from this module.
 */

const GameConstants = {
  // Memory Economy Constants
  MEMORY_VALUE: {
    // Base dollar values for each rating level
    BASE_VALUES: {
      1: 100,
      2: 500,
      3: 1000,
      4: 5000,
      5: 10000
    },
    
    // Type multipliers (FIXED: Was inconsistent across codebase)
    TYPE_MULTIPLIERS: {
      'Personal': 2.0,
      'Business': 5.0,
      'Technical': 10.0
    },
    
    // Group completion multiplier (only applied when ALL tokens in group are collected)
    GROUP_COMPLETION_MULTIPLIER: 10.0,
    
    // Economy targets and thresholds
    TARGET_TOKEN_COUNT: 55,
    MIN_TOKEN_COUNT: 50,
    MAX_TOKEN_COUNT: 60,
    BALANCE_WARNING_THRESHOLD: 0.3, // 30% imbalance triggers warning
    
    // Memory types for filtering
    MEMORY_ELEMENT_TYPES: [
      'Memory Token Video',
      'Memory Token Audio', 
      'Memory Token Physical',
      'Corrupted Memory RFID',
      'Memory Fragment'
    ]
  },
  
  // Resolution Path Constants
  RESOLUTION_PATHS: {
    TYPES: ['Black Market', 'Detective', 'Third Path'],
    DEFAULT: 'Unassigned',
    
    // UI theming for each path
    THEMES: {
      'Black Market': {
        color: 'warning',
        icon: 'AccountBalance',
        theme: 'Wealth & Power'
      },
      'Detective': {
        color: 'error',
        icon: 'Search',
        theme: 'Truth & Justice'
      },
      'Third Path': {
        color: 'secondary',
        icon: 'Groups',
        theme: 'Community & Cooperation'
      },
      'Unassigned': {
        color: 'default',
        icon: 'Help',
        theme: 'Unknown'
      }
    }
  },
  
  // Act/Timeline Constants
  ACTS: {
    TYPES: ['Act 1', 'Act 2'],
    DEFAULT: 'Unassigned',
    SEQUENCE: {
      'Act 1': 1,
      'Act 2': 2,
      'Unassigned': 999
    }
  },
  
  // Production Status Constants
  PRODUCTION_STATUS: {
    TYPES: ['To Design', 'To Build', 'Ready', 'Complete'],
    DEFAULT: 'Unknown',
    
    // UI theming
    COLORS: {
      'To Design': 'warning',
      'To Build': 'info',
      'Ready': 'success',
      'Complete': 'success',
      'Unknown': 'default'
    },
    
    // Production stages for categorization
    STAGES: {
      'To Design': 'design',
      'To Build': 'build',
      'Ready': 'ready',
      'Complete': 'ready',
      'Unknown': 'unknown'
    }
  },
  
  // Character Relationship Constants
  RELATIONSHIPS: {
    TYPES: ['ally', 'rival', 'neutral', 'unknown'],
    DEFAULT_TYPE: 'neutral',
    
    // Minimum link count to consider a relationship "strong"
    STRONG_LINK_THRESHOLD: 3,
    
    // UI theming
    COLORS: {
      'ally': 'success',
      'rival': 'error',
      'neutral': 'default',
      'unknown': 'default'
    }
  },
  
  // Narrative Thread Constants
  NARRATIVE_THREADS: {
    // Core narrative categories
    CATEGORIES: [
      'Corporate Espionage',
      'Memory Technology', 
      'Personal Relationships',
      'Environmental Crimes',
      'AI Consciousness'
    ],
    
    DEFAULT_CATEGORY: 'Uncategorized'
  },
  
  // Character Constants
  CHARACTERS: {
    TYPES: ['Player', 'NPC'],
    TIERS: ['Core', 'Secondary', 'Tertiary'],
    DEFAULT_TYPE: 'NPC',
    DEFAULT_TIER: 'Tertiary',
    
    // Balance thresholds
    UNASSIGNED_WARNING_THRESHOLD: 0.2, // 20%
    ISOLATED_WARNING_THRESHOLD: 0.15,  // 15%
    PATH_IMBALANCE_THRESHOLD: 0.4      // 40%
  },
  
  // Element Constants  
  ELEMENTS: {
    // All possible status values from Notion
    STATUS_TYPES: [
      'Ready for Playtest',
      'Done', 
      'In development',
      'Idea/Placeholder',
      'Source Prop/print',
      'To Design',
      'To Build',
      'Needs Repair'
    ],
    
    // Production readiness thresholds
    MEMORY_TOKEN_WARNING_THRESHOLD: 45,
    MEMORY_READINESS_THRESHOLD: 0.8, // 80%
    OVERALL_READINESS_THRESHOLD: 0.7, // 70%
    
    // Element type categories
    CATEGORIES: [
      'Prop',
      'Set Dressing', 
      'Memory Token Video',
      'Memory Token Audio',
      'Memory Token Physical',
      'Corrupted Memory RFID',
      'Memory Fragment'
    ]
  },
  
  // Puzzle Constants
  PUZZLES: {
    // Complexity thresholds
    HIGH_COMPLEXITY_OWNERS_THRESHOLD: 1,
    HIGH_COMPLEXITY_REWARDS_THRESHOLD: 2,
    MEDIUM_COMPLEXITY_REWARDS_THRESHOLD: 1,
    
    // Production issue thresholds
    UNASSIGNED_WARNING_THRESHOLD: 0.3, // 30%
    NO_REWARDS_WARNING_THRESHOLD: 0.2, // 20%
    NO_NARRATIVE_THREADS_WARNING_THRESHOLD: 0.4 // 40%
  },
  
  // Dashboard-specific Constants
  DASHBOARD: {
    PATH_IMBALANCE_THRESHOLD: 3,
    MEMORY_COMPLETION_WARNING_THRESHOLD: 50,
    UNASSIGNED_EVENTS_WARNING_THRESHOLD: 5
  },

  // Player Journey Constants
  JOURNEY: {
    // Gap detection thresholds
    CRITICAL_GAP_MINUTES: 15,
    WARNING_GAP_MINUTES: 10,
    
    // Node types
    NODE_TYPES: {
      CHARACTER: 'character',
      ELEMENT: 'element',
      PUZZLE: 'puzzle',
      TIMELINE_EVENT: 'timeline_event',
      GAP: 'gap'
    },
    
    // Edge types
    EDGE_TYPES: {
      OWNS: 'owns',
      ASSOCIATES: 'associates',
      PARTICIPATES: 'participates',
      REWARDS: 'rewards',
      TEMPORAL: 'temporal',
      GAP: 'gap'
    }
  },
  
  // System-wide Constants
  SYSTEM: {
    // Database limits
    MAX_BATCH_SIZE: 100,
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 500,
    
    // Cache durations (milliseconds)
    CACHE_DURATIONS: {
      SHORT: 5 * 60 * 1000,      // 5 minutes
      MEDIUM: 30 * 60 * 1000,    // 30 minutes
      LONG: 24 * 60 * 60 * 1000  // 24 hours
    },
    
    // Sync configuration
    SYNC: {
      BATCH_SIZE: 50,
      MAX_RETRIES: 3,
      RETRY_DELAY: 1000 // milliseconds
    },
    
    // UI text display limits
    UI: {
      DEFAULT_SNIPPET_LENGTH: 150
    },
    
    // Rate limiting
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 500,
      MAX_REQUESTS_DEV: 1000 // Higher limit for development
    }
  },
  
  // Act and Timing Constants
  ACTS: {
    // Act boundaries in minutes
    ACT_1: {
      START: 0,
      END: 60
    },
    ACT_2: {
      START: 60,
      END: 90
    },
    
    // Game phase boundaries in minutes
    PHASES: {
      EARLY_GAME: {
        START: 0,
        END: 30
      },
      MID_GAME: {
        START: 30,
        END: 60
      },
      LATE_GAME: {
        START: 60,
        END: 90
      }
    },
    
    // Default duration for single-minute events
    DEFAULT_EVENT_DURATION: 5
  }
};

// Freeze the object to prevent accidental modifications
module.exports = Object.freeze(GameConstants);