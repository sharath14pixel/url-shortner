import express from 'express';
import {
  shortenUrl,
  redirectUrl,
  getUrlStats,
  getAllUrls
} from '../controllers/urlController.js';
import {
  shortenLimiter,
  redirectLimiter,
  apiLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();

// API Endpoints
router.post('/api/shorten', shortenLimiter, shortenUrl);
router.get('/api/stats/:code', apiLimiter, getUrlStats);
router.get('/api/urls', apiLimiter, getAllUrls);

// Redirect Endpoint (Must be last to avoid catching /api/... routes)
router.get('/:code', redirectLimiter, redirectUrl);

export default router;
