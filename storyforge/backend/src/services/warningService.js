const notionService = require('./notionService');
const propertyMapper = require('../utils/notionPropertyMapper');
const logger = require('../utils/logger');

/**
 * Generates warnings for puzzles based on business rules
 */
async function getPuzzleWarnings() {
  const puzzles = await notionService.getPuzzles();
  const puzzlesWithWarnings = [];

  for (const puzzle of puzzles) {
    const mappedPuzzle = await propertyMapper.mapPuzzleWithNames(puzzle, notionService);
    const warnings = [];

    // Check if puzzle has no elements
    if (!mappedPuzzle.puzzleElements || mappedPuzzle.puzzleElements.length === 0) {
      warnings.push({
        warningType: 'NoElements',
        message: 'Puzzle has no required elements.'
      });
    }

    // Check if puzzle has no rewards
    if (!mappedPuzzle.rewards || mappedPuzzle.rewards.length === 0) {
      warnings.push({
        warningType: 'NoRewards',
        message: 'Puzzle has no rewards.'
      });
    }

    // Check if puzzle has no owner
    if (!mappedPuzzle.owner || mappedPuzzle.owner.length === 0) {
      warnings.push({
        warningType: 'NoOwner',
        message: 'Puzzle has no assigned owner.'
      });
    }

    // Check if puzzle has no narrative threads
    if (!mappedPuzzle.narrativeThreads || mappedPuzzle.narrativeThreads.length === 0) {
      warnings.push({
        warningType: 'NoNarrativeThreads',
        message: 'Puzzle is not part of any narrative threads.'
      });
    }

    if (warnings.length > 0) {
      puzzlesWithWarnings.push({
        id: mappedPuzzle.id,
        name: mappedPuzzle.puzzle,
        type: 'Puzzle',
        warnings,
        timing: mappedPuzzle.timing,
        owner: mappedPuzzle.owner,
        narrativeThreads: mappedPuzzle.narrativeThreads
      });
    }
  }

  return puzzlesWithWarnings;
}

/**
 * Generates warnings for elements based on business rules
 */
async function getElementWarnings() {
  const notionElements = await notionService.getElements();
  const mappedElements = await Promise.all(
    notionElements.map(element => propertyMapper.mapElementWithNames(element, notionService))
  );

  const EXCLUDED_BASIC_TYPES = ['Character Sheet', 'Set Dressing', 'Core Narrative'];
  const elementsWithWarnings = [];

  for (const element of mappedElements) {
    if (element.error) {
      continue;
    }

    if (EXCLUDED_BASIC_TYPES.includes(element.basicType)) {
      continue;
    }

    const warnings = [];
    const isRequired = element.requiredForPuzzle && element.requiredForPuzzle.length > 0;
    const isReward = element.rewardedByPuzzle && element.rewardedByPuzzle.length > 0;

    if (!isRequired && !isReward) {
      warnings.push({
        warningType: 'NotUsedInOrRewardingPuzzles',
        message: 'Element is not used as an input for any puzzle and is not a reward from any puzzle.'
      });
    }

    const isMemoryToken = element.basicType?.toLowerCase().includes('memory') || element.basicType?.toLowerCase().includes('token');
    if (isMemoryToken && (!element.memorySets || element.memorySets.length === 0)) {
      warnings.push({
        warningType: 'NoMemorySet',
        message: 'Memory Token is not part of any Memory Set.'
      });
    }

    if (warnings.length > 0) {
      elementsWithWarnings.push({
        id: element.id,
        name: element.name,
        type: 'Element',
        basicType: element.basicType,
        status: element.status,
        owner: element.owner,
        warnings
      });
    }
  }

  return elementsWithWarnings;
}

/**
 * Generates warnings for characters based on business rules
 */
async function getCharacterWarnings() {
  const characters = await notionService.getCharactersForList();
  const charactersWithWarnings = [];

  for (const character of characters) {
    const warnings = [];

    // Check if character has no puzzles
    if (!character.puzzles || character.puzzles.length === 0) {
      warnings.push({
        warningType: 'NoPuzzles',
        message: 'Character is not associated with any puzzles.'
      });
    }

    // Check if character has no narrative threads
    if (!character.narrativeThreads || character.narrativeThreads.length === 0) {
      warnings.push({
        warningType: 'NoNarrativeThreads',
        message: 'Character is not part of any narrative threads.'
      });
    }

    // Check if character has no description
    if (!character.description || character.description.trim() === '') {
      warnings.push({
        warningType: 'NoDescription',
        message: 'Character has no description.'
      });
    }

    if (warnings.length > 0) {
      charactersWithWarnings.push({
        id: character.id,
        name: character.name,
        type: 'Character',
        warnings,
        description: character.description,
        location: character.location,
        status: character.status
      });
    }
  }

  return charactersWithWarnings;
}

module.exports = {
  getPuzzleWarnings,
  getElementWarnings,
  getCharacterWarnings
};