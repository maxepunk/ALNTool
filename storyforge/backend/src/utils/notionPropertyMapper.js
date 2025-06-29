const logger = require('./logger');

/**
 * Extracts the title/name from a Notion title property
 * @param {Object} titleProperty - Notion title property
 * @returns {string} The extracted title text
 */
function extractTitle(titleProperty) {
  if (!titleProperty || !titleProperty.title || !Array.isArray(titleProperty.title)) {
    return '';
  }
  return titleProperty.title.map(text => text.plain_text).join('');
}

/**
 * Extracts text from a Notion rich text property
 * @param {Object} richTextProperty - Notion rich text property
 * @returns {string} The extracted rich text
 */
function extractRichText(richTextProperty) {
  if (!richTextProperty || !richTextProperty.rich_text || !Array.isArray(richTextProperty.rich_text)) {
    return '';
  }
  return richTextProperty.rich_text.map(text => text.plain_text).join('');
}

/**
 * Extracts the value from a Notion select property
 * @param {Object} selectProperty - Notion select property
 * @returns {string|null} The extracted select value or null
 */
function extractSelect(selectProperty) {
  if (!selectProperty || !selectProperty.select) {
    return null;
  }
  return selectProperty.select.name;
}

/**
 * Extracts values from a Notion multi-select property
 * @param {Object} multiSelectProperty - Notion multi-select property
 * @returns {Array} Array of multi-select values
 */
function extractMultiSelect(multiSelectProperty) {
  if (!multiSelectProperty || !multiSelectProperty.multi_select || !Array.isArray(multiSelectProperty.multi_select)) {
    return [];
  }
  return multiSelectProperty.multi_select.map(option => option.name);
}

/**
 * Extracts a relation array from a Notion relation property
 * @param {Object} relationProperty - Notion relation property
 * @returns {Array} Array of relation IDs
 */
function extractRelation(relationProperty) {
  if (!relationProperty || !relationProperty.relation || !Array.isArray(relationProperty.relation)) {
    return [];
  }
  return relationProperty.relation.map(relation => relation.id);
}

/**
 * Extracts a URL from a Notion URL property
 * @param {Object} urlProperty - Notion URL property
 * @returns {string|null} The extracted URL or null
 */
function extractUrl(urlProperty) {
  if (!urlProperty || !urlProperty.url) {
    return null;
  }
  return urlProperty.url;
}

/**
 * Extracts a date from a Notion date property
 * @param {Object} dateProperty - Notion date property
 * @returns {string|null} The extracted date or null
 */
function extractDate(dateProperty) {
  if (!dateProperty || !dateProperty.date) {
    return null;
  }
  return dateProperty.date.start;
}

/**
 * Extracts a number from a Notion number property
 * @param {Object} numberProperty - Notion number property
 * @returns {number|null} The extracted number or null
 */
function extractNumber(numberProperty) {
  if (!numberProperty || numberProperty.number === undefined || numberProperty.number === null) {
    return null;
  }
  return numberProperty.number;
}

/**
 * Maps a Notion character object to a simplified format
 * @param {Object} notionCharacter - Raw Notion character object
 * @returns {Object} Simplified character object
 */
function mapCharacter(notionCharacter) {
  const properties = notionCharacter.properties;

  return {
    id: notionCharacter.id,
    name: extractTitle(properties.Name),
    type: extractSelect(properties.Type),
    tier: extractSelect(properties.Tier),
    logline: properties.Character_Logline ? extractRichText(properties.Character_Logline) : '',
    overview: properties.Overview_Key_Relationships ? extractRichText(properties.Overview_Key_Relationships) : '',
    emotion: properties.Emotion_towards_CEO_others ? extractRichText(properties.Emotion_towards_CEO_others) : '',
    primaryAction: properties.Primary_Action ? extractRichText(properties.Primary_Action) : '',
    events: properties.Events ? extractRelation(properties.Events) : [],
    puzzles: properties.Character_Puzzles ? extractRelation(properties.Character_Puzzles) : [],
    ownedElements: properties.Owned_Elements ? extractRelation(properties.Owned_Elements) : [],
    associatedElements: properties.Associated_Elements ? extractRelation(properties.Associated_Elements) : [],
    connections: extractNumber(properties.Connections),
    lastEdited: notionCharacter.last_edited_time
  };
}

