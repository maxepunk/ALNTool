const DerivedFieldComputer = require('./DerivedFieldComputer');

/**
 * Extracts memory-related data from element descriptions
 * 
 * Parses SF_ fields from descriptions:
 * - SF_RFID: [value] - RFID tag identifier
 * - SF_ValueRating: [1-5] - Base value (1=$100, 2=$500, 3=$1000, 4=$5000, 5=$10000)
 * - SF_MemoryType: [Personal|Business|Technical] - Type multiplier (Personal=2x, Business=5x, Technical=10x)
 * - SF_Group: [GroupName] ([multiplier]x) - Memory group with specific multiplier
 * 
 * Final calculated value = Base Value × Type Multiplier × Group Multiplier
 */
class MemoryValueExtractor extends DerivedFieldComputer {
    constructor(db) {
        super(db);
        this.name = 'MemoryValueExtractor';
    }

    // Simple logging methods
    debug(message) {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`[DEBUG] ${this.name}: ${message}`);
        }
    }

    info(message) {
        console.log(`[INFO] ${this.name}: ${message}`);
    }

    error(message, error) {
        console.error(`[ERROR] ${this.name}: ${message}`, error);
    }

    /**
     * Extract RFID tag from description
     * @param {string} description - Element description text
     * @returns {string|null} - RFID tag value
     */
    extractRFIDTag(description) {
        if (!description) return null;
        const match = description.match(/SF_RFID:\s*([^\s\-]+)/i);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract value rating from description
     * @param {string} description - Element description text
     * @returns {number} - Value rating (1-5, or 0 if not found)
     */
    extractValueRating(description) {
        if (!description) return 0;
        const match = description.match(/SF_ValueRating:\s*(\d+)/i);
        if (match) {
            const rating = parseInt(match[1], 10);
            return (rating >= 1 && rating <= 5) ? rating : 0;
        }
        return 0;
    }

    /**
     * Extract memory type from description
     * @param {string} description - Element description text
     * @returns {string|null} - Memory type (Personal/Business/Technical)
     */
    extractMemoryType(description) {
        if (!description) return null;
        const match = description.match(/SF_MemoryType:\s*(Personal|Business|Technical)/i);
        return match ? match[1] : null;
    }

    /**
     * Extract memory group and multiplier from description
     * @param {string} description - Element description text
     * @returns {Object} - {group: string, multiplier: number}
     */
    extractMemoryGroup(description) {
        if (!description) return { group: null, multiplier: 1.0 };
        
        // Pattern: SF_Group: GroupName (10x) or SF_Group: GroupName (10.5x)
        const match = description.match(/SF_Group:\s*([^(]+)\s*\(([0-9.]+)x\)/i);
        if (match) {
            const group = match[1].trim();
            const multiplier = parseFloat(match[2]);
            return {
                group,
                multiplier: isNaN(multiplier) ? 1.0 : multiplier
            };
        }
        return { group: null, multiplier: 1.0 };
    }

    /**
     * Get base dollar value from rating
     * @param {number} rating - Value rating (1-5)
     * @returns {number} - Dollar value
     */
    getBaseValue(rating) {
        const valueMap = {
            1: 100,
            2: 500,
            3: 1000,
            4: 5000,
            5: 10000
        };
        return valueMap[rating] || 0;
    }

    /**
     * Get type multiplier
     * @param {string} memoryType - Memory type
     * @returns {number} - Multiplier value
     */
    getTypeMultiplier(memoryType) {
        if (!memoryType) return 1.0;
        
        const multipliers = {
            'Personal': 2.0,
            'Business': 5.0,
            'Technical': 10.0
        };
        return multipliers[memoryType] || 1.0;
    }

    /**
     * Calculate individual token value (not including group completion bonuses)
     * @param {number} valueRating - Base rating (1-5)
     * @param {string} memoryType - Memory type
     * @param {number} groupMultiplier - Group multiplier
     * @returns {number} - Individual token value
     */
    calculateIndividualTokenValue(valueRating, memoryType, groupMultiplier = 1.0) {
        if (!valueRating || valueRating === 0) return 0;
        
        const baseValue = this.getBaseValue(valueRating);
        const typeMultiplier = this.getTypeMultiplier(memoryType);
        
        // Individual token value = base * type multiplier
        // Group multiplier is stored but not applied here (that's for group completion bonuses)
        return Math.round(baseValue * typeMultiplier);
    }

    /**
     * Extract all memory data from element description
     * @param {string} description - Element description text
     * @returns {Object} - All extracted memory data
     */
    extractMemoryData(description) {
        if (!description || typeof description !== 'string') {
            return {
                rfidTag: null,
                valueRating: 0,
                memoryType: null,
                memoryGroup: null,
                groupMultiplier: 1.0,
                calculatedValue: 0
            };
        }

        const rfidTag = this.extractRFIDTag(description);
        const valueRating = this.extractValueRating(description);
        const memoryType = this.extractMemoryType(description);
        const { group: memoryGroup, multiplier: groupMultiplier } = this.extractMemoryGroup(description);
        
        const calculatedValue = this.calculateIndividualTokenValue(valueRating, memoryType, groupMultiplier);

        this.debug(`Extracted memory data: RFID=${rfidTag}, Rating=${valueRating}, Type=${memoryType}, Group=${memoryGroup} (${groupMultiplier}x), IndividualValue=$${calculatedValue}`);

        return {
            rfidTag,
            valueRating,
            memoryType,
            memoryGroup,
            groupMultiplier,
            calculatedValue
        };
    }

    /**
     * Extract memory values for all elements
     * @returns {number} - Number of elements updated
     */
    async extractAllMemoryValues() {
        const startTime = Date.now();
        this.debug('Starting memory value extraction for all elements...');

        try {
            // Get all elements with descriptions
            const elements = this.db.prepare(`
                SELECT id, name, description, 
                       rfid_tag, value_rating, memory_type, memory_group, 
                       group_multiplier, calculated_memory_value
                FROM elements 
                WHERE description IS NOT NULL
                ORDER BY name
            `).all();

            this.debug(`Found ${elements.length} elements with descriptions`);

            let updatedCount = 0;
            let extractedCount = 0;

            // Prepare update statement
            const updateStmt = this.db.prepare(`
                UPDATE elements 
                SET rfid_tag = ?, 
                    value_rating = ?, 
                    memory_type = ?, 
                    memory_group = ?, 
                    group_multiplier = ?, 
                    calculated_memory_value = ?
                WHERE id = ?
            `);

            // Process each element
            for (const element of elements) {
                const memoryData = this.extractMemoryData(element.description);
                
                if (memoryData.calculatedValue > 0 || memoryData.rfidTag) {
                    extractedCount++;
                    this.debug(`Element "${element.name}": extracted memory token data`);
                }

                // Check if any field changed
                const hasChanges = (
                    memoryData.rfidTag !== element.rfid_tag ||
                    memoryData.valueRating !== element.value_rating ||
                    memoryData.memoryType !== element.memory_type ||
                    memoryData.memoryGroup !== element.memory_group ||
                    memoryData.groupMultiplier !== element.group_multiplier ||
                    memoryData.calculatedValue !== element.calculated_memory_value
                );

                if (hasChanges) {
                    updateStmt.run(
                        memoryData.rfidTag,
                        memoryData.valueRating,
                        memoryData.memoryType,
                        memoryData.memoryGroup,
                        memoryData.groupMultiplier,
                        memoryData.calculatedValue,
                        element.id
                    );
                    updatedCount++;
                    this.debug(`Updated "${element.name}": memory data extracted`);
                }
            }

            const duration = Date.now() - startTime;
            
            this.info(`Memory value extraction completed in ${duration}ms`);
            this.info(`Processed ${elements.length} elements`);
            this.info(`Found memory tokens in ${extractedCount} elements`);
            this.info(`Updated ${updatedCount} elements`);

            return updatedCount;

        } catch (error) {
            this.error('Error during memory value extraction:', error);
            throw error;
        }
    }

    /**
     * Extract memory value for a single element
     * @param {string} elementId - Element ID
     * @returns {number} - Extracted memory value
     */
    async extractMemoryValueForElement(elementId) {
        try {
            const element = this.db.prepare(`
                SELECT id, name, description 
                FROM elements 
                WHERE id = ?
            `).get(elementId);

            if (!element) {
                throw new Error(`Element not found: ${elementId}`);
            }

            const memoryData = this.extractMemoryData(element.description);

            // Update the element with all memory data
            this.db.prepare(`
                UPDATE elements 
                SET rfid_tag = ?, 
                    value_rating = ?, 
                    memory_type = ?, 
                    memory_group = ?, 
                    group_multiplier = ?, 
                    calculated_memory_value = ?,
                    memory_value = ?
                WHERE id = ?
            `).run(
                memoryData.rfidTag,
                memoryData.valueRating,
                memoryData.memoryType,
                memoryData.memoryGroup,
                memoryData.groupMultiplier,
                memoryData.calculatedValue,
                memoryData.calculatedValue, // Legacy column
                elementId
            );

            this.debug(`Extracted memory value $${memoryData.calculatedValue} for element "${element.name}"`);
            return memoryData.calculatedValue;

        } catch (error) {
            this.error(`Error extracting memory value for element ${elementId}:`, error);
            throw error;
        }
    }

    /**
     * Get elements with memory values for analysis
     * @returns {Array} - Elements with memory values > 0
     */
    getElementsWithMemoryValues() {
        return this.db.prepare(`
            SELECT id, name, description, memory_value
            FROM elements 
            WHERE memory_value > 0
            ORDER BY memory_value DESC, name
        `).all();
    }

    /**
     * Get memory value statistics
     * @returns {Object} - Statistics about memory values
     */
    getMemoryValueStats() {
        const stats = this.db.prepare(`
            SELECT 
                COUNT(*) as total_elements,
                COUNT(CASE WHEN memory_value > 0 THEN 1 END) as elements_with_values,
                SUM(memory_value) as total_memory_value,
                AVG(CASE WHEN memory_value > 0 THEN memory_value END) as avg_memory_value,
                MAX(memory_value) as max_memory_value,
                MIN(CASE WHEN memory_value > 0 THEN memory_value END) as min_memory_value
            FROM elements
        `).get();

        return {
            totalElements: stats.total_elements,
            elementsWithValues: stats.elements_with_values,
            elementsWithoutValues: stats.total_elements - stats.elements_with_values,
            totalMemoryValue: stats.total_memory_value || 0,
            averageMemoryValue: Math.round((stats.avg_memory_value || 0) * 100) / 100,
            maxMemoryValue: stats.max_memory_value || 0,
            minMemoryValue: stats.min_memory_value || 0,
            valueExtractionRate: Math.round((stats.elements_with_values / stats.total_elements) * 100) || 0
        };
    }
}

module.exports = MemoryValueExtractor;