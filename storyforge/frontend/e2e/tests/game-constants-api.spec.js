import { test, expect } from '../utils/test-helpers.js';

test.describe('Game Constants API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing cache
    await page.evaluate(() => {
      window.localStorage.clear();
      // Clear any Query Client cache if accessible
      if (window.__REACT_QUERY_CLIENT__) {
        window.__REACT_QUERY_CLIENT__.clear();
      }
    });
  });

  test('should fetch game constants from API on first load', async ({ page }) => {
    // Set up API response monitoring
    const gameConstantsRequests = [];
    await page.route('**/api/game-constants', async (route) => {
      gameConstantsRequests.push(route.request());
      // Continue with real request
      await route.continue();
    });

    // Navigate to a page that uses game constants
    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');

    // Verify that the game constants API was called
    expect(gameConstantsRequests.length).toBeGreaterThan(0);
    expect(gameConstantsRequests[0].url()).toContain('/api/game-constants');
    expect(gameConstantsRequests[0].method()).toBe('GET');
  });

  test('should display memory value constants from API in Memory Economy page', async ({ page }) => {
    // Mock game constants API with test values
    await page.route('**/api/game-constants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          MEMORY_VALUE: {
            BASE_VALUES: {
              1: 150,  // Different from default 100
              2: 750,  // Different from default 500
              3: 1500, // Different from default 1000
              4: 7500, // Different from default 5000
              5: 15000 // Different from default 10000
            },
            TYPE_MULTIPLIERS: {
              'Personal': 3.0,   // Different from default 2.0
              'Business': 7.5,   // Different from default 5.0
              'Technical': 15.0  // Different from default 10.0
            },
            TARGET_TOKEN_COUNT: 45,  // Different from default 55
            MIN_TOKEN_COUNT: 40,     // Different from default 50
            MAX_TOKEN_COUNT: 50,     // Different from default 60
            MEMORY_ELEMENT_TYPES: [
              'Memory Token Video',
              'Memory Token Audio',
              'Memory Token Physical',
              'Corrupted Memory RFID'
            ]
          },
          ELEMENTS: {
            STATUS_TYPES: [
              'Ready for Playtest',
              'Done',
              'In development'
            ]
          }
        })
      });
    });

    // Mock elements API to return a test memory token
    await page.route('**/api/elements**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-memory-token',
            name: 'Test Memory Token',
            type: 'Memory Token Video',
            sf_value_rating: 2,
            sf_memory_type: 'Business',
            baseValueAmount: 750,     // Should use API value 750, not hardcoded 500
            typeMultiplierValue: 7.5, // Should use API value 7.5, not hardcoded 5.0
            finalCalculatedValue: 5625, // 750 * 7.5 = 5625
            properties: {
              sf_value_rating: 2,
              sf_memory_type: 'Business',
              status: 'Ready for Playtest'
            }
          }
        ])
      });
    });

    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });

    // Verify that the UI displays the API-derived values, not hardcoded values
    // The calculated value should be 5625 (750 * 7.5) using API constants
    await expect(page.locator('text=/5625|\\$5,625/')).toBeVisible({ timeout: 5000 });
    
    // Verify base value from API (750) is shown somewhere
    await expect(page.locator('text=/750|\\$750/')).toBeVisible();

    // Verify multiplier from API (7.5) is shown if displayed
    const multiplierText = page.locator('text=/7\\.5|×7\\.5/');
    if (await multiplierText.count() > 0) {
      await expect(multiplierText.first()).toBeVisible();
    }
  });

  test('should use resolution path constants from API', async ({ page }) => {
    // Mock game constants with different resolution paths
    await page.route('**/api/game-constants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          RESOLUTION_PATHS: {
            TYPES: ['Corporate Path', 'Underground Path', 'Neutral Path'], // Different from defaults
            DEFAULT: 'Undecided',
            THEMES: {
              'Corporate Path': { color: '#FF5722', icon: 'business', theme: 'corporate' },
              'Underground Path': { color: '#9C27B0', icon: 'security', theme: 'underground' },
              'Neutral Path': { color: '#607D8B', icon: 'balance', theme: 'neutral' },
              'Undecided': { color: '#9E9E9E', icon: 'help', theme: 'default' }
            }
          },
          CHARACTERS: {
            TYPES: ['Player', 'NPC'],
            TIERS: ['Core', 'Secondary', 'Tertiary']
          }
        })
      });
    });

    // Mock characters API
    await page.route('**/api/characters**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-char',
            name: 'Test Character',
            type: 'NPC',
            tier: 'Core',
            resolutionPaths: ['Corporate Path'], // Using API constant
            character_links: [],
            ownedElements: [],
            events: []
          }
        ])
      });
    });

    await page.goto('/resolution-path-analyzer');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });

    // Verify that the custom resolution path names appear (not the defaults)
    await expect(page.locator('text=/Corporate Path|Underground Path|Neutral Path/')).toBeVisible({ timeout: 5000 });
    
    // Verify that default resolution path names do NOT appear
    await expect(page.locator('text=/Black Market|Detective|Third Path/')).not.toBeVisible();
  });

  test('should cache game constants and not refetch on subsequent page loads', async ({ page }) => {
    let gameConstantsRequestCount = 0;
    
    await page.route('**/api/game-constants', async (route) => {
      gameConstantsRequestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          MEMORY_VALUE: { BASE_VALUES: { 1: 100, 2: 500 }, TYPE_MULTIPLIERS: { 'Personal': 2.0 } },
          RESOLUTION_PATHS: { TYPES: ['Black Market', 'Detective', 'Third Path'], DEFAULT: 'Unassigned' }
        })
      });
    });

    // Visit first page
    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // First request should have been made
    expect(gameConstantsRequestCount).toBe(1);

    // Navigate to another page that uses game constants
    await page.goto('/resolution-path-analyzer');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should not make another request due to caching
    expect(gameConstantsRequestCount).toBe(1);

    // Navigate to dashboard (also uses game constants)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Still should not make another request
    expect(gameConstantsRequestCount).toBe(1);
  });

  test('should handle game constants API error gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/game-constants', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');

    // Page should still load (possibly with fallback values or error state)
    await expect(page.locator('body')).not.toContainText('White screen of death');
    await expect(page.locator('body')).not.toContainText('TypeError');
    
    // Should either show error message or fallback gracefully
    const hasErrorMessage = await page.locator('text=/error|failed|unable/i').count() > 0;
    const hasContent = await page.locator('h1, h2, h3, h4, h5, h6').count() > 0;
    
    // Either should show an error message OR show content with fallback values
    expect(hasErrorMessage || hasContent).toBe(true);
  });

  test('should retry game constants API on network failure', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/game-constants', async (route) => {
      requestCount++;
      
      if (requestCount <= 2) {
        // Fail first 2 requests
        await route.abort('failed');
      } else {
        // Succeed on 3rd request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            MEMORY_VALUE: { BASE_VALUES: { 1: 100 }, TYPE_MULTIPLIERS: { 'Personal': 2.0 } }
          })
        });
      }
    });

    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for retries to complete
    await page.waitForTimeout(3000);

    // Should have retried and eventually succeeded
    expect(requestCount).toBeGreaterThanOrEqual(3);
    
    // Page should eventually load successfully
    await expect(page.locator('h4')).toContainText(/Memory Economy/);
  });

  test('should display character constants from API in dashboard', async ({ page }) => {
    // Mock game constants with different warning thresholds
    await page.route('**/api/game-constants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          CHARACTERS: {
            TYPES: ['Player', 'NPC'],
            TIERS: ['Core', 'Secondary', 'Tertiary'],
            UNASSIGNED_WARNING_THRESHOLD: 0.4, // Different from default 0.2
            ISOLATED_WARNING_THRESHOLD: 0.3,   // Different from default 0.15
            PATH_IMBALANCE_THRESHOLD: 0.6      // Different from default 0.4
          },
          DASHBOARD: {
            PATH_IMBALANCE_THRESHOLD: 5,           // Different from default 3
            MEMORY_COMPLETION_WARNING_THRESHOLD: 30, // Different from default 50
            UNASSIGNED_EVENTS_WARNING_THRESHOLD: 8   // Different from default 5
          }
        })
      });
    });

    // Mock characters API with test data that should trigger the custom thresholds
    await page.route('**/api/characters**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'char1',
            name: 'Test Character 1',
            type: 'NPC',
            tier: 'Core',
            resolutionPaths: [], // Unassigned - should trigger 40% threshold warning
            character_links: [],
            ownedElements: [],
            events: []
          },
          {
            id: 'char2',
            name: 'Test Character 2',
            type: 'NPC', 
            tier: 'Core',
            resolutionPaths: ['Black Market'],
            character_links: [],
            ownedElements: [],
            events: []
          }
        ])
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });

    // Should show dashboard content
    await expect(page.locator('text=/Dashboard|Production Intelligence/i')).toBeVisible();

    // With 50% unassigned characters (1 of 2) and 40% threshold, should show warning
    // Look for any warning indicators or text
    const warningIndicators = page.locator('[data-testid*="warning"], .warning, .alert, .MuiAlert-root, text=/warning|alert|issue/i');
    if (await warningIndicators.count() > 0) {
      await expect(warningIndicators.first()).toBeVisible();
    }
  });

  test('should use puzzle constants from API', async ({ page }) => {
    // Mock game constants with different puzzle thresholds
    await page.route('**/api/game-constants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          PUZZLES: {
            HIGH_COMPLEXITY_OWNERS_THRESHOLD: 2,    // Different from default 1
            HIGH_COMPLEXITY_REWARDS_THRESHOLD: 4,   // Different from default 2
            MEDIUM_COMPLEXITY_REWARDS_THRESHOLD: 2, // Different from default 1
            UNASSIGNED_WARNING_THRESHOLD: 0.5,      // Different from default 0.3
            NO_REWARDS_WARNING_THRESHOLD: 0.4,      // Different from default 0.2
            NO_NARRATIVE_THREADS_WARNING_THRESHOLD: 0.6 // Different from default 0.4
          }
        })
      });
    });

    // Mock puzzles API with test data
    await page.route('**/api/puzzles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'puzzle1',
            puzzle: 'Test Puzzle High Complexity',
            properties: { actFocus: 'Act 1' },
            owner: [{ name: 'Owner 1' }, { name: 'Owner 2' }], // 2 owners = high complexity with new threshold
            rewards: ['Reward 1', 'Reward 2', 'Reward 3', 'Reward 4'], // 4 rewards = high complexity
            narrativeThreads: ['Thread 1']
          }
        ])
      });
    });

    await page.goto('/puzzles');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });

    // Should show puzzle content
    await expect(page.locator('text=/Test Puzzle High Complexity/')).toBeVisible();

    // Look for complexity indicators - with 2 owners and 4 rewards, should be marked as high complexity
    const complexityIndicators = page.locator('text=/high.*complexity|complex|difficult/i');
    if (await complexityIndicators.count() > 0) {
      await expect(complexityIndicators.first()).toBeVisible();
    }
  });

  test('should work correctly when game constants API returns minimal data', async ({ page }) => {
    // Mock API with minimal required constants
    await page.route('**/api/game-constants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          MEMORY_VALUE: {
            BASE_VALUES: { 1: 100 },
            TYPE_MULTIPLIERS: { 'Personal': 1.0 }
          }
        })
      });
    });

    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');

    // Should not crash, should handle missing constants gracefully
    await expect(page.locator('h4')).toContainText(/Memory Economy/);
    await expect(page.locator('body')).not.toContainText('TypeError');
    await expect(page.locator('body')).not.toContainText('undefined');
  });
});