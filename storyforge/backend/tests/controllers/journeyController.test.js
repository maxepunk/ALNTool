const {
    getCharacterJourney,
    getCharacterGaps,
    getAllGaps,
} = require('../../src/controllers/journeyController');
const JourneyEngine = require('../../src/services/journeyEngine');
const dbQueries = require('../../src/db/queries');

jest.mock('../../src/services/journeyEngine');
jest.mock('../../src/db/queries');

describe('Journey Controller', () => {
    let mockReq, mockRes, next;
    let mockEngineInstance;

    beforeEach(() => {
        mockReq = { params: {}, query: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        
        // Setup the mock engine instance
        mockEngineInstance = {
            buildCharacterJourney: jest.fn(),
        };
        JourneyEngine.mockImplementation(() => mockEngineInstance);
        
        jest.clearAllMocks();
    });

    describe('getCharacterJourney', () => {
        it('should return a journey object for a valid characterId', async () => {
            const characterId = 'char1';
            mockReq.params.characterId = characterId;
            const mockJourney = { character_id: characterId, segments: [], gaps: [] };

            mockEngineInstance.buildCharacterJourney.mockResolvedValue(mockJourney);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(mockEngineInstance.buildCharacterJourney).toHaveBeenCalledWith(characterId);
            expect(mockRes.json).toHaveBeenCalledWith(mockJourney);
        });
    });

    describe('getCharacterGaps', () => {
        it('should return only the gaps array for a valid characterId', async () => {
            const characterId = 'char1';
            mockReq.params.characterId = characterId;
            const mockGaps = [{ start_minute: 10, end_minute: 15, severity: 'low' }];
            const mockJourney = { gaps: mockGaps };

            mockEngineInstance.buildCharacterJourney.mockResolvedValue(mockJourney);

            await getCharacterGaps(mockReq, mockRes, next);

            expect(mockEngineInstance.buildCharacterJourney).toHaveBeenCalledWith(characterId);
            expect(mockRes.json).toHaveBeenCalledWith(mockGaps);
        });
    });

    describe('getAllGaps', () => {
        it('should return a collection of all gaps from all characters', async () => {
            const mockCharacters = [{ id: 'char1', name: 'Character 1' }, { id: 'char2', name: 'Character 2' }];
            dbQueries.getAllCharacterIdsAndNames = jest.fn().mockResolvedValue(mockCharacters);

            const mockJourney1 = { gaps: [{ id: 'gap1' }] };
            const mockJourney2 = { gaps: [{ id: 'gap2' }] };
            
            mockEngineInstance.buildCharacterJourney
                .mockResolvedValueOnce(mockJourney1)
                .mockResolvedValueOnce(mockJourney2);

            await getAllGaps(mockReq, mockRes, next);

            expect(dbQueries.getAllCharacterIdsAndNames).toHaveBeenCalledTimes(1);
            expect(mockEngineInstance.buildCharacterJourney).toHaveBeenCalledTimes(2);
            
            // Check that the response includes gaps with character info
            const expectedGaps = [
                { ...mockJourney1.gaps[0], characterId: 'char1', characterName: 'Character 1' },
                { ...mockJourney2.gaps[0], characterId: 'char2', characterName: 'Character 2' }
            ];
            expect(mockRes.json).toHaveBeenCalledWith(expectedGaps);
        });
    });
}); 