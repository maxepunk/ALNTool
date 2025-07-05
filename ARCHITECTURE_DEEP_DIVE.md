# ALNTool Architecture Deep Dive
**Date**: January 14, 2025  
**Version**: 1.0  
**Status**: Complete architectural analysis of current implementation

## Executive Summary

ALNTool is a design decision support intelligence system for the "About Last Night" murder mystery game. It transforms 18 separate database views into a unified interface where game designers can select any entity and instantly see complete impact analysis across story, social, economic, and production dimensions.

## System Overview

```mermaid
graph TB
    subgraph "Frontend - React SPA"
        UI[JourneyIntelligenceView]
        State[State Management]
        Hooks[Data Hooks]
        API[API Service Layer]
    end
    
    subgraph "Backend - Node.js/Express"
        Routes[API Routes]
        Controllers[Controllers]
        Services[Service Layer]
        DB[(SQLite Database)]
    end
    
    subgraph "External"
        Notion[Notion API]
    end
    
    UI --> State
    UI --> Hooks
    Hooks --> API
    API --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> DB
    Services --> Notion
```

## Frontend Architecture

### Component Hierarchy

```mermaid
graph TD
    App[App.jsx]
    App --> JIV[JourneyIntelligenceView]
    
    JIV --> ES[EntitySelector]
    JIV --> AGC[AdaptiveGraphCanvas]
    JIV --> IP[IntelligencePanel]
    JIV --> IT[IntelligenceToggles]
    
    AGC --> CN[CharacterNode]
    AGC --> EN[ElementNode]
    AGC --> PN[PuzzleNode]
    AGC --> TEN[TimelineEventNode]
    AGC --> AN[AggregatedNode]
    
    IT --> EL[EconomicLayer]
    IT --> SIL[StoryIntelligenceLayer]
    IT --> SoIL[SocialIntelligenceLayer]
    IT --> PIL[ProductionIntelligenceLayer]
    IT --> CGL[ContentGapsLayer]
```

### State Management Architecture

```mermaid
graph LR
    subgraph "Zustand - UI State"
        JIS[journeyIntelligenceStore]
        JIS --> SE[selectedEntity]
        JIS --> VM[viewMode]
        JIS --> AI[activeIntelligence]
        JIS --> FM[focusMode]
        JIS --> GC[graphConfig]
    end
    
    subgraph "React Query - Server State"
        RQ[React Query]
        RQ --> Characters[useCharacters]
        RQ --> Elements[useElements]
        RQ --> Puzzles[usePuzzles]
        RQ --> Timeline[useTimelineEvents]
        RQ --> Journey[useCharacterJourney]
    end
    
    subgraph "Local Storage"
        LS[Persistence Layer]
        JIS -.->|persist| LS
    end
```

### Data Flow Patterns

```mermaid
sequenceDiagram
    participant User
    participant UI as JourneyIntelligenceView
    participant Store as Zustand Store
    participant Hook as Data Hook
    participant API as API Service
    participant Backend
    
    User->>UI: Select Entity
    UI->>Store: Update selectedEntity
    Store->>UI: Trigger re-render
    UI->>Hook: Fetch entity data
    Hook->>API: API call
    API->>Backend: HTTP request
    Backend->>API: Response data
    API->>Hook: Parsed data
    Hook->>UI: Render intelligence
```

## Backend Architecture

### Service Layer Architecture

```mermaid
graph TB
    subgraph "API Layer"
        Routes[Express Routes]
        MW[Response Wrapper]
    end
    
    subgraph "Controller Layer"
        JC[Journey Controller]
        NC[Notion Controller]
    end
    
    subgraph "Service Layer"
        DS[Data Sync Service]
        JE[Journey Engine]
        GS[Graph Service]
        NS[Notion Service]
    end
    
    subgraph "Sync Pipeline"
        SO[Sync Orchestrator]
        ES[Entity Syncers]
        RS[Relationship Syncer]
        CO[Compute Orchestrator]
    end
    
    subgraph "Database Layer"
        DB[(SQLite)]
        QB[Query Builder]
        Queries[SQL Queries]
    end
    
    Routes --> MW
    MW --> JC
    MW --> NC
    JC --> JE
    JC --> GS
    NC --> DS
    DS --> SO
    SO --> ES
    SO --> RS
    SO --> CO
    ES --> NS
    JE --> Queries
    GS --> QB
    Queries --> DB
    QB --> DB
```

### 4-Phase Sync Pipeline

