import asyncHandler from 'express-async-handler';
import https from 'https';

let cachedData = null;
let lastFetched = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const fetchFromUpstream = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ace2examz.com',
      port: 443,
      path: '/api/flashcards/export',
      method: 'GET',
      rejectUnauthorized: false // Bypasses the certificate validation issue on the server
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse upstream response: ' + e.message));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};

// @desc    Get flashcards chapters, topics, and cards from external source
// @route   GET /api/flashcards
// @access  Private (Authenticated student)
export const getFlashcards = asyncHandler(async (req, res) => {
  const now = Date.now();
  if (cachedData && (now - lastFetched < CACHE_TTL)) {
    return res.json(cachedData);
  }

  try {
    const data = await fetchFromUpstream();
    cachedData = data;
    lastFetched = now;
    res.json(data);
  } catch (error) {
    console.error('Error fetching flashcards from upstream:', error.message);
    if (cachedData) {
      // Fallback to cache if upstream is down
      return res.json(cachedData);
    }
    res.status(500);
    throw new Error('Failed to load flashcards from source server.');
  }
});
