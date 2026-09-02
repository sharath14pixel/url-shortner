import { Url } from '../models/Url.js';
import { isMongoReady } from '../config/db.js';
import { inMemoryStore } from '../utils/inMemoryStore.js';
import { generateUniqueShortCode } from '../utils/base62.js';
import { validateUrl } from '../utils/urlValidator.js';
import { getCache, setCache } from '../config/redis.js';

/**
 * Check if a short code exists in active DB (Mongo or In-Memory)
 */
const checkCodeExists = async (code) => {
  if (isMongoReady()) {
    const existing = await Url.findOne({ shortCode: code }).lean();
    return !!existing;
  }
  const existing = await inMemoryStore.findOneByShortCode(code);
  return !!existing;
};

/**
 * @desc   Create a short code for a long URL
 * @route  POST /api/shorten
 */
export const shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl } = req.body;

    // 1. Validate input URL & check anomalies
    const validation = validateUrl(originalUrl);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.reason
      });
    }

    const cleanUrl = validation.cleanUrl;

    // 2. Check if URL is already shortened in active store
    let existingUrl = null;
    if (isMongoReady()) {
      existingUrl = await Url.findOne({ originalUrl: cleanUrl }).lean();
    } else {
      existingUrl = await inMemoryStore.findOneByOriginalUrl(cleanUrl);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    if (existingUrl) {
      return res.status(200).json({
        success: true,
        shortCode: existingUrl.shortCode,
        shortUrl: `${baseUrl}/${existingUrl.shortCode}`,
        originalUrl: existingUrl.originalUrl,
        clicks: existingUrl.clicks,
        isFlagged: existingUrl.isFlagged,
        createdAt: existingUrl.createdAt,
        isExisting: true
      });
    }

    // 3. Generate unique Base62 code with collision retry logic
    const shortCode = await generateUniqueShortCode(checkCodeExists, 7);

    let savedRecord = null;
    if (isMongoReady()) {
      savedRecord = await Url.create({
        shortCode,
        originalUrl: cleanUrl,
        isFlagged: validation.isFlagged
      });
    } else {
      savedRecord = await inMemoryStore.create({
        shortCode,
        originalUrl: cleanUrl,
        isFlagged: validation.isFlagged
      });
    }

    // 4. Write-through to Redis cache if connected
    await setCache(shortCode, cleanUrl, 86400);

    const shortUrl = `${baseUrl}/${shortCode}`;

    return res.status(201).json({
      success: true,
      shortCode,
      shortUrl,
      originalUrl: savedRecord.originalUrl,
      clicks: savedRecord.clicks,
      isFlagged: savedRecord.isFlagged,
      createdAt: savedRecord.createdAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Redirect short code to original URL (301 Permanent Redirect)
 * @route  GET /:code
 */
export const redirectUrl = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Short code is required.' });
    }

    // 1. Redis Cache Lookup (Fast Path)
    let targetUrl = await getCache(code);
    let cacheHit = false;

    if (targetUrl) {
      cacheHit = true;
    } else {
      // 2. Storage Lookup (Cache Miss)
      let urlDoc = null;
      if (isMongoReady()) {
        urlDoc = await Url.findOne({ shortCode: code }).lean();
      } else {
        urlDoc = await inMemoryStore.findOneByShortCode(code);
      }

      if (!urlDoc) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>404 - Link Not Found</title>
              <style>
                body { background: #ffffff; color: #000000; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #ffffff; padding: 2rem; border-radius: 8px; text-align: center; border: 1px solid #eaeaea; box-shadow: 0 4px 14px rgba(0,0,0,0.05); }
                h1 { margin-bottom: 0.5rem; }
                p { color: #666666; }
                a { color: #000000; text-decoration: underline; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>404 - Link Not Found</h1>
                <p>The short link <code>/${code}</code> does not exist or has expired.</p>
                <p><a href="${frontendUrl}">Return to ShortURL Home</a></p>
              </div>
            </body>
          </html>
        `);
      }

      targetUrl = urlDoc.originalUrl;
      await setCache(code, targetUrl, 86400);
    }

    // 3. Async click count increment
    if (isMongoReady()) {
      Url.updateOne({ shortCode: code }, { $inc: { clicks: 1 } })
        .catch(err => console.error(`[DB] Failed to increment click count: ${err.message}`));
    } else {
      inMemoryStore.incrementClicks(code);
    }

    console.log(`[Redirect] ${code} -> ${targetUrl} (${cacheHit ? 'Cache Hit' : 'Cache Miss'})`);

    // 4. HTTP 301 Permanent Redirect
    return res.redirect(301, targetUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get statistics for a specific short code
 * @route  GET /api/stats/:code
 */
export const getUrlStats = async (req, res, next) => {
  try {
    const { code } = req.params;

    let urlDoc = null;
    if (isMongoReady()) {
      urlDoc = await Url.findOne({ shortCode: code }).lean();
    } else {
      urlDoc = await inMemoryStore.findOneByShortCode(code);
    }

    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        error: 'Short URL stats not found.'
      });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    return res.status(200).json({
      success: true,
      stats: {
        shortCode: urlDoc.shortCode,
        shortUrl: `${baseUrl}/${urlDoc.shortCode}`,
        originalUrl: urlDoc.originalUrl,
        clicks: urlDoc.clicks,
        isFlagged: urlDoc.isFlagged,
        createdAt: urlDoc.createdAt,
        updatedAt: urlDoc.updatedAt || urlDoc.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get list of all shortened URLs (sortable)
 * @route  GET /api/urls
 */
export const getAllUrls = async (req, res, next) => {
  try {
    const { sort = 'newest', limit = 50 } = req.query;

    let formattedUrls = [];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    if (isMongoReady()) {
      let sortOptions = { createdAt: -1 };
      if (sort === 'clicks') sortOptions = { clicks: -1, createdAt: -1 };
      else if (sort === 'oldest') sortOptions = { createdAt: 1 };

      const urls = await Url.find()
        .sort(sortOptions)
        .limit(parseInt(limit, 10))
        .lean();

      formattedUrls = urls.map(u => ({
        shortCode: u.shortCode,
        shortUrl: `${baseUrl}/${u.shortCode}`,
        originalUrl: u.originalUrl,
        clicks: u.clicks,
        isFlagged: u.isFlagged,
        createdAt: u.createdAt
      }));
    } else {
      const urls = await inMemoryStore.findAll(sort, parseInt(limit, 10));
      formattedUrls = urls.map(u => ({
        shortCode: u.shortCode,
        shortUrl: `${baseUrl}/${u.shortCode}`,
        originalUrl: u.originalUrl,
        clicks: u.clicks,
        isFlagged: u.isFlagged,
        createdAt: u.createdAt
      }));
    }

    return res.status(200).json({
      success: true,
      count: formattedUrls.length,
      urls: formattedUrls
    });
  } catch (error) {
    next(error);
  }
};
