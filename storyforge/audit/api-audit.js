#!/usr/bin/env node

/**
 * ALNTool API Audit Script
 * Systematically tests all API endpoints for mismatches between frontend and backend
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_API_FILE = path.join(__dirname, '../frontend/src/services/api.js');
const OUTPUT_DIR = path.join(__dirname, 'results');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test result tracking
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    success: 0,
    failed: 0,
    notFound: 0,
    error: 0
  },
  endpoints: []
};

/**
 * Extract API endpoints from frontend code
 */
function extractFrontendEndpoints() {
  const apiCode = fs.readFileSync(FRONTEND_API_FILE, 'utf8');
  const endpoints = [];
  
  // Pattern to match API function definitions
  const functionPattern = /(\w+):\s*async\s*\([^)]*\)\s*=>\s*{[\s\S]*?apiClient\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
  
  // Pattern to match direct apiClient calls
  const directPattern = /apiClient\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g;
  
  let match;
  const seen = new Set();
  
  // Extract function-based endpoints
  while ((match = functionPattern.exec(apiCode)) !== null) {
    const [, functionName, method, path] = match;
    const key = `${method.toUpperCase()} ${path}`;
    if (!seen.has(key)) {
      seen.add(key);
      endpoints.push({
        functionName,
        method: method.toUpperCase(),
        path,
        fullPath: `/api${path}`,
        isDynamic: path.includes('${')
      });
    }
  }
  
  // Also check for direct calls
  apiCode.replace(directPattern, (match, method, path) => {
    const key = `${method.toUpperCase()} ${path}`;
    if (!seen.has(key)) {
      seen.add(key);
      endpoints.push({
        functionName: 'direct',
        method: method.toUpperCase(),
        path,
        fullPath: `/api${path}`,
        isDynamic: path.includes('${')
      });
    }
  });
  
  return endpoints;
}

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  const result = {
    ...endpoint,
    tested: new Date().toISOString(),
    status: 'unknown',
    statusCode: null,
    responseTime: null,
    error: null,
    dataShape: null,
    sampleIds: []
  };
  
  try {
    // For dynamic endpoints, we need test data
    let testPath = endpoint.fullPath;
    
    if (endpoint.isDynamic) {
      // Get sample IDs for testing
      result.sampleIds = await getSampleIds(endpoint.path);
      if (result.sampleIds.length === 0) {
        result.status = 'skipped';
        result.error = 'No sample data available for dynamic endpoint';
        return result;
      }
      
      // Use first sample ID
      testPath = endpoint.fullPath.replace(/\$\{[^}]+\}/g, result.sampleIds[0]);
    }
    
    const startTime = Date.now();
    const response = await axios({
      method: endpoint.method,
      url: `${API_BASE_URL}${endpoint.path}`.replace('/api/api', '/api'),
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
    result.responseTime = Date.now() - startTime;
    
    result.statusCode = response.status;
    
    if (response.status === 200) {
      result.status = 'success';
      result.dataShape = analyzeDataShape(response.data);
    } else if (response.status === 404) {
      result.status = 'notFound';
      result.error = 'Endpoint not found';
    } else {
      result.status = 'failed';
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    result.statusCode = error.response?.status || null;
  }
  
  return result;
}

/**
 * Get sample IDs for testing dynamic endpoints
 */
async function getSampleIds(endpointPath) {
  try {
    // Determine entity type from path
    if (endpointPath.includes('/characters/')) {
      const response = await axios.get(`${API_BASE_URL}/characters`);
      return response.data.slice(0, 3).map(c => c.id);
    } else if (endpointPath.includes('/elements/')) {
      const response = await axios.get(`${API_BASE_URL}/elements`);
      return response.data.slice(0, 3).map(e => e.id);
    } else if (endpointPath.includes('/puzzles/')) {
      const response = await axios.get(`${API_BASE_URL}/puzzles`);
      return response.data.slice(0, 3).map(p => p.id);
    } else if (endpointPath.includes('/timeline/')) {
      const response = await axios.get(`${API_BASE_URL}/timeline`);
      return response.data.slice(0, 3).map(t => t.id);
    } else if (endpointPath.includes('/journeys/')) {
      const response = await axios.get(`${API_BASE_URL}/characters`);
      return response.data.slice(0, 3).map(c => c.id);
    }
  } catch (error) {
    console.error(`Failed to get sample IDs for ${endpointPath}:`, error.message);
  }
  return [];
}

/**
 * Analyze the shape of response data
 */
function analyzeDataShape(data) {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  
  const type = Array.isArray(data) ? 'array' : typeof data;
  
  if (type === 'array') {
    return {
      type: 'array',
      length: data.length,
      itemShape: data.length > 0 ? analyzeDataShape(data[0]) : 'empty'
    };
  }
  
  if (type === 'object') {
    const shape = {
      type: 'object',
      fields: {}
    };
    
    for (const key of Object.keys(data).slice(0, 20)) { // Limit to first 20 fields
      const value = data[key];
      shape.fields[key] = typeof value === 'object' && value !== null
        ? (Array.isArray(value) ? `array[${value.length}]` : 'object')
        : typeof value;
    }
    
    return shape;
  }
  
  return type;
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔍 ALNTool API Audit Starting...\n');
  
  // Step 1: Extract frontend endpoints
  console.log('📋 Extracting frontend API endpoints...');
  const endpoints = extractFrontendEndpoints();
  console.log(`Found ${endpoints.length} endpoints\n`);
  
  // Step 2: Test each endpoint
  console.log('🧪 Testing endpoints...');
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.method} ${endpoint.path}... `);
    
    const result = await testEndpoint(endpoint);
    testResults.endpoints.push(result);
    testResults.summary.total++;
    
    switch (result.status) {
      case 'success':
        testResults.summary.success++;
        console.log('✅ Success');
        break;
      case 'notFound':
        testResults.summary.notFound++;
        console.log('❌ Not Found');
        break;
      case 'failed':
        testResults.summary.failed++;
        console.log(`⚠️  Failed (${result.statusCode})`);
        break;
      case 'error':
        testResults.summary.error++;
        console.log('💥 Error');
        break;
      case 'skipped':
        console.log('⏭️  Skipped');
        break;
    }
    
    // Add small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Step 3: Generate reports
  console.log('\n📊 Generating reports...');
  
  // Summary report
  const summaryReport = generateSummaryReport();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'api-audit-summary.md'),
    summaryReport
  );
  
  // Detailed JSON report
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'api-audit-details.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  // Mismatch report
  const mismatchReport = generateMismatchReport();
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'api-mismatches.md'),
    mismatchReport
  );
  
  console.log(`\n✅ Audit complete! Results saved to ${OUTPUT_DIR}`);
  console.log(`\n📈 Summary:`);
  console.log(`   Total Endpoints: ${testResults.summary.total}`);
  console.log(`   ✅ Success: ${testResults.summary.success}`);
  console.log(`   ❌ Not Found: ${testResults.summary.notFound}`);
  console.log(`   ⚠️  Failed: ${testResults.summary.failed}`);
  console.log(`   💥 Errors: ${testResults.summary.error}`);
}

/**
 * Generate summary report
 */
function generateSummaryReport() {
  let report = `# ALNTool API Audit Summary\n\n`;
  report += `Generated: ${testResults.timestamp}\n\n`;
  
  report += `## Overall Results\n\n`;
  report += `- **Total Endpoints**: ${testResults.summary.total}\n`;
  report += `- **Success**: ${testResults.summary.success} (${Math.round(testResults.summary.success / testResults.summary.total * 100)}%)\n`;
  report += `- **Not Found**: ${testResults.summary.notFound}\n`;
  report += `- **Failed**: ${testResults.summary.failed}\n`;
  report += `- **Errors**: ${testResults.summary.error}\n\n`;
  
  report += `## Endpoints by Status\n\n`;
  
  // Group by status
  const byStatus = {};
  for (const endpoint of testResults.endpoints) {
    if (!byStatus[endpoint.status]) {
      byStatus[endpoint.status] = [];
    }
    byStatus[endpoint.status].push(endpoint);
  }
  
  for (const [status, endpoints] of Object.entries(byStatus)) {
    report += `### ${status.toUpperCase()} (${endpoints.length})\n\n`;
    for (const endpoint of endpoints) {
      report += `- \`${endpoint.method} ${endpoint.path}\``;
      if (endpoint.functionName !== 'direct') {
        report += ` (${endpoint.functionName})`;
      }
      if (endpoint.error) {
        report += ` - ${endpoint.error}`;
      }
      report += `\n`;
    }
    report += `\n`;
  }
  
  return report;
}