/**
 * Maps a Notion timeline event object to a simplified format
 * @param {Object} notionEvent - Raw Notion timeline event object
 * @returns {Object} Simplified timeline event object
 */
function mapTimelineEvent(notionEvent) {
  const properties = notionEvent.properties;

  return {
    id: notionEvent.id,
    description: extractTitle(properties.Description),
    date: extractDate(properties.Date),
    charactersInvolved: properties.Characters_Involved ? extractRelation(properties.Characters_Involved) : [],
    memoryEvidence: properties.Memory_Evidence ? extractRelation(properties.Memory_Evidence) : [],
    memType: properties.mem_type ? extractRichText(properties.mem_type) : '',
    notes: properties.Notes ? extractRichText(properties.Notes) : '',
    lastEdited: notionEvent.last_edited_time
  };
}

/**
 * Maps a Notion puzzle object to a simplified format
 * @param {Object} notionPuzzle - Raw Notion puzzle object
 * @returns {Object} Simplified puzzle object
 */
function mapPuzzle(notionPuzzle) {
  const properties = notionPuzzle.properties;

  return {
    id: notionPuzzle.id,
    puzzle: extractTitle(properties.Puzzle),
    owner: properties.Owner ? extractRelation(properties.Owner) : [],
    lockedItem: properties.Locked_Item ? extractRelation(properties.Locked_Item) : [],
    puzzleElements: properties.Puzzle_Elements ? extractRelation(properties.Puzzle_Elements) : [],
    rewards: properties.Rewards ? extractRelation(properties.Rewards) : [],
    storyReveals: properties.Story_Reveals ? extractRichText(properties.Story_Reveals) : '',
    timing: extractSelect(properties.Timing),
    parentItem: properties.Parent_item ? extractRelation(properties.Parent_item) : [],
    subPuzzles: properties.Sub_Puzzles ? extractRelation(properties.Sub_Puzzles) : [],
    assetLink: extractUrl(properties.Asset_Link),
    description: properties.Description_Solution ? extractRichText(properties.Description_Solution) : '',
    narrativeThreads: properties.Narrative_Threads ? extractMultiSelect(properties.Narrative_Threads) : [],
    lastEdited: notionPuzzle.last_edited_time
  };
}

/**
 * Helper function to get a property from a Notion object, trying various naming conventions
 * @param {Object} properties - The properties object from Notion
 * @param {string} propertyName - The base property name to look for (e.g., "Owned Elements")
 * @returns {Object|null} The property object or null if not found
 */
