const notionController = require('../../src/controllers/notionController');
const notionService = require('../../src/services/notionService');
const propertyMapper = require('../../src/utils/notionPropertyMapper');

// Mock dependencies
jest.mock('../../src/services/notionService');
jest.mock('../../src/utils/notionPropertyMapper');

describe('Notion Controller', () => {
    let mockReq;
    let mockRes;
    let next;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup mock request
        mockReq = {
            query: {}
        };
        
        // Setup mock response
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        
        // Setup mock next function
        next = jest.fn();
        
        // Setup mock data
        const mockRawData = [{
            id: 'test-id',
            properties: {
                Name: { title: [{ text: { content: 'Test' } }] }
            }
        }];
        
        const mockMappedData = [{
            id: 'test-id',
            name: 'Test'
        }];
        
        // Setup mock implementations
        notionService.getCharacters.mockResolvedValue(mockRawData);
        notionService.getElements.mockResolvedValue(mockRawData);
        notionService.getPuzzles.mockResolvedValue(mockRawData);
        notionService.getTimelineEvents.mockResolvedValue(mockRawData);
        
        propertyMapper.mapCharacterWithNames.mockReturnValue(mockMappedData[0]);
        propertyMapper.mapElementWithNames.mockReturnValue(mockMappedData[0]);
        propertyMapper.mapPuzzleWithNames.mockReturnValue(mockMappedData[0]);
        propertyMapper.mapTimelineEventWithNames.mockReturnValue(mockMappedData[0]);
    });

    describe('getCharacters', () => {
        it('should fetch, map, and return all characters', async () => {
            await notionController.getCharacters(mockReq, mockRes, next);

            expect(notionService.getCharacters).toHaveBeenCalled();
            expect(propertyMapper.mapCharacterWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });

    describe('getElements', () => {
        it('should fetch, map, and return all elements', async () => {
            await notionController.getElements(mockReq, mockRes, next);

            expect(notionService.getElements).toHaveBeenCalled();
            expect(propertyMapper.mapElementWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });

    describe('getPuzzles', () => {
        it('should fetch, map, and return all puzzles', async () => {
            await notionController.getPuzzles(mockReq, mockRes, next);

            expect(notionService.getPuzzles).toHaveBeenCalled();
            expect(propertyMapper.mapPuzzleWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });

    describe('getTimelineEvents', () => {
        it('should fetch, map, and return all timeline events', async () => {
            await notionController.getTimelineEvents(mockReq, mockRes, next);

            expect(notionService.getTimelineEvents).toHaveBeenCalled();
            expect(propertyMapper.mapTimelineEventWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });
}); 