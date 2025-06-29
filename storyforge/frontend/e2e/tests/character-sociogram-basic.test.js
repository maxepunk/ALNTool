import { test, expect } from '@playwright/test';

test.describe('Character Sociogram Basic Tests', () => {
  test.use({
    // Override the base URL for these tests
    baseURL: 'http://localhost:3004',
  });

  test('should load the Character Sociogram page', async ({ page }) => {
    // Navigate to the Character Sociogram page
    await page.goto('/character-sociogram');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check page header
    const header = page.locator('h4:has-text("Dependency Choreographer")');
    await expect(header).toBeVisible({ timeout: 30000 });
  });

  test('should fetch and display character data', async ({ page }) => {
    // Navigate to the page
    await page.goto('/character-sociogram');
    
    // Wait for API call to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/characters/with-sociogram-data') && 
      response.status() === 200
    );
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Check if ReactFlow container exists
    const reactFlowContainer = page.locator('.react-flow');
    await expect(reactFlowContainer).toBeVisible({ timeout: 30000 });
    
    // Check for at least one character node
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible({ timeout: 30000 });
  });
});