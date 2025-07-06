# API Service Documentation

## Overview

The API service has been refactored to provide a cleaner, more maintainable structure. The new architecture consolidates 30+ individual endpoints into 5 generic entity operations and 10 specialized endpoints.

## Architecture

### Generic Entity Operations (5 endpoints)

All basic CRUD operations are now handled through a unified interface:

```javascript
api.entities.list(entityType, params)    // GET /{entityType}
api.entities.get(entityType, id)         // GET /{entityType}/{id}
api.entities.create(entityType, data)    // POST /{entityType}
api.entities.update(entityType, id, data) // PUT /{entityType}/{id}
api.entities.delete(entityType, id)      // DELETE /{entityType}/{id}
```

**Entity Types:**
- `'characters'`
- `'elements'`
- `'puzzles'`
- `'timeline'`

### Specialized Endpoints (10 endpoints)

1. **Sync Operations**
   - `api.syncNotionData()` - Trigger data sync from Notion
   - `api.getSyncStatus()` - Get current sync status

2. **Journey & Graph Data**
   - `api.getJourneyData(characterId)` - Get character journey data
   - `api.getEntityGraph(entityType, id, depth)` - Get graph visualization data

3. **Performance Data**
   - `api.getPerformanceElements(filterGroup)` - Get filtered element data

4. **Relationships**
   - `api.getCharacterLinks()` - Get character relationships

5. **Warnings & Attention**
   - `api.getEntitiesWithWarnings(entityType)` - Get entities needing attention

6. **Search**
   - `api.globalSearch(query)` - Search across all entities

7. **Metadata**
   - `api.getMetadata()` - Get database metadata
   - `api.getGameConstants()` - Get game configuration

## Usage Examples

### Generic Operations

```javascript
// Get all characters
const characters = await api.entities.list('characters');

// Get character with filters
const mainCharacters = await api.entities.list('characters', { tier: 'Main' });

// Get specific element
const element = await api.entities.get('elements', 'elem-123');

// Create new puzzle
const newPuzzle = await api.entities.create('puzzles', {
  name: 'New Puzzle',
  description: 'A challenging puzzle'
});

// Update timeline event
const updated = await api.entities.update('timeline', 'event-123', {
  name: 'Updated Event'
});

// Delete element
await api.entities.delete('elements', 'elem-456');
```

### Specialized Operations

```javascript
// Sync data from Notion
const syncResult = await api.syncNotionData();

// Get character journey
const journey = await api.getJourneyData('char-sarah-mitchell');

// Get element graph with depth 3
const graph = await api.getEntityGraph('elements', 'elem-123', 3);

// Get performance elements
const memoryTokens = await api.getPerformanceElements('memoryTypes');

// Get characters with warnings
const problemCharacters = await api.getEntitiesWithWarnings('characters');

// Global search
const results = await api.globalSearch('diary');
```

## Legacy Compatibility

The API maintains backward compatibility with the old method names. These legacy methods map to the new structure:

```javascript
// Old way (still works but deprecated)
api.getCharacters() → api.entities.list('characters')
api.getElementById(id) → api.entities.get('elements', id)
api.getPuzzles() → api.entities.list('puzzles')

// Specialized legacy mappings
api.syncData() → api.syncNotionData()
api.getJourneyByCharacterId(id) → api.getJourneyData(id)
api.getCharacterGraph(id, depth) → api.getEntityGraph('characters', id, depth)
```

## Migration Guide

### For New Code

Use the new generic entity operations:

```javascript
// Instead of:
const characters = await api.getCharacters();
const character = await api.getCharacterById(id);

// Use:
const characters = await api.entities.list('characters');
const character = await api.entities.get('characters', id);
```

### For Existing Code

The legacy methods continue to work, allowing gradual migration. However, we recommend updating to the new structure for:
- Better consistency
- Clearer intent
- Future compatibility

## Benefits

1. **Reduced Complexity**: 30 endpoints → 15 (5 generic + 10 specialized)
2. **Consistency**: All entities follow the same CRUD pattern
3. **Maintainability**: Changes to entity endpoints only need updates in one place
4. **Extensibility**: New entity types can be added without new methods
5. **Type Safety**: Clear TypeScript definitions available

## TypeScript Support

Type definitions are available in `api.types.js` (to be converted to `.ts`):

```javascript
import { Character, Element, Puzzle, TimelineEvent } from './api.types';

// Typed responses
const characters: Character[] = await api.entities.list('characters');
const element: Element = await api.entities.get('elements', id);
```

## Error Handling

All API methods follow the standardized error format:

```javascript
try {
  const data = await api.entities.get('characters', 'invalid-id');
} catch (error) {
  console.error(error.message); // User-friendly error message
  console.error(error.status);  // HTTP status code
  console.error(error.details); // Additional error details
}
```

## Performance Considerations

1. Use filters to reduce payload size:
   ```javascript
   api.entities.list('elements', { type: 'Memory Token' })
   ```

2. Use appropriate graph depth:
   ```javascript
   api.getEntityGraph('characters', id, 2) // Default depth
   api.getEntityGraph('characters', id, 1) // Shallow for performance
   ```

3. Cache responses with React Query for automatic caching and invalidation