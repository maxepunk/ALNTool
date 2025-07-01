/**
 * QueryBuilder.js
 *
 * Centralized SQL query patterns to eliminate duplication.
 * All complex queries should be built here for consistency and reusability.
 */

const GameConstants = require('../config/GameConstants');

class QueryBuilder {
  /**
   * Builds query for character relationships with proper bidirectional handling
   * @param {string} characterId - Character ID to get relationships for
   * @returns {Object} Query object with sql and params
   */
  static characterRelationships(characterId) {
    return {
      sql: `
        SELECT 
          CASE 
            WHEN cl.character_a_id = ? THEN cl.character_b_id
            WHEN cl.character_b_id = ? THEN cl.character_a_id
          END as linked_character_id,
          cl.link_type,
          cl.link_strength as link_count,
          CASE 
            WHEN cl.character_a_id = ? THEN cb.name
            WHEN cl.character_b_id = ? THEN ca.name
          END as linked_character_name
        FROM character_links cl
        LEFT JOIN characters ca ON cl.character_a_id = ca.id
        LEFT JOIN characters cb ON cl.character_b_id = cb.id
        WHERE cl.character_a_id = ? OR cl.character_b_id = ?
        ORDER BY cl.link_strength DESC
      `,
      params: [characterId, characterId, characterId, characterId, characterId, characterId]
    };
  }

  /**
   * Builds query for character memory value aggregation
   * @param {string} characterId - Character ID to aggregate for
   * @returns {Object} Query object
   */
  static characterMemoryValue(characterId) {
    return {
      sql: `
        SELECT 
          c.id,
          c.name,
          COALESCE(SUM(e.calculated_memory_value), 0) as total_memory_value,
          COUNT(CASE WHEN e.calculated_memory_value > 0 THEN 1 END) as memory_token_count
        FROM characters c
        LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
        LEFT JOIN elements e ON coe.element_id = e.id
          AND e.type IN (${GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES.map(() => '?').join(',')})
        WHERE c.id = ?
        GROUP BY c.id, c.name
      `,
      params: [...GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES, characterId]
    };
  }

  /**
   * Builds query for all characters with memory values
   * @returns {Object} Query object
   */
  static allCharacterMemoryValues() {
    return {
      sql: `
        SELECT 
          c.id,
          c.name,
          COALESCE(SUM(e.calculated_memory_value), 0) as total_memory_value,
          COUNT(CASE WHEN e.calculated_memory_value > 0 THEN 1 END) as memory_token_count
        FROM characters c
        LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
        LEFT JOIN elements e ON coe.element_id = e.id
          AND e.type IN (${GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES.map(() => '?').join(',')})
        GROUP BY c.id, c.name
        ORDER BY total_memory_value DESC
      `,
      params: GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES
    };
  }

  /**
   * Builds query for memory elements with full details
   * @param {Object} filters - Optional filters
   * @returns {Object} Query object
   */
  static memoryElements(filters = {}) {
    const whereClauses = [`e.type IN (${GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES.map(() => '?').join(',')})`];
    const params = [...GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES];

    if (filters.hasValue) {
      whereClauses.push('e.calculated_memory_value > 0');
    }

    if (filters.resolutionPath) {
      whereClauses.push('e.resolution_paths LIKE ?');
      params.push(`%${filters.resolutionPath}%`);
    }

    if (filters.characterId) {
      whereClauses.push('coe.character_id = ?');
      params.push(filters.characterId);
    }

    return {
      sql: `
        SELECT 
          e.*,
          c.name as owner_name,
          cont.name as container_name
        FROM elements e
        LEFT JOIN character_owned_elements coe ON e.id = coe.element_id
        LEFT JOIN characters c ON coe.character_id = c.id
        LEFT JOIN elements cont ON e.container_id = cont.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY e.calculated_memory_value DESC
      `,
      params
    };
  }

  /**
   * Builds query for character sociogram data
   * @returns {Object} Query object
   */
  static characterSociogramData() {
    return {
      sql: `
        SELECT 
          c.*,
          (
            SELECT COUNT(DISTINCT CASE 
              WHEN cl.character_a_id = c.id THEN cl.character_b_id 
              WHEN cl.character_b_id = c.id THEN cl.character_a_id 
            END)
            FROM character_links cl
            WHERE cl.character_a_id = c.id OR cl.character_b_id = c.id
          ) as relationship_count,
          COUNT(DISTINCT coe.element_id) as owned_elements_count,
          COUNT(DISTINCT cae.element_id) as associated_elements_count,
          COUNT(DISTINCT cte.timeline_event_id) as timeline_events_count,
          COALESCE(memory_agg.total_memory_value, 0) as total_memory_value
        FROM characters c
        LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
        LEFT JOIN character_associated_elements cae ON c.id = cae.character_id
        LEFT JOIN character_timeline_events cte ON c.id = cte.character_id
        LEFT JOIN (
          SELECT 
            coe.character_id,
            SUM(e.calculated_memory_value) as total_memory_value
          FROM character_owned_elements coe
          JOIN elements e ON coe.element_id = e.id
          WHERE e.type IN (${GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES.map(() => '?').join(',')})
            AND e.calculated_memory_value > 0
          GROUP BY coe.character_id
        ) memory_agg ON c.id = memory_agg.character_id
        GROUP BY c.id
        ORDER BY c.name
      `,
      params: GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES
    };
  }

