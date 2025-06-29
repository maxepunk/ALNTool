import { BasePage } from './BasePage.js';

/**
 * Dashboard Page Object Model
 */
export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Define selectors
    this.selectors = {
      pageTitle: 'h1:has-text("Production Intelligence Dashboard")',
      characterCount: '[data-testid="character-count"]',
      elementCount: '[data-testid="element-count"]',
      puzzleCount: '[data-testid="puzzle-count"]',
      timelineCount: '[data-testid="timeline-count"]',
      navigationCard: '.MuiCard-root',
      cardTitle: '.MuiTypography-h5',
      viewDetailsButton: 'button:has-text("View Details")',
      lastSyncTime: '[data-testid="last-sync-time"]'
    };
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Get entity counts from dashboard
   * @returns {Promise<Object>} Object with entity counts
   */
  async getEntityCounts() {
    return {
      characters: await this.getText(this.selectors.characterCount),
      elements: await this.getText(this.selectors.elementCount),
      puzzles: await this.getText(this.selectors.puzzleCount),
      timeline: await this.getText(this.selectors.timelineCount)
    };
  }

  /**
   * Navigate to a specific section
   * @param {string} sectionName - Name of the section (e.g., 'Characters', 'Elements')
   */
  async navigateToSection(sectionName) {
    const card = await this.page.locator(this.selectors.navigationCard)
      .filter({ hasText: sectionName })
      .first();
    
    await card.locator(this.selectors.viewDetailsButton).click();
    await this.page.waitForNavigation();
  }

  /**
   * Get all available navigation options
   * @returns {Promise<string[]>} Array of navigation option names
   */
  async getNavigationOptions() {
    return await this.getAllText(this.selectors.cardTitle);
  }

  /**
   * Check if dashboard is fully loaded
   * @returns {Promise<boolean>}
   */
  async isLoaded() {
    return await this.isVisible(this.selectors.pageTitle);
  }

  /**
   * Get last sync time
   * @returns {Promise<string>} Last sync time text
   */
  async getLastSyncTime() {
    try {
      return await this.getText(this.selectors.lastSyncTime);
    } catch {
      return 'Not synced';
    }
  }
}