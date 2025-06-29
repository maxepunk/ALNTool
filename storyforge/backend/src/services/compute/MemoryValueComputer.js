const DerivedFieldComputer = require('./DerivedFieldComputer');

const logger = require('../../utils/logger');
/**
 * Computes total memory values for characters based on owned elements
 *
 * This service calculates:
 * 1. Total memory value from owned elements
 * 2. Memory value distribution across characters
 * 3. Path affinity based on memory token types
 */
class MemoryValueComputer extends DerivedFieldComputer {
  constructor(db) {
    super(db);
    this.name = 'MemoryValueComputer';
  }

  // Simple logging methods
  debug(message) {
    if (process.env.NODE_ENV !== 'test') {
      logger.debug(`[DEBUG] ${this.name}: ${message}`);
    }
  }

  info(message) {
    logger.debug(`[INFO] ${this.name}: ${message}`);
  }

  error(message, error) {
    logger.error(`[ERROR] ${this.name}: ${message}`, error);
  }

  /**
     * Compute total memory values for all characters
     * @returns {number} - Number of characters updated
     */
  async computeAllCharacterMemoryValues() {
    const startTime = Date.now();
    this.debug('Computing total memory values for all characters...');

    try {
      // Get all characters
      const characters = this.db.prepare(`
                SELECT id, name 
                FROM characters 
                ORDER BY name
            `).all();

      this.debug(`Processing ${characters.length} characters`);

      let updatedCount = 0;

      // Prepare statements
      const getMemoryValueStmt = this.db.prepare(`
                SELECT COALESCE(SUM(e.calculated_memory_value), 0) as total_memory_value
                FROM elements e
                JOIN character_owned_elements coe ON e.id = coe.element_id
                WHERE coe.character_id = ?
            `);

      const updateCharacterStmt = this.db.prepare(`
                UPDATE characters 
                SET total_memory_value = ? 
                WHERE id = ?
            `);

      // Process each character
      for (const character of characters) {
        const result = getMemoryValueStmt.get(character.id);
        const totalMemoryValue = result.total_memory_value || 0;

        // Update character
        updateCharacterStmt.run(totalMemoryValue, character.id);
        updatedCount++;

        if (totalMemoryValue > 0) {
          this.debug(`Character "${character.name}": total memory value = $${totalMemoryValue}`);
        }
      }

      const duration = Date.now() - startTime;

      this.info(`Memory value computation completed in ${duration}ms`);
      this.info(`Updated ${updatedCount} characters`);

      return updatedCount;

    } catch (error) {
      this.error('Error during memory value computation:', error);
      throw error;
    }
  }

  /**
     * Compute memory value for a single character
     * @param {string} characterId - Character ID
     * @returns {number} - Total memory value
     */
  async computeCharacterMemoryValue(characterId) {
    try {
      const character = this.db.prepare(`
                SELECT id, name 
                FROM characters 
                WHERE id = ?
            `).get(characterId);

      if (!character) {
        throw new Error(`Character not found: ${characterId}`);
      }

      // Get total memory value from owned elements
      const result = this.db.prepare(`
                SELECT COALESCE(SUM(e.calculated_memory_value), 0) as total_memory_value
                FROM elements e
                JOIN character_owned_elements coe ON e.id = coe.element_id
                WHERE coe.character_id = ?
            `).get(characterId);

      const totalMemoryValue = result.total_memory_value || 0;

      // Update character
      this.db.prepare(`
                UPDATE characters 
                SET total_memory_value = ? 
                WHERE id = ?
            `).run(totalMemoryValue, characterId);

      this.debug(`Character "${character.name}": computed total memory value = $${totalMemoryValue}`);
      return totalMemoryValue;

    } catch (error) {
      this.error(`Error computing memory value for character ${characterId}:`, error);
      throw error;
    }
  }

  /**
     * Get memory value distribution across characters
     * @returns {Array} - Characters with their memory values
     */
  getMemoryValueDistribution() {
    return this.db.prepare(`
            SELECT 
                c.id,
                c.name,
                c.total_memory_value,
                COUNT(coe.element_id) as owned_elements_count,
                COUNT(CASE WHEN e.calculated_memory_value > 0 THEN 1 END) as memory_elements_count
            FROM characters c
            LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
            LEFT JOIN elements e ON coe.element_id = e.id
            GROUP BY c.id, c.name, c.total_memory_value
            ORDER BY c.total_memory_value DESC, c.name
        `).all();
  }

