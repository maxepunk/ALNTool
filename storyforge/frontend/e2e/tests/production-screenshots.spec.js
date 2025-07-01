import { test } from '@playwright/test';

test.describe('Production Screenshots', () => {
  test('capture current production UI state', async ({ page }) => {
    // Dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Handle potential API errors gracefully
    const retryButton = page.locator('button:has-text("Retry Connection")');
    if (await retryButton.isVisible({ timeout: 1000 })) {
      await retryButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'screenshots/dashboard.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Player Journey
    await page.goto('/player-journey');
    await page.waitForLoadState('networkidle');
    
    // Select first available character if any exist
    const characterSelector = page.locator('[data-testid="character-selector"]');
    if (await characterSelector.isVisible({ timeout: 2000 })) {
      await characterSelector.click();
      await page.waitForSelector('.MuiMenuItem-root');
      
      const firstCharacter = page.locator('.MuiMenuItem-root').first();
      if (await firstCharacter.isVisible()) {
        const characterName = await firstCharacter.textContent();
        await firstCharacter.click();
        
        // Wait for journey graph to load
        await page.waitForSelector('.react-flow', { state: 'visible', timeout: 5000 });
        await page.waitForSelector('.react-flow__node', { state: 'visible' });
        
        // Wait for loading spinner to disappear
        await page.waitForSelector('.MuiCircularProgress-root', { state: 'hidden' });
      }
    }
    
    await page.screenshot({ 
      path: 'screenshots/player-journey.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Characters List
    await page.goto('/characters');
    await page.waitForLoadState('networkidle');
    
    // Wait for data table to load
    await page.waitForSelector('[data-testid="entity-data-table"], .MuiDataGrid-root', { 
      state: 'visible',
      timeout: 5000 
    }).catch(() => {
      // Table might not exist if no data
    });
    
    await page.screenshot({ 
      path: 'screenshots/characters.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Elements List
    await page.goto('/elements');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for data to render
    
    await page.screenshot({ 
      path: 'screenshots/elements.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Puzzles List
    await page.goto('/puzzles');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/puzzles.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Timeline
    await page.goto('/timeline');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/timeline.png', 
      fullPage: true,
      animations: 'disabled'
    });
    
    // Memory Economy (if accessible)
    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/memory-economy.png', 
      fullPage: true,
      animations: 'disabled'
    });
  });
  
  test('capture navigation drawer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open navigation drawer
    const menuButton = page.locator('[aria-label="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for drawer animation
      
      await page.screenshot({ 
        path: 'screenshots/navigation-drawer.png', 
        fullPage: true,
        animations: 'disabled'
      });
    }
  });
});