/**
 * narrativeAnalysis.js
 * Core narrative analysis utilities for About Last Night
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx to create reusable,
 * testable functions for narrative coherence analysis.
 */

import { 
  NARRATIVE_THREADS, 
  THREAD_KEYWORDS, 
  COHERENCE_THRESHOLDS 
} from './narrativeConstants';

/**
 * Categorizes a single entity by narrative threads based on keyword matching
 * @param {Object} entity - The entity to categorize (character, element, puzzle, timeline event)
 * @param {string} entityType - Type of entity for relevance scoring
 * @returns {Object} Thread categorizations with relevance scores
 */
export const categorizeEntityByThreads = (entity, entityType = 'general') => {
  const name = (entity.name || '').toLowerCase();
  const description = (entity.description || '').toLowerCase();
  const content = `${name} ${description}`;
  
  const categorizations = {};
  
  Object.keys(THREAD_KEYWORDS).forEach(thread => {
    const keywords = THREAD_KEYWORDS[thread];
    const matchedKeywords = keywords.filter(keyword => content.includes(keyword));
    
    if (matchedKeywords.length > 0) {
      categorizations[thread] = {
        relevanceScore: matchedKeywords.length,
        threadConnection: matchedKeywords,
        entity: {
          ...entity,
          relevanceScore: matchedKeywords.length,
          threadConnection: matchedKeywords
        }
      };
    }
  });
  
  return categorizations;
};

/**
 * Categorizes all entities into narrative thread maps
 * @param {Object} data - Object containing arrays of entities { characters, elements, puzzles, timelineEvents }
 * @returns {Object} Thread maps with categorized entities
 */
export const categorizeByThreads = (data) => {
  const { characters = [], elements = [], puzzles = [], timelineEvents = [] } = data;
  
  // Initialize thread maps
  const threadMaps = {};
  Object.keys(NARRATIVE_THREADS).forEach(thread => {
    threadMaps[thread] = {
      characters: [],
      elements: [],
      puzzles: [],
      timelineEvents: [],
      connections: 0,
      coherenceScore: 0
    };
  });

  // Categorize characters
  characters.forEach(char => {
    const categorizations = categorizeEntityByThreads(char, 'character');
    Object.keys(categorizations).forEach(thread => {
      threadMaps[thread].characters.push(categorizations[thread].entity);
    });
  });

  // Categorize elements
  elements.forEach(element => {
    const categorizations = categorizeEntityByThreads(element, 'element');
    Object.keys(categorizations).forEach(thread => {
      threadMaps[thread].elements.push(categorizations[thread].entity);
    });
  });

  // Categorize puzzles
  puzzles.forEach(puzzle => {
    const categorizations = categorizeEntityByThreads(puzzle, 'puzzle');
    Object.keys(categorizations).forEach(thread => {
      threadMaps[thread].puzzles.push(categorizations[thread].entity);
    });
  });

  // Categorize timeline events
  timelineEvents.forEach(event => {
    const categorizations = categorizeEntityByThreads(event, 'timeline');
    Object.keys(categorizations).forEach(thread => {
      threadMaps[thread].timelineEvents.push(categorizations[thread].entity);
    });
  });

  return threadMaps;
};

/**
 * Calculates cross-connections between different content types within a thread
 * @param {Object} threadData - Thread data containing characters, elements, puzzles, timelineEvents
 * @returns {number} Number of cross-connections found
 */
export const calculateCrossConnections = (threadData) => {
  let connections = 0;
  
  // Characters to elements connections
  threadData.characters.forEach(char => {
    threadData.elements.forEach(element => {
      if (element.ownedByCharacter && element.ownedByCharacter.some(owner => owner.id === char.id)) {
        connections++;
      }
    });
  });

  // Characters to puzzles connections
  threadData.characters.forEach(char => {
    threadData.puzzles.forEach(puzzle => {
      if (puzzle.solvedByCharacter && puzzle.solvedByCharacter.some(solver => solver.id === char.id)) {
        connections++;
      }
    });
  });

  // Elements to puzzles connections
  threadData.elements.forEach(element => {
    threadData.puzzles.forEach(puzzle => {
      if (puzzle.puzzleElements && puzzle.puzzleElements.some(pe => pe.id === element.id)) {
        connections++;
      }
    });
  });

  return connections;
};

/**
 * Calculates coherence metrics for a single thread
 * @param {Object} threadData - Thread data containing entities and connections
 * @param {Object} threadConfig - Thread configuration from NARRATIVE_THREADS
 * @returns {Object} Coherence metrics including score, density, and coverage
 */