function getProperty(properties, propertyName) {
  // Define possible property name variations
  const variations = [
    propertyName,                                  // Original format (e.g., "Owned Elements")
    propertyName.replace(/\s/g, '_'),             // snake_case (e.g., "Owned_Elements")
    propertyName.replace(/-/g, '_'),              // Replace hyphens too (e.g., "Sub-Puzzles" -> "Sub_Puzzles")
    propertyName.replace(/(\w)\/(\w)/g, '$1_$2'), // Handle slashes (e.g., "Description/Text" -> "Description_Text")
    propertyName.replace(/\//g, ' ')              // Replace slashes with spaces (e.g., "Description/Text" -> "Description Text")
  ];

  // Try each variation until we find the property
  for (const variant of variations) {
    if (properties[variant]) {
      return properties[variant];
    }
  }

  // If not found, log the issue (but don't throw an error to maintain resilience)
  logger.warn(`Property "${propertyName}" not found in Notion object. Available properties: ${Object.keys(properties).join(', ')}`);

  // Return null
  return null;
}

/**
 * Extract relation from a property using flexible property naming
 * @param {Object} properties - The properties object
 * @param {string} propertyName - The base property name
 * @returns {Array} Array of relation IDs
 */
function extractRelationByName(properties, propertyName) {
  const prop = getProperty(properties, propertyName);
  return prop ? extractRelation(prop) : [];
}

/**
 * Extract rich text from a property using flexible property naming
 * @param {Object} properties - The properties object
 * @param {string} propertyName - The base property name
 * @returns {string} The extracted text
 */
function extractRichTextByName(properties, propertyName) {
  const prop = getProperty(properties, propertyName);
  return prop ? extractRichText(prop) : '';
}

/**
 * Extract select from a property using flexible property naming
 * @param {Object} properties - The properties object
 * @param {string} propertyName - The base property name
 * @returns {string|null} The extracted select value
 */
function extractSelectByName(properties, propertyName) {
  const prop = getProperty(properties, propertyName);
  return prop ? extractSelect(prop) : null;
}

/**
 * Extract multi-select from a property using flexible property naming
 * @param {Object} properties - The properties object
 * @param {string} propertyName - The base property name
 * @returns {Array} Array of multi-select values
 */
function extractMultiSelectByName(properties, propertyName) {
  const prop = getProperty(properties, propertyName);
  return prop ? extractMultiSelect(prop) : [];
}

/**
 * Extract URL from a property using flexible property naming
 * @param {Object} properties - The properties object
 * @param {string} propertyName - The base property name
 * @returns {string|null} The extracted URL
 */
function extractUrlByName(properties, propertyName) {
  const prop = getProperty(properties, propertyName);
  return prop ? extractUrl(prop) : null;
}

/**
 * Async version of mapCharacter that fetches related entity names
 * @param {Object} notionCharacter - Raw Notion character object
 * @param {Object} notionService - Notion service with getPagesByIds
 * @returns {Promise<Object>} Character object with related names
 */
async function mapCharacterWithNames(notionCharacter, notionService) {
  try {
    const properties = notionCharacter.properties;

    // Use the new helper functions to extract relations with flexible property naming
    const eventIds = extractRelationByName(properties, 'Events');
    const puzzleIds = extractRelationByName(properties, 'Character Puzzles');
    const ownedElementIds = extractRelationByName(properties, 'Owned Elements');
    const associatedElementIds = extractRelationByName(properties, 'Associated Elements');
    // NOTE: Linked Characters doesn't exist in Notion - will compute from shared events/puzzles later

    const [
      events,
      puzzles,
      ownedElements,
      associatedElements
    ] = await Promise.all([
      notionService.getPagesByIds(eventIds),
      notionService.getPagesByIds(puzzleIds),
      notionService.getPagesByIds(ownedElementIds),
      notionService.getPagesByIds(associatedElementIds)
    ]);

    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Puzzle'] || page.properties['Description'] || { title: [] }) });

    const mappedChar = {
      id: notionCharacter.id,
      name: extractTitle(properties.Name),
      type: extractSelectByName(properties, 'Type'),
      tier: extractSelectByName(properties, 'Tier'),
      logline: extractRichTextByName(properties, 'Character Logline'),
      overview: extractRichTextByName(properties, 'Overview & Key Relationships'),
      emotion: extractRichTextByName(properties, 'Emotion towards CEO & others'),
      primaryAction: extractRichTextByName(properties, 'Primary Action'),
      events: events.map(page => toIdName(page, 'Description')),
      puzzles: puzzles.map(page => toIdName(page, 'Puzzle')),
      ownedElements: ownedElements.map(page => toIdName(page, 'Name')),
      associatedElements: associatedElements.map(page => toIdName(page, 'Name')),
      connections: extractNumber(properties.Connections),
      lastEdited: notionCharacter.last_edited_time,
      // These properties don't exist in the Characters database:
      // actFocus: extractSelectByName(properties, 'Act Focus'),
      // themes: extractMultiSelectByName(properties, 'Narrative Threads'),
      // resolutionPaths: extractMultiSelectByName(properties, 'Resolution Paths'),
      linkedCharacters: [] // Computed from character_links table after sync
    };
    return mappedChar;
  } catch (error) {
    logger.error(`Error mapping character with ID ${notionCharacter?.id || 'unknown'}:`, error);

    // Return a minimal object to avoid breaking the client
    return {
      id: notionCharacter?.id || 'error',
      name: notionCharacter?.properties?.Name ? extractTitle(notionCharacter.properties.Name) : 'Error loading character',
      error: error.message
    };
  }
}

/**
 * Async version of mapTimelineEvent that fetches related entity names
 * @param {Object} notionEvent - Raw Notion timeline event object
 * @param {Object} notionService - Notion service with getPagesByIds
 * @returns {Promise<Object>} Timeline event object with related names
 */
async function mapTimelineEventWithNames(notionEvent, notionService) {
  try {
    const properties = notionEvent.properties;

    // Use helper functions for flexible property extraction
    const characterIds = extractRelationByName(properties, 'Characters Involved');
    const memoryEvidenceIds = extractRelationByName(properties, 'Memory/Evidence');

    const [characters, memoryEvidence] = await Promise.all([
      notionService.getPagesByIds(characterIds),
      notionService.getPagesByIds(memoryEvidenceIds)
    ]);

    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Description'] || { title: [] }) });

    // Extract character mentions from description if Characters Involved is empty
    const charactersInvolved = characters.map(page => toIdName(page, 'Name'));

    // If no characters in Notion relation, parse from description (@mentions)
    if (charactersInvolved.length === 0) {
      const description = extractTitle(properties.Description) || '';
      // Improved regex to match @FirstName LastName (handles two-word names)
      const characterMentions = description.match(/@([A-Za-z]+(?:\s+[A-Za-z]+)?)/g) || [];

      // For each mention, try to find matching character names
      for (const mention of characterMentions) {
        const characterName = mention.substring(1).trim(); // Remove @ symbol
        // Note: We can't fetch character IDs here without making this function more complex
        // Instead, we'll pass the names and resolve them later in the syncer
        charactersInvolved.push({ id: null, name: characterName });
      }
    }

    const mappedEvent = {
      id: notionEvent.id,
      description: extractTitle(properties.Description),
      date: extractDate(properties.Date),
      charactersInvolved: charactersInvolved,
      memoryEvidence: memoryEvidence.map(page => toIdName(page, 'Name')),
      memType: extractRichTextByName(properties, 'mem type'),
      notes: extractRichTextByName(properties, 'Notes'),
      lastEdited: notionEvent.last_edited_time
      // COMPUTED FIELDS - These don't exist in Notion, only in SQLite after computation
      // Act Focus is computed from related elements' acts, not stored in Notion
      // actFocus: extractSelectByName(properties, 'Act Focus'), // Computed field
      // themes: extractMultiSelectByName(properties, 'Narrative Threads'), // May or may not exist in Notion
      // Note: Timeline events don't have Narrative Threads - this is computed from related elements
      // narrativeThreads: extractMultiSelectByName(properties, 'Narrative Threads'), // Keep if it exists in Notion
    };
    // Debug logging removed for commented fields
    // if (mappedEvent.actFocus) logger.debug(`[GRAPH DATA MAP] Mapped actFocus: ${mappedEvent.actFocus} for event: ${mappedEvent.description}`);
    // if (mappedEvent.themes && mappedEvent.themes.length > 0) logger.debug(`[GRAPH DATA MAP] Mapped themes: ${mappedEvent.themes.join(', ')} for event: ${mappedEvent.description}`);
    return mappedEvent;
  } catch (error) {
    logger.error(`Error mapping timeline event with ID ${notionEvent?.id || 'unknown'}:`, error);

    // Return a minimal object to avoid breaking the client
    return {
      id: notionEvent?.id || 'error',
      description: notionEvent?.properties?.Description ? extractTitle(notionEvent.properties.Description) : 'Error loading event',
      error: error.message
    };
  }
}

/**
 * Async version of mapPuzzle that fetches related entity names
 * @param {Object} notionPuzzle - Raw Notion puzzle object
 * @param {Object} notionService - Notion service with getPagesByIds
 * @returns {Promise<Object>} Puzzle object with related names
 */
async function mapPuzzleWithNames(notionPuzzle, notionService) {
  try {
    const properties = notionPuzzle.properties;

    // Use helper functions for flexible property extraction
    const ownerIds = extractRelationByName(properties, 'Owner');
    const lockedItemIds = extractRelationByName(properties, 'Locked Item');
    const puzzleElementIds = extractRelationByName(properties, 'Puzzle Elements');
    const rewardIds = extractRelationByName(properties, 'Rewards');
    const parentItemIds = extractRelationByName(properties, 'Parent item');
    const subPuzzleIds = extractRelationByName(properties, 'Sub-Puzzles');
    // Note: Impacted Characters and Related Timeline Events are computed relationships,
    // not direct Notion properties. These will be computed after sync based on puzzle ownership.

    // Optimize API calls - only fetch non-empty relation arrays
    // This prevents unnecessary API calls for empty relations, improving performance significantly
    const apiCalls = [];
    const callMap = {};

    if (ownerIds.length > 0) {
      callMap.owners = apiCalls.length;
      apiCalls.push(notionService.getPagesByIds(ownerIds));
    }
    if (lockedItemIds.length > 0) {
      callMap.lockedItems = apiCalls.length;
      apiCalls.push(notionService.getPagesByIds(lockedItemIds));
    }
    if (puzzleElementIds.length > 0) {
      callMap.puzzleElements = apiCalls.length;
      apiCalls.push(notionService.getPagesByIds(puzzleElementIds));
    }
    if (rewardIds.length > 0) {
      callMap.rewards = apiCalls.length;
      apiCalls.push(notionService.getPagesByIds(rewardIds));
    }
    if (parentItemIds.length > 0) {
      callMap.parentItems = apiCalls.length;
      apiCalls.push(notionService.getPagesByIds(parentItemIds));
    }
    if (subPuzzleIds.length > 0) {
      callMap.subPuzzles = apiCalls.length;
      apiCalls.push(notionService.getPagesByIds(subPuzzleIds));
    }

    // Execute only the needed API calls with timeout protection
    const results = apiCalls.length > 0 ? await Promise.race([
      Promise.all(apiCalls),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Puzzle mapping timeout after 10 seconds')), 10000)
      )
    ]) : [];

    // Map results back to expected variables (empty arrays for skipped calls)
    const owners = callMap.owners !== undefined ? results[callMap.owners] : [];
    const lockedItems = callMap.lockedItems !== undefined ? results[callMap.lockedItems] : [];
    const puzzleElements = callMap.puzzleElements !== undefined ? results[callMap.puzzleElements] : [];
    const rewards = callMap.rewards !== undefined ? results[callMap.rewards] : [];
    const parentItems = callMap.parentItems !== undefined ? results[callMap.parentItems] : [];
    const subPuzzles = callMap.subPuzzles !== undefined ? results[callMap.subPuzzles] : [];

    // Helper to map to {id, name}
    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Puzzle'] || page.properties['Description'] || { title: [] }) });

    const mappedPuzzle = {
      id: notionPuzzle.id,
      puzzle: extractTitle(properties.Puzzle),
      owner: owners.map(page => toIdName(page, 'Name')),
      lockedItem: lockedItems.map(page => toIdName(page, 'Name')),
      puzzleElements: puzzleElements.map(page => toIdName(page, 'Name')),
      rewards: rewards.map(page => toIdName(page, 'Name')),
      storyReveals: extractRichTextByName(properties, 'Story Reveals'),
      timing: extractSelectByName(properties, 'Timing'),
      parentItem: parentItems.map(page => toIdName(page, 'Puzzle')),
      subPuzzles: subPuzzles.map(page => toIdName(page, 'Puzzle')),
      assetLink: extractUrlByName(properties, 'Asset Link'),
      description: extractRichTextByName(properties, 'Description/Solution'),
      narrativeThreads: extractMultiSelectByName(properties, 'Narrative Threads'),
      lastEdited: notionPuzzle.last_edited_time
      // COMPUTED FIELDS - These don't exist in Notion, only in SQLite after computation
      // Commenting out to prevent "Property not found" errors
      // actFocus: extractSelectByName(properties, 'Act Focus'), // Computed from timeline events
      // themes: extractMultiSelectByName(properties, 'Narrative Threads'), // Duplicate of narrativeThreads
      // resolutionPaths: extractMultiSelectByName(properties, 'Resolution Paths'), // Computed field
      // impactedCharacters: computed after sync based on ownership relationships
      // relatedTimelineEvents: computed after sync based on story reveals and timing
    };
    // Debug logging removed since fields are commented out
    // if (mappedPuzzle.actFocus) logger.debug(`[GRAPH DATA MAP] Mapped actFocus: ${mappedPuzzle.actFocus} for puzzle: ${mappedPuzzle.puzzle}`);
    // if (mappedPuzzle.themes && mappedPuzzle.themes.length > 0) logger.debug(`[GRAPH DATA MAP] Mapped themes: ${mappedPuzzle.themes.join(', ')} for puzzle: ${mappedPuzzle.puzzle}`);
    return mappedPuzzle;
  } catch (error) {
    const puzzleName = notionPuzzle?.properties?.Puzzle ? extractTitle(notionPuzzle.properties.Puzzle) : 'Unknown';
    logger.error(`[PUZZLE SYNC ERROR] Failed to map puzzle "${puzzleName}" (ID: ${notionPuzzle?.id || 'unknown'})`);
    logger.error(`[PUZZLE SYNC ERROR] Error type: ${error.name || 'Unknown'}`);
    logger.error(`[PUZZLE SYNC ERROR] Error message: ${error.message}`);

    // Log relation array sizes for debugging
    if (notionPuzzle?.properties) {
      const properties = notionPuzzle.properties;
      const relationSizes = {
        owners: extractRelationByName(properties, 'Owner').length,
        lockedItems: extractRelationByName(properties, 'Locked Item').length,
        puzzleElements: extractRelationByName(properties, 'Puzzle Elements').length,
        rewards: extractRelationByName(properties, 'Rewards').length,
        parentItems: extractRelationByName(properties, 'Parent item').length,
        subPuzzles: extractRelationByName(properties, 'Sub-Puzzles').length
      };
      logger.error('[PUZZLE SYNC ERROR] Relation sizes:', relationSizes);
    }

    // Return a minimal object to avoid breaking the client
    return {
      id: notionPuzzle?.id || 'error',
      puzzle: puzzleName,
      error: error.message
    };
  }
}