```mermaid
graph LR
    subgraph "Phase 1: Entity Sync"
        CS[Character Syncer]
        ES[Element Syncer]
        PS[Puzzle Syncer]
        TS[Timeline Syncer]
    end
    
    subgraph "Phase 2: Relationships"
        RS[Relationship Syncer]
        CTE[character_timeline_events]
        COE[character_owned_elements]
        CP[character_puzzles]
    end
    
    subgraph "Phase 3: Compute"
        AFC[Act Focus Computer]
        MVC[Memory Value Computer]
        NTC[Narrative Thread Computer]
        RPC[Resolution Path Computer]
    end
    
    subgraph "Phase 4: Cache"
        CL[Character Links]
        JG[Journey Graphs]
        OV[Optimized Views]
    end
    
    CS --> RS
    ES --> RS
    PS --> RS
    TS --> RS
    
    RS --> AFC
    RS --> MVC
    RS --> NTC
    RS --> RPC
    
    AFC --> CL
    MVC --> JG
    NTC --> OV
    RPC --> OV
```

## Data Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    CHARACTERS ||--o{ CHARACTER_TIMELINE_EVENTS : participates
    CHARACTERS ||--o{ CHARACTER_OWNED_ELEMENTS : owns
    CHARACTERS ||--o{ CHARACTER_ASSOCIATED_ELEMENTS : associated
    CHARACTERS ||--o{ CHARACTER_PUZZLES : has
    CHARACTERS ||--o{ CHARACTER_LINKS : connects
    
    TIMELINE_EVENTS ||--o{ CHARACTER_TIMELINE_EVENTS : involves
    TIMELINE_EVENTS ||--o{ ELEMENTS : reveals
    
    ELEMENTS ||--o{ CHARACTER_OWNED_ELEMENTS : owned_by
    ELEMENTS ||--o{ CHARACTER_ASSOCIATED_ELEMENTS : associated_with
    ELEMENTS }o--|| TIMELINE_EVENTS : timeline_event_id
    ELEMENTS }o--|| ELEMENTS : container_id
    
    PUZZLES ||--o{ CHARACTER_PUZZLES : belongs_to
    PUZZLES ||--o{ ELEMENTS : rewards
    PUZZLES ||--o{ ELEMENTS : requires
    
    CHARACTERS {
        string id PK
        string name
        string type
        string tier
        string logline
        number total_memory_value
    }
    
    ELEMENTS {
        string id PK
        string name
        string type_or_basicType
        string description
        string status
        string rfid_tag
        number calculated_memory_value
        string memory_type
        string memory_group
        number group_multiplier
        string timeline_event_id FK
        string container_id FK
    }
    
    PUZZLES {
        string id PK
        string name
        string timing
        json reward_ids
        json puzzle_element_ids
        json computed_narrative_threads
    }
    
    TIMELINE_EVENTS {
        string id PK
        string description
        string date
        json character_ids
        json element_ids
        string act_focus
    }
```

### Dual-Path API Architecture

```mermaid
graph TD
    subgraph "Client Request"
        R1[Request Elements]
    end
    
    subgraph "API Router"
        Router{Path?}
    end
    
    subgraph "Performance Path"
        PP["/api/elements?filterGroup=memoryTypes"]
        SQLite[(SQLite Cache)]
        TypeField[Returns 'type' field]
        CompFields[Computed fields included]
    end
    
    subgraph "Fresh Path"
        FP["/api/elements"]
        Notion[Notion API]
        BasicType[Returns 'basicType' field]
        RealTime[Real-time data]
    end
    
    R1 --> Router
    Router -->|Performance| PP
    Router -->|Fresh| FP
    PP --> SQLite
    SQLite --> TypeField
    SQLite --> CompFields
    FP --> Notion
    Notion --> BasicType
    Notion --> RealTime
```

## Intelligence Layer Architecture

### Intelligence Layer Data Flow

```mermaid
graph TB
    subgraph "Entity Selection"
        User[User Selects Entity]
        Store[Update Store]
    end
    
    subgraph "Intelligence Computation"
        EI[Economic Intelligence]
        SI[Story Intelligence]  
        SoI[Social Intelligence]
        PI[Production Intelligence]
        CI[Content Gaps Intelligence]
    end
    
    subgraph "Data Sources"
        CD[Character Data]
        ED[Element Data]
        PD[Puzzle Data]
        TD[Timeline Data]
        RL[Relationships]
    end
    
    subgraph "Analysis Output"
        Impact[Impact Analysis]
        Warnings[Balance Warnings]
        Opps[Integration Opportunities]
        Deps[Dependencies]
    end
    
    User --> Store
    Store --> EI
    Store --> SI
    Store --> SoI
    Store --> PI
    Store --> CI
    
    CD --> EI
    ED --> EI
    ED --> SI
    TD --> SI
    PD --> SoI
    RL --> SoI
    ED --> PI
    PD --> PI
    CD --> CI
    TD --> CI
    
    EI --> Impact
    SI --> Impact
    SoI --> Warnings
    PI --> Deps
    CI --> Opps
```

## Social Choreography System

```mermaid
graph LR
    subgraph "Initial State"
        A[Alex has Business Card]
        D[Derek has Safe Combo]
        S[Sarah has Jewelry Box]
    end
    
    subgraph "Puzzle Requirements"
        P1[Safe Puzzle needs Card + Combo]
        P2[Jewelry Box needs Token from Safe]
    end
    
    subgraph "Forced Interactions"
        I1[Alex must find Derek]
        I2[Alex + Derek solve Safe]
        I3[Alex gets Token reward]
        I4[Sarah must find Alex]
        I5[Sarah + Alex solve Box]
    end
    
    A --> I1
    D --> I1
    I1 --> I2
    I2 --> P1
    P1 --> I3
    I3 --> I4
    S --> I4
    I4 --> I5
    I5 --> P2
```

## Memory Token Economy Flow

```mermaid
graph TD
    subgraph "Discovery Phase"
        Find[Player finds Memory Token]
        Scan[Player scans with RFID reader]
        Reveal[Token reveals video/content]
    end
    
    subgraph "Value Calculation"
        Base[Base Value: $500-$5000]
        Type[Type Multiplier: 0.5-1.5x]
        Group[Group Multiplier: 1.0-2.0x]
        Total[Calculated Total Value]
    end
    
    subgraph "Choice Phase"
        BM[Black Market Path: Cash]
        DP[Detective Path: Story]
        RO[Return Path: Character]
        Keep[Keep: Corruption]
    end
    
    Find --> Scan
    Scan --> Reveal
    Reveal --> Base
    Base --> Type
    Type --> Group
    Group --> Total
    Total --> BM
    Total --> DP
    Total --> RO
    Total --> Keep
```

## Performance Optimization Strategy

```mermaid
graph TD
    subgraph "Node Rendering"
        Count{Node Count?}
        Full[Render All Nodes]
        Aggregate[Show Aggregated Nodes]
    end
    
    subgraph "Data Loading"
        Initial[Load Characters Only]
        Progressive[Load Other Types on Demand]
    end
    
    subgraph "Caching Strategy"
        RQ[React Query Cache]
        Local[Local Storage]
        Computed[Pre-computed Values]
    end
    
    Count -->|<=50| Full
    Count -->|>50| Aggregate
    
    Initial --> Progressive
    
    RQ --> Computed
    Local --> RQ
```

## System Integration Points

### API Response Standardization

```javascript
// Success Response Structure
{
  "success": true,
  "data": {
    // Response payload
  },
  "message": "Optional success message"
}

// Error Response Structure
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Optional
  }
}
```

### Key Integration Patterns

1. **Unified API Service**: Single `api.js` file handles all HTTP communication
2. **Response Wrapper**: Middleware ensures consistent response format
3. **Error Boundaries**: 79 error boundaries prevent cascade failures
4. **State Persistence**: Zustand store persists to localStorage
5. **Performance Monitoring**: Built-in performance indicators
6. **Logger Utility**: Replaces console.log for production safety

## Current Implementation Gaps

### Completed (Phase 1 - Days 1-8)
- ✅ Unified JourneyIntelligenceView interface
- ✅ All 5 intelligence layers implemented
- ✅ Entity selector with search functionality
- ✅ State persistence with localStorage
- ✅ Progressive entity loading
- ✅ Character relationship edges
- ✅ Custom node shapes per entity type

### Remaining (Phase 1 - Days 9-11)
- ❌ Force-directed layout (currently using grid)
- ❌ Radial layout for character focus mode
- ❌ Intelligence layer data visualization
- ❌ 3-layer maximum enforcement
- ❌ Hover states showing connections
- ❌ Keyboard shortcuts
- ❌ Zoom constraints
- ❌ Performance with 400+ entities

### Future Phases (Not Started)
- Phase 2: Real-time content creation
- Phase 3: Bidirectional Notion sync
- Phase 4: Collaborative design platform

## Architecture Strengths

1. **Clean Separation**: Frontend/Backend clearly separated with API boundary
2. **Scalable State**: Zustand + React Query handles complex state elegantly
3. **Performance First**: Dual-path API, computed fields, smart aggregation
4. **Extensible**: Intelligence layers can be added without core changes
5. **Error Resilient**: Comprehensive error handling at every level

## Architecture Considerations

1. **Complexity**: 4-dimensional analysis requires careful state management
2. **Performance**: 400+ entities push ReactFlow limits
3. **Data Freshness**: Dual-path API balances performance vs real-time
4. **Testing**: Complex interactions require comprehensive test coverage

---

*This architecture supports the transformation from 18 separate database views into a unified design decision support intelligence system for complex social narrative game design.*