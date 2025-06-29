const express = require('express');
const logger = require('../utils/logger');
const router = express.Router();
const dataSyncService = require('../services/dataSyncService');

// Helper to format dates consistently
const formatDate = (date) => {
  if (!date) {
    return null;
  }
  const d = new Date(date);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

/**
 * POST /api/sync/data - Trigger full data sync
 *
 * Response:
 * - 200: Sync completed successfully
 * - 409: Sync already in progress
 * - 500: Internal server error
 */
router.post('/data', async (req, res) => {
  try {
    // Check if sync is already running
    const status = dataSyncService.getSyncStatus();
    if (!status || typeof status.isRunning !== 'boolean') {
      throw new Error('Invalid sync status');
    }

    if (status.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Sync already in progress',
        message: 'A sync operation is already running'
      });
    }

    logger.debug('🔄 API sync request received');
    const result = await dataSyncService.syncAll();

    if (!result || !result.phases) {
      throw new Error('Invalid sync result');
    }

    res.json({
      success: true,
      message: 'Sync completed successfully',
      stats: {
        phases: result.phases,
        totalDuration: result.totalDuration,
        status: result.status
      }
    });
  } catch (error) {
    logger.error('❌ Sync API error:', error);

    // Handle specific error types
    if (error.message === 'Sync already in progress') {
      return res.status(409).json({
        success: false,
        error: error.message,
        message: 'A sync operation is already running'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Sync failed',
      message: 'Failed to complete sync operation'
    });
  }
});

/**
 * GET /api/sync/status - Get current sync status
 *
 * Response:
 * - 200: Status retrieved successfully
 * - 500: Internal server error
 */
router.get('/status', (req, res) => {
  try {
    const status = dataSyncService.getSyncStatus();

    if (!status || typeof status.isRunning !== 'boolean') {
      throw new Error('Invalid sync status');
    }

    // Add additional status information with consistent date format
    const enhancedStatus = {
      ...status,
      startTime: formatDate(status.startTime),
      progress: typeof status.progress === 'number' ? status.progress : 0
    };

    res.json({
      success: true,
      status: enhancedStatus
    });
  } catch (error) {
    logger.error('❌ Status API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status',
      message: 'Failed to get sync status'
    });
  }
});

/**
 * POST /api/sync/cancel - Cancel current sync operation
 *
 * Response:
 * - 200: Cancellation successful or no sync running
 * - 500: Internal server error
 */
router.post('/cancel', async (req, res) => {
  try {
    const status = dataSyncService.getSyncStatus();

    if (!status || typeof status.isRunning !== 'boolean') {
      throw new Error('Invalid sync status');
    }

    if (!status.isRunning) {
      return res.json({
        success: true,
        message: 'No sync operation to cancel'
      });
    }

    // Let errors from cancelSync propagate to the outer catch
    const cancelled = await dataSyncService.cancelSync();
    if (typeof cancelled !== 'boolean') {
      throw new Error('Invalid cancellation result');
    }

    res.json({
      success: true,
      message: cancelled ? 'Sync cancellation requested' : 'No sync operation to cancel'
    });
  } catch (error) {
    logger.error('❌ Cancel API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel',
      message: 'Failed to cancel sync operation'
    });
  }
});

module.exports = router;