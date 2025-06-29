import { http } from 'msw';
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
  http.get('/api/characters', () => {
    return new Response(JSON.stringify([{ id: 'char1', name: 'Mock Character 1' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  http.get('/api/elements', () => {
    return new Response(JSON.stringify([{ id: 'elem1', name: 'Mock Element 1' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  http.get('/api/puzzles', () => {
    return new Response(JSON.stringify([{ id: 'puzz1', name: 'Mock Puzzle 1' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  http.get('/api/timeline', () => {
    return new Response(JSON.stringify([{ id: 'time1', name: 'Mock Timeline 1' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // Specific ID endpoints (can be expanded)
  http.get('/api/characters/:id', ({ params }) => {
    const { id } = params;
    return new Response(JSON.stringify({ id, name: `Mock Character ${id}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  // ... other /api/:entity/:id endpoints

  // Graph Data Endpoints
  http.get('/api/characters/:id/graph', ({ params }) => {
    const { id } = params;
    if (id === DETAILED_MOCK_CHARACTER_GRAPH_DATA.center.id) {
      return new Response(JSON.stringify(DETAILED_MOCK_CHARACTER_GRAPH_DATA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (id === 'char-notfound') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Fallback for other character IDs
    return new Response(JSON.stringify(mockGenericCharacterGraph(id)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get('/api/elements/:id/graph', ({ params }) => {
    const { id } = params;
    if (id === DETAILED_MOCK_ELEMENT_GRAPH_DATA.center.id) {
      return new Response(JSON.stringify(DETAILED_MOCK_ELEMENT_GRAPH_DATA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (id === 'elem-notfound') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Fallback for other element IDs
    return new Response(JSON.stringify(mockGenericElementGraph(id)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get('/api/puzzles/:id/graph', ({ params }) => {
    const { id } = params;
    if (id === DETAILED_MOCK_PUZZLE_GRAPH_DATA.center.id) {
      return new Response(JSON.stringify(DETAILED_MOCK_PUZZLE_GRAPH_DATA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (id === 'puzz-notfound') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Fallback for other puzzle IDs
    return new Response(JSON.stringify(mockGenericPuzzleGraph(id)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get('/api/timeline/:id/graph', ({ params }) => {
    const { id } = params;
    if (id === DETAILED_MOCK_TIMELINE_GRAPH_DATA.center.id) {
      return new Response(JSON.stringify(DETAILED_MOCK_TIMELINE_GRAPH_DATA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (id === 'time-notfound') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Fallback for other timeline IDs
    return new Response(JSON.stringify(mockGenericTimelineGraph(id)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
  
  // Mock for /api/metadata endpoint
  http.get('/api/metadata', () => {
    return new Response(JSON.stringify({ /* mock metadata object */ }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // Mock for /api/cache/clear endpoint
  http.post('/api/cache/clear', () => {
    return new Response(JSON.stringify({ message: 'Cache cleared (mocked)' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // Mock for /search endpoint
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    // Return some generic search results based on the query or fixed data
    return new Response(JSON.stringify({ 
        characters: [{id: 'char-search', name: `Search result for ${query} in Characters`}],
        elements: [],
        puzzles: [],
        timeline: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
]; 