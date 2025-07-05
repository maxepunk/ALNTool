/**
 * ValidationUtils.js
 *
 * Centralized validation logic to eliminate duplication across services.
 * All validation rules should be defined here, not scattered across the codebase.
 */

const GameConstants = require('../config/GameConstants');

class ValidationUtils {
  /**
   * Validates that an object has all required fields
   * @param {Object} obj - Object to validate
   * @param {string[]} requiredFields - Array of required field names
   * @param {string} objectType - Type of object for error messages
   * @throws {Error} If validation fails
   */
  static validateRequiredFields(obj, requiredFields, objectType = 'Object') {
    if (!obj) {
      throw new Error(`${objectType} is null or undefined`);
    }

    const missingFields = requiredFields.filter(field => {
      const value = obj[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(
        `${objectType} missing required fields: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Validates a memory element has proper structure
   * @param {Object} element - Element to validate
   * @returns {boolean} True if valid
   */
  static isValidMemoryElement(element) {
    if (!element) {
      return false;
    }

    // Must be a memory type
    const validTypes = GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES;
    if (!validTypes.includes(element.type)) {
      return false;
    }

    // Must have required fields
    try {
      this.validateRequiredFields(element, ['id', 'name', 'type'], 'Memory Element');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Validates memory value rating
   * @param {number} rating - Rating to validate
   * @returns {boolean} True if valid
   */
  static isValidMemoryRating(rating) {
    if (typeof rating !== 'number') {
      return false;
    }
    return rating >= 1 && rating <= 5;
  }

  /**
   * Validates memory type
   * @param {string} type - Type to validate
   * @returns {boolean} True if valid
   */
  static isValidMemoryType(type) {
    if (!type || typeof type !== 'string') {
      return false;
    }
    return Object.keys(GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS).includes(type);
  }

  /**
   * Validates resolution path
   * @param {string} path - Path to validate
   * @returns {boolean} True if valid
   */
  static isValidResolutionPath(path) {
    if (!path || typeof path !== 'string') {
      return false;
    }
    const validPaths = [
      ...GameConstants.RESOLUTION_PATHS.TYPES,
      GameConstants.RESOLUTION_PATHS.DEFAULT
    ];
    return validPaths.includes(path);
  }

  /**
   * Validates act designation
   * @param {string} act - Act to validate
   * @returns {boolean} True if valid
   */
  static isValidAct(act) {
    if (!act || typeof act !== 'string') {
      return false;
    }
    const validActs = [
      ...GameConstants.ACTS.TYPES,
      GameConstants.ACTS.DEFAULT
    ];
    return validActs.includes(act);
  }

  /**
   * Validates production status
   * @param {string} status - Status to validate
   * @returns {boolean} True if valid
   */
  static isValidProductionStatus(status) {
    if (!status || typeof status !== 'string') {
      return false;
    }
    const validStatuses = [
      ...GameConstants.PRODUCTION_STATUS.TYPES,
      GameConstants.PRODUCTION_STATUS.DEFAULT
    ];
    return validStatuses.includes(status);
  }

  /**
   * Validates a character object
   * @param {Object} character - Character to validate
   * @throws {Error} If validation fails
   */
  static validateCharacter(character) {
    this.validateRequiredFields(
      character,
      ['id', 'name'],
      'Character'
    );
  }

  /**
   * Validates a timeline event object
   * @param {Object} event - Timeline event to validate
   * @throws {Error} If validation fails
   */
  static validateTimelineEvent(event) {
    this.validateRequiredFields(
      event,
      ['id', 'name', 'time_period'],
      'Timeline Event'
    );
  }

  /**
   * Validates a puzzle object
   * @param {Object} puzzle - Puzzle to validate
   * @throws {Error} If validation fails
   */
  static validatePuzzle(puzzle) {
    this.validateRequiredFields(
      puzzle,
      ['id', 'name'],
      'Puzzle'
    );
  }

  /**
   * Validates a journey node structure
   * @param {Object} node - Node to validate
   * @returns {boolean} True if valid
   */
  static isValidJourneyNode(node) {
    if (!node) {
      return false;
    }

    // Must have required fields
    if (!node.id || !node.type) {
      return false;
    }

    // Must be a valid node type
    const validTypes = Object.values(GameConstants.JOURNEY.NODE_TYPES);
    return validTypes.includes(node.type);
  }

  /**
   * Validates a journey edge structure
   * @param {Object} edge - Edge to validate
   * @returns {boolean} True if valid
   */
  static isValidJourneyEdge(edge) {
    if (!edge) {
      return false;
    }

    // Must have required fields
    if (!edge.source || !edge.target || !edge.type) {
      return false;
    }

    // Must be a valid edge type
    const validTypes = Object.values(GameConstants.JOURNEY.EDGE_TYPES);
    return validTypes.includes(edge.type);
  }

  /**
   * Validates a complete journey graph structure
   * @param {Object} graph - Graph to validate
   * @throws {Error} If validation fails
   */
  static validateJourneyGraph(graph) {
    this.validateRequiredFields(
      graph,
      ['nodes', 'edges'],
      'Journey Graph'
    );

    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      throw new Error('Journey graph nodes and edges must be arrays');
    }

    // Validate all nodes
    const invalidNodes = graph.nodes.filter(node => !this.isValidJourneyNode(node));
    if (invalidNodes.length > 0) {
      throw new Error(`Invalid journey nodes found: ${invalidNodes.map(n => n.id).join(', ')}`);
    }

    // Validate all edges
    const invalidEdges = graph.edges.filter(edge => !this.isValidJourneyEdge(edge));
    if (invalidEdges.length > 0) {
      throw new Error(`Invalid journey edges found: ${invalidEdges.length} edges`);
    }
  }

  /**
   * Sanitizes a string for safe database storage
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }

    // Remove any potential SQL injection attempts
    return str
      .replace(/'/g, '\'\'')  // Escape single quotes
      .replace(/--/g, '')   // Remove SQL comments
      .replace(/;/g, '')    // Remove statement terminators
      .trim();
  }

  /**
   * Validates pagination parameters
   * @param {Object} params - Pagination parameters
   * @returns {Object} Validated and normalized parameters
   */
  static validatePaginationParams(params = {}) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(
      GameConstants.SYSTEM.MAX_PAGE_SIZE,
      Math.max(1, parseInt(params.limit) || GameConstants.SYSTEM.DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }
}

module.exports = ValidationUtils;