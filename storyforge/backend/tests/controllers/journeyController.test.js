const {
    getCharacterJourney,
    getCharacterGaps,
    getAllGaps,
} = require('../../src/controllers/journeyController');
const journeyEngine = require('../../src/services/journey/journeyEngine');
const dbQueries = require('../../src/db/queries');

jest.mock('../../src/services/journey/journeyEngine');
jest.mock('../../src/db/queries');

describe('Journey Controller', () => {
    let mockReq;
    let mockRes;
    let next;
    let mockEngineInstance;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup mock request
        mockReq = {
            params: { characterId: 'test-character-id' }
        };
        
        // Setup mock response
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        
        // Setup mock next function
        next = jest.fn();
        
        // Setup mock journey engine instance
        mockEngineInstance = {
            buildCharacterJourney: jest.fn()
        };
        journeyEngine.getInstance = jest.fn().mockReturnValue(mockEngineInstance);
        
        // Setup mock data
        const mockJourney = {
            character_info: {
                id: 'test-character-id',
                name: 'Test Character'
            },
            timeline: [],
            gaps: []
        };
        
        const mockGaps = [
            { id: 'gap1', description: 'Test Gap' }
        ];
        
        // Setup mock implementations
        mockEngineInstance.buildCharacterJourney.mockResolvedValue(mockJourney);
        dbQueries.getAllCharacterIdsAndNames.mockResolvedValue([
            { id: 'test-character-id', name: 'Test Character' },
            { id: 'char2', name: 'Another Character' }
        ]);
    });

    describe('getCharacterJourney', () => {
        it('should return a journey object for a valid characterId', async () => {
            const characterId = 'test-character-id';
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
            const characterId = 'test-character-id';
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
            const mockCharacters = [{ id: 'test-character-id', name: 'Test Character' }, { id: 'char2', name: 'Another Character' }];
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
                { ...mockJourney1.gaps[0], characterId: 'test-character-id', characterName: 'Test Character' },
                { ...mockJourney2.gaps[0], characterId: 'char2', characterName: 'Another Character' }
            ];
            expect(mockRes.json).toHaveBeenCalledWith(expectedGaps);
        });
    });
}); 