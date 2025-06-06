const express = require('express');
const router = express.Router();

const DataSyncService = require('../services/dataSyncService');

// Instantiate sync service
const syncService = new DataSyncService();

/**
 * POST /api/sync/data - Trigger full data sync
 */
router.post('/data', async (req, res) => {
  try {
    console.log('🔄 API sync request received');
    const result = await syncService.syncAllData();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Data sync completed successfully',
        stats: result.stats,
        duration: result.duration
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Data sync failed',
        error: result.error,
        stats: result.stats
      });
    }
  } catch (error) {
    console.error('❌ Sync API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during sync',
      error: error.message
    });
  }
});

/**
 * GET /api/sync/status - Get current sync status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await syncService.getSyncStatus();
    
    if (status.success) {
      res.json({
        success: true,
        status: 'ready',
        counts: status.counts,
        lastSync: status.lastSync
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get sync status',
        error: status.error
      });
    }
  } catch (error) {
    console.error('❌ Sync status API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error getting sync status',
      error: error.message
    });
  }
});

module.exports = router; 