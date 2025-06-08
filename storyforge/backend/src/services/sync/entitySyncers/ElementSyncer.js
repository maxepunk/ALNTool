const BaseSyncer = require('./BaseSyncer');

/**
 * Syncer for Element entities.
 * Handles fetching from Notion, mapping, and inserting element data.
 * 
 * Elements have relationships with:
 * - Characters (owner)
 * - Other Elements (container)
 * - Timeline Events
 * 
 * @extends BaseSyncer
 */
class ElementSyncer extends BaseSyncer {
  /**
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.notionService - Service for fetching from Notion
   * @param {Object} dependencies.propertyMapper - Service for mapping Notion properties
   * @param {Object} dependencies.logger - SyncLogger instance
   */
  constructor(dependencies) {
    super({ ...dependencies, entityType: 'elements' });
  }

  /**
   * Fetch elements from Notion
   * @returns {Promise<Array>} Array of Notion element objects
   */
  async fetchFromNotion() {
    return await this.notionService.getElements();
  }

  /**
   * Clear existing element data and related tables
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    // Clear tables that have foreign key to elements, in correct order
    this.db.prepare('UPDATE puzzles SET locked_item_id = NULL').run();
    this.db.prepare('DELETE FROM character_owned_elements').run();
    this.db.prepare('DELETE FROM character_associated_elements').run();
    
    // Finally, clear the elements table
    this.db.prepare('DELETE FROM elements').run();
  }

  /**
   * Map Notion element data to database format
   * @param {Object} notionElement - Raw Notion element object
   * @returns {Promise<Object>} Mapped element data
   */
  async mapData(notionElement) {
    try {
      const mapped = await this.propertyMapper.mapElementWithNames(
        notionElement, 
        this.notionService
      );
      
      if (mapped.error) {
        return { error: mapped.error };
      }

      // Extract single IDs from relation arrays
      const ownerId = mapped.owner && mapped.owner.length > 0 
        ? mapped.owner[0].id 
        : null;
      
      const containerId = mapped.container && mapped.container.length > 0 
        ? mapped.container[0].id 
        : null;
      
      const timelineEventId = mapped.timelineEvent && mapped.timelineEvent.length > 0 
        ? mapped.timelineEvent[0].id 
        : null;

      // Extract memory values from properties object (if they exist)
      const memoryProps = mapped.properties || {};
      
      return {
        id: mapped.id,
        name: mapped.name || '',
        type: mapped.basicType || '',
        description: mapped.description || '',
        status: mapped.status || '',
        owner_id: ownerId,
        container_id: containerId,
        production_notes: mapped.productionNotes || '',
        first_available: mapped.firstAvailable || '',
        timeline_event_id: timelineEventId,
        // Memory value fields extracted from properties
        rfid_tag: memoryProps.parsed_sf_rfid || null,
        value_rating: memoryProps.sf_value_rating || null,
        memory_type: memoryProps.sf_memory_type || null,
        memory_group: memoryProps.sf_group || null,
        group_multiplier: memoryProps.sf_group_multiplier || 1.0,
        calculated_memory_value: (memoryProps.sf_value_rating && memoryProps.sf_group_multiplier) 
          ? memoryProps.sf_value_rating * memoryProps.sf_group_multiplier 
          : (memoryProps.sf_value_rating || 0)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Insert element data into database
   * @param {Object} mappedData - Mapped element data
   * @returns {Promise<void>}
   */
  async insertData(mappedData) {
    const stmt = this.db.prepare(`
      INSERT INTO elements (
        id, name, type, description, status, owner_id, 
        container_id, production_notes, first_available, timeline_event_id,
        rfid_tag, value_rating, memory_type, memory_group, group_multiplier, calculated_memory_value
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      mappedData.id,
      mappedData.name,
      mappedData.type,
      mappedData.description,
      mappedData.status,
      mappedData.owner_id,
      mappedData.container_id,
      mappedData.production_notes,
      mappedData.first_available,
      mappedData.timeline_event_id,
      mappedData.rfid_tag || null,
      mappedData.value_rating || null,
      mappedData.memory_type || null,
      mappedData.memory_group || null,
      mappedData.group_multiplier || null,
      mappedData.calculated_memory_value || null
    );
  }

  /**
   * Get current element count for dry run
   * @returns {Promise<number>} Current element count
   */
  async getCurrentRecordCount() {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM elements').get();
    return result.count;
  }
}

module.exports = ElementSyncer;
