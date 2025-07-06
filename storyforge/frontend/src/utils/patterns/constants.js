/**
 * Constants - Shared constants for the pattern library and ALNTool
 * 
 * @module utils/patterns/constants
 */

// Component Size Constants
export const SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Component Variants
export const VARIANTS = {
  CONTAINED: 'contained',
  OUTLINED: 'outlined',
  TEXT: 'text',
  FILLED: 'filled',
  STANDARD: 'standard',
  ELEVATION: 'elevation'
};

// Color Palette
export const COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  DEFAULT: 'default',
  INHERIT: 'inherit'
};

// Positions
export const POSITIONS = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
  START: 'start',
  END: 'end'
};

// Breakpoints (matching MUI)
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536
};

// Grid System
export const GRID = {
  COLUMNS: 12,
  SPACING: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  CONTAINER_MAX_WIDTHS: {
    xs: 444,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536
  }
};

// Form Constants
export const FORM = {
  FIELD_VARIANTS: ['outlined', 'filled', 'standard'],
  LABEL_PLACEMENTS: ['top', 'left', 'right', 'bottom', 'end', 'start'],
  INPUT_TYPES: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
  VALIDATION_TRIGGERS: ['blur', 'change', 'submit']
};

// Animation Durations (ms)
export const DURATIONS = {
  SHORTEST: 150,
  SHORTER: 200,
  SHORT: 250,
  STANDARD: 300,
  COMPLEX: 375,
  ENTERING: 225,
  LEAVING: 195
};

// Z-Index Layers
export const Z_INDEX = {
  DRAWER: 1200,
  MODAL: 1300,
  SNACKBAR: 1400,
  TOOLTIP: 1500
};

// ALNTool Specific Constants
export const ENTITY_TYPES = {
  CHARACTER: 'character',
  ELEMENT: 'element',
  PUZZLE: 'puzzle',
  TIMELINE_EVENT: 'timeline_event'
};

export const ENTITY_TYPE_PREFIXES = {
  CHARACTER: 'char',
  ELEMENT: 'elem',
  PUZZLE: 'puzz',
  TIMELINE_EVENT: 'time'
};

export const ELEMENT_TYPES = {
  MEMORY_TOKEN: 'Memory Token',
  PROP: 'Prop',
  CLUE: 'Clue',
  DOCUMENT: 'Document',
  PHYSICAL: 'Physical',
  DIGITAL: 'Digital'
};

export const MEMORY_VALUE_RANGE = {
  MIN: 0,
  MAX: 10
};

export const ACTS = {
  ONE: 1,
  TWO: 2,
  BOTH: 'both'
};

export const RELATIONSHIP_TYPES = {
  CHARACTER_ELEMENT: 'character-element',
  CHARACTER_CHARACTER: 'character-character',
  ELEMENT_ELEMENT: 'element-element',
  PUZZLE_ELEMENT: 'puzzle-element',
  CHARACTER_TIMELINE: 'character-timeline'
};

export const INTELLIGENCE_LAYERS = {
  ECONOMIC: 'economic',
  STORY: 'story',
  SOCIAL: 'social',
  PRODUCTION: 'production',
  CONTENT_GAPS: 'contentGaps'
};

export const VIEW_MODES = {
  OVERVIEW: 'overview',
  FOCUS: 'focus',
  DETAIL: 'detail'
};

// Graph Constants
export const GRAPH = {
  NODE_TYPES: {
    CHARACTER: 'character',
    ELEMENT: 'element',
    PUZZLE: 'puzzle',
    TIMELINE: 'timeline',
    AGGREGATE: 'aggregate'
  },
  EDGE_TYPES: {
    OWNERSHIP: 'ownership',
    ASSOCIATION: 'association',
    CONTAINER: 'container',
    REWARD: 'reward',
    REQUIREMENT: 'requirement',
    TIMELINE: 'timeline'
  },
  MAX_VISIBLE_NODES: 50,
  AGGREGATION_THRESHOLD: 20
};

// API Constants
export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  JOURNEY_STATE: 'journey-storage',
  THEME: 'theme',
  RECENT_SEARCHES: 'recent_searches'
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  TIMEOUT: 'The request timed out. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  DELETED: 'Item deleted successfully.',
  CREATED: 'Item created successfully.',
  UPDATED: 'Item updated successfully.',
  COPIED: 'Copied to clipboard.'
};

// Keyboard Shortcuts
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true },
  SEARCH: { key: '/', ctrl: true },
  ESCAPE: { key: 'Escape' },
  ENTER: { key: 'Enter' },
  DELETE: { key: 'Delete' },
  UNDO: { key: 'z', ctrl: true },
  REDO: { key: 'y', ctrl: true }
};

// Default Values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 6000,
  AUTO_SAVE_DELAY: 3000,
  IDLE_TIMEOUT: 900000, // 15 minutes
  MAX_FILE_SIZE: 5242880, // 5MB
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp']
};

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  ENTITY_ID: /^(char|elem|puzz|time)_[a-zA-Z0-9]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/
};