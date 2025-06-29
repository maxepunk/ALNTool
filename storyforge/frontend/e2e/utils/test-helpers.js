import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage.js';
import { PlayerJourneyPage } from '../pages/PlayerJourneyPage.js';

/**
 * Extend Playwright test to include page objects
 */
export const test = base.extend({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  
  playerJourneyPage: async ({ page }, use) => {
    const playerJourneyPage = new PlayerJourneyPage(page);
    await use(playerJourneyPage);
  }
});

export { expect } from '@playwright/test';

/**
 * Test data helpers
 */
export const testData = {
  characters: [
    'Alex Reeves',
    'Marcus Blackwood',
    'Sarah Blackwood',
    'Victoria Kingsley',
    'James Whitman'
  ],
  
  elements: [
    'UV Light',
    'Sarah\'s Jewelry Box',
    'Derek\'s Gym Bag'
  ],
  
  puzzles: [
    'Pillow Puzzle',
    'Company One-Pagers',
    'False Bottom Puzzle'
  ]
};

/**
 * Wait for API response
 * @param {Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @returns {Promise<Response>} API response
 */
export async function waitForApiResponse(page, urlPattern) {
  return await page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Mock API responses
 * @param {Page} page - Playwright page object
 * @param {Object} mocks - Object with URL patterns and responses
 */
export async function mockApiResponses(page, mocks) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    
    for (const [pattern, response] of Object.entries(mocks)) {
      if (url.includes(pattern)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
        return;
      }
    }
    
    // If no mock matches, continue with real request
    await route.continue();
  });
}

/**
 * Login helper (if authentication is implemented)
 * @param {Page} page - Playwright page object
 * @param {string} username - Username
 * @param {string} password - Password
 */
export async function login(page, username, password) {
  // This is a placeholder for when authentication is implemented
  // await page.goto('/login');
  // await page.fill('[name="username"]', username);
  // await page.fill('[name="password"]', password);
  // await page.click('button[type="submit"]');
  // await page.waitForNavigation();
}

/**
 * Take screenshot with timestamp
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `screenshots/${name}-${timestamp}.png`, 
    fullPage: true 
  });
}

/**
 * Ensure backend is running
 * @param {Page} page - Playwright page object
 */
export async function ensureBackendRunning(page) {
  try {
    const response = await page.request.get('http://localhost:3000/api/health');
    if (response.status() !== 200) {
      throw new Error('Backend is not healthy');
    }
  } catch (error) {
    throw new Error('Backend is not running. Please start it with: cd storyforge/backend && npm start');
  }
}

/**
 * Clear local storage
 * @param {Page} page - Playwright page object
 */
export async function clearLocalStorage(page) {
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}

/**
 * Set local storage item
 * @param {Page} page - Playwright page object
 * @param {string} key - Storage key
 * @param {any} value - Storage value
 */
export async function setLocalStorage(page, key, value) {
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, { key, value });
}