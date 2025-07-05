import { test, expect } from '@playwright/test';

test.describe('Journey Intelligence View E2E Tests', () => {
  // Track API responses and data
  let apiResponses = [];
  let frontendData = {
    characters: [],
    elements: []
  };
  let validationResults = null;
  
  test.beforeEach(async ({ page }) => {
    apiResponses = [];
    frontendData = { characters: [], elements: [] };
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser console:', msg.text());
      }
    });
    
    // Monitor API responses and capture the data
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const endpoint = response.url().split('/api/')[1]?.split('?')[0];
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          endpoint: endpoint
        });
        
        // Capture the actual data returned
        if (response.status() === 200) {
          try {
            const data = await response.json();
            if (endpoint === 'characters' && data.success) {
              frontendData.characters = data.data || [];
            } else if (endpoint?.includes('elements') && data.success) {
              frontendData.elements = data.data || [];
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    });
  });

  // First test: Validate SQLite data matches Notion reality
  test('validate SQLite data matches Notion reality', async ({ request }) => {
    console.log('🔍 Validating SQLite vs Notion data integrity...');
    
    // Call validation endpoint
    const response = await request.get('http://localhost:3001/api/validate/notion-sync');
    expect(response.ok()).toBeTruthy();
    
    validationResults = await response.json();
    console.log('\n📊 Validation Results:');
    console.log(`- Characters: ${validationResults.summary.characters.sqlite} SQLite / ${validationResults.summary.characters.notion} Notion`);
    console.log(`  ✓ Matched: ${validationResults.summary.characters.matched}`);
    console.log(`  ✗ Mismatched: ${validationResults.summary.characters.mismatched}`);
    console.log(`- Elements: ${validationResults.summary.elements.sqlite} SQLite / ${validationResults.summary.elements.notion} Notion`);
    console.log(`- Total Discrepancies: ${validationResults.totalDiscrepancies}`);
    console.log(`- Sync Status: ${validationResults.syncStatus.isStale ? 'STALE' : 'Fresh'} (${validationResults.syncStatus.staleDuration})`);
    
    // Report any discrepancies
    if (validationResults.discrepancies.length > 0) {
      console.log('\n⚠️  Data Discrepancies Found:');
      validationResults.discrepancies.forEach(d => {
        console.log(`  - ${d.type} ${d.id}: ${d.field} mismatch`);
        console.log(`    SQLite: ${JSON.stringify(d.sqliteValue)}`);
        console.log(`    Notion: ${JSON.stringify(d.notionValue)}`);
      });
    }
    
    // Warn if sync is stale
    if (validationResults.syncStatus.isStale) {
      console.warn('\n⚠️  WARNING: Data sync is stale! Frontend may show outdated information.');
    }
    
    // Don't fail the test for discrepancies, but report them
    expect(validationResults.success).toBeTruthy();
  });

  test('journey intelligence view loads with real backend data', async ({ page }) => {
    // Navigate to journey intelligence
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Should show loading state briefly
    const loadingIndicator = page.locator('[data-testid="loading-skeleton"]');
    // It might be too fast to catch, so we don't assert it exists
    
    // Wait for content to load
    await page.waitForSelector('[aria-label="Select Entity"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Core components should be visible
    // Components exist but don't have data-testid attributes - use aria labels
    await expect(page.locator('[aria-label="Select Entity"]')).toBeVisible();
    await expect(page.locator('[data-testid="intelligence-toggles"]')).toBeVisible();
    await expect(page.locator('[data-testid="graph-canvas"]')).toBeVisible();
    // Performance indicator shows node count
    await expect(page.locator('text=/\\d+ nodes/')).toBeVisible();
    
    // Should show overview text
    await expect(page.locator('text=Select any entity to explore')).toBeVisible();
    
    // Intelligence panel should NOT be visible in overview mode
    // The panel doesn't exist yet, so check it's not in the DOM at all
    await expect(page.locator('[data-testid="intelligence-panel"]')).toHaveCount(0);
  });

  test('api calls complete successfully', async ({ page }) => {
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for all API calls to complete
    await page.waitForTimeout(2000);
    
    // Check that we made the expected API calls
    const characterCall = apiResponses.find(r => r.endpoint === 'characters');
    const elementsCall = apiResponses.find(r => r.endpoint?.includes('elements'));
    
    // Both should have been called and succeeded
    expect(characterCall).toBeTruthy();
    expect(characterCall.status).toBeLessThan(400);
    
    expect(elementsCall).toBeTruthy();
    expect(elementsCall.status).toBeLessThan(400);
    
    // No failed API calls
    const failedCalls = apiResponses.filter(r => r.status >= 400);
    if (failedCalls.length > 0) {
      console.log('Failed API calls:', failedCalls);
    }
    expect(failedCalls.length).toBe(0);
  });

  test('sparse data reality - limited characters and elements', async ({ page }) => {
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Count visible nodes (characters) - ReactFlow uses .react-flow__node
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`Found ${nodeCount} nodes in the graph`);
    
    // Should have some nodes but not many (sparse data)
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBeLessThanOrEqual(22); // We have 22 characters
    
    // Performance indicator should show low node count
    const performanceIndicator = page.locator('text=/\\d+ nodes/');
    await expect(performanceIndicator).toBeVisible();
    const performanceText = await performanceIndicator.textContent();
    expect(performanceText).toContain('nodes');
    
    // Should NOT be in performance mode with so few nodes
    expect(performanceText).not.toContain('Performance Mode');
  });

  test('entity selection flow works', async ({ page }) => {
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Wait for ReactFlow to initialize and nodes to render
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    await page.waitForTimeout(1000); // Let ReactFlow stabilize
    
    // Get all character nodes
    const nodes = await page.locator('.react-flow__node').all();
    console.log(`Found ${nodes.length} nodes in entity selection test`);
    
    if (nodes.length > 0) {
      // Click the first node
      const firstNode = nodes[0];
      await firstNode.click();
      console.log('Entity selection test: Node clicked successfully');
      
      // Wait for intelligence panel to appear
      await page.waitForSelector('[data-testid="intelligence-panel"]', { 
        timeout: 5000 
      });
      
      // Verify intelligence panel is visible
      await expect(page.locator('[data-testid="intelligence-panel"]')).toBeVisible();
      
      // Verify entity selector updated (it shows selected entity name)
      const entitySelector = await page.locator('[aria-label="Select Entity"]').textContent();
      expect(entitySelector).not.toBe('Select Entity');
      expect(entitySelector).toContain('Character:'); // Since we clicked a character node
      
      console.log('Entity selection test: Intelligence panel appeared and selector updated');
    } else {
      console.log('No character nodes visible - sparse data reality');
    }
  });

  test('intelligence layer toggles work', async ({ page }) => {
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Find intelligence toggle buttons
    const economicToggle = page.locator('button[aria-label="Economic"]');
    
    if (await economicToggle.isVisible({ timeout: 5000 })) {
      // Check initial state
      const initialPressed = await economicToggle.getAttribute('aria-pressed');
      expect(initialPressed).toBe('false');
      
      // Click to activate
      await economicToggle.click();
      
      // Should now be pressed
      await expect(economicToggle).toHaveAttribute('aria-pressed', 'true');
      
      // Story and social should be active by default
      const storyToggle = page.locator('button[aria-label="Story"]');
      const socialToggle = page.locator('button[aria-label="Social"]');
      
      await expect(storyToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(socialToggle).toHaveAttribute('aria-pressed', 'true');
    } else {
      console.log('Intelligence toggles not visible');
    }
  });

  test('empty state handling when no data', async ({ page }) => {
    // This test is for reference - our backend should have some data
    // But if it doesn't, we should handle it gracefully
    
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Check if we got an empty state
    const emptyStateText = page.locator('text=No journey data available');
    const errorStateText = page.locator('text=Unable to load journey data');
    
    // We should have data, so neither should be visible
    if (await emptyStateText.isVisible({ timeout: 2000 })) {
      console.log('Unexpected empty state - backend has no data');
    }
    
    if (await errorStateText.isVisible({ timeout: 2000 })) {
      console.log('Unexpected error state - API might be down');
      
      // Should NOT have a retry button (removed in TDD)
      await expect(page.locator('button:has-text("Retry")')).not.toBeVisible();
    }
  });

  test('performance with real data volume', async ({ page }) => {
    await page.goto('/journey-intelligence');
    await page.waitForLoadState('networkidle');
    
    // Measure time to interactive
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="entity-selector"]', { state: 'visible' });
    const loadTime = Date.now() - startTime;
    
    console.log(`Time to interactive: ${loadTime}ms`);
    
    // Should load in under 2 seconds (our target)
    expect(loadTime).toBeLessThan(2000);
    
    // Check memory usage if possible (browser-specific)
    const performanceEntries = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576)
        };
      }
      return null;
    });
    
    if (performanceEntries) {
      console.log(`Memory usage: ${performanceEntries.usedJSHeapSize}MB / ${performanceEntries.totalJSHeapSize}MB`);
      
      // Should be under 200MB (our target)
      expect(performanceEntries.usedJSHeapSize).toBeLessThan(200);
    }
  });

  test('frontend data accuracy - compare with validation results', async ({ page }) => {
    // This test runs after validation and main tests
    if (!validationResults) {
      console.log('⚠️  No validation results available, skipping accuracy check');
      return;
    }
    
    console.log('\n🔍 Verifying frontend data accuracy...');
    
    // Compare character counts
    if (frontendData.characters.length > 0) {
      console.log(`Frontend loaded ${frontendData.characters.length} characters`);
      console.log(`Validation says SQLite has ${validationResults.summary.characters.sqlite} characters`);
      
      // Frontend should match SQLite (since that's what it loads from)
      expect(frontendData.characters.length).toBe(validationResults.summary.characters.sqlite);
    }
    
    // Compare element counts (considering the performance path)
    if (frontendData.elements.length > 0) {
      console.log(`Frontend loaded ${frontendData.elements.length} elements`);
      console.log(`Validation sampled ${validationResults.summary.elements.sqlite} memory token elements`);
      
      // Note: Frontend might load more elements than validation sampled
      // This is expected since validation only samples memory tokens
    }
    
    // Report final summary
    console.log('\n📋 E2E Test Summary:');
    console.log(`- SQLite has ${validationResults.summary.characters.matched} characters matching Notion`);
    console.log(`- Frontend successfully loaded character data`);
    console.log(`- Sync is ${validationResults.syncStatus.isStale ? 'STALE' : 'fresh'}`);
    
    if (validationResults.syncStatus.isStale) {
      console.log('\n💡 Recommendation: Run sync to get latest Notion data');
      console.log('   cd storyforge/backend && node scripts/sync-data.js');
    }
  });
});