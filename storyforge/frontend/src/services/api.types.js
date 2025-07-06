/**
 * TypeScript type definitions for API responses
 * These can be converted to .ts file when migrating to TypeScript
 */

// Base entity types
export const EntityTypes = {
  CHARACTER: 'characters',
  ELEMENT: 'elements',
  PUZZLE: 'puzzles',
  TIMELINE: 'timeline'
};

// Common response wrapper
/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {any} data
 * @property {string} [message]
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {string} [code]
 * @property {Object} [details]
 */

// Entity types
/**
 * @typedef {Object} Character
 * @property {string} id
 * @property {string} name
 * @property {string} [tier]
 * @property {string} [logline]
 * @property {string[]} [ownedElements]
 * @property {string[]} [resolutionPaths]
 * @property {string} [type]
 * @property {Object} [metadata]
 */

/**
 * @typedef {Object} Element
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} [type]
 * @property {string} [basicType]
 * @property {string} [owner_character_id]
 * @property {string} [container_element_id]
 * @property {string} [timeline_event_id]
 * @property {number} [calculated_memory_value]
 * @property {string} [memory_type]
 * @property {string} [discoverability]
 */

/**
 * @typedef {Object} Puzzle
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string[]} [required_elements]
 * @property {string[]} [reward_ids]
 * @property {string} [type]
 */

/**
 * @typedef {Object} TimelineEvent
 * @property {string} id
 * @property {string} [name]
 * @property {string} [description]
 * @property {string[]} [characters]
 * @property {string} [act_focus]
 * @property {number} [narrative_weight]
 */

// Graph data types
/**
 * @typedef {Object} GraphNode
 * @property {string} id
 * @property {string} type
 * @property {Object} data
 * @property {Object} position
 * @property {Object} [style]
 */

/**
 * @typedef {Object} GraphEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {string} [type]
 * @property {Object} [data]
 * @property {Object} [style]
 */

/**
 * @typedef {Object} GraphData
 * @property {GraphNode[]} nodes
 * @property {GraphEdge[]} edges
 * @property {Object} [metadata]
 */

// Journey data
/**
 * @typedef {Object} JourneyData
 * @property {Character} character
 * @property {Element[]} elements
 * @property {Puzzle[]} puzzles
 * @property {TimelineEvent[]} timeline_events
 * @property {Object[]} relationships
 */

// Sync status
/**
 * @typedef {Object} SyncStatus
 * @property {boolean} is_syncing
 * @property {string} [current_step]
 * @property {number} [progress]
 * @property {string} [last_sync]
 * @property {string} [error]
 */

// Metadata
/**
 * @typedef {Object} DatabaseMetadata
 * @property {string} name
 * @property {string} id
 * @property {number} item_count
 * @property {string} last_updated
 */

// Search results
/**
 * @typedef {Object} SearchResult
 * @property {string} id
 * @property {string} type
 * @property {string} name
 * @property {string} [description]
 * @property {number} [relevance]
 */

// Game constants
/**
 * @typedef {Object} GameConstants
 * @property {Object} memory_values
 * @property {Object} character_tiers
 * @property {Object} element_types
 * @property {Object} puzzle_types
 */

// API method signatures
/**
 * @typedef {Object} EntityAPI
 * @property {(entityType: string, params?: Object) => Promise<any[]>} list
 * @property {(entityType: string, id: string) => Promise<any>} get
 * @property {(entityType: string, data: Object) => Promise<any>} create
 * @property {(entityType: string, id: string, data: Object) => Promise<any>} update
 * @property {(entityType: string, id: string) => Promise<boolean>} delete
 */

/**
 * @typedef {Object} SpecializedAPI
 * @property {() => Promise<ApiResponse>} syncNotionData
 * @property {() => Promise<SyncStatus>} getSyncStatus
 * @property {(characterId: string) => Promise<JourneyData>} getJourneyData
 * @property {(entityType: string, id: string, depth?: number) => Promise<GraphData>} getEntityGraph
 * @property {(filterGroup?: string) => Promise<Element[]>} getPerformanceElements
 * @property {() => Promise<Object[]>} getCharacterLinks
 * @property {(entityType: string) => Promise<any[]>} getEntitiesWithWarnings
 * @property {(query: string) => Promise<SearchResult[]>} globalSearch
 * @property {() => Promise<DatabaseMetadata[]>} getMetadata
 * @property {() => Promise<GameConstants>} getGameConstants
 */

export default {
  EntityTypes
};