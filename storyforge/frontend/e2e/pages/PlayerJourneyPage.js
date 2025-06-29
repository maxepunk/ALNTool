import { BasePage } from './BasePage.js';

/**
 * Player Journey Page Object Model
 */
export class PlayerJourneyPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Define selectors
    this.selectors = {
      pageTitle: 'h4:has-text("Player Journey")',
      characterSelector: '[data-testid="character-selector"]',
      characterOption: '.MuiMenuItem-root',
      journeyGraph: '.react-flow',
      graphNode: '.react-flow__node',
      graphEdge: '.react-flow__edge',
      contextWorkspace: '[data-testid="context-workspace"]',
      nodeDetails: '[data-testid="node-details"]',
      commandBar: '[data-testid="command-bar"]',
      searchInput: 'input[placeholder*="Search"]',
      syncButton: 'button:has-text("Sync")',
      exportButton: 'button:has-text("Export")',
      loadingSpinner: '.MuiCircularProgress-root',
      emptyState: '[data-testid="empty-state"]',
      zoomInButton: '.react-flow__controls-button[aria-label="zoom in"]',
      zoomOutButton: '.react-flow__controls-button[aria-label="zoom out"]',
      fitViewButton: '.react-flow__controls-button[aria-label="fit view"]'
    };
  }

  /**
   * Navigate to player journey page
   */
  async goto() {
    await super.goto('/player-journey');
    await this.waitForPageLoad();
  }

  /**
   * Select a character
   * @param {string} characterName - Name of the character to select
   */
  async selectCharacter(characterName) {
    await this.click(this.selectors.characterSelector);
    await this.page.waitForSelector(this.selectors.characterOption);
    
    const option = await this.page.locator(this.selectors.characterOption)
      .filter({ hasText: characterName })
      .first();
    
    await option.click();
    await this.waitForGraphToLoad();
  }

  /**
   * Wait for journey graph to load
   */
  async waitForGraphToLoad() {
    // Wait for loading to complete
    await this.page.waitForSelector(this.selectors.loadingSpinner, { state: 'hidden' });
    
    // Wait for graph to be visible
    await this.page.waitForSelector(this.selectors.journeyGraph, { state: 'visible' });
    
    // Give the graph time to render
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get node count in the graph
   * @returns {Promise<number>} Number of nodes
   */
  async getNodeCount() {
    await this.waitForGraphToLoad();
    const nodes = await this.page.$$(this.selectors.graphNode);
    return nodes.length;
  }

  /**
   * Get edge count in the graph
   * @returns {Promise<number>} Number of edges
   */
  async getEdgeCount() {
    await this.waitForGraphToLoad();
    const edges = await this.page.$$(this.selectors.graphEdge);
    return edges.length;
  }

  /**
   * Click on a node in the graph
   * @param {string} nodeLabel - Label of the node to click
   */
  async clickNode(nodeLabel) {
    const node = await this.page.locator(this.selectors.graphNode)
      .filter({ hasText: nodeLabel })
      .first();
    
    await node.click();
    
    // Wait for context workspace to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Get selected node details from context workspace
   * @returns {Promise<Object>} Node details
   */
  async getSelectedNodeDetails() {
    const contextWorkspace = await this.page.locator(this.selectors.contextWorkspace);
    
    // Check if any node is selected
    const hasSelection = await contextWorkspace.locator(this.selectors.nodeDetails).isVisible();
    
    if (!hasSelection) {
      return null;
    }

    return {
      title: await contextWorkspace.locator('h6').textContent(),
      type: await contextWorkspace.locator('.MuiChip-label').textContent(),
      details: await contextWorkspace.locator('[data-testid="node-details-content"]').textContent()
    };
  }

  /**
   * Search in the command bar
   * @param {string} searchTerm - Term to search for
   */
  async search(searchTerm) {
    await this.fill(this.selectors.searchInput, searchTerm);
    // Wait for debounce
    await this.page.waitForTimeout(500);
  }

  /**
   * Click sync button
   */
  async sync() {
    await this.click(this.selectors.syncButton);
    // Wait for sync to complete
    await this.page.waitForSelector(this.selectors.syncButton + ':not(:disabled)');
  }

  /**
   * Export data
   */
  async export() {
    // Set up download listener
    const downloadPromise = this.page.waitForEvent('download');
    
    await this.click(this.selectors.exportButton);
    
    const download = await downloadPromise;
    return download.suggestedFilename();
  }

  /**
   * Zoom controls
   */
  async zoomIn() {
    await this.click(this.selectors.zoomInButton);
  }

  async zoomOut() {
    await this.click(this.selectors.zoomOutButton);
  }

  async fitView() {
    await this.click(this.selectors.fitViewButton);
  }

  /**
   * Check if graph is empty
   * @returns {Promise<boolean>}
   */
  async isGraphEmpty() {
    return await this.isVisible(this.selectors.emptyState);
  }

  /**
   * Get all available characters
   * @returns {Promise<string[]>} Array of character names
   */
  async getAvailableCharacters() {
    await this.click(this.selectors.characterSelector);
    await this.page.waitForSelector(this.selectors.characterOption);
    
    const characters = await this.getAllText(this.selectors.characterOption);
    
    // Close dropdown
    await this.page.keyboard.press('Escape');
    
    return characters;
  }
}