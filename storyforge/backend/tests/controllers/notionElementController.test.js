const request = require('supertest');
const express = require('express');
const notionElementController = require('../../src/controllers/notionElementController');
const notionService = require('../../src/services/notionService');
const memoryElementService = require('../../src/services/memoryElementService');
const warningService = require('../../src/services/warningService');
const propertyMapper = require('../../src/utils/notionPropertyMapper');

// Mock dependencies
jest.mock('../../src/services/notionService', () => ({
  notionCache: {
    get: jest.fn(),
    set: jest.fn()
  },
  makeCacheKey: jest.fn(),
  getElements: jest.fn(),
  getPage: jest.fn()
}));
jest.mock('../../src/services/memoryElementService');
jest.mock('../../src/services/warningService');
jest.mock('../../src/utils/notionPropertyMapper');

describe('NotionElementController', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add routes directly for testing - order matters!
    app.get('/elements', notionElementController.getElements);
    app.get('/elements/with-warnings', notionElementController.getElementsWithWarnings);
    app.get('/elements/:id', notionElementController.getElementById);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /elements', () => {
    it('should return memory elements when filterGroup=memoryTypes', async () => {
      const mockMemoryElements = [
        { 
          id: '1', 
          name: 'Memory Token',
          type: 'Memory Token Video',
          sf_value_rating: 3,
          finalCalculatedValue: 300
        }
      ];
      
      memoryElementService.getMemoryElements.mockReturnValue(mockMemoryElements);
      
      const response = await request(app)
        .get('/elements?filterGroup=memoryTypes')
        .expect(200);
      
      expect(response.body).toEqual(mockMemoryElements);
      expect(memoryElementService.getMemoryElements).toHaveBeenCalled();
    });

    it('should return regular elements from Notion API', async () => {
      const mockNotionElements = [
        { id: '1', properties: { Name: { title: [{ text: { content: 'Test Element' } }] } } }
      ];
      const mockMappedElements = [
        { id: '1', name: 'Test Element', basicType: 'Physical' }
      ];
      
      notionService.getElements.mockResolvedValue(mockNotionElements);
      propertyMapper.mapElementWithNames.mockResolvedValue(mockMappedElements[0]);
      
      const response = await request(app)
        .get('/elements')
        .expect(200);
      
      expect(response.body).toEqual(mockMappedElements);
      expect(notionService.getElements).toHaveBeenCalledWith(undefined);
    });

    it('should apply filters to Notion API calls', async () => {
      notionService.getElements.mockResolvedValue([]);
      propertyMapper.mapElementWithNames.mockResolvedValue([]);
      
      await request(app)
        .get('/elements?basicType=Memory&status=Active')
        .expect(200);
      
      expect(notionService.getElements).toHaveBeenCalledWith({
        and: [
          { property: 'Basic Type', select: { equals: 'Memory' } },
          { property: 'Status', select: { equals: 'Active' } }
        ]
      });
    });
  });

  describe('GET /elements/:id', () => {
    it('should return an element by ID', async () => {
      const mockElement = { 
        id: '123', 
        properties: { Name: { title: [{ text: { content: 'Test Element' } }] } }
      };
      const mockMappedElement = { 
        id: '123', 
        name: 'Test Element',
        basicType: 'Physical'
      };
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('element-123');
      notionService.getPage.mockResolvedValue(mockElement);
      propertyMapper.mapElementWithNames.mockResolvedValue(mockMappedElement);
      
      const response = await request(app)
        .get('/elements/123')
        .expect(200);
      
      expect(response.body).toEqual(mockMappedElement);
      expect(notionService.getPage).toHaveBeenCalledWith('123');
    });

    it('should return 404 if element not found', async () => {
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('element-456');
      notionService.getPage.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/elements/456')
        .expect(404);
      
      expect(response.body).toEqual({ error: 'Element not found' });
    });
  });

  describe('GET /elements/with-warnings', () => {
    it('should return elements with warnings', async () => {
      const mockWarnings = [
        {
          id: '1',
          name: 'Unused Element',
          type: 'Element',
          basicType: 'Physical',
          warnings: [{ 
            warningType: 'NotUsedInOrRewardingPuzzles', 
            message: 'Element is not used as an input for any puzzle and is not a reward from any puzzle.' 
          }]
        }
      ];
      
      notionService.notionCache.get.mockReturnValue(null);
      notionService.makeCacheKey.mockReturnValue('elements-warnings');
      warningService.getElementWarnings.mockResolvedValue(mockWarnings);
      
      const response = await request(app)
        .get('/elements/with-warnings')
        .expect(200);
      
      expect(response.body).toEqual(mockWarnings);
      expect(warningService.getElementWarnings).toHaveBeenCalled();
    });
  });
});