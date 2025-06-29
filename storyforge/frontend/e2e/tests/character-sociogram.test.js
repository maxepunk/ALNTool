import { test, expect } from '@playwright/test';

test.describe('Character Sociogram Visualization', () => {
  test.use({
    // Override the base URL for these tests
    baseURL: 'http://localhost:3004',
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the Character Sociogram page
    await page.goto('/character-sociogram');
  });

  test('should display the Character Sociogram page title', async ({ page }) => {
    // Check page header
    await expect(page.locator('h4')).toContainText('Dependency Choreographer - Character Interactions');
  });

  test('should load character nodes in the graph', async ({ page }) => {
    // Wait for the ReactFlow container to be visible
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    
    // Check if character nodes are rendered
    const characterNodes = page.locator('.react-flow__node');
    await expect(characterNodes).toHaveCount(22); // We have 22 characters in the database
  });

  test('should display character relationships as edges', async ({ page }) => {
    // Wait for edges to render
    await page.waitForSelector('.react-flow__edge', { timeout: 10000 });
    
    // Check if edges exist
    const edges = page.locator('.react-flow__edge');
    const edgeCount = await edges.count();
    
    // We know from the backend that there are 60 character links
    // But since edges are bidirectional and deduplicated, we should have around 30 edges
    expect(edgeCount).toBeGreaterThan(20);
    expect(edgeCount).toBeLessThan(70);
  });

  test('should open character detail panel on node click', async ({ page }) => {
    // Wait for nodes to render
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    
    // Click on the first character node
    await page.locator('.react-flow__node').first().click();
    
    // Check if the detail panel opens
    await expect(page.locator('.MuiDrawer-root')).toBeVisible();
    await expect(page.locator('h6')).toContainText('Character Details');
    
    // Check if character information is displayed
    await expect(page.locator('h5')).toBeVisible(); // Character name
    await expect(page.locator('text=Tier:')).toBeVisible();
    await expect(page.locator('text=Type:')).toBeVisible();
  });

  test('should display linked characters in the detail panel', async ({ page }) => {
    // Wait for nodes to render
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    
    // Find and click on Alex Reeves node (we know he has 11 linked characters)
    const alexNode = page.locator('.react-flow__node').filter({ hasText: 'Alex Reeves' });
    await alexNode.click();
    
    // Wait for detail panel
    await page.waitForSelector('.MuiDrawer-root', { state: 'visible' });
    
    // Check for linked characters section
    await expect(page.locator('text=Linked Characters:')).toBeVisible();
    
    // Check if linked character list is displayed
    const linkedCharactersList = page.locator('.MuiList-root');
    const linkedCharacterItems = linkedCharactersList.locator('.MuiListItem-root');
    
    // Alex should have multiple linked characters
    const linkedCount = await linkedCharacterItems.count();
    expect(linkedCount).toBeGreaterThan(0);
  });

  test('should have functional graph controls', async ({ page }) => {
    // Check if ReactFlow controls are present
    await expect(page.locator('.react-flow__controls')).toBeVisible();
    
    // Check for zoom controls
    await expect(page.locator('.react-flow__controls-button[aria-label="zoom in"]')).toBeVisible();
    await expect(page.locator('.react-flow__controls-button[aria-label="zoom out"]')).toBeVisible();
    await expect(page.locator('.react-flow__controls-button[aria-label="fit view"]')).toBeVisible();
  });

  test('should navigate to character detail page from panel', async ({ page }) => {
    // Click on a character node
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    await page.locator('.react-flow__node').first().click();
    
    // Wait for detail panel
    await page.waitForSelector('.MuiDrawer-root', { state: 'visible' });
    
    // Click on "View Full Detail Page" button
    await page.locator('text=View Full Detail Page').click();
    
    // Check if we navigated to the character detail page
    await expect(page.url()).toContain('/characters/');
  });
});