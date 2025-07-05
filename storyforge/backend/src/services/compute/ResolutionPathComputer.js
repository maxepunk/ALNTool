const DerivedFieldComputer = require('./DerivedFieldComputer');
const GameConstants = require('../../config/GameConstants');
const ValidationUtils = require('../../utils/ValidationUtils');

const logger = require('../../utils/logger');
/**
 * Computes Resolution Paths for entities based on ownership patterns and game logic
 * Paths indicate which narrative resolution paths an entity is associated with:
 * - Black Market: Memory tokens, black market cards, trading elements
 * - Detective: Evidence, investigation tools, detective connections
 * - Third Path: High community connections, rejection of authorities
 */
class ResolutionPathComputer extends DerivedFieldComputer {
  constructor(db) {
    super(db);
    this.requiredFields = ['id'];
  }

  /**
   * Compute resolution paths for an entity
   * @param {Object} entity - The entity to compute paths for
   * @param {string} entityType - Type of entity ('character', 'puzzle', 'element')
   * @returns {Promise<Object>} Object containing resolution_paths
   * @throws {Error} If computation fails
   */
  async compute(entity, entityType) {
    try {
      this.validateRequiredFields(entity, this.requiredFields);
      const paths = [];

      switch (entityType) {
      case 'character':
        await this.computeCharacterPaths(entity, paths);
        break;
      case 'puzzle':
        await this.computePuzzlePaths(entity, paths);
        break;
      case 'element':
        await this.computeElementPaths(entity, paths);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
      }

      // Validate all computed paths
      const validPaths = paths.filter(path => ValidationUtils.isValidResolutionPath(path));

      return {
        resolution_paths: JSON.stringify(validPaths.length > 0 ? validPaths : [GameConstants.RESOLUTION_PATHS.DEFAULT])
      };
    } catch (error) {
      throw new Error(`Failed to compute resolution paths for ${entityType} ${entity.id}: ${error.message}`);
    }
  }

  /**
   * Compute paths for a character based on owned elements and connections
   * @private
   */
  async computeCharacterPaths(character, paths) {
    // Check owned elements for path indicators
    const ownedElements = this.db.prepare(
      'SELECT e.name, e.type FROM elements e JOIN character_owned_elements coe ON e.id = coe.element_id WHERE coe.character_id = ?'
    ).all(character.id);

    // Black Market path indicators
    const hasBlackMarket = ownedElements.some(el =>
      el.name?.toLowerCase().includes('black market') ||
      GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES.some(memType =>
        el.type?.toLowerCase().includes(memType.toLowerCase())
      )
    );
    if (hasBlackMarket) {
      paths.push(GameConstants.RESOLUTION_PATHS.TYPES[0]);
    } // 'Black Market'

    // Detective path indicators
    const hasDetective = ownedElements.some(el =>
      el.type?.toLowerCase().includes('evidence') ||
      el.name?.toLowerCase().includes('clue') ||
      el.name?.toLowerCase().includes('investigation')
    );
    if (hasDetective) {
      paths.push(GameConstants.RESOLUTION_PATHS.TYPES[1]);
    } // 'Detective'

    // Third Path indicators (using strong link threshold from GameConstants)
    if (character.connections > GameConstants.RELATIONSHIPS.STRONG_LINK_THRESHOLD) {
      paths.push(GameConstants.RESOLUTION_PATHS.TYPES[2]); // 'Third Path'
    }
  }

  /**
   * Compute paths for a puzzle based on narrative threads
   * @private
   */
  async computePuzzlePaths(puzzle, paths) {
    const threads = JSON.parse(puzzle.computed_narrative_threads || '[]');

    // Use GameConstants for path names
    const [blackMarket, detective, thirdPath] = GameConstants.RESOLUTION_PATHS.TYPES;

    if (threads.includes('Underground Parties') || threads.includes('Memory Drug')) {
      paths.push(blackMarket);
    }
    if (threads.includes('Corp. Espionage') || threads.includes('Corporate Espionage')) {
      paths.push(detective);
    }
    if (threads.includes('Marriage Troubles') || threads.includes('Community')) {
      paths.push(thirdPath);
    }
  }

  /**
   * Compute paths for an element based on type and name
   * @private
   */
  async computeElementPaths(element, paths) {
    const name = element.name?.toLowerCase() || '';
    const type = element.type?.toLowerCase() || '';

    // Use GameConstants for path names
    const [blackMarket, detective, thirdPath] = GameConstants.RESOLUTION_PATHS.TYPES;

    // Black Market indicators
    const isMemoryType = GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES.some(memType =>
      type.includes(memType.toLowerCase())
    );
    if (isMemoryType ||
        name.includes('black market') ||
        name.includes('trade')) {
      paths.push(blackMarket);
    }

    // Detective indicators
    if (type.includes('evidence') ||
        name.includes('clue') ||
        name.includes('investigation') ||
        name.includes('evidence')) {
      paths.push(detective);
    }

    // Third Path indicators
    if (name.includes('community') ||
        name.includes('rejection') ||
        name.includes('authority')) {
      paths.push(thirdPath);
    }
  }

  /**
   * Compute and update resolution paths for all entities of a type
   * @param {string} entityType - Type of entities to compute for
   * @returns {Promise<{processed: number, errors: number}>} Stats about the computation
   */
  async computeAll(entityType) {
    const stats = { processed: 0, errors: 0 };
    const tableMap = {
      character: 'characters',
      puzzle: 'puzzles',
      element: 'elements'
    };

    const tableName = tableMap[entityType];
    if (!tableName) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    try {
      const entities = this.db.prepare(`SELECT * FROM ${tableName}`).all();

      for (const entity of entities) {
        try {
          const { resolution_paths } = await this.compute(entity, entityType);
          await this.updateDatabase(tableName, 'id', entity, { resolution_paths });
          stats.processed++;
        } catch (error) {
          logger.error(`Error processing ${entityType} ${entity.id}:`, error);
          stats.errors++;
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to compute all resolution paths for ${entityType}: ${error.message}`);
    }
  }
}

module.exports = ResolutionPathComputer;