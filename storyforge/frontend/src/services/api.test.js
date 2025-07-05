import api from './api';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    
    // Mock axios.create to return our mock instance
    axios.create.mockReturnValue(mockAxiosInstance);
    
    // Re-import api to get fresh instance with mocked axios
    jest.resetModules();
  });

  // Test suite for getCharacterGraph
  describe('getCharacterGraph', () => {
    it('should fetch character graph data successfully', async () => {
      const mockId = 'char-alex-reeves';
      const mockGraphData = { center: { id: mockId, name: 'Alex Reeves' }, nodes: [], edges: [] };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockGraphData });

      const data = await api.getCharacterGraph(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/characters/${mockId}/graph`, { params: { depth: 2 } });
      expect(data).toEqual(mockGraphData);
    });

    it('should fetch character graph data with custom depth', async () => {
      const mockId = 'char-alex-reeves';
      const mockGraphData = { center: { id: mockId, name: 'Alex Reeves' }, nodes: [], edges: [] };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockGraphData });

      const data = await api.getCharacterGraph(mockId, 3);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/characters/${mockId}/graph`, { params: { depth: 3 } });
      expect(data).toEqual(mockGraphData);
    });
  });

  // Test suite for getElementGraph
  describe('getElementGraph', () => {
    it('should fetch element graph data successfully', async () => {
      const mockId = 'elem-secure-briefcase';
      const mockGraphData = { center: { id: mockId, name: 'Secure Briefcase' }, nodes: [], edges: [] };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockGraphData });

      const data = await api.getElementGraph(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/elements/${mockId}/graph`, { params: { depth: 2 } });
      expect(data).toEqual(mockGraphData);
    });
  });

  // Test suite for getPuzzleGraph
  describe('getPuzzleGraph', () => {
    it('should fetch puzzle graph data successfully', async () => {
      const mockId = 'puzzle-security-office';
      const mockGraphData = { center: { id: mockId, name: 'Security Office Access' }, nodes: [], edges: [] };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockGraphData });

      const data = await api.getPuzzleGraph(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/puzzles/${mockId}/graph`, { params: { depth: 2 } });
      expect(data).toEqual(mockGraphData);
    });
  });

  // Test suite for getTimelineGraph
  describe('getTimelineGraph', () => {
    it('should fetch timeline graph data successfully', async () => {
      const mockId = 'timeline-arrival';
      const mockGraphData = { center: { id: mockId, name: 'Guest Arrival' }, nodes: [], edges: [] };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockGraphData });

      const data = await api.getTimelineGraph(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/timeline/${mockId}/graph`, { params: { depth: 2 } });
      expect(data).toEqual(mockGraphData);
    });
  });

  // Test suite for getCharacters
  describe('getCharacters', () => {
    it('should fetch characters successfully', async () => {
      const mockCharacters = [
        { id: 'char-alex-reeves', name: 'Alex Reeves' },
        { id: 'char-jordan-hayes', name: 'Jordan Hayes' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCharacters });

      const data = await api.getCharacters();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/characters', { params: {} });
      expect(data).toEqual(mockCharacters);
    });

    it('should fetch characters with filters', async () => {
      const mockCharacters = [{ id: 'char-alex-reeves', name: 'Alex Reeves' }];
      const filters = { category: 'guest' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCharacters });

      const data = await api.getCharacters(filters);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/characters', { params: filters });
      expect(data).toEqual(mockCharacters);
    });
  });

  // Test suite for getElements
  describe('getElements', () => {
    it('should fetch elements successfully', async () => {
      const mockElements = [
        { id: 'elem-secure-briefcase', name: 'Secure Briefcase' },
        { id: 'elem-mansion-key', name: 'Mansion Key' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockElements });

      const data = await api.getElements();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/elements', { params: {} });
      expect(data).toEqual(mockElements);
    });
  });

  // Test suite for getPuzzles
  describe('getPuzzles', () => {
    it('should fetch puzzles successfully', async () => {
      const mockPuzzles = [
        { id: 'puzzle-security-office', name: 'Security Office Access' },
        { id: 'puzzle-safe-combination', name: 'Safe Combination' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockPuzzles });

      const data = await api.getPuzzles();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/puzzles', { params: {} });
      expect(data).toEqual(mockPuzzles);
    });
  });

  // Test suite for getTimelineEvents
  describe('getTimelineEvents', () => {
    it('should fetch timeline events successfully', async () => {
      const mockEvents = [
        { id: 'timeline-arrival', name: 'Guest Arrival' },
        { id: 'timeline-discovery', name: 'Body Discovery' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockEvents });

      const data = await api.getTimelineEvents();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/timeline', { params: {} });
      expect(data).toEqual(mockEvents);
    });
  });

  // Test suite for entity by ID methods
  describe('Entity by ID methods', () => {
    it('should fetch character by ID successfully', async () => {
      const mockId = 'char-alex-reeves';
      const mockCharacter = { id: mockId, name: 'Alex Reeves' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCharacter });

      const data = await api.getCharacterById(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/characters/${mockId}`);
      expect(data).toEqual(mockCharacter);
    });

    it('should fetch element by ID successfully', async () => {
      const mockId = 'elem-secure-briefcase';
      const mockElement = { id: mockId, name: 'Secure Briefcase' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockElement });

      const data = await api.getElementById(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/elements/${mockId}`);
      expect(data).toEqual(mockElement);
    });

    it('should fetch puzzle by ID successfully', async () => {
      const mockId = 'puzzle-security-office';
      const mockPuzzle = { id: mockId, name: 'Security Office Access' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockPuzzle });

      const data = await api.getPuzzleById(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/puzzles/${mockId}`);
      expect(data).toEqual(mockPuzzle);
    });

    it('should fetch timeline event by ID successfully', async () => {
      const mockId = 'timeline-arrival';
      const mockEvent = { id: mockId, name: 'Guest Arrival' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockEvent });

      const data = await api.getTimelineEventById(mockId);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/timeline/${mockId}`);
      expect(data).toEqual(mockEvent);
    });
  });

  // Test suite for globalSearch
  describe('globalSearch', () => {
    it('should perform global search successfully', async () => {
      const query = 'briefcase';
      const mockResults = {
        characters: [],
        elements: [{ id: 'elem-secure-briefcase', name: 'Secure Briefcase' }],
        puzzles: [],
        timeline: []
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResults });

      const data = await api.globalSearch(query);
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/search', { params: { q: query } });
      expect(data).toEqual(mockResults);
    });
  });

  // Test suite for new endpoints
  describe('New endpoints', () => {
    it('should clear cache successfully', async () => {
      const mockResponse = { message: 'Cache cleared successfully' };
      
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const data = await api.clearCache();
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/cache/clear');
      expect(data).toEqual(mockResponse);
    });

    it('should cancel sync successfully', async () => {
      const mockResponse = { message: 'Sync cancelled' };
      
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const data = await api.cancelSync();
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sync/cancel');
      expect(data).toEqual(mockResponse);
    });

    it('should get game constants successfully', async () => {
      const mockConstants = { 
        MAX_MEMORY_VALUE: 3,
        ACT_MULTIPLIERS: { 1: 1, 2: 2, 3: 3 }
      };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockConstants });

      const data = await api.getGameConstants();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/game-constants');
      expect(data).toEqual(mockConstants);
    });
  });
});