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
const mapCharacter = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    tier: props['Tier']?.select?.name,
    logline: getPlainText(props['Character_Logline']?.rich_text),
    event_ids: getRelationIds(props['Events']?.relation), // Assuming 'Events' is the relation prop name
    puzzle_ids: getRelationIds(props['Character Puzzles']?.relation), // Assuming 'Character Puzzles'
    owned_element_ids: getRelationIds(props['Owned_Elements']?.relation), // Assuming 'Owned Elements'
    associated_element_ids: getRelationIds(props['Associated Elements']?.relation), // Assuming 'Associated Elements'
    // Add other character-specific properties as needed
  };
};

/**
 * Maps Notion page properties to a TimelineEvent object.
 */
const mapTimelineEvent = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  // Date handling: Notion date property can be start/end.
  // For journey engine, we need a single point in time or a way to derive minutes.
  // Assuming 'Date' property contains a start date.
  const dateValue = props['Date']?.date?.start; // e.g., "2023-10-26T12:00:00.000Z" or "2023-10-26"

  return {
    id: notionPage.id,
    name: getPlainText(props['Description']?.title), // Corrected from 'Name' to 'Description'
    description: getPlainText(props['Description']?.rich_text),
    date: dateValue, // Keep raw date string for now, parsing will be in journeyEngine or service
    character_ids: getRelationIds(props['Characters_Involved']?.relation), // Relation to characters
    element_ids: getRelationIds(props['Memory_Evidence']?.relation), // Relation to elements
    // Add other event-specific properties
  };
};

/**
 * Maps Notion page properties to a Puzzle object.
 */
const mapPuzzle = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  return {
    id: notionPage.id,
    name: getPlainText(props['Puzzle']?.title), // Corrected from 'Name' to 'Puzzle'
    description: getPlainText(props['Description']?.rich_text),
    timing: props['Timing']?.select?.name, // Corrected from rich_text to select
    character_ids: getRelationIds(props['Owner']?.relation), // Corrected from 'Characters'
    element_ids: getRelationIds(props['Rewards']?.relation), // Corrected from 'Elements Involved'
    sub_puzzle_ids: getRelationIds(props['Sub-Puzzles']?.relation), // Relation to other puzzles
    // Add other puzzle-specific properties
  };
};

/**
 * Maps Notion page properties to an Element object.
 */
const mapElement = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;

  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    type: props['Basic_Type']?.select?.name, // Corrected from 'Type'
    description: getPlainText(props['Description_Text']?.rich_text), // Corrected from 'Description'
    character_ids: getRelationIds(props['Owner']?.relation), // Corrected from 'Characters'
    // Add other element-specific properties
  };
};

/**
 * Simplified mapper for character overviews (e.g., for lists).
 */
const mapCharacterOverview = (notionPage) => {
  if (!notionPage || !notionPage.properties) return null;
  const props = notionPage.properties;
  return {
    id: notionPage.id,
    name: getPlainText(props['Name']?.title),
    // tier: props['Tier']?.select?.name, // Optional: include if needed for overview
  };
};

module.exports = {
    getPlainText,
    getRelationId,
    getRelationIds,
    mapCharacter,
    mapTimelineEvent,
    mapPuzzle,
    mapElement,
    mapCharacterOverview
};
