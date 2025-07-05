/**
 * MSW (Mock Service Worker) handlers for API mocking during tests
 * These handlers mock our backend API endpoints for reliable testing
 */

import { http, HttpResponse } from 'msw';
import { mockGameConstants } from '../test-utils.js';

import logger from '../../utils/logger';
// Base API URL - matches our production API
const API_BASE = 'http://localhost:3001/api';
// For relative URLs in tests
const RELATIVE_API = '/api';
// For absolute URLs in test environment
const TEST_API = 'http://localhost/api';

export const handlers = [
  // Game Constants API endpoint
  http.get(`${API_BASE}/game-constants`, () => {
    return HttpResponse.json({
      success: true,
      data: mockGameConstants,
      cached: false,
      timestamp: new Date().toISOString()
    });
  }),
  
  // Also handle relative URL for tests
  http.get(`${RELATIVE_API}/game-constants`, () => {
    return HttpResponse.json({
      success: true,
      data: mockGameConstants,
      cached: false,
      timestamp: new Date().toISOString()
    });
  }),

  // Mock error response for testing error states
  http.get(`${API_BASE}/game-constants-error`, () => {
    return HttpResponse.json(
      { error: 'Failed to fetch game constants' },
      { status: 500 }
    );
  }),

  // Characters API - Basic mock for testing
  http.get(`${API_BASE}/characters`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'char-1',
          name: 'Test Character 1',
          type: 'NPC',
          tier: 'Core',
          resolutionPaths: ['Black Market'],
          character_links: [{ id: 'char-2', name: 'Test Character 2' }],
          ownedElements: [],
          events: []
        },
        {
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Tier 2',
          resolutionPaths: ['Detective', 'Black Market'],
          character_links: [{ id: 'char-alex', name: 'Alex' }],
          ownedElements: ['elem-voice-memo'],
          events: ['timeline-1', 'timeline-2']
        }
      ]
    });
  }),
  
  // Also handle relative URL for tests
  http.get(`${RELATIVE_API}/characters`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'char-1',
          name: 'Test Character 1',
          type: 'NPC',
          tier: 'Core',
          resolutionPaths: ['Black Market'],
          character_links: [{ id: 'char-2', name: 'Test Character 2' }],
          ownedElements: [],
          events: []
        },
        {
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Tier 2',
          resolutionPaths: ['Detective', 'Black Market'],
          character_links: [{ id: 'char-alex', name: 'Alex' }],
          ownedElements: ['elem-voice-memo'],
          events: ['timeline-1', 'timeline-2']
        }
      ]
    });
  }),
  
  // Handle absolute test URL
  http.get(`${TEST_API}/characters`, () => {
    console.log('[MSW] Handling test API characters request');
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'char-1',
          name: 'Test Character 1',
          type: 'NPC',
          tier: 'Core',
          resolutionPaths: ['Black Market'],
          character_links: [{ id: 'char-2', name: 'Test Character 2' }],
          ownedElements: [],
          events: []
        },
        {
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Tier 2',
          resolutionPaths: ['Detective', 'Black Market'],
          character_links: [{ id: 'char-alex', name: 'Alex' }],
          ownedElements: ['elem-voice-memo'],
          events: ['timeline-1', 'timeline-2']
        }
      ]
    });
  }),

  // Elements API - Basic mock for testing
  http.get(`${API_BASE}/elements`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Test Element',
          basicType: 'Prop',
          status: 'Ready for Playtest',
          properties: {
            actFocus: 'Act 1',
            themes: ['Test Theme'],
            memorySets: ['Test Set']
          }
        },
        {
          id: 'elem-voice-memo',
          name: 'Victoria\'s Voice Memo',
          basicType: 'Memory Token',
          status: 'Ready for Playtest',
          properties: {
            actFocus: 'Act 2',
            themes: ['Betrayal', 'Secrets'],
            memorySets: ['Victoria Memories']
          },
          calculated_memory_value: 5000
        }
      ]
    });
  }),

  // Puzzles API - Basic mock for testing
  http.get(`${API_BASE}/puzzles`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          puzzle: 'Test Puzzle',
          properties: {
            actFocus: 'Act 1',
            themes: ['Test Theme']
          },
          owner: [{ name: 'Test Character' }],
          rewards: ['Test Reward'],
          narrativeThreads: ['Test Thread']
        }
      ]
    });
  }),

  // Timeline API - Basic mock for testing
  http.get(`${API_BASE}/timeline`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          description: 'Test Timeline Event',
          date: '2024-01-01',
          properties: {
            actFocus: 'Act 1',
            themes: ['Test Theme']
          },
          charactersInvolved: ['Test Character']
        }
      ]
    });
  }),

  // Intelligence API endpoints
  http.get(`${API_BASE}/intelligence/:entityId`, ({ params }) => {
    const { entityId } = params;
    
    // Mock intelligence calculation
    const mockIntelligence = {
      story: {
        narrativeImportance: 'High',
        storyConnections: 3,
        timelineEvents: 2,
        completionPercentage: 75
      },
      social: {
        collaborationCount: 8,
        socialLoad: 'High',
        requiredCollaborators: ['Alex', 'Derek']
      },
      economic: {
        tokenValue: 5000,
        pathImpact: 'Balanced',
        totalPathValue: { detective: 45000, blackMarket: 48000 }
      }
    };
    
    return HttpResponse.json({
      success: true,
      data: {
        entityId,
        intelligence: mockIntelligence,
        timestamp: new Date().toISOString()
      }
    });
  }),

  // Entity graph endpoint
  http.get(`${API_BASE}/entities/:entityId/graph`, ({ params }) => {
    const { entityId } = params;
    
    return HttpResponse.json({
      success: true,
      data: {
        nodes: [
          { id: entityId, type: 'character', data: { name: 'Test Entity' } },
          { id: 'related-1', type: 'element', data: { name: 'Related Element' } }
        ],
        edges: [
          { id: 'edge-1', source: entityId, target: 'related-1' }
        ]
      }
    });
  }),

  // Performance metrics endpoint
  http.post(`${API_BASE}/analytics/performance`, async ({ request }) => {
    const metrics = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: {
        received: metrics,
        threshold: {
          renderTime: 200,
          nodeCount: 50,
          fps: 30
        }
      }
    });
  }),
  
  // Also add relative URL handlers for elements, puzzles, timeline
  http.get(`${RELATIVE_API}/elements`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'elem-voice-memo',
          name: 'Victoria\'s Voice Memo',
          basicType: 'Memory Token',
          status: 'Ready for Playtest',
          properties: {
            actFocus: 'Act 2',
            themes: ['Betrayal', 'Secrets'],
            memorySets: ['Victoria Memories']
          },
          calculated_memory_value: 5000
        }
      ]
    });
  }),

  // Catch-all handler for unmocked requests (useful for debugging)
  http.get('*', ({ request }) => {
    console.log(`[MSW] Unmocked GET request to ${request.url}`);
    logger.warn(`Unmocked request to ${request.url}`);
    return HttpResponse.json(
      { error: `Unmocked request to ${request.url}` },
      { status: 404 }
    );
  }),
  
  http.post('*', ({ request }) => {
    console.log(`[MSW] Unmocked POST request to ${request.url}`);
    return HttpResponse.json(
      { error: `Unmocked POST request to ${request.url}` },
      { status: 404 }
    );
  }),
];

// Export handlers for different environments
export const errorHandlers = [
  // Handler that always returns an error - useful for testing error states
  http.get(`${API_BASE}/game-constants`, () => {
    return HttpResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }),
];

export const emptyHandlers = [
  // Handler that returns empty data - useful for testing empty states
  http.get(`${API_BASE}/game-constants`, () => {
    return HttpResponse.json({
      success: true,
      data: {},
      cached: false,
      timestamp: new Date().toISOString()
    });
  }),
];