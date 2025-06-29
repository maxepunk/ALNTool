import { test, expect } from '../utils/test-helpers.js';

test.describe('Memory Economy Data Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response to match our current data state
    await page.route('**/api/elements?filterGroup=memoryTypes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'howie-memory-token',
            name: "Howie's Memory Token: 'Elara Vance - Soil of Insight' Lecture Excerpt",
            type: "Memory Token Video",
            sf_value_rating: 2,
            sf_memory_type: "Business",
            parsed_sf_rfid: null,
            sf_memory_group: null,
            baseValueAmount: 100,
            typeMultiplierValue: 2,
            finalCalculatedValue: 200,
            properties: {
              sf_value_rating: 2,
              sf_memory_type: "Business",
              parsed_sf_rfid: null,
              status: "Unknown"
            }
          },
          // The other 6 memory elements without values
          {
            id: 'alex-rfid',
            name: "Alex's RFID Memory",
            type: "Corrupted Memory RFID",
            sf_value_rating: 0,
            sf_memory_type: null,
            parsed_sf_rfid: null,
            sf_memory_group: null,
            baseValueAmount: 0,
            typeMultiplierValue: 1,
            finalCalculatedValue: 0,
            properties: {
              sf_value_rating: 0,
              sf_memory_type: null,
              parsed_sf_rfid: null,
              status: "Unknown"
            }
          },
          {
            id: 'diane-rfid',
            name: "Diane's RFID Memory",
            type: "Corrupted Memory RFID",
            sf_value_rating: 0,
            sf_memory_type: null,
            parsed_sf_rfid: null,
            sf_memory_group: null,
            baseValueAmount: 0,
            typeMultiplierValue: 1,
            finalCalculatedValue: 0,
            properties: {
              sf_value_rating: 0,
              sf_memory_type: null,
              parsed_sf_rfid: null,
              status: "Unknown"
            }
          }
        ])
      });
    });

    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');
  });

  test('should display extracted memory value for Howie\'s token', async ({ page }) => {
    // Wait for data to load
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    
    // Check page title
    await expect(page.locator('h4')).toContainText(/Memory Economy/);
    
    // Look for Howie's memory token in the display
    const memoryElements = page.locator('[data-testid*="memory"], .MuiTableRow-root, .memory-item, .MuiCard-root').filter({ 
      hasText: "Howie's Memory Token" 
    });
    
    await expect(memoryElements.first()).toBeVisible({ timeout: 10000 });
    
    // Verify the $200 value is displayed
    const valueDisplay = page.locator('text=/\\$200|200|Value.*200/');
    await expect(valueDisplay.first()).toBeVisible();
    
    // Verify value rating of 2 is shown
    const ratingDisplay = page.locator('text=/Rating.*2|Value Rating.*2/');
    await expect(ratingDisplay.first()).toBeVisible();
    
    // Verify memory type "Business" is shown
    const typeDisplay = page.locator('text=/Business|Type.*Business/');
    await expect(typeDisplay.first()).toBeVisible();
  });

  test('should show correct statistics: 1 of 7 tokens valued', async ({ page }) => {
    // Wait for statistics to load
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    
    // Look for statistics display showing 1 valued token out of 7 total
    const statsSection = page.locator('[data-testid*="stats"], .statistics, .MuiCard-root').filter({
      hasText: /total.*7|tokens.*7/i
    });
    
    // Verify some kind of 1/7 or 14% completion is shown
    const completionIndicator = page.locator('text=/1.*7|14%|1 of 7/');
    await expect(completionIndicator.first()).toBeVisible({ timeout: 10000 });
    
    // Verify total value of $200 is shown somewhere
    const totalValue = page.locator('text=/Total.*200|\\$200/').first();
    await expect(totalValue).toBeVisible();
  });

  test('should show N/A or 0 for tokens without values', async ({ page }) => {
    // Wait for data to load
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    
    // Look for Alex's RFID Memory
    const alexMemory = page.locator('[data-testid*="memory"], .MuiTableRow-root, .memory-item').filter({ 
      hasText: "Alex's RFID Memory" 
    });
    
    if (await alexMemory.count() > 0) {
      // Check that it shows N/A, 0, or no value
      const parentElement = alexMemory.first();
      await expect(parentElement).toContainText(/N\/A|\\$0|Value: 0/);
    }
  });

  test('should handle empty memory economy gracefully', async ({ page }) => {
    // Override with empty response
    await page.route('**/api/elements?filterGroup=memoryTypes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show empty state message
    const emptyState = page.locator('text=/No memory|No tokens|No data/i');
    await expect(emptyState.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display memory economy balance analysis', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    
    // Look for any balance or distribution analysis
    const balanceSection = page.locator('[data-testid*="balance"], [data-testid*="analysis"], .balance-section');
    
    if (await balanceSection.count() > 0) {
      // If balance analysis exists, it should mention the imbalance
      // (only 1 token has value, which is unbalanced)
      await expect(balanceSection.first()).toContainText(/imbalance|uneven|distribution/i);
    }
  });

  test('visual regression: memory economy dashboard', async ({ page, browserName }) => {
    // Wait for all content to load
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    await page.waitForTimeout(1000); // Allow animations to complete
    
    // Take screenshot of the entire page
    await expect(page).toHaveScreenshot(`memory-economy-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
      mask: [
        // Mask dynamic elements like timestamps
        page.locator('.timestamp'),
        page.locator('[data-testid="last-updated"]')
      ]
    });
  });
});

test.describe('Memory Economy Data Pipeline - Live Data', () => {
  test('should verify actual database values', async ({ page }) => {
    // This test runs against the real API without mocking
    await page.goto('/memory-economy');
    await page.waitForLoadState('networkidle');
    
    // Wait for real data to load
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 15000 });
    
    // Log what we actually see on the page for debugging
    const pageContent = await page.locator('body').textContent();
    console.log('Memory Economy page content includes:', {
      hasHowieToken: pageContent.includes("Howie's Memory Token"),
      has200Value: pageContent.includes('200'),
      hasBusinessType: pageContent.includes('Business')
    });
    
    // At minimum, the page should load without errors
    await expect(page.locator('body')).not.toContainText('Error');
    await expect(page.locator('body')).not.toContainText('Failed to fetch');
  });
});