/**
 * Maps a Notion character object to a simplified overview format (ID and name only)
 * @param {Object} notionCharacter - Raw Notion character object
 * @returns {Object} Simplified character overview object
 */
function mapCharacterOverview(notionCharacter) {
  if (!notionCharacter || !notionCharacter.properties) {
    return null;
  }
  const properties = notionCharacter.properties;

  return {
    id: notionCharacter.id,
    name: extractTitle(properties.Name)
  };
}

/**
 * Async version of mapElement that fetches related entity names
 * @param {Object} notionElement - Raw Notion element object
 * @param {Object} notionService - Notion service with getPagesByIds
 * @returns {Promise<Object>} Element object with related names
 */
async function mapElementWithNames(notionElement, notionService) {
  try {
    const properties = notionElement.properties;

    // Use helper functions for flexible property extraction
    const ownerIds = extractRelationByName(properties, 'Owner');
    const containerIds = extractRelationByName(properties, 'Container');
    const contentsIds = extractRelationByName(properties, 'Contents');
    const containerPuzzleIds = extractRelationByName(properties, 'Container Puzzle');
    const requiredForIds = extractRelationByName(properties, 'Required For (Puzzle)');
    const rewardedByIds = extractRelationByName(properties, 'Rewarded by (Puzzle)');
    const timelineEventIds = extractRelationByName(properties, 'Timeline Event');
    const associatedCharacterIds = extractRelationByName(properties, 'Associated Characters');

    const [owners, containers, contents, containerPuzzles, requiredFor, rewardedBy, timelineEvents, associatedCharacters] = await Promise.all([
      notionService.getPagesByIds(ownerIds),
      notionService.getPagesByIds(containerIds),
      notionService.getPagesByIds(contentsIds),
      notionService.getPagesByIds(containerPuzzleIds),
      notionService.getPagesByIds(requiredForIds),
      notionService.getPagesByIds(rewardedByIds),
      notionService.getPagesByIds(timelineEventIds),
      notionService.getPagesByIds(associatedCharacterIds)
    ]);

    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Description'] || page.properties['Puzzle'] || { title: [] }) });

    const mappedElement = {
      id: notionElement.id,
      name: extractTitle(properties.Name),
      owner: owners.map(page => toIdName(page, 'Name')),
      basicType: extractSelectByName(properties, 'Basic Type'),
      description: extractRichTextByName(properties, 'Description/Text'),
      container: containers.map(page => toIdName(page, 'Name')),
      contents: contents.map(page => toIdName(page, 'Name')),
      containerPuzzle: containerPuzzles.map(page => toIdName(page, 'Puzzle')),
      requiredForPuzzle: requiredFor.map(page => toIdName(page, 'Puzzle')),
      rewardedByPuzzle: rewardedBy.map(page => toIdName(page, 'Puzzle')),
      timelineEvent: timelineEvents.map(page => toIdName(page, 'Description')),
      associatedCharacters: associatedCharacters.map(page => toIdName(page, 'Name')),
      narrativeThreads: extractMultiSelectByName(properties, 'Narrative Threads'),
      firstAvailable: extractSelectByName(properties, 'First Available'),
      status: extractSelectByName(properties, 'Status'),
      contentLink: extractUrlByName(properties, 'Content Link'),
      productionNotes: extractRichTextByName(properties, 'Production/Puzzle Notes'),
      lastEdited: notionElement.last_edited_time
      // COMPUTED FIELDS - These don't exist in Notion, only in SQLite after computation
      // actFocus: extractSelectByName(properties, 'First Available'), // This was wrong - Act Focus is computed, not First Available
      // themes: extractMultiSelectByName(properties, 'Narrative Threads'), // Duplicate of narrativeThreads
      // memorySets: extractMultiSelectByName(properties, 'Memory Sets'), // May not exist in Notion
      // resolutionPaths: computed field, not in Notion
    };

    // Debug logging removed for commented fields
    // if (mappedElement.actFocus) logger.debug(`[GRAPH DATA MAP] Mapped actFocus: ${mappedElement.actFocus} for element: ${mappedElement.name}`);
    // if (mappedElement.themes && mappedElement.themes.length > 0) logger.debug(`[GRAPH DATA MAP] Mapped themes: ${mappedElement.themes.join(', ')} for element: ${mappedElement.name}`);
    // if (mappedElement.memorySets && mappedElement.memorySets.length > 0) logger.debug(`[GRAPH DATA MAP] Mapped memorySets: ${mappedElement.memorySets.join(', ')} for element: ${mappedElement.name}`);

    // Parse SF_RFID from Description/Text for memory-type Elements
    const descriptionText = mappedElement.description; // Already extracted
    const basicType = mappedElement.basicType; // Already extracted

    if (descriptionText && basicType) {
      const memoryTypeKeywords = ['memory', 'rfid', 'corrupted']; // Case-insensitive check later
      const isMemoryType = memoryTypeKeywords.some(keyword => basicType.toLowerCase().includes(keyword));

      if (isMemoryType) {
        // Ensure properties object exists
        if (!mappedElement.properties) {
          mappedElement.properties = {};
        }

        // Updated regex patterns to handle [bracket] format
        const rfidRegex = /^SF_RFID:\s*\[([^\]]+)\]/m;
        const rfidMatch = descriptionText.match(rfidRegex);
        if (rfidMatch && rfidMatch[1]) {
          mappedElement.properties.parsed_sf_rfid = rfidMatch[1];
          logger.debug('[MEMORY PARSE] Found RFID:', mappedElement.properties.parsed_sf_rfid, 'for Element:', mappedElement.name);
        }

        const valueRatingRegex = /^SF_ValueRating:\s*\[([1-5])\]/m;
        const valueRatingMatch = descriptionText.match(valueRatingRegex);
        if (valueRatingMatch && valueRatingMatch[1]) {
          mappedElement.properties.sf_value_rating = parseInt(valueRatingMatch[1], 10);
          logger.debug('[MEMORY PARSE] Found SF_ValueRating:', mappedElement.properties.sf_value_rating, 'for Element:', mappedElement.name);
        }

        const memoryTypeRegex = /^SF_MemoryType:\s*\[([^\]]+)\]/im;
        const memoryTypeMatch = descriptionText.match(memoryTypeRegex);
        if (memoryTypeMatch && memoryTypeMatch[1]) {
          mappedElement.properties.sf_memory_type = memoryTypeMatch[1];
          logger.debug('[MEMORY PARSE] Found SF_MemoryType:', mappedElement.properties.sf_memory_type, 'for Element:', mappedElement.name);
        }

        // NEW: Extract SF_Group with multiplier parsing
        const groupRegex = /^SF_Group:\s*\[([^\]]+)\]/im;
        const groupMatch = descriptionText.match(groupRegex);
        if (groupMatch && groupMatch[1]) {
          const groupValue = groupMatch[1];
          mappedElement.properties.sf_group = groupValue;

          // Parse multiplier from patterns like "Ephemeral Echo (x10)"
          const multiplierRegex = /\(x(\d+(?:\.\d+)?)\)/i;
          const multiplierMatch = groupValue.match(multiplierRegex);
          if (multiplierMatch && multiplierMatch[1]) {
            mappedElement.properties.sf_group_multiplier = parseFloat(multiplierMatch[1]);
            logger.debug('[MEMORY PARSE] Found SF_Group with multiplier:', groupValue, 'x' + mappedElement.properties.sf_group_multiplier, 'for Element:', mappedElement.name);
          } else {
            mappedElement.properties.sf_group_multiplier = 1.0; // Default multiplier
            logger.debug('[MEMORY PARSE] Found SF_Group (no multiplier):', groupValue, 'for Element:', mappedElement.name);
          }
        }
      }
    }

    return mappedElement;
  } catch (error) {
    logger.error(`Error mapping element with ID ${notionElement?.id || 'unknown'}:`, error);

    // Return a minimal object to avoid breaking the client
    return {
      id: notionElement?.id || 'error',
      name: notionElement?.properties?.Name ? extractTitle(notionElement.properties.Name) : 'Error loading element',
      error: error.message
    };
  }
}

module.exports = {
  extractTitle,
  extractRichText,
  extractSelect,
  extractMultiSelect,
  extractRelation,
  extractUrl,
  extractDate,
  extractNumber,
  mapCharacter,
  mapTimelineEvent,
  mapPuzzle,
  mapCharacterOverview,
  mapPuzzleWithNames,
  mapCharacterWithNames,
  mapTimelineEventWithNames,
  mapElementWithNames,
  getProperty,
  extractRelationByName,
  extractRichTextByName,
  extractSelectByName,
  extractMultiSelectByName,
  extractUrlByName
};