export const calculateThreadCoherence = (threadData, threadConfig) => {
  const totalItems = threadData.characters.length + threadData.elements.length + 
                    threadData.puzzles.length + threadData.timelineEvents.length;
  
  const connections = calculateCrossConnections(threadData);
  
  // Update thread data with connections
  threadData.connections = connections;

  // Calculate coherence score (0-100)
  // Density score: how interconnected the content is
  const densityScore = totalItems > 0 ? Math.min(100, (connections / totalItems) * 20) : 0;
  
  // Balance score: how evenly distributed content is across types
  const balanceScore = totalItems > 0 ? Math.min(100, 
    100 - Math.abs(25 - (threadData.characters.length / totalItems * 100)) -
    Math.abs(25 - (threadData.elements.length / totalItems * 100)) -
    Math.abs(25 - (threadData.puzzles.length / totalItems * 100)) -
    Math.abs(25 - (threadData.timelineEvents.length / totalItems * 100))
  ) : 0;
  
  const coherenceScore = Math.round((densityScore + balanceScore) / 2);
  
  // Update thread data with score
  threadData.coherenceScore = coherenceScore;

  return {
    totalItems,
    connections,
    coherenceScore,
    density: totalItems > 0 ? connections / totalItems : 0,
    coverage: {
      characters: threadData.characters.length,
      elements: threadData.elements.length,
      puzzles: threadData.puzzles.length,
      timelineEvents: threadData.timelineEvents.length
    }
  };
};

/**
 * Calculates coherence metrics for all threads
 * @param {Object} threadMaps - Maps of entities categorized by thread
 * @returns {Object} Complete coherence metrics for all threads
 */
export const calculateCoherenceMetrics = (threadMaps) => {
  const coherenceMetrics = {};
  
  Object.keys(NARRATIVE_THREADS).forEach(thread => {
    const threadData = threadMaps[thread];
    const threadConfig = NARRATIVE_THREADS[thread];
    
    coherenceMetrics[thread] = calculateThreadCoherence(threadData, threadConfig);
  });

  return coherenceMetrics;
};

/**
 * Identifies story gaps and narrative issues
 * @param {Object} coherenceMetrics - Coherence metrics for all threads
 * @returns {Array} List of identified story gaps with severity and impact
 */
export const identifyStoryGaps = (coherenceMetrics) => {
  const storyGaps = [];
  
  Object.keys(NARRATIVE_THREADS).forEach(thread => {
    const metrics = coherenceMetrics[thread];
    const threadConfig = NARRATIVE_THREADS[thread];
    
    // Critical coherence issues
    if (metrics.coherenceScore < COHERENCE_THRESHOLDS.CRITICAL && threadConfig.priority === 'critical') {
      storyGaps.push({
        type: 'critical-coherence',
        thread,
        severity: 'error',
        message: `Critical narrative thread "${thread}" has low coherence (${metrics.coherenceScore}%)`,
        impact: 'Story may feel disconnected or confusing'
      });
    }
    
    // Insufficient content issues
    if (metrics.totalItems < COHERENCE_THRESHOLDS.MIN_ELEMENTS_PER_THREAD && threadConfig.priority !== 'medium') {
      storyGaps.push({
        type: 'insufficient-content',
        thread,
        severity: 'warning',
        message: `Narrative thread "${thread}" has insufficient content (${metrics.totalItems} items)`,
        impact: 'Thread may feel underdeveloped'
      });
    }
    
    // Isolated content issues
    if (metrics.connections === 0 && metrics.totalItems > 0) {
      storyGaps.push({
        type: 'isolated-content',
        thread,
        severity: 'warning',
        message: `Narrative thread "${thread}" has no cross-connections`,
        impact: 'Content feels isolated from the main story'
      });
    }
  });

  return storyGaps;
};

/**
 * Generates recommendations based on story gaps
 * @param {Array} storyGaps - List of identified story gaps
 * @returns {Array} List of actionable recommendations
 */
export const generateRecommendations = (storyGaps) => {
  const recommendations = [];
  
  storyGaps.forEach(gap => {
    if (gap.type === 'critical-coherence') {
      recommendations.push({
        type: 'enhance-connections',
        message: `Add more cross-references between characters, elements, and puzzles in ${gap.thread}`,
        action: `Review ${gap.thread} content and create stronger narrative links`
      });
    }
    
    if (gap.type === 'insufficient-content') {
      recommendations.push({
        type: 'expand-content',
        message: `Consider adding more elements or puzzles to strengthen ${gap.thread}`,
        action: `Design additional content that supports the ${gap.thread} narrative`
      });
    }
    
    if (gap.type === 'isolated-content') {
      recommendations.push({
        type: 'create-connections',
        message: `Link ${gap.thread} content to characters and other story elements`,
        action: `Add character ownership or puzzle relationships to ${gap.thread} elements`
      });
    }
  });

  return recommendations;
};

