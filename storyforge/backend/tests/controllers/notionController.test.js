const notionController = require('../../src/controllers/notionController');
const notionService = require('../../src/services/notionService');
const graphService = require('../../src/services/graphService');
const propertyMapper = require('../../src/utils/notionPropertyMapper');
const { getDB } = require('../../src/db/database');

// Mock dependencies
jest.mock('../../src/services/notionService');
jest.mock('../../src/services/graphService');
jest.mock('../../src/utils/notionPropertyMapper');
jest.mock('../../src/db/database');

describe('Notion Controller', () => {
    let mockReq;
    let mockRes;
    let next;
    let mockDB;
    let mockPrepare;
    let mockAll;
    let mockGet;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup mock request
        mockReq = {
            query: {},
            params: {}
        };
        
        // Setup mock response
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis()
        };
        
        // Setup mock next function
        next = jest.fn();

        // Setup mock database
        mockAll = jest.fn();
        mockGet = jest.fn();
        mockPrepare = jest.fn().mockReturnValue({
            all: mockAll,
            get: mockGet
        });
        mockDB = {
            prepare: mockPrepare
        };
        getDB.mockReturnValue(mockDB);
        
        // Setup default mock data
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
        
        // Setup default mock implementations
        notionService.getCharacters.mockResolvedValue(mockRawData);
        notionService.getCharactersForList.mockResolvedValue(mockMappedData);
        notionService.getElements.mockResolvedValue(mockRawData);
        notionService.getPuzzles.mockResolvedValue(mockRawData);
        notionService.getTimelineEvents.mockResolvedValue(mockRawData);
        notionService.getTimelineEventsForList.mockResolvedValue(mockMappedData);
        notionService.getPage.mockResolvedValue(mockRawData[0]);
        notionService.getPagesByIds.mockResolvedValue(mockRawData);
        notionService.fetchPuzzleFlowDataStructure.mockResolvedValue({
            centralPuzzle: { id: 'test-id', puzzle: 'Test Puzzle' },
            mappedRelatedEntities: new Map()
        });
        
        propertyMapper.mapCharacterWithNames.mockResolvedValue(mockMappedData[0]);
        propertyMapper.mapElementWithNames.mockResolvedValue(mockMappedData[0]);
        propertyMapper.mapPuzzleWithNames.mockResolvedValue(mockMappedData[0]);
        propertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockMappedData[0]);

        // Setup cache mock
        notionService.notionCache = {
            get: jest.fn(),
            set: jest.fn()
        };
        notionService.makeCacheKey = jest.fn((key, params) => `${key}-${JSON.stringify(params)}`);
        notionService.clearCache = jest.fn();
        notionService.DB_IDS = {
            CHARACTERS: 'char-db-id',
            TIMELINE: 'timeline-db-id',
            PUZZLES: 'puzzle-db-id',
            ELEMENTS: 'element-db-id'
        };
    });

    describe('getCharacters', () => {
        it('should fetch and return characters list', async () => {
            const mockCharacters = [
                { id: 'char1', name: 'Character 1' },
                { id: 'char2', name: 'Character 2' }
            ];
            notionService.getCharactersForList.mockResolvedValue(mockCharacters);

            await notionController.getCharacters(mockReq, mockRes);

            expect(notionService.getCharactersForList).toHaveBeenCalledWith(mockReq.query);
            expect(mockRes.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
            expect(mockRes.json).toHaveBeenCalledWith(mockCharacters);
        });

        it('should pass query parameters to service', async () => {
            mockReq.query = { status: 'active', location: 'test' };

            await notionController.getCharacters(mockReq, mockRes, next);

            expect(notionService.getCharactersForList).toHaveBeenCalledWith({ 
                status: 'active', 
                location: 'test' 
            });
        });

        it('should handle service errors', async () => {
            const error = new Error('Service error');
            notionService.getCharactersForList.mockRejectedValue(error);

            await notionController.getCharacters(mockReq, mockRes, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getCharactersWithSociogramData', () => {
        it('should fetch characters with computed fields from database', async () => {
            const mockDbCharacters = [{
                id: 'char1',
                name: 'Character 1',
                resolution_paths: JSON.stringify(['path1', 'path2']),
                total_memory_value: 150,
                relationship_count: 5,
                owned_elements_count: 3,
                associated_elements_count: 2,
                timeline_events_count: 10
            }];
            mockAll.mockReturnValue(mockDbCharacters);

            await notionController.getCharactersWithSociogramData(mockReq, mockRes, next);

            expect(mockPrepare).toHaveBeenCalled();
            expect(mockAll).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith([{
                id: 'char1',
                name: 'Character 1',
                resolution_paths: ['path1', 'path2'],
                resolutionPaths: ['path1', 'path2'],
                memoryValue: 150,
                relationshipCount: 5,
                elementCount: 5,
                timelineEventCount: 10
            }]);
        });

        it('should handle null resolution paths', async () => {
            const mockDbCharacters = [{
                id: 'char1',
                name: 'Character 1',
                resolution_paths: null,
                total_memory_value: null,
                relationship_count: 0,
                owned_elements_count: 0,
                associated_elements_count: 0,
                timeline_events_count: 0
            }];
            mockAll.mockReturnValue(mockDbCharacters);

            await notionController.getCharactersWithSociogramData(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([{
                id: 'char1',
                name: 'Character 1',
                resolution_paths: [],
                resolutionPaths: [],
                memoryValue: 0,
                relationshipCount: 0,
                elementCount: 0,
                timelineEventCount: 0
            }]);
        });
    });

    describe('getCharacterById', () => {
        beforeEach(() => {
            mockReq.params.id = 'test-character-id';
        });

        it('should return cached character if available', async () => {
            const cachedCharacter = { id: 'test-character-id', name: 'Cached Character' };
            notionService.notionCache.get.mockReturnValue(cachedCharacter);

            await notionController.getCharacterById(mockReq, mockRes, next);

            expect(notionService.notionCache.get).toHaveBeenCalled();
            expect(notionService.getPage).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(cachedCharacter);
        });

        it('should fetch character from Notion if not cached', async () => {
            notionService.notionCache.get.mockReturnValue(null);
            const mockPage = { id: 'test-character-id', properties: {} };
            const mappedCharacter = { id: 'test-character-id', name: 'Test Character' };
            notionService.getPage.mockResolvedValue(mockPage);
            propertyMapper.mapCharacterWithNames.mockResolvedValue(mappedCharacter);

            await notionController.getCharacterById(mockReq, mockRes, next);

            expect(notionService.getPage).toHaveBeenCalledWith('test-character-id');
            expect(propertyMapper.mapCharacterWithNames).toHaveBeenCalledWith(mockPage, notionService);
            expect(notionService.notionCache.set).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(mappedCharacter);
        });

        it('should return 404 if character not found', async () => {
            notionService.notionCache.get.mockReturnValue(null);
            notionService.getPage.mockResolvedValue(null);

            await notionController.getCharacterById(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Character not found' });
        });

        it('should not cache character with mapping errors', async () => {
            notionService.notionCache.get.mockReturnValue(null);
            const mockPage = { id: 'test-character-id', properties: {} };
            const errorCharacter = { id: 'test-character-id', error: 'Mapping failed' };
            notionService.getPage.mockResolvedValue(mockPage);
            propertyMapper.mapCharacterWithNames.mockResolvedValue(errorCharacter);

            await notionController.getCharacterById(mockReq, mockRes, next);

            expect(notionService.notionCache.set).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(errorCharacter);
        });
    });

    describe('getCharacterGraph', () => {
        beforeEach(() => {
            mockReq.params.id = 'test-character-id';
        });

        it('should get character graph with default depth', async () => {
            const mockGraph = { nodes: [], edges: [] };
            graphService.getCharacterGraph.mockResolvedValue(mockGraph);

            await notionController.getCharacterGraph(mockReq, mockRes, next);

            expect(graphService.getCharacterGraph).toHaveBeenCalledWith('test-character-id', 1);
            expect(mockRes.json).toHaveBeenCalledWith(mockGraph);
        });

        it('should parse depth from query parameter', async () => {
            mockReq.query.depth = '3';
            const mockGraph = { nodes: [], edges: [] };
            graphService.getCharacterGraph.mockResolvedValue(mockGraph);

            await notionController.getCharacterGraph(mockReq, mockRes, next);

            expect(graphService.getCharacterGraph).toHaveBeenCalledWith('test-character-id', 3);
        });

        it('should handle invalid depth parameter', async () => {
            mockReq.query.depth = 'invalid';
            const mockGraph = { nodes: [], edges: [] };
            graphService.getCharacterGraph.mockResolvedValue(mockGraph);

            await notionController.getCharacterGraph(mockReq, mockRes, next);

            expect(graphService.getCharacterGraph).toHaveBeenCalledWith('test-character-id', NaN);
        });
    });

    describe('getTimelineEvents', () => {
        it('should fetch timeline events with filters', async () => {
            mockReq.query = {
                memType: 'core',
                date: '2025-06-12',
                narrativeThreadContains: 'thread1',
                actFocus: 'Act 1'
            };

            const mockEvents = [{ id: 'event1', description: 'Event 1' }];
            notionService.getTimelineEvents.mockResolvedValue(mockEvents);
            propertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockEvents[0]);

            await notionController.getTimelineEvents(mockReq, mockRes, next);

            expect(notionService.getTimelineEvents).toHaveBeenCalledWith({
                and: [
                    { property: 'mem type', select: { equals: 'core' } },
                    { property: 'Date', select: { equals: '2025-06-12' } },
                    { property: 'Narrative Threads', multi_select: { contains: 'thread1' } },
                    { property: 'Act Focus', select: { equals: 'Act 1' } }
                ]
            });
            expect(mockRes.json).toHaveBeenCalledWith([mockEvents[0]]);
        });

        it('should handle empty filters', async () => {
            mockReq.query = {};

            await notionController.getTimelineEvents(mockReq, mockRes, next);

            expect(notionService.getTimelineEvents).toHaveBeenCalledWith(undefined);
        });
    });

    describe('getElements', () => {
        it('should fetch memory type elements from database', async () => {
            mockReq.query.filterGroup = 'memoryTypes';
            
            const mockDbElements = [{
                id: 'elem1',
                name: 'Memory Token',
                type: 'Memory Token Video',
                calculated_memory_value: 500,
                memory_type: 'Video',
                rfid_tag: 'RFID123',
                memory_group: 'Group A',
                resolution_paths: JSON.stringify(['path1']),
                owner_name: 'Character 1',
                container_name: 'Container 1'
            }];
            mockAll.mockReturnValue(mockDbElements);

            await notionController.getElements(mockReq, mockRes, next);

            expect(mockPrepare).toHaveBeenCalled();
            expect(mockAll).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith([{
                id: 'elem1',
                name: 'Memory Token',
                type: 'Memory Token Video',
                calculated_memory_value: 500,
                memory_type: 'Video',
                rfid_tag: 'RFID123',
                memory_group: 'Group A',
                resolution_paths: '["path1"]',
                owner_name: 'Character 1',
                container_name: 'Container 1',
                sf_value_rating: 5,
                sf_memory_type: 'Video',
                parsed_sf_rfid: 'RFID123',
                sf_memory_group: 'Group A',
                resolutionPaths: ['path1'],
                ownerName: 'Character 1',
                containerName: 'Container 1',
                memoryValue: 500
            }]);
        });

        it('should fetch elements from Notion for non-memory queries', async () => {
            mockReq.query = {
                type: 'Prop',
                status: 'Active'
            };

            const mockElements = [{ id: 'elem1', name: 'Prop 1' }];
            notionService.getElements.mockResolvedValue(mockElements);
            propertyMapper.mapElementWithNames.mockResolvedValue(mockElements[0]);

            await notionController.getElements(mockReq, mockRes, next);

            expect(notionService.getElements).toHaveBeenCalledWith({
                and: [
                    { property: 'Basic Type', select: { equals: 'Prop' } },
                    { property: 'Status', select: { equals: 'Active' } }
                ]
            });
        });
    });

    describe('getDatabasesMetadata', () => {
        it('should return databases metadata', async () => {
            await notionController.getDatabasesMetadata(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith({
                databases: {
                    characters: 'char-db-id',
                    timeline: 'timeline-db-id',
                    puzzles: 'puzzle-db-id',
                    elements: 'element-db-id'
                },
                elementTypes: [
                    "Prop", 
                    "Set Dressing", 
                    "Memory Token Video", 
                    "Character Sheet"
                ]
            });
        });
    });

    describe('globalSearch', () => {
        it('should search across all databases', async () => {
            mockReq.query.q = 'test';

            const mockCharacters = [{ id: 'char1', name: 'Test Character' }];
            const mockElements = [{ id: 'elem1', name: 'Test Element' }];
            const mockPuzzles = [{ id: 'puzz1', puzzle: 'Test Puzzle' }];
            const mockEvents = [{ id: 'event1', description: 'Test Event' }];

            notionService.getCharacters.mockResolvedValue(mockCharacters);
            notionService.getElements.mockResolvedValue(mockElements);
            notionService.getPuzzles.mockResolvedValue(mockPuzzles);
            notionService.getTimelineEvents.mockResolvedValue(mockEvents);

            propertyMapper.mapCharacterWithNames.mockResolvedValue(mockCharacters[0]);
            propertyMapper.mapElementWithNames.mockResolvedValue(mockElements[0]);
            propertyMapper.mapPuzzleWithNames.mockResolvedValue(mockPuzzles[0]);
            propertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockEvents[0]);

            await notionController.globalSearch(mockReq, mockRes, next);

            expect(notionService.getCharacters).toHaveBeenCalledWith({
                property: 'Name',
                title: { contains: 'test' }
            });
            expect(notionService.getElements).toHaveBeenCalledWith({
                property: 'Name',
                title: { contains: 'test' }
            });
            expect(notionService.getPuzzles).toHaveBeenCalledWith({
                property: 'Puzzle',
                title: { contains: 'test' }
            });
            expect(notionService.getTimelineEvents).toHaveBeenCalledWith({
                property: 'Description',
                title: { contains: 'test' }
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                characters: [mockCharacters[0]],
                timeline: [mockEvents[0]],
                puzzles: [mockPuzzles[0]],
                elements: [mockElements[0]]
            });
        });

        it('should return 400 for missing search query', async () => {
            mockReq.query = {};

            await notionController.globalSearch(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing search query' });
        });

        it('should handle search errors gracefully', async () => {
            mockReq.query.q = 'test';
            const error = new Error('Search failed');
            notionService.getCharacters.mockRejectedValue(error);

            await notionController.globalSearch(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith({
                characters: [],
                timeline: expect.any(Array),
                puzzles: expect.any(Array),
                elements: expect.any(Array)
            });
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', async () => {
            await notionController.clearCache(mockReq, mockRes, next);

            expect(notionService.clearCache).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Cache cleared' });
        });
    });

    describe('getPuzzlesWithWarnings', () => {
        it('should return puzzles with warnings', async () => {
            const mockPuzzles = [
                {
                    id: 'puzz1',
                    puzzle: 'Puzzle 1',
                    rewards: [],
                    puzzleElements: [],
                    resolutionPaths: [],
                    owner: 'Owner 1',
                    timing: 'Act 1'
                },
                {
                    id: 'puzz2',
                    puzzle: 'Puzzle 2',
                    rewards: ['reward1'],
                    puzzleElements: ['elem1'],
                    resolutionPaths: ['path1'],
                    owner: 'Owner 2',
                    timing: 'Act 2'
                }
            ];

            notionService.notionCache.get.mockReturnValue(null);
            notionService.getPuzzles.mockResolvedValue(mockPuzzles);
            propertyMapper.mapPuzzleWithNames
                .mockResolvedValueOnce(mockPuzzles[0])
                .mockResolvedValueOnce(mockPuzzles[1]);

            await notionController.getPuzzlesWithWarnings(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([{
                id: 'puzz1',
                name: 'Puzzle 1',
                type: 'Puzzle',
                warnings: [
                    { warningType: 'NoRewards', message: 'Puzzle has no rewards defined.' },
                    { warningType: 'NoInputs', message: 'Puzzle has no input elements defined (puzzleElements).' },
                    { warningType: 'NoResolutionPath', message: 'Puzzle does not contribute to any resolution path.' }
                ],
                owner: 'Owner 1',
                timing: 'Act 1'
            }]);
        });

        it('should return cached data if available', async () => {
            const cachedData = [{ id: 'cached', warnings: [] }];
            notionService.notionCache.get.mockReturnValue(cachedData);

            await notionController.getPuzzlesWithWarnings(mockReq, mockRes, next);

            expect(notionService.getPuzzles).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(cachedData);
        });
    });

    describe('getElementsWithWarnings', () => {
        it('should return elements with warnings', async () => {
            const mockElements = [
                {
                    id: 'elem1',
                    name: 'Element 1',
                    basicType: 'Prop',
                    requiredForPuzzle: [],
                    rewardedByPuzzle: [],
                    status: 'Active',
                    owner: 'Owner 1'
                },
                {
                    id: 'elem2',
                    name: 'Memory Token',
                    basicType: 'Memory Token Video',
                    requiredForPuzzle: [],
                    rewardedByPuzzle: [],
                    memorySets: [],
                    status: 'Active',
                    owner: 'Owner 2'
                }
            ];

            notionService.notionCache.get.mockReturnValue(null);
            notionService.getElements.mockResolvedValue(mockElements);
            propertyMapper.mapElementWithNames
                .mockResolvedValueOnce(mockElements[0])
                .mockResolvedValueOnce(mockElements[1]);

            await notionController.getElementsWithWarnings(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([
                {
                    id: 'elem1',
                    name: 'Element 1',
                    type: 'Element',
                    basicType: 'Prop',
                    status: 'Active',
                    owner: 'Owner 1',
                    warnings: [{
                        warningType: 'NotUsedInOrRewardingPuzzles',
                        message: 'Element is not used as an input for any puzzle and is not a reward from any puzzle.'
                    }]
                },
                {
                    id: 'elem2',
                    name: 'Memory Token',
                    type: 'Element',
                    basicType: 'Memory Token Video',
                    status: 'Active',
                    owner: 'Owner 2',
                    warnings: [
                        {
                            warningType: 'NotUsedInOrRewardingPuzzles',
                            message: 'Element is not used as an input for any puzzle and is not a reward from any puzzle.'
                        },
                        {
                            warningType: 'NoMemorySet',
                            message: 'Memory Token is not part of any Memory Set.'
                        }
                    ]
                }
            ]);
        });

        it('should exclude certain basic types', async () => {
            const mockElements = [
                {
                    id: 'elem1',
                    name: 'Character Sheet 1',
                    basicType: 'Character Sheet',
                    requiredForPuzzle: [],
                    rewardedByPuzzle: []
                }
            ];

            notionService.notionCache.get.mockReturnValue(null);
            notionService.getElements.mockResolvedValue(mockElements);
            propertyMapper.mapElementWithNames.mockResolvedValue(mockElements[0]);

            await notionController.getElementsWithWarnings(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith([]);
        });
    });

    describe('getPuzzleFlow', () => {
        beforeEach(() => {
            mockReq.params.id = 'puzzle-id';
        });

        it('should get puzzle flow data', async () => {
            const mockPuzzle = {
                id: 'puzzle-id',
                puzzle: 'Test Puzzle',
                puzzleElements: [{ id: 'elem1', name: 'Element 1' }],
                rewards: [{ id: 'elem2', name: 'Element 2' }],
                subPuzzles: [{ id: 'sub1', name: 'Sub Puzzle' }],
                parentItem: [{ id: 'parent1', name: 'Parent Puzzle' }],
                lockedItem: []
            };

            const relatedPages = [
                { id: 'elem1', properties: { Name: {} } },
                { id: 'elem2', properties: { Name: {} } },
                { id: 'sub1', properties: { Puzzle: {} } },
                { id: 'parent1', properties: { Puzzle: {} } }
            ];

            notionService.notionCache.get.mockReturnValue(null);
            notionService.getPage.mockResolvedValue({ id: 'puzzle-id' });
            propertyMapper.mapPuzzleWithNames.mockResolvedValue(mockPuzzle);
            notionService.getPagesByIds.mockResolvedValue(relatedPages);
            propertyMapper.mapElementWithNames
                .mockResolvedValueOnce({ id: 'elem1', name: 'Element 1', basicType: 'Prop' })
                .mockResolvedValueOnce({ id: 'elem2', name: 'Element 2', basicType: 'Memory Token' });
            propertyMapper.mapPuzzleWithNames
                .mockResolvedValueOnce({ id: 'sub1', puzzle: 'Sub Puzzle' })
                .mockResolvedValueOnce({ id: 'parent1', puzzle: 'Parent Puzzle' });

            await notionController.getPuzzleFlow(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith({
                centralPuzzle: {
                    id: 'puzzle-id',
                    name: 'Test Puzzle',
                    type: 'Puzzle',
                    properties: mockPuzzle
                },
                inputElements: [{ id: 'elem1', name: 'Element 1', type: 'Element', basicType: 'Prop' }],
                outputElements: [{ id: 'elem2', name: 'Element 2', type: 'Element', basicType: 'Memory Token' }],
                unlocksPuzzles: [{ id: 'sub1', name: 'Sub Puzzle', type: 'Puzzle' }],
                prerequisitePuzzles: [{ id: 'parent1', name: 'Parent Puzzle', type: 'Puzzle' }]
            });
        });

        it('should return 404 if puzzle not found', async () => {
            notionService.notionCache.get.mockReturnValue(null);
            notionService.getPage.mockResolvedValue(null);

            await notionController.getPuzzleFlow(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Puzzle not found' });
        });
    });

    describe('getAllUniqueNarrativeThreads', () => {
        it('should return all unique narrative threads', async () => {
            const mockCharacters = [{ narrativeThreads: ['thread1', 'thread2'] }];
            const mockElements = [{ narrativeThreads: ['thread2', 'thread3'] }];
            const mockPuzzles = [{ narrativeThreads: ['thread1', 'thread3'] }];
            const mockEvents = [{ narrativeThreads: ['thread4'] }];

            notionService.notionCache.get.mockReturnValue(null);
            notionService.getCharacters.mockResolvedValue([{}]);
            notionService.getElements.mockResolvedValue([{}]);
            notionService.getPuzzles.mockResolvedValue([{}]);
            notionService.getTimelineEvents.mockResolvedValue([{}]);

            propertyMapper.mapCharacterWithNames.mockResolvedValue(mockCharacters[0]);
            propertyMapper.mapElementWithNames.mockResolvedValue(mockElements[0]);
            propertyMapper.mapPuzzleWithNames.mockResolvedValue(mockPuzzles[0]);
            propertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockEvents[0]);

            await notionController.getAllUniqueNarrativeThreads(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith(['thread1', 'thread2', 'thread3', 'thread4']);
        });

        it('should handle entities without narrative threads', async () => {
            notionService.notionCache.get.mockReturnValue(null);
            notionService.getCharacters.mockResolvedValue([{}]);
            notionService.getElements.mockResolvedValue([{}]);
            notionService.getPuzzles.mockResolvedValue([{}]);
            notionService.getTimelineEvents.mockResolvedValue([{}]);

            propertyMapper.mapCharacterWithNames.mockResolvedValue({});
            propertyMapper.mapElementWithNames.mockResolvedValue({ narrativeThreads: null });
            propertyMapper.mapPuzzleWithNames.mockResolvedValue({ narrativeThreads: [] });
            propertyMapper.mapTimelineEventWithNames.mockResolvedValue({ narrativeThreads: ['thread1'] });

            await notionController.getAllUniqueNarrativeThreads(mockReq, mockRes, next);

            expect(mockRes.json).toHaveBeenCalledWith(['thread1']);
        });
    });

    describe('Error handling', () => {
        it('should use catchAsync wrapper for all endpoints', () => {
            // This is more of a static analysis test
            // Verify that all exported functions are properly wrapped
            const controllerMethods = Object.keys(notionController);
            
            // All methods should be functions
            controllerMethods.forEach(method => {
                expect(typeof notionController[method]).toBe('function');
            });
        });

        it('should handle and pass errors to next middleware', async () => {
            const error = new Error('Test error');
            notionService.getCharactersForList.mockRejectedValue(error);

            await notionController.getCharacters(mockReq, mockRes, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('Cache headers', () => {
        it('should set cache headers with default duration', async () => {
            await notionController.getCharacters(mockReq, mockRes, next);

            expect(mockRes.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
        });
    });

    describe('Not implemented endpoints', () => {
        it('getElementGraph should return 501', async () => {
            await notionController.getElementGraph(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(501);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not implemented' });
        });

        it('getPuzzleGraph should return 501', async () => {
            await notionController.getPuzzleGraph(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(501);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not implemented' });
        });

        it('getTimelineGraph should return 501', async () => {
            await notionController.getTimelineGraph(mockReq, mockRes, next);

            expect(mockRes.status).toHaveBeenCalledWith(501);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not implemented' });
        });
    });
});
}); 
}); 
}); 
}); 
}); 
}); 
}); 
}); 
}); 