# StoryForge Backend

This is the backend (BFF) for StoryForge, an immersive narrative design hub that integrates with Notion workspaces.

## Prerequisites

- Node.js (v16+)
- Notion API Key

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```
4. Add your Notion API key to the `.env` file
5. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NOTION_API_KEY` | Your Notion API key |
| `NOTION_CHARACTERS_DB` | Database ID for Characters |
| `NOTION_TIMELINE_DB` | Database ID for Timeline |
| `NOTION_PUZZLES_DB` | Database ID for Puzzles |
| `NOTION_ELEMENTS_DB` | Database ID for Elements |
| `PORT` | Port to run the server on (default: 3001) |

## API Endpoints

### Health Check
- `GET /health` - Check API health

### Database Metadata
- `GET /api/metadata` - Get database IDs and metadata

### Characters
- `GET /api/characters` - Get all characters
- `GET /api/characters/:id` - Get a specific character

### Timeline
- `GET /api/timeline` - Get all timeline events
- `GET /api/timeline/:id` - Get a specific timeline event

### Puzzles
- `GET /api/puzzles` - Get all puzzles
- `GET /api/puzzles/:id` - Get a specific puzzle

### Elements
- `GET /api/elements` - Get all elements
- `GET /api/elements?type=Memory%20Token%20Video` - Get elements filtered by type
- `GET /api/elements/:id` - Get a specific element

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic and API interactions
│   ├── utils/           # Utility functions
│   └── index.js         # Main entry point
├── .env                 # Environment variables (not in repo)
├── .env.example         # Example environment variables template
└── package.json         # Dependencies and scripts
```

## Testing

### Running Tests
Tests use Jest and can be run with:
```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
```

### Test Structure
- `tests/utils/` - Unit tests for utility functions
- `tests/integration/` - Integration tests for API endpoints
- `tests/services/` - Tests for service functions
- `tests/controllers/` - Tests for controller functions

### Key Features Tested
1. **Property Mapping** - Testing extraction of properties from Notion objects
2. **Relationship Enhancement** - Testing the async mappers that fetch related entity names
3. **API Endpoints** - Testing the API endpoints return correct data

## Implementation Notes

### Enhanced Related Entity Display
The backend now returns human-readable names for related entities, not just IDs. For example, a puzzle will include:

```json
{
  "id": "puzzle-id-1",
  "puzzle": "Locked Safe",
  "owner": [
    { "id": "char-id-1", "name": "Alex Reeves" }
  ],
  "rewards": [
    { "id": "element-id-1", "name": "Memory Video 1" }
  ]
}
```

This enhancement applies to all entity types:
- Characters: events, puzzles, ownedElements, associatedElements
- Timeline Events: charactersInvolved, memoryEvidence
- Puzzles: owner, lockedItem, puzzleElements, rewards, parentItem, subPuzzles
- Elements: owner, container, contents, containerPuzzle, requiredForPuzzle, rewardedByPuzzle, timelineEvent, associatedCharacters

## Future Enhancements

### Backend
- Add endpoint performance optimizations (caching)
- Implement write operations (Phase 3)
- Add authentication (Phase 4+)

### Testing
- Complete integration test setup
- Add more test cases for edge cases
- Add performance benchmarks

## Future Enhancements (Phase 3+)

- Write operations (create/update) for all entity types
- Authentication and authorization
- Caching layer for improved performance
- Rate limiting and retry strategies for Notion API 