/**
 * MSW (Mock Service Worker) handlers for API mocking during tests
 * These handlers mock our backend API endpoints for reliable testing
 */

import { http, HttpResponse } from 'msw';
import { mockGameConstants } from '../test-utils.js';

import logger from '../../utils/logger';
// Base API URL - matches our production API
const API_BASE = 'http://localhost:3001/api';

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
          id: '1',
          name: 'Test Character',
          type: 'NPC',
          tier: 'Core',
          resolutionPaths: ['Black Market'],
          character_links: [{ id: '2', name: 'Other Character' }],
          ownedElements: [],
          events: []
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

  // Catch-all handler for unmocked requests (useful for debugging)
  http.get('*', (req) => {
    logger.warn(`Unmocked request to ${req.request.url}`);
    return HttpResponse.json(
      { error: `Unmocked request to ${req.request.url}` },
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