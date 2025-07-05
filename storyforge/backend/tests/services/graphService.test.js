const graphService = require('../../src/services/graphService');
const dbQueries = require('../../src/db/queries');

// Mock the queries module
jest.mock('../../src/db/queries');

describe('GraphService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCharacterGraph', () => {
        const mockCharacter = {
            id: 'char1',
            name: 'Test Character',
            logline: 'A brave adventurer on a quest',
            tier: 'A',
            type: 'Main'
        };

        const mockRelations = {
            events: [
                {
                    id: 'event1',
                    description: 'First Event',
                    date: '2025-01-01',
                    notes: 'Important event notes that are very long and should be truncated',
                    type: 'timeline_event',
                    act_focus: 'Act 1'
                },
                {
                    id: 'event2',
                    description: 'Second Event',
                    date: '2025-01-02',
                    type: 'timeline_event'
                }
            ],
            puzzles: [
                {
                    id: 'puzzle1',
                    name: 'Test Puzzle',
                    timing: 'Act 1',
                    story_reveals: 'This puzzle reveals important story information that should also be truncated because it is very long',
                    owner_id: 'char1',
                    type: 'puzzle',
                    resolution_paths: JSON.stringify(['path1', 'path2'])
                }
            ],
            elements: [
                {
                    id: 'elem1',
                    name: 'Element 1',
                    type: 'element',
                    status: 'Active',
                    owner_id: 'char1',
                    relationship_type: 'owned'
                },
                {
                    id: 'elem2',
                    name: 'Element 2',
                    type: 'element',
                    relationship_type: 'associated'
                }
            ]
        };

        const mockLinkedCharacters = [
            {
                linked_character_id: 'char2',
                linked_character_name: 'Linked Character',
                link_type: 'computed',
                link_count: 3
            }
        ];

        const mockLinkedCharacter = {
            id: 'char2',
            name: 'Linked Character',
            logline: 'A connected character',
            tier: 'B',
            type: 'Supporting'
        };

        beforeEach(() => {
            dbQueries.getCharacterById.mockImplementation((id) => {
                if (id === 'char1') return mockCharacter;
                if (id === 'char2') return mockLinkedCharacter;
                return null;
            });
            dbQueries.getCharacterRelations.mockReturnValue(mockRelations);
            dbQueries.getLinkedCharacters.mockReturnValue(mockLinkedCharacters);
        });

        it('should return a graph with central character', async () => {
            const result = await graphService.getCharacterGraph('char1');

            expect(result).toBeDefined();
            expect(result.center).toEqual(mockCharacter);
            expect(result.nodes).toBeDefined();
            expect(result.edges).toBeDefined();
        });

        it('should include the central character as first node', async () => {
            const result = await graphService.getCharacterGraph('char1');

            expect(result.nodes[0]).toMatchObject({
                id: 'char1',
                name: 'Test Character',
                type: 'character',
                fullDescription: 'A brave adventurer on a quest',
                descriptionSnippet: 'A brave adventurer on a quest',
                tier: 'A',
                role: 'Main'
            });
        });

        it('should create nodes for all related entities', async () => {
            const result = await graphService.getCharacterGraph('char1');

            // Should have 1 central character + 1 linked character + 2 events + 1 puzzle + 2 elements = 7 nodes
            expect(result.nodes).toHaveLength(7);

            // Check event nodes
            const eventNodes = result.nodes.filter(n => n.type === 'timeline_event');
            expect(eventNodes).toHaveLength(2);
            expect(eventNodes[0]).toMatchObject({
                id: 'event1',
                name: 'First Event',
                type: 'timeline_event',
                dateString: '2025-01-01',
                actFocus: 'Act 1'
            });

            // Check puzzle nodes
            const puzzleNodes = result.nodes.filter(n => n.type === 'puzzle');
            expect(puzzleNodes).toHaveLength(1);
            expect(puzzleNodes[0]).toMatchObject({
                id: 'puzzle1',
                name: 'Test Puzzle',
                type: 'puzzle',
                timing: 'Act 1',
                ownerId: 'char1',
                resolutionPaths: ['path1', 'path2']
            });

            // Check element nodes
            const elementNodes = result.nodes.filter(n => n.type === 'element');
            expect(elementNodes).toHaveLength(2);
        });

        it('should create edges for all relationships', async () => {
            const result = await graphService.getCharacterGraph('char1');

            // Should have edges for: 2 events + 1 puzzle + 2 elements + 1 character link = 6 edges
            expect(result.edges).toHaveLength(6);

            // Check event edges
            const eventEdges = result.edges.filter(e => e.label === 'participates_in');
            expect(eventEdges).toHaveLength(2);
            expect(eventEdges[0]).toMatchObject({
                source: 'char1',
                target: 'event1',
                label: 'participates_in',
                data: {
                    sourceNodeName: 'Test Character',
                    sourceNodeType: 'character',
                    targetNodeName: 'First Event',
                    targetNodeType: 'timeline_event',
                    shortLabel: 'participates_in'
                }
            });

            // Check puzzle edges
            const puzzleEdges = result.edges.filter(e => e.label === 'involved_in');
            expect(puzzleEdges).toHaveLength(1);

            // Check element edges
            const ownedEdges = result.edges.filter(e => e.label === 'owns');
            expect(ownedEdges).toHaveLength(1);
            const associatedEdges = result.edges.filter(e => e.label === 'associated_with');
            expect(associatedEdges).toHaveLength(1);
        });

        it('should include character links', async () => {
            const result = await graphService.getCharacterGraph('char1');

            // Check linked character node exists
            const linkedCharNode = result.nodes.find(n => n.id === 'char2');
            expect(linkedCharNode).toBeDefined();
            expect(linkedCharNode).toMatchObject({
                id: 'char2',
                name: 'Linked Character',
                type: 'character',
                tier: 'B',
                role: 'Supporting'
            });

            // Check character link edge exists
            const charLinkEdges = result.edges.filter(e => e.label.startsWith('linked_via_'));
            expect(charLinkEdges).toHaveLength(1);
            expect(charLinkEdges[0]).toMatchObject({
                source: 'char1',
                target: 'char2',
                label: 'linked_via_computed',
                data: {
                    linkCount: 1,
                    sourceNodeName: 'Test Character',
                    targetNodeName: 'Linked Character'
                }
            });
        });

        it('should handle long text with snippets', async () => {
            const result = await graphService.getCharacterGraph('char1');

            // Check event notes snippet
            const event1 = result.nodes.find(n => n.id === 'event1');
            expect(event1.notesSnippet).toMatch(/\.\.\.$/);
            expect(event1.notesSnippet.length).toBeLessThanOrEqual(153); // 150 + '...'

            // Check puzzle story reveals snippet
            const puzzle1 = result.nodes.find(n => n.id === 'puzzle1');
            expect(puzzle1.storyRevealSnippet).toMatch(/\.\.\.$/);
            expect(puzzle1.storyRevealSnippet.length).toBeLessThanOrEqual(153);
        });

        it('should throw error if character not found', async () => {
            dbQueries.getCharacterById.mockReturnValue(null);

            await expect(graphService.getCharacterGraph('nonexistent')).rejects.toThrow('Character not found');
        });

        it('should handle character with no relationships', async () => {
            dbQueries.getCharacterRelations.mockReturnValue({
                events: [],
                puzzles: [],
                elements: []
            });
            dbQueries.getLinkedCharacters.mockReturnValue([]);

            const result = await graphService.getCharacterGraph('char1');

            expect(result.nodes).toHaveLength(1); // Only the character
            expect(result.edges).toHaveLength(0);
        });

        it('should handle character with no character links', async () => {
            dbQueries.getLinkedCharacters.mockReturnValue([]);

            const result = await graphService.getCharacterGraph('char1');

            // Should still have other relationships but no character links
            const charNodes = result.nodes.filter(n => n.type === 'character');
            expect(charNodes).toHaveLength(1); // Only the central character
            
            const charLinkEdges = result.edges.filter(e => e.label.startsWith('linked_via_'));
            expect(charLinkEdges).toHaveLength(0);
        });

        it('should handle missing or null entity names', async () => {
            const relationsWithMissingNames = {
                events: [{
                    id: 'event1',
                    description: null, // No description
                    type: 'timeline_event'
                }],
                puzzles: [{
                    id: 'puzzle1',
                    name: '', // Empty name
                    type: 'puzzle'
                }],
                elements: [{
                    id: 'elem1',
                    // No name at all
                    type: 'element',
                    relationship_type: 'owned'
                }]
            };

            dbQueries.getCharacterRelations.mockReturnValue(relationsWithMissingNames);

            const result = await graphService.getCharacterGraph('char1');

            // Check that nodes have 'Unnamed' as fallback
            const unnamedNodes = result.nodes.filter(n => n.name === 'Unnamed');
            expect(unnamedNodes.length).toBeGreaterThan(0);
        });

        it('should handle entities with no description/logline', async () => {
            const characterWithNoDescription = {
                id: 'char1',
                name: 'Test Character',
                // No logline
                tier: 'A',
                type: 'Main'
            };

            dbQueries.getCharacterById.mockReturnValue(characterWithNoDescription);

            const result = await graphService.getCharacterGraph('char1');

            const charNode = result.nodes[0];
            expect(charNode.fullDescription).toBe('');
            expect(charNode.descriptionSnippet).toBe('');
        });

        it('should not add duplicate nodes', async () => {
            // Create relations with duplicate IDs
            const relationsWithDuplicates = {
                events: [
                    { id: 'event1', description: 'Event', type: 'timeline_event' },
                    { id: 'event1', description: 'Duplicate Event', type: 'timeline_event' }
                ],
                puzzles: [],
                elements: []
            };

            dbQueries.getCharacterRelations.mockReturnValue(relationsWithDuplicates);

            const result = await graphService.getCharacterGraph('char1');

            // Should only have 2 nodes: character + 1 event (no duplicate)
            expect(result.nodes).toHaveLength(2);
            const eventNodes = result.nodes.filter(n => n.id === 'event1');
            expect(eventNodes).toHaveLength(1);
        });

        it('should create contextual labels for edges', async () => {
            const result = await graphService.getCharacterGraph('char1');

            const firstEdge = result.edges[0];
            expect(firstEdge.data.contextualLabel).toMatch(/Test Character \(character\) \w+ .+ \(\w+\)/);
        });

        it('should handle depth parameter (currently only depth 1)', async () => {
            // Test with default depth
            const result1 = await graphService.getCharacterGraph('char1');
            expect(result1.nodes.length).toBeGreaterThan(1);

            // Test with explicit depth 1
            const result2 = await graphService.getCharacterGraph('char1', 1);
            expect(result2.nodes).toEqual(result1.nodes);

            // TODO: When depth > 1 is implemented, add tests for it
        });

        it('should parse resolution_paths JSON when present', async () => {
            const result = await graphService.getCharacterGraph('char1');

            const puzzleNode = result.nodes.find(n => n.id === 'puzzle1');
            expect(puzzleNode.resolutionPaths).toEqual(['path1', 'path2']);
        });

        it('should handle malformed resolution_paths JSON', async () => {
            const relationsWithBadJSON = {
                events: [],
                puzzles: [{
                    id: 'puzzle1',
                    name: 'Test Puzzle',
                    type: 'puzzle',
                    resolution_paths: 'invalid json'
                }],
                elements: []
            };

            dbQueries.getCharacterRelations.mockReturnValue(relationsWithBadJSON);

            // Should not throw, just skip the bad JSON
            const result = await graphService.getCharacterGraph('char1');
            const puzzleNode = result.nodes.find(n => n.id === 'puzzle1');
            expect(puzzleNode.resolutionPaths).toBeUndefined();
        });

        it('should generate unique edge IDs', async () => {
            const result = await graphService.getCharacterGraph('char1');

            const edgeIds = result.edges.map(e => e.id);
            const uniqueIds = new Set(edgeIds);
            expect(uniqueIds.size).toBe(edgeIds.length);
        });

        it('should handle null nodes gracefully', async () => {
            const relationsWithNullId = {
                events: [
                    { description: 'Event without ID', type: 'timeline_event' }, // Missing ID
                    null // Null event
                ],
                puzzles: [],
                elements: []
            };

            dbQueries.getCharacterRelations.mockReturnValue(relationsWithNullId);

            const result = await graphService.getCharacterGraph('char1');

            // Should only have the character node
            expect(result.nodes).toHaveLength(1);
            expect(result.edges).toHaveLength(0);
        });
    });

});