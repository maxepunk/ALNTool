import { test, expect, testData, waitForApiResponse } from '../utils/test-helpers.js';

test.describe('Player Journey', () => {
  test.beforeEach(async ({ playerJourneyPage }) => {
    await playerJourneyPage.goto();
  });

  test('should load the player journey page', async ({ page }) => {
    await expect(page.locator('h4')).toContainText('Player Journey');
    
    // Command bar should be visible
    await expect(page.locator('[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sync")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('should display character selector with available characters', async ({ playerJourneyPage }) => {
    const characters = await playerJourneyPage.getAvailableCharacters();
    
    // Should have at least some characters
    expect(characters.length).toBeGreaterThan(0);
    
    // Check for some expected characters
    expect(characters).toContain('Alex Reeves');
    expect(characters).toContain('Marcus Blackwood');
  });

  test('should load journey graph when character is selected', async ({ page, playerJourneyPage }) => {
    // Select a character
    await playerJourneyPage.selectCharacter('Alex Reeves');
    
    // Wait for API call
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    // Graph should be loaded
    const nodeCount = await playerJourneyPage.getNodeCount();
    expect(nodeCount).toBeGreaterThan(0);
    
    const edgeCount = await playerJourneyPage.getEdgeCount();
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('should show node details in context workspace when node is clicked', async ({ page, playerJourneyPage }) => {
    // Select a character first
    await playerJourneyPage.selectCharacter('Alex Reeves');
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    // Get initial node count
    const nodeCount = await playerJourneyPage.getNodeCount();
    expect(nodeCount).toBeGreaterThan(0);
    
    // Click on the first visible node
    const firstNode = await page.locator('.react-flow__node').first();
    const nodeText = await firstNode.textContent();
    await firstNode.click();
    
    // Check context workspace updates
    const contextContent = await page.locator('[data-testid="context-workspace"]').textContent();
    expect(contextContent).not.toContain('Select a node');
    expect(contextContent).toContain('Context Workspace');
  });

  test('should export journey data', async ({ page, playerJourneyPage }) => {
    // Select a character first
    await playerJourneyPage.selectCharacter('Alex Reeves');
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    // Export the data
    const filename = await playerJourneyPage.export();
    
    // Verify filename format
    expect(filename).toMatch(/journey.*\.(csv|json)$/);
  });

  test('should handle search functionality', async ({ page, playerJourneyPage }) => {
    // Select a character first
    await playerJourneyPage.selectCharacter('Alex Reeves');
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    // Search for something
    await playerJourneyPage.search('memory');
    
    // The search should trigger (we'd need to implement highlighting in the actual app)
    // For now, just verify the search input works
    const searchValue = await page.locator('[placeholder*="Search"]').inputValue();
    expect(searchValue).toBe('memory');
  });

  test('should handle sync functionality', async ({ page, playerJourneyPage }) => {
    // Mock the sync API response
    await page.route('**/api/sync/data', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Sync completed successfully' })
      });
    });
    
    // Click sync
    await playerJourneyPage.sync();
    
    // Should show success message (in snackbar)
    await expect(page.locator('.MuiAlert-message')).toContainText('Sync completed');
  });

  test('should handle zoom controls', async ({ page, playerJourneyPage }) => {
    // Select a character to load graph
    await playerJourneyPage.selectCharacter('Alex Reeves');
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    // Test zoom controls
    await playerJourneyPage.zoomIn();
    await page.waitForTimeout(300);
    
    await playerJourneyPage.zoomOut();
    await page.waitForTimeout(300);
    
    await playerJourneyPage.fitView();
    await page.waitForTimeout(300);
    
    // Controls should work without errors
    const graphContainer = await page.locator('.react-flow');
    await expect(graphContainer).toBeVisible();
  });

  test('should show empty state when no character is selected', async ({ page }) => {
    // Should show character selector prompt
    const content = await page.textContent('body');
    expect(content).toContain('Select a character');
  });

  test('should handle character switching', async ({ page, playerJourneyPage }) => {
    // Select first character
    await playerJourneyPage.selectCharacter('Alex Reeves');
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    const firstNodeCount = await playerJourneyPage.getNodeCount();
    
    // Switch to another character
    await playerJourneyPage.selectCharacter('Marcus Blackwood');
    await waitForApiResponse(page, '/api/journeys/characters/');
    
    const secondNodeCount = await playerJourneyPage.getNodeCount();
    
    // Node counts might be different (or the same, but graph should update)
    expect(secondNodeCount).toBeGreaterThan(0);
  });
});