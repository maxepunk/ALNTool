const {
    getCharacters,
    getTimelineEvents,
    getPuzzles,
    getElements,
    getElementsByType,
    getPage,
    queryDatabase,
    DB_IDS,
    getPagesByIds,
    clearCache,
    notionCache,
    makeCacheKey,
    getCharacterDetails,
    getAllCharacterOverviews,
    getCharactersForList,
    getTimelineEventsForList
} = require('../../src/services/notionService');
const dbQueries = require('../../src/db/queries');
const propertyMapper = require('../../src/utils/notionPropertyMapper');

// Mock dependencies
jest.mock('@notionhq/client');
jest.mock('../../src/db/queries');
jest.mock('../../src/utils/notionPropertyMapper');

// Get mocked Client
const { Client } = require('@notionhq/client');

describe('NotionService', () => {
    let mockNotionClient;
    let originalEnv;

    beforeEach(() => {
        jest.clearAllMocks();
        notionCache.flushAll();
        
        // Save original environment
        originalEnv = process.env.NOTION_API_KEY;
        process.env.NOTION_API_KEY = 'test-api-key';
        
        // Setup mock Notion client
        mockNotionClient = {
            databases: {
                query: jest.fn()
            },
            pages: {
                retrieve: jest.fn()
            }
        };
        
        Client.mockImplementation(() => mockNotionClient);
    });

    afterEach(() => {
        // Restore original environment
        process.env.NOTION_API_KEY = originalEnv;
    });

    describe('Notion Client Initialization', () => {
        it('should create Notion client with API key', async () => {
            await queryDatabase('test-db-id');
            
            expect(Client).toHaveBeenCalledWith({
                auth: 'test-api-key'
            });
        });

        it('should throw error if NOTION_API_KEY is not set', async () => {
            delete process.env.NOTION_API_KEY;
            
            await expect(queryDatabase('test-db-id')).rejects.toThrow('NOTION_API_KEY not found');
        });

        it('should reuse existing client instance', async () => {
            await queryDatabase('test-db-id');
            await queryDatabase('test-db-id-2');
            
            expect(Client).toHaveBeenCalledTimes(1);
        });
    });

    describe('queryDatabase', () => {
        const mockResults = {
            results: [
                { id: 'page1', properties: { Name: { title: [{ plain_text: 'Test Page 1' }] } } },
                { id: 'page2', properties: { Name: { title: [{ plain_text: 'Test Page 2' }] } } }
            ]
        };

        beforeEach(() => {
            mockNotionClient.databases.query.mockResolvedValue(mockResults);
        });

        it('should query database without filter', async () => {
            const result = await queryDatabase('test-db-id');
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: 'test-db-id'
            });
            expect(result).toEqual(mockResults.results);
        });

        it('should query database with filter', async () => {
            const filter = {
                property: 'Status',
                select: { equals: 'Active' }
            };
            
            const result = await queryDatabase('test-db-id', filter);
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: 'test-db-id',
                filter: filter
            });
            expect(result).toEqual(mockResults.results);
        });

        it('should cache results', async () => {
            // First call
            await queryDatabase('test-db-id');
            expect(mockNotionClient.databases.query).toHaveBeenCalledTimes(1);
            
            // Second call should use cache
            const result = await queryDatabase('test-db-id');
            expect(mockNotionClient.databases.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockResults.results);
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Notion API error');
            mockNotionClient.databases.query.mockRejectedValue(error);
            
            await expect(queryDatabase('test-db-id')).rejects.toThrow('Notion API error');
        });
    });

    describe('getPage', () => {
        const mockPage = {
            id: 'page1',
            properties: { Name: { title: [{ plain_text: 'Test Page' }] } }
        };

        beforeEach(() => {
            mockNotionClient.pages.retrieve.mockResolvedValue(mockPage);
        });

        it('should retrieve a page by ID', async () => {
            const result = await getPage('page1');
            
            expect(mockNotionClient.pages.retrieve).toHaveBeenCalledWith({
                page_id: 'page1'
            });
            expect(result).toEqual(mockPage);
        });

        it('should cache page results', async () => {
            // First call
            await getPage('page1');
            expect(mockNotionClient.pages.retrieve).toHaveBeenCalledTimes(1);
            
            // Second call should use cache
            const result = await getPage('page1');
            expect(mockNotionClient.pages.retrieve).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPage);
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Page not found');
            mockNotionClient.pages.retrieve.mockRejectedValue(error);
            
            await expect(getPage('invalid-id')).rejects.toThrow('Page not found');
        });
    });

    describe('Database-specific query methods', () => {
        const mockResults = {
            results: [{ id: 'item1' }, { id: 'item2' }]
        };

        beforeEach(() => {
            mockNotionClient.databases.query.mockResolvedValue(mockResults);
        });

        it('should get characters', async () => {
            const result = await getCharacters();
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: DB_IDS.CHARACTERS
            });
            expect(result).toEqual(mockResults.results);
        });

        it('should get timeline events', async () => {
            const result = await getTimelineEvents();
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: DB_IDS.TIMELINE
            });
            expect(result).toEqual(mockResults.results);
        });

        it('should get puzzles', async () => {
            const result = await getPuzzles();
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: DB_IDS.PUZZLES
            });
            expect(result).toEqual(mockResults.results);
        });

        it('should get elements', async () => {
            const result = await getElements();
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: DB_IDS.ELEMENTS
            });
            expect(result).toEqual(mockResults.results);
        });

        it('should get elements by type', async () => {
            const result = await getElementsByType('Memory Token Video');
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: DB_IDS.ELEMENTS,
                filter: {
                    property: 'Basic Type',
                    select: {
                        equals: 'Memory Token Video'
                    }
                }
            });
            expect(result).toEqual(mockResults.results);
        });
    });

    describe('getPagesByIds', () => {
        const mockPages = [
            { id: 'page1', properties: { Name: { title: [{ plain_text: 'Page 1' }] } } },
            { id: 'page2', properties: { Name: { title: [{ plain_text: 'Page 2' }] } } }
        ];

        beforeEach(() => {
            mockNotionClient.pages.retrieve
                .mockResolvedValueOnce(mockPages[0])
                .mockResolvedValueOnce(mockPages[1]);
        });

        it('should fetch multiple pages by IDs', async () => {
            const result = await getPagesByIds(['page1', 'page2']);
            
            expect(mockNotionClient.pages.retrieve).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockPages);
        });

        it('should handle empty array', async () => {
            const result = await getPagesByIds([]);
            
            expect(mockNotionClient.pages.retrieve).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should handle non-array input', async () => {
            const result = await getPagesByIds(null);
            
            expect(mockNotionClient.pages.retrieve).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should filter out failed fetches', async () => {
            mockNotionClient.pages.retrieve
                .mockResolvedValueOnce(mockPages[0])
                .mockRejectedValueOnce(new Error('Page not found'));
            
            const result = await getPagesByIds(['page1', 'invalid-id']);
            
            expect(result).toEqual([mockPages[0]]);
        });
    });

    describe('Cache functionality', () => {
        it('should create correct cache keys', () => {
            const key1 = makeCacheKey('test', { id: '123', filter: 'active' });
            const key2 = makeCacheKey('test', { id: '123', filter: 'active' });
            const key3 = makeCacheKey('test', { id: '456', filter: 'active' });
            
            expect(key1).toBe(key2);
            expect(key1).not.toBe(key3);
        });

        it('should clear cache', async () => {
            // Add something to cache
            mockNotionClient.databases.query.mockResolvedValue({ results: [] });
            await queryDatabase('test-db');
            
            // Verify cache has content
            expect(notionCache.keys().length).toBeGreaterThan(0);
            
            // Clear cache
            clearCache();
            
            // Verify cache is empty
            expect(notionCache.keys().length).toBe(0);
        });
    });

    describe('getCharacterDetails', () => {
        const mockCharacterPage = {
            id: 'char1',
            properties: {
                Name: { title: [{ plain_text: 'Test Character' }] }
            }
        };

        const mockMappedCharacter = {
            id: 'char1',
            name: 'Test Character',
            event_ids: ['event1', 'event2'],
            puzzle_ids: ['puzzle1'],
            owned_element_ids: ['elem1'],
            associated_element_ids: ['elem2']
        };

        const mockEventPages = [
            { id: 'event1', properties: { Description: { title: [{ plain_text: 'Event 1' }] } } },
            { id: 'event2', properties: { Description: { title: [{ plain_text: 'Event 2' }] } } }
        ];

        beforeEach(() => {
            mockNotionClient.pages.retrieve.mockResolvedValue(mockCharacterPage);
            propertyMapper.mapCharacter.mockReturnValue(mockMappedCharacter);
            propertyMapper.mapTimelineEvent.mockImplementation(page => ({ id: page.id, description: 'Mapped event' }));
            propertyMapper.mapPuzzle.mockImplementation(page => ({ id: page.id, name: 'Mapped puzzle' }));
            propertyMapper.mapElementWithNames.mockImplementation(page => Promise.resolve({ id: page.id, name: 'Mapped element' }));
        });

        it('should fetch and map character details with all relations', async () => {
            // Mock getPagesByIds to return pages
            const originalGetPagesByIds = module.exports.getPagesByIds;
            module.exports.getPagesByIds = jest.fn()
                .mockResolvedValueOnce(mockEventPages) // events
                .mockResolvedValueOnce([{ id: 'puzzle1' }]) // puzzles
                .mockResolvedValueOnce([{ id: 'elem1' }, { id: 'elem2' }]); // elements

            const result = await getCharacterDetails('char1');
            
            expect(result).toMatchObject({
                character: mockMappedCharacter,
                events: expect.arrayContaining([
                    expect.objectContaining({ id: 'event1' }),
                    expect.objectContaining({ id: 'event2' })
                ]),
                puzzles: expect.arrayContaining([
                    expect.objectContaining({ id: 'puzzle1' })
                ]),
                elements: expect.arrayContaining([
                    expect.objectContaining({ id: 'elem1' }),
                    expect.objectContaining({ id: 'elem2' })
                ])
            });

            // Restore original
            module.exports.getPagesByIds = originalGetPagesByIds;
        });

        it('should return null if character page not found', async () => {
            mockNotionClient.pages.retrieve.mockRejectedValue(new Error('Not found'));
            
            const result = await getCharacterDetails('invalid-id');
            
            expect(result).toBeNull();
        });

        it('should handle character without relations', async () => {
            propertyMapper.mapCharacter.mockReturnValue({
                id: 'char1',
                name: 'Test Character',
                event_ids: [],
                puzzle_ids: [],
                owned_element_ids: [],
                associated_element_ids: []
            });

            const result = await getCharacterDetails('char1');
            
            expect(result).toMatchObject({
                character: expect.objectContaining({ id: 'char1' }),
                events: [],
                puzzles: [],
                elements: []
            });
        });
    });

    describe('getAllCharacterOverviews', () => {
        const mockCharacterPages = [
            { id: 'char1', properties: { Name: { title: [{ plain_text: 'Character 1' }] } } },
            { id: 'char2', properties: { Name: { title: [{ plain_text: 'Character 2' }] } } }
        ];

        beforeEach(() => {
            mockNotionClient.databases.query.mockResolvedValue({ results: mockCharacterPages });
            propertyMapper.mapCharacterOverview.mockImplementation(page => ({
                id: page.id,
                name: `Mapped ${page.id}`
            }));
        });

        it('should fetch and map all character overviews', async () => {
            const result = await getAllCharacterOverviews();
            
            expect(mockNotionClient.databases.query).toHaveBeenCalledWith({
                database_id: DB_IDS.CHARACTERS
            });
            expect(result).toEqual([
                { id: 'char1', name: 'Mapped char1' },
                { id: 'char2', name: 'Mapped char2' }
            ]);
        });

        it('should filter out null mappings', async () => {
            propertyMapper.mapCharacterOverview
                .mockReturnValueOnce({ id: 'char1', name: 'Character 1' })
                .mockReturnValueOnce(null);
            
            const result = await getAllCharacterOverviews();
            
            expect(result).toEqual([
                { id: 'char1', name: 'Character 1' }
            ]);
        });
    });

    describe('Database-backed list methods', () => {
        it('should delegate getCharactersForList to dbQueries', async () => {
            const mockCharacters = [{ id: 'char1', name: 'Character 1' }];
            dbQueries.getCharactersForList.mockReturnValue(mockCharacters);
            
            const result = await getCharactersForList();
            
            expect(dbQueries.getCharactersForList).toHaveBeenCalled();
            expect(result).toEqual(mockCharacters);
        });

        it('should delegate getTimelineEventsForList to dbQueries', async () => {
            const mockEvents = [{ id: 'event1', description: 'Event 1' }];
            dbQueries.getTimelineEventsForList.mockReturnValue(mockEvents);
            
            const result = await getTimelineEventsForList();
            
            expect(dbQueries.getTimelineEventsForList).toHaveBeenCalled();
            expect(result).toEqual(mockEvents);
        });
    });

    describe('Environment variable handling', () => {
        it('should use custom database IDs from environment', async () => {
            process.env.NOTION_CHARACTERS_DB = 'custom-char-db';
            process.env.NOTION_TIMELINE_DB = 'custom-timeline-db';
            process.env.NOTION_PUZZLES_DB = 'custom-puzzle-db';
            process.env.NOTION_ELEMENTS_DB = 'custom-element-db';
            
            // Reload module to pick up new env vars
            jest.resetModules();
            const freshNotionService = require('../../src/services/notionService');
            
            expect(freshNotionService.DB_IDS.CHARACTERS).toBe('custom-char-db');
            expect(freshNotionService.DB_IDS.TIMELINE).toBe('custom-timeline-db');
            expect(freshNotionService.DB_IDS.PUZZLES).toBe('custom-puzzle-db');
            expect(freshNotionService.DB_IDS.ELEMENTS).toBe('custom-element-db');
        });
    });
});