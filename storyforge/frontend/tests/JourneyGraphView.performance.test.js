// RED PHASE: This test should FAIL first to prove there's a performance problem

const { test, expect } = require('@playwright/test');

test.describe('JourneyGraphView Performance', () => {
  test('should load in under 2 seconds', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Click on a character to load their journey
    await page.getByRole('link', { name: /characters/i }).click();
    
    // Wait for characters list to load
    await page.waitForSelector('[data-testid="character-card"]');
    
    // Click on first character
    const firstCharacter = page.locator('[data-testid="character-card"]').first();
    await firstCharacter.click();
    
    // Measure time from navigation to JourneyGraphView fully rendered
    const startTime = Date.now();
    
    // Wait for JourneyGraphView to be visible
    await page.waitForSelector('text=Journey Timeline', { timeout: 5000 });
    
    // Wait for ReactFlow to render nodes
    await page.waitForSelector('[data-testid="react-flow"] .react-flow__node', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`JourneyGraphView load time: ${loadTime}ms`);
    
    // This assertion should FAIL first (RED phase)
    expect(loadTime).toBeLessThan(2000); // Requirement: <2s load time
  });
});