  /**
   * Builds query for timeline events with character participation
   * @param {Object} filters - Optional filters
   * @returns {Object} Query object
   */
  static timelineEventsWithCharacters(filters = {}) {
    const whereClauses = [];
    const params = [];

    if (filters.characterId) {
      whereClauses.push('cte.character_id = ?');
      params.push(filters.characterId);
    }

    if (filters.act) {
      whereClauses.push('te.act_focus = ?');
      params.push(filters.act);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return {
      sql: `
        SELECT 
          te.*,
          GROUP_CONCAT(c.name) as participating_characters,
          COUNT(DISTINCT cte.character_id) as participant_count
        FROM timeline_events te
        LEFT JOIN character_timeline_events cte ON te.id = cte.timeline_event_id
        LEFT JOIN characters c ON cte.character_id = c.id
        ${whereClause}
        GROUP BY te.id
        ORDER BY te.time_period ASC
      `,
      params
    };
  }

  /**
   * Builds query for puzzle flow analysis
   * @param {string} puzzleId - Puzzle ID to analyze
   * @returns {Object} Query object
   */
  static puzzleFlow(puzzleId) {
    return {
      sql: `
        SELECT 
          p.*,
          COUNT(DISTINCT pep.element_id) as prerequisite_count,
          COUNT(DISTINCT per.element_id) as reward_count,
          GROUP_CONCAT(DISTINCT pep_el.name) as prerequisite_names,
          GROUP_CONCAT(DISTINCT per_el.name) as reward_names
        FROM puzzles p
        LEFT JOIN puzzle_element_prerequisites pep ON p.id = pep.puzzle_id
        LEFT JOIN elements pep_el ON pep.element_id = pep_el.id
        LEFT JOIN puzzle_element_rewards per ON p.id = per.puzzle_id
        LEFT JOIN elements per_el ON per.element_id = per_el.id
        WHERE p.id = ?
        GROUP BY p.id
      `,
      params: [puzzleId]
    };
  }

  /**
   * Builds query for resolution path distribution
   * @returns {Object} Query object
   */
  static resolutionPathDistribution() {
    const paths = [...GameConstants.RESOLUTION_PATHS.TYPES, GameConstants.RESOLUTION_PATHS.DEFAULT];

    return {
      sql: `
        SELECT 
          path,
          COUNT(*) as count,
          entity_type
        FROM (
          SELECT 
            CASE 
              ${paths.map(path => `WHEN resolution_paths LIKE '%${path}%' THEN '${path}'`).join('\n              ')}
              ELSE '${GameConstants.RESOLUTION_PATHS.DEFAULT}'
            END as path,
            'character' as entity_type
          FROM characters
          WHERE resolution_paths IS NOT NULL
          
          UNION ALL
          
          SELECT 
            CASE 
              ${paths.map(path => `WHEN resolution_paths LIKE '%${path}%' THEN '${path}'`).join('\n              ')}
              ELSE '${GameConstants.RESOLUTION_PATHS.DEFAULT}'
            END as path,
            'element' as entity_type
          FROM elements
          WHERE resolution_paths IS NOT NULL
        ) path_data
        GROUP BY path, entity_type
        ORDER BY count DESC
      `,
      params: []
    };
  }

  /**
   * Builds query for journey gaps detection
   * @param {string} characterId - Character ID to analyze
   * @param {number} gapThreshold - Gap threshold in minutes
   * @returns {Object} Query object
   */
  static journeyGaps(characterId, gapThreshold = GameConstants.JOURNEY.CRITICAL_GAP_MINUTES) {
    return {
      sql: `
        WITH journey_events AS (
          SELECT 
            te.id,
            te.name,
            te.time_period,
            te.minutes,
            LAG(te.minutes) OVER (ORDER BY te.minutes) as prev_minutes
          FROM character_timeline_events cte
          JOIN timeline_events te ON cte.timeline_event_id = te.id
          WHERE cte.character_id = ?
            AND te.minutes IS NOT NULL
          ORDER BY te.minutes
        )
        SELECT 
          id,
          name,
          time_period,
          minutes,
          prev_minutes,
          (minutes - prev_minutes) as gap_minutes
        FROM journey_events
        WHERE prev_minutes IS NOT NULL
          AND (minutes - prev_minutes) > ?
        ORDER BY gap_minutes DESC
      `,
      params: [characterId, gapThreshold]
    };
  }

  /**
   * Builds query for narrative thread analysis
   * @param {string[]} threads - Array of thread names to analyze
   * @returns {Object} Query object
   */
  static narrativeThreadAnalysis(threads = []) {
    const threadConditions = threads.length > 0
      ? threads.map(thread => 'narrative_threads LIKE ?').join(' OR ')
      : '1=1';

    const threadParams = threads.map(thread => `%${thread}%`);

    return {
      sql: `
        SELECT 
          narrative_threads,
          COUNT(*) as entity_count,
          entity_type,
          GROUP_CONCAT(name, ', ') as entity_names
        FROM (
          SELECT id, name, narrative_threads, 'character' as entity_type
          FROM characters
          WHERE narrative_threads IS NOT NULL AND (${threadConditions})
          
          UNION ALL
          
          SELECT id, name, narrative_threads, 'element' as entity_type
          FROM elements
          WHERE narrative_threads IS NOT NULL AND (${threadConditions})
          
          UNION ALL
          
          SELECT id, name, narrative_threads, 'timeline_event' as entity_type
          FROM timeline_events
          WHERE narrative_threads IS NOT NULL AND (${threadConditions})
        ) thread_data
        GROUP BY narrative_threads, entity_type
        ORDER BY entity_count DESC
      `,
      params: [...threadParams, ...threadParams, ...threadParams]
    };
  }
}

module.exports = QueryBuilder;