/**
 * Generate mismatch report
 */
function generateMismatchReport() {
  let report = `# API Mismatch Report\n\n`;
  report += `Generated: ${testResults.timestamp}\n\n`;
  
  const issues = testResults.endpoints.filter(e => 
    e.status === 'notFound' || e.status === 'failed' || e.status === 'error'
  );
  
  report += `## Critical Issues (${issues.length})\n\n`;
  
  for (const endpoint of issues) {
    report += `### ${endpoint.method} ${endpoint.path}\n\n`;
    report += `- **Function**: ${endpoint.functionName}\n`;
    report += `- **Status**: ${endpoint.status}\n`;
    report += `- **Error**: ${endpoint.error || 'Unknown'}\n`;
    
    if (endpoint.status === 'notFound') {
      report += `- **Action Required**: Backend endpoint missing\n`;
      report += `- **Solution**: Implement in backend routes or update frontend to use correct endpoint\n`;
    } else if (endpoint.statusCode >= 400 && endpoint.statusCode < 500) {
      report += `- **Action Required**: Client error - check request format\n`;
    } else if (endpoint.statusCode >= 500) {
      report += `- **Action Required**: Server error - check backend implementation\n`;
    }
    
    report += `\n`;
  }
  
  return report;
}

// Run the audit
runAudit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});