  /**
     * Get memory value statistics across all characters
     * @returns {Object} - Statistics about memory value distribution
     */
  getMemoryValueStats() {
    const stats = this.db.prepare(`
            SELECT 
                COUNT(*) as total_characters,
                COUNT(CASE WHEN total_memory_value > 0 THEN 1 END) as characters_with_memory,
                SUM(total_memory_value) as total_memory_value,
                AVG(CASE WHEN total_memory_value > 0 THEN total_memory_value END) as avg_memory_value,
                MAX(total_memory_value) as max_memory_value,
                MIN(CASE WHEN total_memory_value > 0 THEN total_memory_value END) as min_memory_value
            FROM characters
        `).get();

    return {
      totalCharacters: stats.total_characters,
      charactersWithMemory: stats.characters_with_memory,
      charactersWithoutMemory: stats.total_characters - stats.characters_with_memory,
      totalMemoryValue: stats.total_memory_value || 0,
      averageMemoryValue: Math.round((stats.avg_memory_value || 0) * 100) / 100,
      maxMemoryValue: stats.max_memory_value || 0,
      minMemoryValue: stats.min_memory_value || 0
    };
  }

  /**
     * Get elements contributing to a character's memory value
     * @param {string} characterId - Character ID
     * @returns {Array} - Elements with memory values
     */
  getCharacterMemoryElements(characterId) {
    return this.db.prepare(`
            SELECT 
                e.id,
                e.name,
                e.rfid_tag,
                e.value_rating,
                e.memory_type,
                e.memory_group,
                e.group_multiplier,
                e.calculated_memory_value,
                e.description
            FROM elements e
            JOIN character_owned_elements coe ON e.id = coe.element_id
            WHERE coe.character_id = ? AND e.calculated_memory_value > 0
            ORDER BY e.calculated_memory_value DESC, e.name
        `).all(characterId);
  }

  /**
     * Get memory tokens by group for potential completion bonus calculations
     * @returns {Object} - Memory tokens organized by group
     */
  getMemoryTokensByGroup() {
    const tokens = this.db.prepare(`
            SELECT 
                e.id,
                e.name,
                e.rfid_tag,
                e.value_rating,
                e.memory_type,
                e.memory_group,
                e.group_multiplier,
                e.calculated_memory_value,
                coe.character_id as current_owner
            FROM elements e
            LEFT JOIN character_owned_elements coe ON e.id = coe.element_id
            WHERE e.memory_group IS NOT NULL
            ORDER BY e.memory_group, e.name
        `).all();

    // Group by memory_group
    const grouped = {};
    tokens.forEach(token => {
      if (!grouped[token.memory_group]) {
        grouped[token.memory_group] = {
          groupName: token.memory_group,
          groupMultiplier: token.group_multiplier,
          tokens: []
        };
      }
      grouped[token.memory_group].tokens.push(token);
    });

    return grouped;
  }

  /**
     * Run the complete memory value computation pipeline
     * @returns {Object} - Computation results
     */
  async runComputePipeline() {
    const startTime = Date.now();
    this.info('Starting memory value computation pipeline...');

    try {
      // Note: Memory value extraction should be run first by MemoryValueExtractor
      const updatedCharacters = await this.computeAllCharacterMemoryValues();

      const stats = this.getMemoryValueStats();
      const distribution = this.getMemoryValueDistribution();
      const memoryGroups = this.getMemoryTokensByGroup();

      const duration = Date.now() - startTime;

      const results = {
        success: true,
        duration,
        updatedCharacters,
        stats,
        topCharacters: distribution.slice(0, 5), // Top 5 by memory value
        memoryGroups: Object.keys(memoryGroups)
      };

      this.info(`Memory value computation pipeline completed in ${duration}ms`);
      this.info(`Updated ${updatedCharacters} characters`);
      this.info(`Total memory value across all characters: $${stats.totalMemoryValue}`);
      this.info(`Memory groups found: ${Object.keys(memoryGroups).join(', ') || 'none'}`);

      return results;

    } catch (error) {
      this.error('Error in memory value computation pipeline:', error);
      throw error;
    }
  }
}

module.exports = MemoryValueComputer;