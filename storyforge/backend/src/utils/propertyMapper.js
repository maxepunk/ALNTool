// storyforge/backend/src/utils/propertyMapper.js

/**
 * Extracts the plain text from a Notion rich_text array.
 * @param {Array<Object>} richTextArray - Notion rich_text property array.
 * @returns {string} Plain text content.
 */
const getPlainText = (richTextArray) => {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(rt => rt.plain_text).join('');
};

/**
 * Extracts the ID from a Notion relation array (takes the first one if multiple).
 * @param {Array<Object>} relationArray - Notion relation property array.
 * @returns {string|null} ID of the first related page, or null.
 */
const getRelationId = (relationArray) => {
  if (!relationArray || !Array.isArray(relationArray) || relationArray.length === 0) return null;
  return relationArray[0].id; // Assuming single relation, or taking the first
};

/**
 * Extracts all IDs from a Notion relation array.
 * @param {Array<Object>} relationArray - Notion relation property array.
 * @returns {Array<string>} Array of IDs of related pages.
 */
const getRelationIds = (relationArray) => {
  if (!relationArray || !Array.isArray(relationArray)) return [];
  return relationArray.map(rel => rel.id);
};

/**
 * Maps Notion page properties to a Character object.
 * Assumes specific property names in Notion (e.g., 'Name', 'Tier', 'Events Relation', etc.)
 */
export const mapCharacter = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    tier: props['Tier']?.select?.name,
    logline: getPlainText(props['Logline']?.rich_text),
    event_ids: getRelationIds(props['Events']?.relation), // Assuming 'Events' is the relation prop name
    puzzle_ids: getRelationIds(props['Character Puzzles']?.relation), // Assuming 'Character Puzzles'
    owned_element_ids: getRelationIds(props['Owned Elements']?.relation), // Assuming 'Owned Elements'
    associated_element_ids: getRelationIds(props['Associated Elements']?.relation), // Assuming 'Associated Elements'
    // Add other character-specific properties as needed
  };
};

/**
 * Maps Notion page properties to a TimelineEvent object.
 */
export const mapTimelineEvent = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  // Date handling: Notion date property can be start/end.
  // For journey engine, we need a single point in time or a way to derive minutes.
  // Assuming 'Date' property contains a start date.
  const dateValue = props['Date']?.date?.start; // e.g., "2023-10-26T12:00:00.000Z" or "2023-10-26"

  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title), // Assuming events also have a name/title
    description: getPlainText(props['Description']?.rich_text),
    date: dateValue, // Keep raw date string for now, parsing will be in journeyEngine or service
    character_ids: getRelationIds(props['Characters']?.relation), // Relation to characters
    element_ids: getRelationIds(props['Elements']?.relation), // Relation to elements
    // Add other event-specific properties
  };
};

/**
 * Maps Notion page properties to a Puzzle object.
 */
export const mapPuzzle = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    description: getPlainText(props['Description']?.rich_text),
    timing: getPlainText(props['Timing']?.rich_text), // e.g., "Minute 30", "Between Event A and B"
                                                      // Needs robust parsing in journeyEngine
    character_ids: getRelationIds(props['Characters']?.relation),
    element_ids: getRelationIds(props['Elements Involved']?.relation), // Assuming 'Elements Involved'
    sub_puzzle_ids: getRelationIds(props['Sub-Puzzles']?.relation), // Relation to other puzzles
    // Add other puzzle-specific properties
  };
};

/**
 * Maps Notion page properties to an Element object.
 */
export const mapElement = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    type: props['Type']?.select?.name,
    description: getPlainText(props['Description']?.rich_text),
    character_ids: getRelationIds(props['Characters']?.relation), // If elements are linked to characters
    // Add other element-specific properties
  };
};

/**
 * Simplified mapper for character overviews (e.g., for lists).
 */
export const mapCharacterOverview = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;
  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    // tier: props['Tier']?.select?.name, // Optional: include if needed for overview
  };
};
