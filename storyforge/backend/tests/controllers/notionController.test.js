const notionController = require('../../src/controllers/notionController');
const notionService = require('../../src/services/notionService');
const propertyMapper = require('../../src/utils/notionPropertyMapper');

jest.mock('../../src/services/notionService');
jest.mock('../../src/utils/notionPropertyMapper');

describe('Notion Controller', () => {
    let mockReq, mockRes, next;

    beforeEach(() => {
        mockReq = { params: {}, query: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            set: jest.fn(),
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getCharacters', () => {
        it('should fetch, map, and return all characters', async () => {
            const mockRawData = [{ id: '1' }];
            const mockMappedData = [{ id: '1', mapped: true }];
            notionService.getCharacters.mockResolvedValue(mockRawData);
            propertyMapper.mapCharacterWithNames.mockResolvedValue(mockMappedData[0]);

            await notionController.getCharacters(mockReq, mockRes, next);

            expect(notionService.getCharacters).toHaveBeenCalled();
            expect(propertyMapper.mapCharacterWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });

    describe('getElements', () => {
        it('should fetch, map, and return all elements', async () => {
            const mockRawData = [{ id: '1' }];
            const mockMappedData = [{ id: '1', mapped: true }];
            notionService.getElements.mockResolvedValue(mockRawData);
            propertyMapper.mapElementWithNames.mockResolvedValue(mockMappedData[0]);

            await notionController.getElements(mockReq, mockRes, next);

            expect(notionService.getElements).toHaveBeenCalled();
            expect(propertyMapper.mapElementWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });

    describe('getPuzzles', () => {
        it('should fetch, map, and return all puzzles', async () => {
            const mockRawData = [{ id: '1' }];
            const mockMappedData = [{ id: '1', mapped: true }];
            notionService.getPuzzles.mockResolvedValue(mockRawData);
            propertyMapper.mapPuzzleWithNames.mockResolvedValue(mockMappedData[0]);

            await notionController.getPuzzles(mockReq, mockRes, next);

            expect(notionService.getPuzzles).toHaveBeenCalled();
            expect(propertyMapper.mapPuzzleWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });

    describe('getTimelineEvents', () => {
        it('should fetch, map, and return all timeline events', async () => {
            const mockRawData = [{ id: '1' }];
            const mockMappedData = [{ id: '1', mapped: true }];
            notionService.getTimelineEvents.mockResolvedValue(mockRawData);
            propertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockMappedData[0]);

            await notionController.getTimelineEvents(mockReq, mockRes, next);

            expect(notionService.getTimelineEvents).toHaveBeenCalled();
            expect(propertyMapper.mapTimelineEventWithNames).toHaveBeenCalledWith(mockRawData[0], notionService);
            expect(mockRes.json).toHaveBeenCalledWith(mockMappedData);
        });
    });
}); 