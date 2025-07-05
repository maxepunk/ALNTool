// Quick test to check if nodes are clickable in overview mode
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to journey intelligence
  await page.goto('http://localhost:3003/journey-intelligence');
  
  // Wait for graph to load
  await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  
  // Get all nodes
  const nodes = await page.$$('.react-flow__node');
  console.log(`Found ${nodes.length} nodes`);
  
  // Check each node's computed styles
  for (let i = 0; i < Math.min(3, nodes.length); i++) {
    const node = nodes[i];
    const className = await node.evaluate(el => el.className);
    const pointerEvents = await node.evaluate(el => 
      window.getComputedStyle(el).pointerEvents
    );
    const opacity = await node.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    
    console.log(`Node ${i}: className="${className}", pointer-events="${pointerEvents}", opacity="${opacity}"`);
  }
  
  // Try to click the first node
  if (nodes.length > 0) {
    try {
      await nodes[0].click();
      console.log('Successfully clicked first node');
      
      // Check if intelligence panel appeared
      await page.waitForTimeout(1000);
      const panel = await page.$('[data-testid="intelligence-panel"]');
      console.log('Intelligence panel visible:', !!panel);
    } catch (e) {
      console.log('Failed to click node:', e.message);
    }
  }
  
  await browser.close();
})();