const dbQueries = require('../db/queries');
const QueryBuilder = require('../db/QueryBuilder');
const Database = require('../db/database');
const GameConstants = require('../config/GameConstants');

/**
 * Creates a short snippet from text.
 * @param {string} text The text to snippet.
 * @param {number} maxLength The maximum length of the snippet.
 * @returns {string} The generated snippet.
 */
function createSnippet(text, maxLength = GameConstants.SYSTEM.UI.DEFAULT_SNIPPET_LENGTH) {
  if (!text) {
    return '';
  }
  text = String(text);
  if (text.length <= maxLength) {
    return text;
  }
  const cutPos = text.lastIndexOf(' ', maxLength - 3);
  if (cutPos > maxLength / 2 && cutPos < text.length -1) {
    return text.substring(0, cutPos) + '...';
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Creates a standardized node for the graph, mimicking the original structure.
 * @param {object} entity - The entity from the database.
 * @returns {object} The graph node.
 */
function createNode(entity) {
  if (!entity || !entity.id) {
    return null;
  }

  const commonProps = {
    id: entity.id,
    name: entity.name || entity.description || 'Unnamed',
    type: entity.type,
    fullDescription: entity.logline || entity.description || entity.notes || ''
  };
  commonProps.descriptionSnippet = createSnippet(commonProps.fullDescription);

  let specificProps = {};
  switch (entity.type) {
  case 'character':
    specificProps = {
      tier: entity.tier,
      role: entity.type
    };
    break;
  case 'puzzle':
    specificProps = {
      timing: entity.timing,
      storyRevealSnippet: createSnippet(entity.story_reveals),
      ownerId: entity.owner_id
    };
    break;
  case 'element':
    specificProps = {
      basicType: entity.type,
      status: entity.status,
      ownerId: entity.owner_id
    };
    break;
  case 'timeline_event':
    specificProps = {
      dateString: entity.date,
      notesSnippet: createSnippet(entity.notes)
    };
    break;
  }

  // Add computed fields if they exist
  if (entity.resolution_paths) {
    specificProps.resolutionPaths = JSON.parse(entity.resolution_paths);
  }
  if (entity.act_focus) {
    specificProps.actFocus = entity.act_focus;
  }

  return { ...commonProps, ...specificProps };
}

/**
 * Creates a standardized edge for the graph, mimicking the original structure.
 * @param {object} sourceNode - The source node object.
 * @param {object} targetNode - The target node object.
 * @param {string} label - The relationship label.
 * @returns {object} The graph edge.
 */
function createEdge(sourceNode, targetNode, label) {
  if (!sourceNode || !targetNode) {
    return null;
  }
  return {
    id: `edge-${sourceNode.id}-${targetNode.id}-${label}`,
    source: sourceNode.id,
    target: targetNode.id,
    label: label,
    data: {
      sourceNodeName: sourceNode.name,
      sourceNodeType: sourceNode.type,
      targetNodeName: targetNode.name,
      targetNodeType: targetNode.type,
      contextualLabel: `${sourceNode.name} (${sourceNode.type}) ${label.toLowerCase()} ${targetNode.name} (${targetNode.type})`,
      shortLabel: label
    }
  };
}

class GraphService {
  constructor() {}

  /**
   * Builds a relationship graph for a given character from the SQLite database.
   * @param {string} characterId The ID of the central character.
   * @param {number} depth The depth of relationships to fetch (currently supports 1).
   * @returns {Promise<object>} The graph data containing nodes and edges.
   */
  async getCharacterGraph(characterId, depth = 1) {
    const nodes = [];
    const edges = [];
    const addedNodeIds = new Set();

    // 1. Fetch the central character
    const characterData = dbQueries.getCharacterById(characterId);
    if (!characterData) {
      throw new Error('Character not found');
    }
    characterData.type = 'character'; // Add type for createNode
    const centerNode = createNode(characterData);
    if(centerNode) {
      nodes.push(centerNode);
      addedNodeIds.add(characterData.id);
    }

    // 2. Fetch all direct relations
    const relations = dbQueries.getCharacterRelations(characterId);

    // 3. Fetch character-to-character links using QueryBuilder
    const characterLinksQuery = QueryBuilder.characterRelationships(characterId);
    const characterLinks = Database.getDb().prepare(characterLinksQuery.sql).all(...characterLinksQuery.params);

    // 4. Process relations into nodes and edges
    relations.events.forEach(event => {
      const eventNode = createNode(event);
      if (eventNode && !addedNodeIds.has(event.id)) {
        nodes.push(eventNode);
        addedNodeIds.add(event.id);
      }
      const edge = createEdge(centerNode, eventNode, 'participates_in');
      if(edge) {
        edges.push(edge);
      }
    });

    relations.puzzles.forEach(puzzle => {
      const puzzleNode = createNode(puzzle);
      if (puzzleNode && !addedNodeIds.has(puzzle.id)) {
        nodes.push(puzzleNode);
        addedNodeIds.add(puzzle.id);
      }
      const edge = createEdge(centerNode, puzzleNode, 'involved_in');
      if(edge) {
        edges.push(edge);
      }
    });

    relations.elements.forEach(element => {
      const elementNode = createNode(element);
      if (elementNode && !addedNodeIds.has(element.id)) {
        nodes.push(elementNode);
        addedNodeIds.add(element.id);
      }
      const relationshipLabel = element.relationship_type === 'owned' ? 'owns' : 'associated_with';
      const edge = createEdge(centerNode, elementNode, relationshipLabel);
      if(edge) {
        edges.push(edge);
      }
    });

    // 5. Process character links
    for (const link of characterLinks) {
      // Fetch the linked character data if not already in nodes
      if (!addedNodeIds.has(link.linked_character_id)) {
        const linkedCharData = dbQueries.getCharacterById(link.linked_character_id);
        if (linkedCharData) {
          linkedCharData.type = 'character';
          const linkedCharNode = createNode(linkedCharData);
          if (linkedCharNode) {
            nodes.push(linkedCharNode);
            addedNodeIds.add(link.linked_character_id);
          }
        }
      }

      // Create edge for character link
      const linkedNode = nodes.find(n => n.id === link.linked_character_id);
      if (linkedNode) {
        const linkLabel = `linked_via_${link.link_type}`;
        const edge = createEdge(centerNode, linkedNode, linkLabel);
        if (edge) {
          // Add link count as edge weight/data
          edge.data.linkCount = link.link_count;
          edges.push(edge);
        }
      }
    }

    // TODO: Implement depth > 1 fetching if necessary

    return {
      center: characterData,
      nodes,
      edges
    };
  }
}

module.exports = new GraphService();