import { rest } from 'msw';
import {
  DETAILED_MOCK_CHARACTER_GRAPH_DATA,
  DETAILED_MOCK_ELEMENT_GRAPH_DATA,
  DETAILED_MOCK_PUZZLE_GRAPH_DATA,
  DETAILED_MOCK_TIMELINE_GRAPH_DATA
} from '../components/RelationshipMapper/__mocks__/graphData.mock.js';

// Mock data - this would ideally import more structured mock graphData objects
// For now, a simple placeholder.
const mockCharacterGraph = (id) => ({
  center: { id, name: `Character ${id}`, type: 'Character', tier: 'Core', role: 'Player', primaryActionSnippet: 'Test Action' },
  nodes: [{ id, name: `Character ${id}`, type: 'Character', tier: 'Core', role: 'Player', primaryActionSnippet: 'Test Action' }],
  edges: [],
});

const mockElementGraph = (id) => ({
    center: { id, name: `Element ${id}`, type: 'Element', basicType: 'Prop', status: 'Done', flowSummary: 'Test Flow' },
    nodes: [{ id, name: `Element ${id}`, type: 'Element', basicType: 'Prop', status: 'Done', flowSummary: 'Test Flow' }],
    edges: [],
  });

const mockPuzzleGraph = (id) => ({
    center: { id, name: `Puzzle ${id}`, type: 'Puzzle', timing: 'Act 1', statusSummary: 'Test Status', storyRevealSnippet: 'Test Reveal' },
    nodes: [{ id, name: `Puzzle ${id}`, type: 'Puzzle', timing: 'Act 1', statusSummary: 'Test Status', storyRevealSnippet: 'Test Reveal' }],
    edges: [],
  });

const mockTimelineGraph = (id) => ({
    center: { id, name: `Timeline ${id}`, type: 'Timeline', dateString: '2023-01-01', participantSummary: 'Test Participants', notesSnippet: 'Test Notes' },
    nodes: [{ id, name: `Timeline ${id}`, type: 'Timeline', dateString: '2023-01-01', participantSummary: 'Test Participants', notesSnippet: 'Test Notes' }],
    edges: [],
  });

// Simple placeholder mock functions (can be used as fallbacks or for generic IDs)
const mockGenericCharacterGraph = (id) => ({
  center: { id, name: `Generic Character ${id}`, type: 'Character', tier: 'Core', role: 'Player', primaryActionSnippet: 'Generic Action' },
  nodes: [{ id, name: `Generic Character ${id}`, type: 'Character', tier: 'Core', role: 'Player', primaryActionSnippet: 'Generic Action' }],
  edges: [],
});

const mockGenericElementGraph = (id) => ({
    center: { id, name: `Generic Element ${id}`, type: 'Element', basicType: 'Prop', status: 'Done', flowSummary: 'Generic Flow' },
    nodes: [{ id, name: `Generic Element ${id}`, type: 'Element', basicType: 'Prop', status: 'Done', flowSummary: 'Generic Flow' }],
    edges: [],
  });

const mockGenericPuzzleGraph = (id) => ({
    center: { id, name: `Generic Puzzle ${id}`, type: 'Puzzle', timing: 'Act 1', statusSummary: 'Generic Status', storyRevealSnippet: 'Generic Reveal' },
    nodes: [{ id, name: `Generic Puzzle ${id}`, type: 'Puzzle', timing: 'Act 1', statusSummary: 'Generic Status', storyRevealSnippet: 'Generic Reveal' }],
    edges: [],
  });

const mockGenericTimelineGraph = (id) => ({
    center: { id, name: `Generic Timeline ${id}`, type: 'Timeline', dateString: '2023-01-01', participantSummary: 'Generic Participants', notesSnippet: 'Generic Notes' },
    nodes: [{ id, name: `Generic Timeline ${id}`, type: 'Timeline', dateString: '2023-01-01', participantSummary: 'Generic Participants', notesSnippet: 'Generic Notes' }],
    edges: [],
  });

export const handlers = [
  // Generic list endpoints (can be expanded with mock data)
  rest.get('/api/characters', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([{ id: 'char1', name: 'Mock Character 1' }]));
  }),
  rest.get('/api/elements', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([{ id: 'elem1', name: 'Mock Element 1' }]));
  }),
  rest.get('/api/puzzles', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([{ id: 'puzz1', name: 'Mock Puzzle 1' }]));
  }),
  rest.get('/api/timeline', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([{ id: 'time1', name: 'Mock Timeline 1' }]));
  }),

  // Specific ID endpoints (can be expanded)
  rest.get('/api/characters/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.status(200), ctx.json({ id, name: `Mock Character ${id}` }));
  }),
  // ... other /api/:entity/:id endpoints

  // Graph Data Endpoints
  rest.get('/api/characters/:id/graph', (req, res, ctx) => {
    const { id } = req.params;
    if (id === DETAILED_MOCK_CHARACTER_GRAPH_DATA.center.id) {
      return res(ctx.status(200), ctx.json(DETAILED_MOCK_CHARACTER_GRAPH_DATA));
    }
    if (id === 'char-notfound') {
        return res(ctx.status(404), ctx.json({ error: 'Not found' }));
    }
    // Fallback for other character IDs
    return res(ctx.status(200), ctx.json(mockGenericCharacterGraph(id)));
  }),

  rest.get('/api/elements/:id/graph', (req, res, ctx) => {
    const { id } = req.params;
    if (id === DETAILED_MOCK_ELEMENT_GRAPH_DATA.center.id) {
      return res(ctx.status(200), ctx.json(DETAILED_MOCK_ELEMENT_GRAPH_DATA));
    }
    if (id === 'elem-notfound') {
        return res(ctx.status(404), ctx.json({ error: 'Not found' }));
    }
    // Fallback for other element IDs
    return res(ctx.status(200), ctx.json(mockGenericElementGraph(id)));
  }),

  rest.get('/api/puzzles/:id/graph', (req, res, ctx) => {
    const { id } = req.params;
    if (id === DETAILED_MOCK_PUZZLE_GRAPH_DATA.center.id) {
      return res(ctx.status(200), ctx.json(DETAILED_MOCK_PUZZLE_GRAPH_DATA));
    }
    if (id === 'puzz-notfound') {
        return res(ctx.status(404), ctx.json({ error: 'Not found' }));
    }
    // Fallback for other puzzle IDs
    return res(ctx.status(200), ctx.json(mockGenericPuzzleGraph(id)));
  }),

  rest.get('/api/timeline/:id/graph', (req, res, ctx) => {
    const { id } = req.params;
    if (id === DETAILED_MOCK_TIMELINE_GRAPH_DATA.center.id) {
      return res(ctx.status(200), ctx.json(DETAILED_MOCK_TIMELINE_GRAPH_DATA));
    }
    if (id === 'time-notfound') {
        return res(ctx.status(404), ctx.json({ error: 'Not found' }));
    }
    // Fallback for other timeline IDs
    return res(ctx.status(200), ctx.json(mockGenericTimelineGraph(id)));
  }),
  
  // Mock for /api/metadata endpoint
  rest.get('/api/metadata', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ /* mock metadata object */ }));
  }),

  // Mock for /api/cache/clear endpoint
  rest.post('/api/cache/clear', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Cache cleared (mocked)' }));
  }),

  // Mock for /search endpoint
  rest.get('/api/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    // Return some generic search results based on the query or fixed data
    return res(ctx.status(200), ctx.json({ 
        characters: [{id: 'char-search', name: `Search result for ${query} in Characters`}],
        elements: [],
        puzzles: [],
        timeline: []
    }));
  }),
]; 