/**
 * Calculates overall narrative coherence score
 * @param {Object} coherenceMetrics - Coherence metrics for all threads
 * @returns {number} Overall score (0-100)
 */
export const calculateOverallScore = (coherenceMetrics) => {
  const threadScores = Object.values(coherenceMetrics).map(m => m.coherenceScore);
  return threadScores.length > 0 ? 
    Math.round(threadScores.reduce((sum, score) => sum + score, 0) / threadScores.length) : 0;
};

/**
 * Main analysis function that orchestrates the complete narrative analysis
 * @param {Object} data - Object containing arrays of entities { characters, elements, puzzles, timelineEvents }
 * @returns {Object} Complete narrative analysis results
 */
export const analyzeNarrativeCoherence = (data) => {
  // Early return if no data
  if (!data.characters || !data.elements || !data.puzzles || !data.timelineEvents) {
    return {
      threadMaps: {},
      coherenceMetrics: {},
      storyGaps: [],
      recommendations: [],
      overallScore: 0
    };
  }

  // Categorize content into narrative threads
  const threadMaps = categorizeByThreads(data);
  
  // Calculate coherence metrics
  const coherenceMetrics = calculateCoherenceMetrics(threadMaps);
  
  // Identify story gaps
  const storyGaps = identifyStoryGaps(coherenceMetrics);
  
  // Generate recommendations
  const recommendations = generateRecommendations(storyGaps);
  
  // Calculate overall score
  const overallScore = calculateOverallScore(coherenceMetrics);

  return {
    threadMaps,
    coherenceMetrics,
    storyGaps,
    recommendations,
    overallScore
  };
};

/**
 * Legacy support function for processing thread-specific data
 * @param {string} selectedThread - Selected thread name
 * @param {Object} legacyData - Legacy data structure
 * @returns {Object} Processed chronological entries and orphaned items
 */
export const processLegacyNarrativeData = (selectedThread, legacyData) => {
  const { 
    characters: legacyCharactersData = [], 
    elements: legacyElementsData = [], 
    puzzles: legacyPuzzlesData = [], 
    timelineEvents: legacyTimelineEventsData = [] 
  } = legacyData;

  if (!selectedThread || !legacyTimelineEventsData.length) {
    return { 
      chronologicalEntries: [], 
      orphanedItems: { characters: [], elements: [], puzzles: [] } 
    };
  }

  const allCharsMap = new Map(legacyCharactersData.map(c => [c.id, c]));
  const allElemsMap = new Map(legacyElementsData.map(e => [e.id, e]));
  const allPuzzlesMap = new Map(legacyPuzzlesData.map(p => [p.id, p]));

  const associatedItemIds = new Set();

  const sortedEvents = [...legacyTimelineEventsData].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateA - dateB;
  });

  const chronologicalEntries = sortedEvents.map(event => {
    const entry = {
      type: 'TimelineEventEntry',
      event,
      associatedCharacters: [],
      associatedElements: [],
      associatedPuzzles: [],
    };

    (event.charactersInvolved || []).forEach(charRef => {
      if (allCharsMap.has(charRef.id)) {
        entry.associatedCharacters.push(allCharsMap.get(charRef.id));
        associatedItemIds.add(charRef.id);
      }
    });
    
    (event.memoryEvidence || []).forEach(elemRef => {
      if (allElemsMap.has(elemRef.id)) {
        entry.associatedElements.push(allElemsMap.get(elemRef.id));
        associatedItemIds.add(elemRef.id);
      }
    });
    
    legacyPuzzlesData.forEach(puzzle => {
      if (puzzle.properties?.actFocus && event.properties?.actFocus && 
          puzzle.properties.actFocus === event.properties.actFocus) {
        if (allPuzzlesMap.has(puzzle.id) && !entry.associatedPuzzles.find(p => p.id === puzzle.id)) {
           entry.associatedPuzzles.push(allPuzzlesMap.get(puzzle.id));
           associatedItemIds.add(puzzle.id);
        }
      }
    });
    
    return entry;
  });

  const orphanedItems = {
    characters: legacyCharactersData.filter(c => !associatedItemIds.has(c.id)),
    elements: legacyElementsData.filter(e => !associatedItemIds.has(e.id)),
    puzzles: legacyPuzzlesData.filter(p => !associatedItemIds.has(p.id)),
  };

  return { chronologicalEntries, orphanedItems };
};