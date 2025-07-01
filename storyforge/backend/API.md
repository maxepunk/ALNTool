# ALNTool API Documentation

## Overview
The ALNTool backend provides a RESTful API for the About Last Night Production Intelligence Tool. All API endpoints are prefixed with `/api` and return standardized JSON responses.

## Base URL
- Development: `http://localhost:3001`
- Frontend proxy: `http://localhost:3000/api` (proxied to backend)

## Response Format
All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "data": <response data>,
  "message": <optional success message>
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": 404,
    "details": <optional error details>
  }
}
```

## Authentication
No authentication required (internal tool for 2-3 users).

## Rate Limiting
- Development: Disabled
- Production: 100 requests per 15 minutes per IP

## Endpoints

### System & Metadata

#### Get Database Metadata
```
GET /api/metadata
```
Returns metadata about all Notion databases.

**Response:**
```json
{
  "success": true,
  "data": {
    "databases": [
      {
        "id": "database-id",
        "name": "Database Name",
        "properties": { ... }
      }
    ]
  }
}
```

#### Get Game Constants
```
GET /api/game-constants
```
Returns game configuration constants.

**Response:**
```json
{
  "success": true,
  "data": {
    "MAX_MEMORY_VALUE": 3,
    "ACT_MULTIPLIERS": { "1": 1, "2": 2, "3": 3 },
    "MEMORY_VALUES": { ... }
  }
}
```

### Characters

#### List Characters
```
GET /api/characters
GET /api/characters?category=guest
```
Returns all characters with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by character category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "char-alex-reeves",
      "name": "Alex Reeves",
      "category": "guest",
      "description": "...",
      "importance": 8
    }
  ]
}
```

#### Get Character by ID
```
GET /api/characters/:id
```
Returns a single character's details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "char-alex-reeves",
    "name": "Alex Reeves",
    "category": "guest",
    "full_description": "...",
    "relationships": [...]
  }
}
```

#### Get Character Graph
```
GET /api/characters/:id/graph?depth=2
```
Returns character relationship graph data.

**Query Parameters:**
- `depth` (optional, default: 2): Graph traversal depth

**Response:**
```json
{
  "success": true,
  "data": {
    "center": { "id": "...", "name": "..." },
    "nodes": [...],
    "edges": [...]
  }
}
```

#### Get Character Journey
```
GET /api/journeys/:characterId
```
Returns the character's journey flow data.

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...],
    "metadata": { ... }
  }
}
```

#### Get Characters with Warnings
```
GET /api/characters/with-warnings
```
Returns characters that have validation warnings.

#### Get Characters with Sociogram Data
```
GET /api/characters/with-sociogram-data
```
Returns all characters with their relationship data for sociogram visualization.

### Timeline Events

#### List Timeline Events
```
GET /api/timeline
GET /api/timeline?act=1
```
Returns timeline events with optional filtering.

**Query Parameters:**
- `act` (optional): Filter by act number

#### Get Timeline Event by ID
```
GET /api/timeline/:id
```

#### Get Timeline Graph
```
GET /api/timeline/:id/graph?depth=2
```

#### List Timeline Events (Database View)
```
GET /api/timeline/list
```
Returns a simplified list view of timeline events.

### Puzzles

#### List Puzzles
```
GET /api/puzzles
GET /api/puzzles?category=logic
```

**Query Parameters:**
- `category` (optional): Filter by puzzle category

#### Get Puzzle by ID
```
GET /api/puzzles/:id
```

#### Get Puzzle Graph
```
GET /api/puzzles/:id/graph?depth=2
```

#### Get Puzzle Flow
```
GET /api/puzzles/:id/flow
```
Returns puzzle progression flow data.

#### Get Puzzle Flow Graph
```
GET /api/puzzles/:id/flowgraph
```
Returns puzzle flow visualization data.

#### Get Puzzles with Warnings
```
GET /api/puzzles/with-warnings
```

### Elements

#### List Elements
```
GET /api/elements
GET /api/elements?category=object
```

**Query Parameters:**
- `category` (optional): Filter by element category

#### Get Element by ID
```
GET /api/elements/:id
```

#### Get Element Graph
```
GET /api/elements/:id/graph?depth=2
```

#### Get Elements with Warnings
```
GET /api/elements/with-warnings
```

### Search & Analysis

#### Global Search
```
GET /api/search?q=briefcase
```
Searches across all entity types.

**Query Parameters:**
- `q` (required): Search query string

**Response:**
```json
{
  "success": true,
  "data": {
    "characters": [...],
    "elements": [...],
    "puzzles": [...],
    "timeline": [...]
  }
}
```

#### Get Unique Narrative Threads
```
GET /api/narrative-threads/unique
```
Returns all unique narrative thread values.

### Data Sync

#### Trigger Data Sync
```
POST /api/sync/data
```
Initiates a full data sync from Notion.

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "sync-12345",
    "status": "started"
  }
}
```

#### Get Sync Status
```
GET /api/sync/status
```
Returns the current sync operation status.

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "progress": 45,
    "currentPhase": "entities",
    "startTime": "2025-01-07T10:00:00Z"
  }
}
```

#### Cancel Sync
```
POST /api/sync/cancel
```
Cancels the current sync operation.

### Cache Management

#### Clear Cache
```
POST /api/cache/clear
```
Clears all cached data.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

## Error Codes
- `400` - Bad Request (invalid parameters)
- `404` - Resource Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Testing
Use the verification script to test all endpoints:
```bash
node scripts/verify-fixes.js
```

Or test individual endpoints:
```bash
# Test character endpoint
curl http://localhost:3001/api/characters/char-alex-reeves

# Test error handling
curl http://localhost:3001/api/characters/invalid-id
```