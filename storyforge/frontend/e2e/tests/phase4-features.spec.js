import { test, expect } from '../utils/test-helpers.js';

test.describe('Phase 4+ Features Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access Memory Economy Workshop', async ({ page }) => {
    // Navigate to Memory Economy from dashboard
    await page.locator('.MuiCard-root').filter({ hasText: 'Memory Economy' }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/memory-economy/);
    
    // Check for key Memory Economy components
    await expect(page.locator('h4')).toContainText(/Memory Economy|Workshop/);
    
    // Verify data loads (should see character or element data)
    const dataElements = page.locator('[data-testid*="memory"], .MuiTableRow-root, .memory-value');
    await expect(dataElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should access Narrative Thread Tracker', async ({ page }) => {
    // Test our newly fixed narrative threads route
    await page.locator('.MuiCard-root').filter({ hasText: 'Narrative Thread Tracker' }).click();
    await page.waitForLoadState('networkidle');
    
    // Verify navigation
    await expect(page).toHaveURL(/\/narrative-thread-tracker/);
    
    // Check for narrative thread content
    await expect(page.locator('h4')).toContainText(/Narrative|Thread/);
    
    // Wait for data to load (our fixed /api/narrative-threads endpoint)
    const threadElements = page.locator('[data-testid*="thread"], .MuiTableRow-root, .narrative-thread');
    await expect(threadElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should access Player Journey with dual-lens layout', async ({ page }) => {
    await page.locator('.MuiCard-root').filter({ hasText: 'Player Journey' }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/player-journey/);
    
    // Check for DualLensLayout components
    await expect(page.locator('[data-testid*="dual-lens"], [data-testid*="context-workspace"]')).toBeVisible({ timeout: 10000 });
    
    // Verify character selection is available
    await expect(page.locator('select, .MuiSelect-root')).toBeVisible({ timeout: 5000 });
  });

  test('should access Character Sociogram', async ({ page }) => {
    await page.locator('.MuiCard-root').filter({ hasText: 'Character Sociogram' }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/character-sociogram/);
    await expect(page.locator('h4')).toContainText(/Sociogram|Character/);
    
    // Check for relationship visualization
    const relationshipElements = page.locator('[data-testid*="relationship"], [data-testid*="sociogram"], .relationship-node');
    await expect(relationshipElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should access Resolution Path Analyzer', async ({ page }) => {
    await page.locator('.MuiCard-root').filter({ hasText: 'Resolution Path Analyzer' }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/resolution-path-analyzer/);
    await expect(page.locator('h4')).toContainText(/Resolution|Path/);
    
    // Check for path analysis components
    const pathElements = page.locator('[data-testid*="path"], [data-testid*="resolution"], .resolution-card');
    await expect(pathElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should access Element-Puzzle Flow with fixed endpoint', async ({ page }) => {
    // Test our newly fixed puzzle flow route
    await page.locator('.MuiCard-root').filter({ hasText: 'Element-Puzzle Economy' }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/element-puzzle-economy/);
    
    // Verify puzzle flow data loads (using our fixed /api/puzzles/:id/flow endpoint)
    const flowElements = page.locator('[data-testid*="puzzle"], [data-testid*="flow"], .puzzle-flow');
    await expect(flowElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should validate cross-feature navigation', async ({ page }) => {
    // Test navigation between different Phase 4+ features
    
    // Start with Memory Economy
    await page.locator('.MuiCard-root').filter({ hasText: 'Memory Economy' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/memory-economy/);
    
    // Navigate to Player Journey
    await page.goto('/player-journey');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/player-journey/);
    
    // Navigate to Narrative Thread Tracker  
    await page.goto('/narrative-thread-tracker');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/narrative-thread-tracker/);
    
    // Each should load without errors
    await expect(page.locator('body')).not.toContainText('Error');
  });

  test('should validate API endpoints work correctly', async ({ page }) => {
    // Monitor network requests to verify our fixed routes work
    const narrativeThreadsRequests = [];
    const puzzleFlowRequests = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/narrative-threads')) {
        narrativeThreadsRequests.push(url);
      }
      if (url.includes('/api/puzzles/') && url.includes('/flow')) {
        puzzleFlowRequests.push(url);
      }
    });
    
    // Navigate to features that use our fixed endpoints
    await page.goto('/narrative-thread-tracker');
    await page.waitForLoadState('networkidle');
    
    // Verify narrative threads API was called
    expect(narrativeThreadsRequests.length).toBeGreaterThan(0);
    
    // Navigate to puzzle flow feature
    await page.goto('/element-puzzle-economy');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential puzzle flow calls
    await page.waitForTimeout(2000);
    
    // Check that no 404 errors occurred
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('Not Found');
  });

  test('should validate production team workflow', async ({ page }) => {
    // Test a complete workflow that a production designer would use
    
    // 1. Start with overview (Dashboard)
    await expect(page.locator('h4')).toContainText(/Dashboard|StoryForge/);
    
    // 2. Check system balance (Memory Economy)
    await page.locator('.MuiCard-root').filter({ hasText: 'Memory Economy' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/memory-economy/);
    
    // 3. Analyze individual character (Player Journey)
    await page.goto('/player-journey');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/player-journey/);
    
    // 4. Review narrative coherence (Narrative Threads)
    await page.goto('/narrative-thread-tracker');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/narrative-thread-tracker/);
    
    // 5. Check relationships (Character Sociogram)
    await page.goto('/character-sociogram');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/character-sociogram/);
    
    // Complete workflow should work without errors
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('body')).not.toContainText('Failed to fetch');
  });
});