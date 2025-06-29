import { test, expect } from '../utils/test-helpers.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto('/');
  });

  test('should display the dashboard title', async ({ page, dashboardPage }) => {
    await expect(page).toHaveTitle(/StoryForge/);
    const isLoaded = await dashboardPage.isLoaded();
    expect(isLoaded).toBeTruthy();
  });

  test('should display entity counts', async ({ dashboardPage }) => {
    const counts = await dashboardPage.getEntityCounts();
    
    // Verify that counts are displayed (they should be numbers or "Loading...")
    expect(counts.characters).toBeTruthy();
    expect(counts.elements).toBeTruthy();
    expect(counts.puzzles).toBeTruthy();
    expect(counts.timeline).toBeTruthy();
  });

  test('should display navigation cards', async ({ dashboardPage }) => {
    const navOptions = await dashboardPage.getNavigationOptions();
    
    // Should have at least the main navigation options
    expect(navOptions).toContain('Characters');
    expect(navOptions).toContain('Elements');
    expect(navOptions).toContain('Puzzles');
    expect(navOptions).toContain('Timeline');
  });

  test('should navigate to Characters page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateToSection('Characters');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/characters/);
    await expect(page.locator('h4')).toContainText('Characters');
  });

  test('should navigate to Elements page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateToSection('Elements');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/elements/);
    await expect(page.locator('h4')).toContainText('Elements');
  });

  test('should navigate to Puzzles page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateToSection('Puzzles');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/puzzles/);
    await expect(page.locator('h4')).toContainText('Puzzles');
  });

  test('should navigate to Timeline page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateToSection('Timeline');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/timeline/);
    await expect(page.locator('h4')).toContainText('Timeline');
  });

  test('should display Phase 4+ feature links', async ({ page }) => {
    // Check for advanced feature navigation
    const advancedFeatures = [
      'Character Sociogram',
      'Memory Economy',
      'Player Journey',
      'Puzzle Flow',
      'Element-Puzzle Economy',
      'Narrative Thread Tracker',
      'Resolution Path Analyzer'
    ];

    for (const feature of advancedFeatures) {
      const card = page.locator('.MuiCard-root').filter({ hasText: feature });
      await expect(card).toBeVisible();
    }
  });

  test('should handle navigation to Player Journey', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateToSection('Player Journey');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/player-journey/);
    await expect(page.locator('h4')).toContainText('Player Journey');
  });
});