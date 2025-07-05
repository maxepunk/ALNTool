const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getDB } = require('../db/database');
const notionService = require('../services/notionService');
const propertyMapper = require('../utils/notionPropertyMapper');

/**
 * GET /api/validate/notion-sync
 * 
 * Compares current SQLite data with fresh Notion data to identify discrepancies.
 * Used by E2E tests to ensure frontend displays accurate Notion data.
 * 
 * Response format:
 * {
 *   success: boolean,
 *   summary: { characters: {...}, elements: {...} },
 *   discrepancies: [ { type, id, field, sqliteValue, notionValue } ],
 *   syncStatus: { lastSync, isStale }
 * }
 */
router.get('/notion-sync', async (req, res) => {
  try {
    const db = getDB();
    const discrepancies = [];
    const summary = {
      characters: { sqlite: 0, notion: 0, matched: 0, mismatched: 0 },
      elements: { sqlite: 0, notion: 0, matched: 0, mismatched: 0 }
    };

    // 1. Compare Characters
    logger.debug('Validating characters...');
    
    // Get SQLite characters
    const sqliteCharacters = db.prepare(`
      SELECT id, name, type, tier, logline, resolution_paths 
      FROM characters
    `).all();
    summary.characters.sqlite = sqliteCharacters.length;
    
    // Get Notion characters
    const notionCharacters = await notionService.getCharacters();
    summary.characters.notion = notionCharacters.length;
    
    // Create maps for comparison
    const sqliteCharMap = new Map(sqliteCharacters.map(c => [c.id, c]));
    const notionCharMap = new Map();
    
    // Map Notion characters
    for (const notionChar of notionCharacters) {
      const mapped = await propertyMapper.mapCharacter(notionChar);
      notionCharMap.set(mapped.id, mapped);
    }
    
    // Compare each character
    for (const [id, sqliteChar] of sqliteCharMap) {
      const notionChar = notionCharMap.get(id);
      
      if (!notionChar) {
        discrepancies.push({
          type: 'character',
          id,
          field: 'existence',
          sqliteValue: sqliteChar.name,
          notionValue: null,
          issue: 'exists_in_sqlite_not_notion'
        });
        summary.characters.mismatched++;
      } else {
        // Compare fields
        let hasDiscrepancy = false;
        
        if (sqliteChar.name !== notionChar.name) {
          discrepancies.push({
            type: 'character',
            id,
            field: 'name',
            sqliteValue: sqliteChar.name,
            notionValue: notionChar.name
          });
          hasDiscrepancy = true;
        }
        
        if (sqliteChar.tier !== notionChar.tier) {
          discrepancies.push({
            type: 'character',
            id,
            field: 'tier',
            sqliteValue: sqliteChar.tier,
            notionValue: notionChar.tier
          });
          hasDiscrepancy = true;
        }
        
        if (hasDiscrepancy) {
          summary.characters.mismatched++;
        } else {
          summary.characters.matched++;
        }
      }
    }
    
    // Check for Notion characters not in SQLite
    for (const [id, notionChar] of notionCharMap) {
      if (!sqliteCharMap.has(id)) {
        discrepancies.push({
          type: 'character',
          id,
          field: 'existence',
          sqliteValue: null,
          notionValue: notionChar.name,
          issue: 'exists_in_notion_not_sqlite'
        });
        summary.characters.mismatched++;
      }
    }

    // 2. Compare Memory Elements (simplified for Day 9)
    logger.debug('Validating memory elements...');
    
    // Get SQLite memory elements
    const sqliteElements = db.prepare(`
      SELECT id, name, type, calculated_memory_value, memory_group, rfid_tag
      FROM elements 
      WHERE type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical')
      LIMIT 50
    `).all();
    summary.elements.sqlite = sqliteElements.length;
    
    // Sample check - just verify counts match
    const notionElementsFilter = {
      or: [
        { property: 'Basic Type', select: { equals: 'Memory Token Video' } },
        { property: 'Basic Type', select: { equals: 'Memory Token Audio' } },
        { property: 'Basic Type', select: { equals: 'Memory Token Physical' } }
      ]
    };
    
    const notionElements = await notionService.getElements(notionElementsFilter);
    summary.elements.notion = Math.min(notionElements.length, 50); // Limited sample
    
    // Basic count validation
    if (Math.abs(sqliteElements.length - notionElements.length) > 10) {
      discrepancies.push({
        type: 'elements',
        field: 'count',
        sqliteValue: sqliteElements.length,
        notionValue: notionElements.length,
        issue: 'significant_count_mismatch'
      });
    }

    // 3. Check sync freshness
    const syncStatus = db.prepare(`
      SELECT MAX(end_time) as last_sync 
      FROM sync_log 
      WHERE status = 'completed'
    `).get();
    
    const lastSyncTime = syncStatus?.last_sync ? new Date(syncStatus.last_sync) : null;
    const isStale = !lastSyncTime || (Date.now() - lastSyncTime.getTime()) > 60 * 60 * 1000; // >1 hour
    
    // Return validation results
    res.json({
      success: true,
      summary,
      discrepancies: discrepancies.slice(0, 20), // Limit to first 20 issues
      totalDiscrepancies: discrepancies.length,
      syncStatus: {
        lastSync: lastSyncTime?.toISOString(),
        isStale,
        staleDuration: lastSyncTime ? `${Math.round((Date.now() - lastSyncTime.getTime()) / 1000 / 60)} minutes` : 'never synced'
      }
    });
    
  } catch (error) {
    logger.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to validate Notion sync'
    });
  }
});

module.exports = router;