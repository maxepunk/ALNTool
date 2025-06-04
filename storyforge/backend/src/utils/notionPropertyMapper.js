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
    lastEdited: notionCharacter.last_edited_time,
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
    lastEdited: notionEvent.last_edited_time,
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
    lastEdited: notionPuzzle.last_edited_time,
  };
}

/**
 * Maps a Notion element object to a simplified format
 * @param {Object} notionElement - Raw Notion element object
 * @returns {Object} Simplified element object
 */
function mapElement(notionElement) {
  const properties = notionElement.properties;
  
  return {
    id: notionElement.id,
    name: extractTitle(properties.Name),
    owner: properties.Owner ? extractRelation(properties.Owner) : [],
    basicType: extractSelect(properties.Basic_Type),
    description: properties.Description_Text ? extractRichText(properties.Description_Text) : '',
    container: properties.Container ? extractRelation(properties.Container) : [],
    contents: properties.Contents ? extractRelation(properties.Contents) : [],
    containerPuzzle: properties.Container_Puzzle ? extractRelation(properties.Container_Puzzle) : [],
    requiredForPuzzle: properties.Required_For ? extractRelation(properties.Required_For) : [],
    rewardedByPuzzle: properties.Rewarded_by ? extractRelation(properties.Rewarded_by) : [],
    timelineEvent: properties.Timeline_Event ? extractRelation(properties.Timeline_Event) : [],
    associatedCharacters: properties.Associated_Characters ? extractRelation(properties.Associated_Characters) : [],
    narrativeThreads: properties.Narrative_Threads ? extractMultiSelect(properties.Narrative_Threads) : [],
    firstAvailable: extractSelect(properties.First_Available),
    status: extractSelect(properties.Status),
    contentLink: extractUrl(properties.Content_Link),
    productionNotes: properties.Production_Puzzle_Notes ? extractRichText(properties.Production_Puzzle_Notes) : '',
    lastEdited: notionElement.last_edited_time,
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
  console.warn(`Property "${propertyName}" not found in Notion object. Available properties: ${Object.keys(properties).join(', ')}`);
  
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
    const linkedCharacterIds = extractRelationByName(properties, 'Linked Characters'); // New for sociogram

    const [
      events,
      puzzles,
      ownedElements,
      associatedElements,
      linkedCharactersPages // New
    ] = await Promise.all([
      notionService.getPagesByIds(eventIds),
      notionService.getPagesByIds(puzzleIds),
      notionService.getPagesByIds(ownedElementIds),
      notionService.getPagesByIds(associatedElementIds),
      notionService.getPagesByIds(linkedCharacterIds), // New
    ]);

    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Puzzle'] || page.properties['Description'] || { title: [] }) });

    return {
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
      // Existing new properties
      actFocus: extractSelectByName(properties, 'Act Focus'),
      themes: extractMultiSelectByName(properties, 'Themes'),
      memorySets: extractMultiSelectByName(properties, 'Memory Sets'),
      // New properties for sociogram
      linkedCharacters: linkedCharactersPages.map(page => toIdName(page, 'Name')),
      resolutionPaths: extractMultiSelectByName(properties, 'Resolution Paths'),
      // Ensure Narrative Threads is present
      narrativeThreads: extractMultiSelectByName(properties, 'Narrative Threads'),
    };
  } catch (error) {
    console.error(`Error mapping character with ID ${notionCharacter?.id || 'unknown'}:`, error);
    
    // Return a minimal object to avoid breaking the client
    return {
      id: notionCharacter?.id || 'error',
      name: notionCharacter?.properties?.Name ? extractTitle(notionCharacter.properties.Name) : 'Error loading character',
      error: error.message,
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
      notionService.getPagesByIds(memoryEvidenceIds),
    ]);

    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Description'] || { title: [] }) });

    return {
      id: notionEvent.id,
      description: extractTitle(properties.Description),
      date: extractDate(properties.Date),
      charactersInvolved: characters.map(page => toIdName(page, 'Name')),
      memoryEvidence: memoryEvidence.map(page => toIdName(page, 'Name')),
      memType: extractRichTextByName(properties, 'mem type'),
      notes: extractRichTextByName(properties, 'Notes'),
      lastEdited: notionEvent.last_edited_time,
      // New properties
      actFocus: extractSelectByName(properties, 'Act Focus'),
      themes: extractMultiSelectByName(properties, 'Themes'),
      // memorySets might not be directly on Timeline events, but associated via Elements
      // Ensure Narrative Threads is present
      narrativeThreads: extractMultiSelectByName(properties, 'Narrative Threads'),
    };
  } catch (error) {
    console.error(`Error mapping timeline event with ID ${notionEvent?.id || 'unknown'}:`, error);
    
    // Return a minimal object to avoid breaking the client
    return {
      id: notionEvent?.id || 'error',
      description: notionEvent?.properties?.Description ? extractTitle(notionEvent.properties.Description) : 'Error loading event',
      error: error.message,
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
    // New relations for narrative cohesion
    const impactedCharacterIds = extractRelationByName(properties, 'Impacted Characters');
    const relatedTimelineEventIds = extractRelationByName(properties, 'Related Timeline Events');


    // Fetch related entities in parallel
    const [
      owners,
      lockedItems,
      puzzleElements,
      rewards,
      parentItems,
      subPuzzles,
      impactedCharactersPages, // New
      relatedTimelineEventPages // New
    ] = await Promise.all([
      notionService.getPagesByIds(ownerIds),
      notionService.getPagesByIds(lockedItemIds),
      notionService.getPagesByIds(puzzleElementIds),
      notionService.getPagesByIds(rewardIds),
      notionService.getPagesByIds(parentItemIds),
      notionService.getPagesByIds(subPuzzleIds),
      notionService.getPagesByIds(impactedCharacterIds), // New
      notionService.getPagesByIds(relatedTimelineEventIds), // New
    ]);

    // Helper to map to {id, name}
    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Puzzle'] || page.properties['Description'] || { title: [] }) });

    return {
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
      lastEdited: notionPuzzle.last_edited_time,
      // Existing new properties
      actFocus: extractSelectByName(properties, 'Act Focus'),
      themes: extractMultiSelectByName(properties, 'Themes'),
      memorySets: extractMultiSelectByName(properties, 'Memory Sets'),
      // Properties for narrative cohesion
      impactedCharacters: impactedCharactersPages.map(page => toIdName(page, 'Name')),
      relatedTimelineEvents: relatedTimelineEventPages.map(page => toIdName(page, 'Description')),
      resolutionPaths: extractMultiSelectByName(properties, 'Resolution Paths'),
    };
  } catch (error) {
    console.error(`Error mapping puzzle with ID ${notionPuzzle?.id || 'unknown'}:`, error);
    
    // Return a minimal object to avoid breaking the client
    return {
      id: notionPuzzle?.id || 'error',
      puzzle: notionPuzzle?.properties?.Puzzle ? extractTitle(notionPuzzle.properties.Puzzle) : 'Error loading puzzle',
      error: error.message,
    };
  }
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
      notionService.getPagesByIds(associatedCharacterIds),
    ]);

    const toIdName = (page, titleProp = 'Name') => ({ id: page.id, name: extractTitle(page.properties[titleProp] || page.properties['Description'] || page.properties['Puzzle'] || { title: [] }) });

    return {
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
      lastEdited: notionElement.last_edited_time,
      // Existing new properties
      actFocus: extractSelectByName(properties, 'Act Focus'),
      themes: extractMultiSelectByName(properties, 'Themes'),
      memorySets: extractMultiSelectByName(properties, 'Memory Set'), // Corrected to "Memory Set"
      // Ensure Narrative Threads is present (it was already correctly here)
      narrativeThreads: extractMultiSelectByName(properties, 'Narrative Threads'),
      // Ensure no sociogram properties are here
      // linkedCharacters: undefined,
      // resolutionPaths: undefined,
    };
  } catch (error) {
    console.error(`Error mapping element with ID ${notionElement?.id || 'unknown'}:`, error);
    
    // Return a minimal object to avoid breaking the client
    return {
      id: notionElement?.id || 'error',
      name: notionElement?.properties?.Name ? extractTitle(notionElement.properties.Name) : 'Error loading element',
      error: error.message,
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
  mapElement,
  mapPuzzleWithNames,
  mapCharacterWithNames,
  mapTimelineEventWithNames,
  mapElementWithNames,
  getProperty,
  extractRelationByName,
  extractRichTextByName,
  extractSelectByName,
  extractMultiSelectByName,
  extractUrlByName,
}; 