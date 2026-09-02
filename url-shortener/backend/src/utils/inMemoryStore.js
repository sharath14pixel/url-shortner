// Fallback in-memory database store when MongoDB is not running locally
const urlsMap = new Map();

export const inMemoryStore = {
  async findOneByShortCode(shortCode) {
    return urlsMap.get(shortCode) || null;
  },

  async findOneByOriginalUrl(originalUrl) {
    for (const urlDoc of urlsMap.values()) {
      if (urlDoc.originalUrl === originalUrl) {
        return urlDoc;
      }
    }
    return null;
  },

  async create(data) {
    const doc = {
      shortCode: data.shortCode,
      originalUrl: data.originalUrl,
      clicks: data.clicks || 0,
      isFlagged: data.isFlagged || false,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date()
    };
    urlsMap.set(data.shortCode, doc);
    return doc;
  },

  async incrementClicks(shortCode) {
    const doc = urlsMap.get(shortCode);
    if (doc) {
      doc.clicks += 1;
      doc.updatedAt = new Date();
    }
  },

  async findAll(sort = 'newest', limit = 50) {
    const list = Array.from(urlsMap.values());
    if (sort === 'clicks') {
      list.sort((a, b) => b.clicks - a.clicks);
    } else if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      // newest
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list.slice(0, limit);
  }
};
