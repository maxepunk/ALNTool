import { fetchCharacterGraphData, fetchElementGraphData, fetchPuzzleGraphData, fetchTimelineGraphData, fetchCharacters, fetchElements, fetchPuzzles, fetchTimelineEvents, fetchEntityById, searchAll } from './api';

// Mock the global fetch function
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  // Test suite for fetchCharacterGraphData
  describe('fetchCharacterGraphData', () => {
    it('should fetch character graph data successfully', async () => {
      const mockId = 'char-alex-reeves';
      const mockGraphData = { center: { id: mockId, name: 'Alex Reeves' }, nodes: [], edges: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphData,
      });

      const data = await fetchCharacterGraphData(mockId);
      expect(fetch).toHaveBeenCalledWith(`/api/characters/${mockId}/graph`);
      expect(data).toEqual(mockGraphData);
    });

    it('should throw an error if fetchCharacterGraphData fails', async () => {
      const mockId = 'char-unknown';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not Found' }),
      });

      await expect(fetchCharacterGraphData(mockId)).rejects.toThrow('Failed to fetch character graph data for char-unknown: 404');
    });
  });

  // Test suite for fetchElementGraphData
  describe('fetchElementGraphData', () => {
    it('should fetch element graph data successfully', async () => {
      const mockId = 'elem-secure-briefcase';
      const mockGraphData = { center: { id: mockId, name: 'Secure Briefcase' }, nodes: [], edges: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphData,
      });
      const data = await fetchElementGraphData(mockId);
      expect(fetch).toHaveBeenCalledWith(`/api/elements/${mockId}/graph`);
      expect(data).toEqual(mockGraphData);
    });

    it('should throw an error if fetchElementGraphData fails', async () => {
      const mockId = 'elem-unknown';
       fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server Error' }),
      });
      await expect(fetchElementGraphData(mockId)).rejects.toThrow('Failed to fetch element graph data for elem-unknown: 500');
    });
  });

  // Test suite for fetchPuzzleGraphData
  describe('fetchPuzzleGraphData', () => {
    it('should fetch puzzle graph data successfully', async () => {
      const mockId = 'puzzle-data-heist';
      const mockGraphData = { center: { id: mockId, name: 'Data Heist' }, nodes: [], edges: [] };
       fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphData,
      });
      const data = await fetchPuzzleGraphData(mockId);
      expect(fetch).toHaveBeenCalledWith(`/api/puzzles/${mockId}/graph`);
      expect(data).toEqual(mockGraphData);
    });
    
    it('should throw an error if fetchPuzzleGraphData fails', async () => {
      const mockId = 'puzzle-unknown';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });
      await expect(fetchPuzzleGraphData(mockId)).rejects.toThrow('Failed to fetch puzzle graph data for puzzle-unknown: 403');
    });
  });

  // Test suite for fetchTimelineGraphData
  describe('fetchTimelineGraphData', () => {
     it('should fetch timeline graph data successfully', async () => {
      const mockId = 'event-ceo-speech';
      const mockGraphData = { center: { id: mockId, name: 'CEO Speech' }, nodes: [], edges: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphData,
      });
      const data = await fetchTimelineGraphData(mockId);
      expect(fetch).toHaveBeenCalledWith(`/api/timeline/${mockId}/graph`);
      expect(data).toEqual(mockGraphData);
    });

    it('should throw an error if fetchTimelineGraphData fails', async () => {
      const mockId = 'timeline-unknown';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad Request' }),
      });
      await expect(fetchTimelineGraphData(mockId)).rejects.toThrow('Failed to fetch timeline graph data for timeline-unknown: 400');
    });
  });

  // Test suite for fetchCharacters
  describe('fetchCharacters', () => {
    it('should fetch characters list successfully', async () => {
      const mockCharacters = [{ id: 'char1', name: 'Character 1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCharacters,
      });
      const data = await fetchCharacters();
      expect(fetch).toHaveBeenCalledWith('/api/characters');
      expect(data).toEqual(mockCharacters);
    });

    it('should throw an error if fetchCharacters fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      await expect(fetchCharacters()).rejects.toThrow('Failed to fetch characters: 500');
    });
  });
  
  // Test suite for fetchElements
  describe('fetchElements', () => {
    it('should fetch elements list successfully', async () => {
      const mockElements = [{ id: 'elem1', name: 'Element 1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockElements,
      });
      const data = await fetchElements();
      expect(fetch).toHaveBeenCalledWith('/api/elements');
      expect(data).toEqual(mockElements);
    });

    it('should throw an error if fetchElements fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      await expect(fetchElements()).rejects.toThrow('Failed to fetch elements: 500');
    });
  });

  // Test suite for fetchPuzzles
  describe('fetchPuzzles', () => {
    it('should fetch puzzles list successfully', async () => {
      const mockPuzzles = [{ id: 'puzz1', name: 'Puzzle 1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPuzzles,
      });
      const data = await fetchPuzzles();
      expect(fetch).toHaveBeenCalledWith('/api/puzzles');
      expect(data).toEqual(mockPuzzles);
    });
    
    it('should throw an error if fetchPuzzles fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      await expect(fetchPuzzles()).rejects.toThrow('Failed to fetch puzzles: 500');
    });
  });

  // Test suite for fetchTimelineEvents
  describe('fetchTimelineEvents', () => {
    it('should fetch timeline events list successfully', async () => {
      const mockTimelineEvents = [{ id: 'time1', name: 'Timeline Event 1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimelineEvents,
      });
      const data = await fetchTimelineEvents();
      expect(fetch).toHaveBeenCalledWith('/api/timeline');
      expect(data).toEqual(mockTimelineEvents);
    });

    it('should throw an error if fetchTimelineEvents fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      await expect(fetchTimelineEvents()).rejects.toThrow('Failed to fetch timeline events: 500');
    });
  });

  // Test suite for fetchEntityById
  describe('fetchEntityById', () => {
    it('should fetch entity by ID successfully', async () => {
      const mockEntityType = 'characters';
      const mockId = 'char1';
      const mockEntity = { id: mockId, name: 'Character 1' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntity,
      });
      const data = await fetchEntityById(mockEntityType, mockId);
      expect(fetch).toHaveBeenCalledWith(`/api/${mockEntityType}/${mockId}`);
      expect(data).toEqual(mockEntity);
    });

    it('should throw an error if fetchEntityById fails', async () => {
      const mockEntityType = 'elements';
      const mockId = 'elem-unknown';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      await expect(fetchEntityById(mockEntityType, mockId)).rejects.toThrow('Failed to fetch elements with id elem-unknown: 404');
    });
  });

  // Test suite for searchAll
  describe('searchAll', () => {
    it('should search all entities successfully', async () => {
      const mockQuery = 'testQuery';
      const mockSearchResults = { characters: [], elements: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      });
      const data = await searchAll(mockQuery);
      expect(fetch).toHaveBeenCalledWith(`/api/search?q=${mockQuery}`);
      expect(data).toEqual(mockSearchResults);
    });

    it('should throw an error if searchAll fails', async () => {
      const mockQuery = 'anotherQuery';
       fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      await expect(searchAll(mockQuery)).rejects.toThrow('Search failed: 500');
    });
  });

  // Add more tests for other API functions (e.g., create, update, delete if they exist)
  // and for different scenarios (e.g., network errors)
}); 