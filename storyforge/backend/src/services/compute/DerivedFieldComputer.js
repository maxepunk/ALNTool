/**
 * Base class for all derived field computers
 * Provides common functionality and enforces interface
 */
class DerivedFieldComputer {
  constructor(db) {
    if (!db) throw new Error('Database connection required');
    this.db = db;
  }

  /**
   * Compute derived fields for a single entity
   * @param {Object} entity - The entity to compute fields for
   * @returns {Promise<Object>} Object containing computed fields
   * @throws {Error} If computation fails
   */
  async compute(entity) {
    throw new Error('compute() must be implemented by subclass');
  }

  /**
   * Compute derived fields for multiple entities
   * @param {Array<Object>} entities - Array of entities to compute fields for
   * @returns {Promise<Array<Object>>} Array of objects containing computed fields
   */
  async computeBatch(entities) {
    if (!Array.isArray(entities)) {
      throw new Error('entities must be an array');
    }
    return Promise.all(entities.map(entity => this.compute(entity)));
  }

  /**
   * Update database with computed fields
   * @param {string} tableName - Name of table to update
   * @param {string} idField - Name of ID field
   * @param {Object} entity - Entity with computed fields
   * @param {Object} computedFields - Object containing computed field values
   * @returns {Promise<void>}
   */
  async updateDatabase(tableName, idField, entity, computedFields) {
    // Handle empty computed fields
    if (Object.keys(computedFields).length === 0) {
      return; // Nothing to update
    }
    
    const updates = Object.entries(computedFields)
      .map(([field, value]) => `${field} = ?`)
      .join(', ');
    const values = [...Object.values(computedFields), entity[idField]];
    
    try {
      const stmt = this.db.prepare(
        `UPDATE ${tableName} SET ${updates} WHERE ${idField} = ?`
      );
      stmt.run(...values);
    } catch (error) {
      throw new Error(`Failed to update ${tableName}: ${error.message}`);
    }
  }

  /**
   * Validate that required fields exist in entity
   * @param {Object} entity - Entity to validate
   * @param {Array<string>} requiredFields - Array of required field names
   * @throws {Error} If any required field is missing
   */
  validateRequiredFields(entity, requiredFields) {
    const missing = requiredFields.filter(field => !(field in entity));
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}

module.exports = DerivedFieldComputer; 