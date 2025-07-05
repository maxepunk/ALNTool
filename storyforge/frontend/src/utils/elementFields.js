/**
 * Element Field Utilities
 * 
 * Handles the dual API response structure for elements:
 * - Performance path (SQLite): Returns 'type' field
 * - Fresh path (Notion): Returns 'basicType' field
 * 
 * @module elementFields
 */

/**
 * Gets the element type from either API response format
 * @param {Object} element - Element object from either API path
 * @returns {string} The element type (e.g., 'Memory Token Audio', 'Prop', etc.)
 */
export function getElementType(element) {
  if (!element) return 'Unknown';
  
  // Performance path uses 'type'
  // Fresh path uses 'basicType'
  // Some elements might be generic 'element' type
  const type = element.type || element.basicType || 'element';
  
  // If it's one of the main entity types, it's not an element subtype
  if (['character', 'puzzle', 'timeline_event'].includes(type)) {
    return type;
  }
  
  // If it's 'element', return a generic label
  if (type === 'element') {
    return 'Element';
  }
  
  // Otherwise it's a specific element type
  return type;
}

/**
 * Checks if an element is a memory token
 * @param {Object} element - Element object
 * @returns {boolean} True if element is any type of memory token
 */
export function isMemoryToken(element) {
  const type = getElementType(element);
  return type.toLowerCase().includes('memory token');
}

/**
 * Gets the memory value of an element
 * @param {Object} element - Element object
 * @returns {number} The calculated memory value or 0
 */
export function getElementValue(element) {
  if (!element) return 0;
  
  // Both API paths return calculated_memory_value
  return element.calculated_memory_value || 0;
}

/**
 * Gets the memory type (Personal, Business, Technical) from SF fields
 * @param {Object} element - Element object
 * @returns {string|null} The memory type or null
 */
export function getMemoryType(element) {
  if (!element) return null;
  
  // This is parsed from the Description field and stored as SF_MemoryType
  return element.SF_MemoryType || element.memory_type || null;
}

/**
 * Gets the RFID tag for an element
 * @param {Object} element - Element object
 * @returns {string|null} The RFID tag or null
 */
export function getRFIDTag(element) {
  if (!element) return null;
  
  return element.rfid_tag || element.SF_RFID || null;
}

/**
 * Checks if an element needs an RFID tag
 * @param {Object} element - Element object
 * @returns {boolean} True if element is a memory token that needs RFID
 */
export function needsRFID(element) {
  return isMemoryToken(element) && !getRFIDTag(element);
}

/**
 * Gets the production status of an element
 * @param {Object} element - Element object
 * @returns {string} The status (Ready, In Development, Idea)
 */
export function getProductionStatus(element) {
  if (!element) return 'Unknown';
  
  return element.status || 'Idea';
}

/**
 * Normalizes element type for consistent grouping
 * @param {string} type - Raw element type
 * @returns {string} Normalized type key for grouping
 */
export function normalizeElementType(type) {
  if (!type) return 'unknown';
  
  // Convert to lowercase and replace spaces with hyphens
  return type.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Groups elements by their type
 * @param {Array} elements - Array of element objects
 * @returns {Object} Elements grouped by type
 */
export function groupElementsByType(elements) {
  const groups = {};
  
  elements.forEach(element => {
    const type = getElementType(element);
    const normalizedType = normalizeElementType(type);
    
    if (!groups[normalizedType]) {
      groups[normalizedType] = {
        type,
        elements: []
      };
    }
    
    groups[normalizedType].elements.push(element);
  });
  
  return groups;
}

/**
 * Determines if we should show element as a node or detail
 * @param {Object} element - Element object
 * @param {Object} context - Current view context
 * @returns {boolean} True if element should be shown as node
 */
export function shouldShowAsNode(element, context) {
  // High-value tokens always show as nodes
  if (getElementValue(element) > 3000) return true;
  
  // In character journey, show owned elements as nodes
  if (context.viewType === 'character-journey' && 
      element.owner_character_id === context.characterId) {
    return true;
  }
  
  // In puzzle view, show required/reward elements as nodes
  if (context.viewType === 'puzzle' && 
      (context.requiredElements?.includes(element.id) || 
       context.rewardElements?.includes(element.id))) {
    return true;
  }
  
  // Otherwise show as detail
  return false;
}