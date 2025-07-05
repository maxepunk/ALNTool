// Mock API service for tests

const mockCharacters = [
  {
    id: 'char-1',
    name: 'Test Character 1',
    type: 'NPC',
    tier: 'Core',
    resolutionPaths: ['Black Market'],
    character_links: [{ id: 'char-2', name: 'Test Character 2' }],
    ownedElements: [],
    events: []
  },
  {
    id: 'char-sarah-mitchell',
    name: 'Sarah Mitchell',
    type: 'character',
    tier: 'Tier 2',
    resolutionPaths: ['Detective', 'Black Market'],
    character_links: [{ id: 'char-alex', name: 'Alex' }],
    ownedElements: ['elem-voice-memo'],
    events: ['timeline-1', 'timeline-2']
  }
];

const mockElements = [
  {
    id: 'elem-voice-memo',
    name: 'Victoria\'s Voice Memo',
    basicType: 'Memory Token',
    status: 'Ready for Playtest',
    properties: {
      actFocus: 'Act 2',
      themes: ['Betrayal', 'Secrets'],
      memorySets: ['Victoria Memories']
    },
    calculated_memory_value: 5000
  }
];

const api = {
  getCharacters: jest.fn(() => Promise.resolve({
    success: true,
    data: mockCharacters
  })),
  
  getElements: jest.fn(() => Promise.resolve({
    success: true,
    data: mockElements
  })),
  
  getCharacterById: jest.fn((id) => Promise.resolve({
    success: true,
    data: mockCharacters.find(char => char.id === id)
  })),
  
  getTimelineEvents: jest.fn(() => Promise.resolve({
    success: true,
    data: []
  })),
  
  getPuzzles: jest.fn(() => Promise.resolve({
    success: true,
    data: []
  })),
  
  getGameConstants: jest.fn(() => Promise.resolve({
    success: true,
    data: {}
  }))
};

export default api;