# Developer Technical Documentation

**Purpose**: Technical implementation guides and backend/frontend architecture details for developers working on ALNTool.

**Architecture Status**: All content reflects CURRENT verified architecture (React Query + Zustand UI-only + single API + responseWrapper).

---

## Backend API Documentation

@import:/home/spide/projects/GitHub/ALNTool/storyforge/backend/API.md

---

## Backend Data Flow & Field Mapping Analysis

@import:/home/spide/projects/GitHub/ALNTool/storyforge/backend/FIELD_MAPPING_ANALYSIS.md

---

## Frontend Feature Implementation

@import:/home/spide/projects/GitHub/ALNTool/storyforge/frontend/docs/TOOLTIP_IMPLEMENTATION_PLAN.md

---

## Backend Architecture Details

### Tech Stack
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Data: Notion API → SQLite sync pipeline
- Testing: Jest + MSW + transaction-based testing

### Backend Structure
```
storyforge/backend/src/
├── routes/             # Express route handlers
├── controllers/        # Route controllers  
├── services/           # Business logic
│   ├── sync/          # Notion sync orchestration
│   └── compute/       # Cross-entity calculations
├── db/                # Database layer
│   ├── database.js    # SQLite connection
│   ├── queries.js     # SQL queries
│   └── migration-scripts/  # 11 migration files
└── utils/             # Shared utilities
```

### Multi-Phase Sync Pattern
1. **Entity Phase**: Sync base entities from Notion
2. **Relationship Phase**: Sync relationships between entities
3. **Compute Phase**: Calculate derived fields
4. **Cache Phase**: Generate optimized views

### Entity Syncers
All syncers extend `BaseSyncer` and implement:
- `fetchFromNotion()` - Retrieve data from Notion API
- `transformData()` - Convert to internal format
- `saveToDatabase()` - Persist to SQLite

### Development Commands
```bash
cd storyforge/backend
npm start                   # Production server
npm run dev                # Development with nodemon
npm test                   # Jest tests
npm run verify:all         # Run ALL verifications
node scripts/sync-data.js  # Manual Notion sync
```

### API Response Format
All API responses follow standardized format via responseWrapper middleware:

**Success Response:**
```json
{
  "success": true,
  "data": <response data>,
  "message": <optional success message>
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": <error message>,
    "code": <error code>,
    "details": <optional error details>
  }
}
```

### Code Quality Rules
- **Zero Console Logs**: Use logger utility instead (enforced via verification)
- **Transaction-based Testing**: All database tests use transactions for isolation
- **Error Boundaries**: Comprehensive error handling throughout
- **Performance Monitoring**: Track response times and optimize bottlenecks