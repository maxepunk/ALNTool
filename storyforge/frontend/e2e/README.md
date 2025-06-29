# End-to-End Testing with Playwright

This directory contains end-to-end tests for the StoryForge frontend application using Playwright.

## Setup

### Prerequisites
- Node.js LTS version
- Backend server running at http://localhost:3000
- Frontend dev server running at http://localhost:5173

### Installation
Playwright is already included in the project dependencies. To install browsers:

```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with visible browser
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### Generate new tests using Playwright's codegen
```bash
npm run test:e2e:codegen
```

### Use Playwright UI mode
```bash
npm run test:e2e:ui
```

## Test Structure

```
e2e/
├── tests/           # Test files
├── pages/           # Page Object Models
├── fixtures/        # Test data and fixtures
└── utils/           # Helper functions and utilities
```

### Page Object Model Pattern

We use the Page Object Model (POM) pattern for better maintainability:

```javascript
// Example usage in tests
import { test, expect } from '../utils/test-helpers.js';

test('should navigate to player journey', async ({ playerJourneyPage }) => {
  await playerJourneyPage.goto();
  await playerJourneyPage.selectCharacter('Alex Reeves');
  const nodeCount = await playerJourneyPage.getNodeCount();
  expect(nodeCount).toBeGreaterThan(0);
});
```

## Playwright MCP Server

The Playwright MCP (Model Context Protocol) server allows AI assistants like Claude to help generate and maintain tests.

### Setup for Claude Desktop

1. Install MCP server globally:
```bash
npm install -g @executeautomation/playwright-mcp-server
```

2. Configure Claude Desktop by adding to your `claude-desktop-config.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@executeautomation/playwright-mcp-server"]
    }
  }
}
```

3. Restart Claude Desktop completely (including terminating background processes)

### Using MCP Server with Claude

Once configured, you can ask Claude to:
- Generate new test cases
- Debug failing tests
- Update tests when UI changes
- Create page object models for new pages
- Analyze test coverage

Example prompts:
- "Generate a test for the Memory Economy page"
- "Debug why the character selection test is failing"
- "Create a page object model for the Puzzle Flow page"

## Test Data

Test data is managed in `utils/test-helpers.js`:

```javascript
export const testData = {
  characters: ['Alex Reeves', 'Marcus Blackwood', ...],
  elements: ['UV Light', 'Sarah\'s Jewelry Box', ...],
  puzzles: ['Pillow Puzzle', 'Company One-Pagers', ...]
};
```

## CI/CD Integration

Tests can be run in CI with:

```bash
# Run in CI mode (headless, with retries)
CI=true npm run test:e2e
```

Test results are saved to:
- HTML Report: `playwright-report/`
- JUnit XML: `test-results/junit.xml`
- Videos: `test-results/videos/`
- Screenshots: `screenshots/`

## Debugging Tips

1. **Use `test:e2e:debug`** to step through tests with Playwright Inspector
2. **Take screenshots** during test execution:
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```
3. **Use `page.pause()`** to pause execution:
   ```javascript
   await page.pause(); // Opens Playwright Inspector
   ```
4. **Enable verbose logging**:
   ```bash
   DEBUG=pw:api npm run test:e2e
   ```

## Best Practices

1. **Keep tests independent** - Each test should be able to run in isolation
2. **Use data-testid attributes** - Add `data-testid` to elements for reliable selection
3. **Wait for elements properly** - Use Playwright's built-in waiting mechanisms
4. **Mock external APIs** when appropriate to ensure consistent test results
5. **Use descriptive test names** that explain what is being tested
6. **Keep page objects focused** - One page object per page/component

## Common Issues

### Backend not running
```
Error: Backend is not running. Please start it with: cd storyforge/backend && npm start
```

### Frontend not running
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173
```
Solution: Start the frontend dev server with `npm run dev`

### Flaky tests
- Increase timeouts in `playwright.config.js`
- Add explicit waits for dynamic content
- Use `waitForLoadState('networkidle')` for pages with async data

## Contributing

When adding new features:
1. Create/update page object models
2. Write tests for happy path and edge cases
3. Run tests locally before pushing
4. Update this README if needed