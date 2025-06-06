/**
 * Mock for the Notion Service
 */

// Database IDs (same as in .env.test)
const DB_IDS = {
  CHARACTERS: '18c2f33d583f8060a6abde32ff06bca2',
  TIMELINE: '1b52f33d583f80deae5ad20020c120dd',
  PUZZLES: '1b62f33d583f80cc87cfd7d6c4b0b265',
  ELEMENTS: '18c2f33d583f802091bcd84c7dd94306',
};

// Mock data: Characters
const MOCK_CHARACTERS = [
  {
    id: 'char-id-1',
    properties: {
      Name: { title: [{ plain_text: 'Alex Reeves' }] },
      Type: { select: { name: 'Player' } },
      Tier: { select: { name: 'Core' } },
      Character_Logline: { rich_text: [{ plain_text: 'A talented engineer' }] },
      Events: { relation: [{ id: 'event-id-1' }] },
      Owned_Elements: { relation: [{ id: 'element-id-1' }] },
    },
    last_edited_time: '2023-01-01',
  },
  {
    id: 'char-id-2',
    properties: {
      Name: { title: [{ plain_text: 'Marcus Blackwood' }] },
      Type: { select: { name: 'NPC' } },
      Tier: { select: { name: 'Core' } },
      Character_Logline: { rich_text: [{ plain_text: 'CEO of Blackwood Tech' }] },
      Events: { relation: [{ id: 'event-id-2' }] },
      Owned_Elements: { relation: [{ id: 'element-id-2' }] },
    },
    last_edited_time: '2023-01-02',
  },
];

// Mock data: Timeline Events
const MOCK_TIMELINE_EVENTS = [
  {
    id: 'event-id-1',
    properties: {
      Description: { title: [{ plain_text: 'Party begins' }] },
      Date: { date: { start: '2023-01-01' } },
      Characters_Involved: { relation: [{ id: 'char-id-1' }, { id: 'char-id-2' }] },
      Memory_Evidence: { relation: [{ id: 'element-id-1' }] },
    },
    last_edited_time: '2023-01-01',
  },
  {
    id: 'event-id-2',
    properties: {
      Description: { title: [{ plain_text: 'Discovery of the body' }] },
      Date: { date: { start: '2023-01-02' } },
      Characters_Involved: { relation: [{ id: 'char-id-2' }] },
      Memory_Evidence: { relation: [{ id: 'element-id-2' }] },
    },
    last_edited_time: '2023-01-02',
  },
];

// Mock data: Puzzles
const MOCK_PUZZLES = [
  {
    id: 'puzzle-id-1',
    properties: {
      Puzzle: { title: [{ plain_text: 'Locked Safe' }] },
      Description: { rich_text: [{ plain_text: 'A safe that is locked.' }] },
      Owner: { relation: [{ id: 'char-id-1' }] },
      Timing: { select: { name: 'Act 1' } },
      Rewards: { relation: [{ id: 'element-id-1' }] },
      Narrative_Threads: { multi_select: [{ name: 'Memory Drug' }] },
    },
    last_edited_time: '2023-01-01',
  },
  {
    id: 'puzzle-id-2',
    properties: {
      Puzzle: { title: [{ plain_text: 'Computer Password' }] },
      Description: { rich_text: [{ plain_text: 'A computer needs a password.' }] },
      Owner: { relation: [{ id: 'char-id-2' }] },
      Timing: { select: { name: 'Act 1' } },
      Rewards: { relation: [{ id: 'element-id-2' }] },
      Narrative_Threads: { multi_select: [{ name: 'Memory Drug' }, { name: 'Blackwood Tech' }] },
    },
    last_edited_time: '2023-01-02',
  },
];

// Mock data: Elements
const MOCK_ELEMENTS = [
  {
    id: 'element-id-1',
    properties: {
      Name: { title: [{ plain_text: 'Memory Video 1' }] },
      Basic_Type: { select: { name: 'Memory Token Video' } },
      Owner: { relation: [{ id: 'char-id-1' }] },
      Description_Text: { rich_text: [{ plain_text: 'A corrupted memory video' }] },
    },
    last_edited_time: '2023-01-01',
  },
  {
    id: 'element-id-2',
    properties: {
      Name: { title: [{ plain_text: 'CEO ID Badge' }] },
      Basic_Type: { select: { name: 'Prop' } },
      Owner: { relation: [{ id: 'char-id-2' }] },
      Description_Text: { rich_text: [{ plain_text: 'Access badge for CEO office' }] },
    },
    last_edited_time: '2023-01-02',
  },
];

// Mock database lookup function
const MOCK_DATA_BY_ID = {
  'char-id-1': MOCK_CHARACTERS[0],
  'char-id-2': MOCK_CHARACTERS[1],
  'event-id-1': MOCK_TIMELINE_EVENTS[0],
  'event-id-2': MOCK_TIMELINE_EVENTS[1],
  'puzzle-id-1': MOCK_PUZZLES[0],
  'puzzle-id-2': MOCK_PUZZLES[1],
  'element-id-1': MOCK_ELEMENTS[0],
  'element-id-2': MOCK_ELEMENTS[1],
};

// Mock implementations
const mockNotionService = {
  // Database IDs for reference
  DB_IDS,
  
  // Mock functions for database queries
  queryDatabase: jest.fn().mockImplementation((databaseId, filter = {}) => {
    switch(databaseId) {
      case DB_IDS.CHARACTERS:
        return Promise.resolve(MOCK_CHARACTERS);
      case DB_IDS.TIMELINE:
        return Promise.resolve(MOCK_TIMELINE_EVENTS);
      case DB_IDS.PUZZLES:
        return Promise.resolve(MOCK_PUZZLES);
      case DB_IDS.ELEMENTS:
        return Promise.resolve(MOCK_ELEMENTS);
      default:
        return Promise.resolve([]);
    }
  }),
  
  // Mock function for page retrieval
  getPage: jest.fn().mockImplementation((pageId) => {
    const page = MOCK_DATA_BY_ID[pageId];
    if (page) {
      return Promise.resolve(page);
    }
    return Promise.resolve(null);
  }),
  
  // Helper to get multiple pages
  getPagesByIds: jest.fn().mockImplementation((ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve([]);
    
    const pages = ids.map(id => MOCK_DATA_BY_ID[id]).filter(Boolean);
    return Promise.resolve(pages);
  }),
  
  // Mock endpoint functions
  getCharacters: jest.fn().mockResolvedValue(MOCK_CHARACTERS),
  getTimelineEvents: jest.fn().mockResolvedValue(MOCK_TIMELINE_EVENTS),
  getPuzzles: jest.fn().mockResolvedValue(MOCK_PUZZLES),
  getElements: jest.fn().mockResolvedValue(MOCK_ELEMENTS),
  getElementsByType: jest.fn().mockImplementation((type) => {
    const filtered = MOCK_ELEMENTS.filter(el => 
      el.properties.Basic_Type.select && 
      el.properties.Basic_Type.select.name === type
    );
    return Promise.resolve(filtered);
  }),
};

// Export mock service and data for testing
module.exports = {
  ...mockNotionService,
  MOCK_CHARACTERS,
  MOCK_TIMELINE_EVENTS,
  MOCK_PUZZLES,
  MOCK_ELEMENTS,
  MOCK_DATA_BY_ID
}; 