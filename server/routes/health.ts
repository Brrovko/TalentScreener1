import express from 'express';

const router = express.Router();

/**
 * Health check endpoint for deployment verification
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    // Add database connection check or other health checks here if needed
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

export default router;
