// Mock the JourneyEngine constructor BEFORE requiring the controller
jest.mock('../../src/services/journeyEngine', () => {
    return jest.fn().mockImplementation(() => ({
        buildCharacterJourney: jest.fn()
    }));
});

jest.mock('../../src/db/queries');

// Now require the controller after mocks are set up
const {
    getCharacterJourney,
    getCharacterGaps,
    getAllGaps,
    getSyncStatus,
    getGapSuggestions,
    resolveGap
} = require('../../src/controllers/journeyController');
const { getSyncStatus: getDbSyncStatus } = require('../../src/db/queries');
const JourneyEngine = require('../../src/services/journeyEngine');

// Get the mocked instance that was created when the controller loaded
const journeyEngineInstance = JourneyEngine.mock.results[0].value;

describe('Journey Controller', () => {
    let mockReq;
    let mockRes;
    let next;

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
    });

    describe('getCharacterJourney', () => {
        it('should return a journey object for a valid characterId', async () => {
            const characterId = 'test-character-id';
            mockReq.params.characterId = characterId;
            const mockJourney = { 
                character_id: characterId, 
                nodes: [
                    { id: 'node1', type: 'activityNode' },
                    { id: 'node2', type: 'discoveryNode' }
                ],
                edges: [
                    { source: 'node1', target: 'node2' }
                ]
            };

            journeyEngineInstance.buildCharacterJourney.mockResolvedValue(mockJourney);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).toHaveBeenCalledWith(characterId);
            expect(mockRes.json).toHaveBeenCalledWith(mockJourney);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 404 when character is not found', async () => {
            const characterId = 'non-existent-id';
            mockReq.params.characterId = characterId;

            journeyEngineInstance.buildCharacterJourney.mockResolvedValue(null);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).toHaveBeenCalledWith(characterId);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Character not found' });
        });

        it('should handle errors and return 500 status', async () => {
            const characterId = 'test-character-id';
            mockReq.params.characterId = characterId;
            const error = new Error('Database connection failed');

            journeyEngineInstance.buildCharacterJourney.mockRejectedValue(error);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).toHaveBeenCalledWith(characterId);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch character journey' });
        });

        it('should handle missing characterId parameter', async () => {
            mockReq.params = {};
            
            // When characterId is undefined, it may throw an error
            journeyEngineInstance.buildCharacterJourney.mockRejectedValue(new Error('Invalid character ID'));

            await getCharacterJourney(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).toHaveBeenCalledWith(undefined);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch character journey' });
        });
    });

    describe('getCharacterGaps (deprecated)', () => {
        it('should return empty array for backward compatibility', async () => {
            await getCharacterGaps(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(journeyEngineInstance.buildCharacterJourney).not.toHaveBeenCalled();
        });

        it('should not require characterId parameter', async () => {
            mockReq.params = {};

            await getCharacterGaps(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('getAllGaps (deprecated)', () => {
        it('should return empty array for backward compatibility', async () => {
            await getAllGaps(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(journeyEngineInstance.buildCharacterJourney).not.toHaveBeenCalled();
        });

        it('should not require any parameters', async () => {
            mockReq = {};

            await getAllGaps(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([]);
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('getSyncStatus', () => {
        it('should return sync status from database', async () => {
            const mockStatus = {
                characters: { count: 22, lastSync: '2025-06-12T00:00:00Z' },
                elements: { count: 100, lastSync: '2025-06-12T00:00:00Z' },
                puzzles: { count: 32, lastSync: '2025-06-12T00:00:00Z' },
                timeline_events: { count: 75, lastSync: '2025-06-12T00:00:00Z' }
            };

            getDbSyncStatus.mockReturnValue(mockStatus);

            await getSyncStatus(mockReq, mockRes, next);

            expect(getDbSyncStatus).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(mockStatus);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle database errors gracefully', async () => {
            const error = new Error('Database query failed');
            getDbSyncStatus.mockImplementation(() => {
                throw error;
            });

            await getSyncStatus(mockReq, mockRes, next);

            expect(getDbSyncStatus).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch sync status' });
        });

        it('should handle empty sync status', async () => {
            getDbSyncStatus.mockReturnValue({});

            await getSyncStatus(mockReq, mockRes, next);

            expect(getDbSyncStatus).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({});
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe('getGapSuggestions (deprecated)', () => {
        it('should return 410 Gone status with migration info', async () => {
            await getGapSuggestions(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(410);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Gap suggestions endpoint is deprecated',
                message: 'The gap model has been replaced with a journey graph model',
                migration: 'Use the journey graph endpoint at /api/journeys/:characterId instead'
            });
        });

        it('should not call any journey engine methods', async () => {
            await getGapSuggestions(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).not.toHaveBeenCalled();
            expect(getDbSyncStatus).not.toHaveBeenCalled();
        });
    });

    describe('resolveGap (deprecated)', () => {
        it('should return 410 Gone status with migration info', async () => {
            await resolveGap(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(410);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Gap resolution endpoint is deprecated',
                message: 'The gap model has been replaced with a journey graph model',
                migration: 'Gaps no longer exist in the current data model'
            });
        });

        it('should not call any journey engine methods', async () => {
            await resolveGap(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).not.toHaveBeenCalled();
            expect(getDbSyncStatus).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should log errors to console.error', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Test error');
            journeyEngineInstance.buildCharacterJourney.mockRejectedValue(error);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching character journey:', error);
            consoleErrorSpy.mockRestore();
        });

        it('should handle null journey engine response', async () => {
            journeyEngineInstance.buildCharacterJourney.mockResolvedValue(null);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Character not found' });
        });

        it('should handle undefined journey engine response', async () => {
            journeyEngineInstance.buildCharacterJourney.mockResolvedValue(undefined);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Character not found' });
        });
    });

    describe('Response format validation', () => {
        it('should pass through journey data without modification', async () => {
            // Make sure characterId is set
            mockReq.params.characterId = 'test-id';
            
            const complexJourney = {
                character_id: 'test-id',
                character_info: {
                    id: 'test-id',
                    name: 'Test Character',
                    description: 'A test character'
                },
                nodes: [
                    { id: 'n1', type: 'activityNode', data: { puzzle: 'Test Puzzle' } },
                    { id: 'n2', type: 'discoveryNode', data: { element: 'Test Element' } },
                    { id: 'n3', type: 'loreNode', data: { event: 'Test Event' } }
                ],
                edges: [
                    { id: 'e1', source: 'n1', target: 'n2', type: 'gameplay' },
                    { id: 'e2', source: 'n2', target: 'n3', type: 'lore' }
                ],
                metadata: {
                    generated_at: new Date().toISOString(),
                    version: '1.0.0'
                }
            };

            journeyEngineInstance.buildCharacterJourney.mockResolvedValue(complexJourney);

            await getCharacterJourney(mockReq, mockRes, next);

            expect(journeyEngineInstance.buildCharacterJourney).toHaveBeenCalledWith('test-id');
            expect(mockRes.json).toHaveBeenCalledWith(complexJourney);
        });
    });
});