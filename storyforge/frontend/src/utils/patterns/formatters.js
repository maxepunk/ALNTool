/**
 * formatters.js - Common formatting utilities for the ALNTool system
 */

/**
 * Format currency values
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD') {
  if (value == null || isNaN(value)) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format percentage values
 * @param {number} value - The value to format (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 0) {
  if (value == null || isNaN(value)) return '-';
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations
 * @param {number} value - The value to format
 * @returns {string} Formatted number string (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(value) {
  if (value == null || isNaN(value)) return '-';
  
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  });
  
  return formatter.format(value);
}

/**
 * Format date/time values
 * @param {string|Date} date - The date to format
 * @param {string} format - Format type: 'short', 'long', 'time', 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
    case 'time':
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
    case 'relative':
      return formatRelativeTime(dateObj);
      
    default:
      return dateObj.toLocaleString('en-US');
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date} date - The date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (Math.abs(diffSec) < 60) {
    return 'just now';
  }
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, 'day');
  } else {
    return formatDate(date, 'short');
  }
}

/**
 * Format entity type for display
 * @param {string} type - The entity type
 * @returns {string} Formatted type string
 */
export function formatEntityType(type) {
  if (!type) return '-';
  
  const typeMap = {
    'character': 'Character',
    'element': 'Element',
    'puzzle': 'Puzzle',
    'timeline_event': 'Timeline Event',
    'memory_token': 'Memory Token',
    'prop': 'Prop',
    'document': 'Document',
    'location': 'Location'
  };
  
  return typeMap[type.toLowerCase()] || type;
}

/**
 * Format element subtype for display
 * @param {string} subtype - The element subtype
 * @returns {string} Formatted subtype string
 */
export function formatElementSubtype(subtype) {
  if (!subtype) return '-';
  
  // Convert snake_case to Title Case
  return subtype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '-';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration in milliseconds to human readable
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return '-';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format act number
 * @param {number} act - Act number
 * @returns {string} Formatted act string
 */
export function formatAct(act) {
  if (act == null) return '-';
  
  const actMap = {
    1: 'Act I',
    2: 'Act II',
    3: 'Act III',
    4: 'Act IV',
    5: 'Act V'
  };
  
  return actMap[act] || `Act ${act}`;
}

/**
 * Format player count
 * @param {number} count - Number of players
 * @returns {string} Formatted player count
 */
export function formatPlayerCount(count) {
  if (count == null || isNaN(count)) return '-';
  
  if (count === 1) return '1 player';
  return `${count} players`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format list of items with proper grammar
 * @param {Array<string>} items - Array of items
 * @param {string} conjunction - Conjunction to use (default: 'and')
 * @returns {string} Formatted list
 */
export function formatList(items, conjunction = 'and') {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
}

/**
 * Format memory value
 * @param {number} value - Memory value
 * @returns {string} Formatted memory value
 */
export function formatMemoryValue(value) {
  if (value == null || isNaN(value)) return '-';
  
  return `${value} tokens`;
}

/**
 * Format relationship type
 * @param {string} type - Relationship type
 * @returns {string} Formatted relationship type
 */
export function formatRelationshipType(type) {
  if (!type) return '-';
  
  const typeMap = {
    'ownership': 'Owns',
    'association': 'Associated with',
    'container': 'Contains',
    'requirement': 'Requires',
    'reward': 'Rewards',
    'participation': 'Participates in',
    'narrative_thread': 'Narrative Thread',
    'act_focus': 'Act Focus'
  };
  
  return typeMap[type.toLowerCase()] || formatElementSubtype(type);
}