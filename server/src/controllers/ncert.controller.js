import asyncHandler from 'express-async-handler';
import https from 'https';

const UPSTREAM_HOST = 'ace2examz.com';

/**
 * Helper utility to perform GET requests on upstream server
 */
const fetchFromUpstream = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: UPSTREAM_HOST,
      port: 443,
      path: path,
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

/**
 * Helper utility to perform POST requests on upstream server
 */
const postToUpstream = (path, bodyData) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bodyData);
    const options = {
      hostname: UPSTREAM_HOST,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false // Bypasses certificate verification
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

    req.write(postData);
    req.end();
  });
};

// @desc    Get NCERT Chapters for a specific category
// @route   GET /api/ncert/chapters/:category
// @access  Private
export const getNCERTChapters = asyncHandler(async (req, res) => {
  const category = req.params.category || 'line-by-line';
  try {
    const data = await fetchFromUpstream(`/api/ncert/chapters/${encodeURIComponent(category)}`);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching chapters for category ${category}:`, error.message);
    res.status(500);
    throw new Error('Failed to load NCERT chapters from source server.');
  }
});

// @desc    Get NCERT Badges for a specific category
// @route   GET /api/ncert/badges/:category
// @access  Private
export const getNCERTBadges = asyncHandler(async (req, res) => {
  const category = req.params.category;
  if (!category) {
    res.status(400);
    throw new Error('category is required parameter');
  }
  try {
    const data = await fetchFromUpstream(`/api/ncert/badges/${encodeURIComponent(category)}`);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching badges for category ${category}:`, error.message);
    res.status(500);
    throw new Error('Failed to load NCERT badges from source server.');
  }
});

// @desc    Get the available NTA Abhyas subjects
// @route   GET /api/ncert/nta-abhyas/subjects
// @access  Private
export const getNTAAbhyasSubjects = asyncHandler(async (_req, res) => {
  try {
    const data = await fetchFromUpstream('/api/nta-abhyas/stats');
    const stats = Array.isArray(data) ? data : [];

    // The source dataset is chemistry-only and groups records by exam category.
    // Expose those groups as subjects so the student flow remains
    // Subject -> Chapter -> Topic -> Questions.
    const subjects = stats.map((item) => ({
      _id: item.examCategory,
      name: `${item.examCategory} Chemistry`,
      subject: 'Chemistry',
      examCategory: item.examCategory,
      totalQuestions: item.totalQuestions || 0,
      totalChapters: item.totalChapters || 0
    }));

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching NTA Abhyas subjects:', error.message);
    res.status(500);
    throw new Error('Failed to load NTA Abhyas subjects from source server.');
  }
});

// @desc    Get NTA Abhyas chapters for an exam subject
// @route   GET /api/ncert/nta-abhyas/chapters/:examCategory
// @access  Private
export const getNTAAbhyasChapters = asyncHandler(async (req, res) => {
  const examCategory = String(req.params.examCategory || '').toUpperCase();
  if (!['JEE', 'NEET'].includes(examCategory)) {
    res.status(400);
    throw new Error('Valid exam category is required.');
  }

  try {
    const data = await fetchFromUpstream(
      `/api/nta-abhyas/chapters/${encodeURIComponent(examCategory)}`
    );
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(`Error fetching NTA Abhyas chapters for ${examCategory}:`, error.message);
    res.status(500);
    throw new Error('Failed to load NTA Abhyas chapters from source server.');
  }
});

// @desc    Get NTA Abhyas questions for an exam subject and chapter
// @route   GET /api/ncert/nta-abhyas/questions
// @access  Private
export const getNTAAbhyasQuestions = asyncHandler(async (req, res) => {
  const examCategory = String(req.query.examCategory || '').toUpperCase();
  const chapter = String(req.query.chapter || '').trim();

  if (!['JEE', 'NEET'].includes(examCategory) || !chapter) {
    res.status(400);
    throw new Error('Valid exam category and chapter are required.');
  }

  try {
    const path = `/api/nta-abhyas/questions?examCategory=${encodeURIComponent(examCategory)}&chapter=${encodeURIComponent(chapter)}`;
    const data = await fetchFromUpstream(path);
    const questions = (Array.isArray(data) ? data : []).map((question) => {
      const absoluteAssetUrl = (url) => {
        if (!url || /^https?:\/\//i.test(url)) return url;
        return `https://${UPSTREAM_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
      };

      return {
        ...question,
        imageUrl: absoluteAssetUrl(question.imageUrl),
        solutionImageUrl: absoluteAssetUrl(question.solutionImageUrl)
      };
    });
    res.json(questions);
  } catch (error) {
    console.error(`Error fetching NTA Abhyas questions for ${examCategory}/${chapter}:`, error.message);
    res.status(500);
    throw new Error('Failed to load NTA Abhyas questions from source server.');
  }
});

// @desc    Get NCERT Questions for a specific chapter/badge and category
// @route   GET /api/ncert/questions
// @access  Private
export const getNCERTQuestions = asyncHandler(async (req, res) => {
  const { chapterId, category, badgeType } = req.query;
  const categoryParam = category || 'line-by-line';

  let path = `/api/ncert/questions?category=${encodeURIComponent(categoryParam)}`;
  if (chapterId) path += `&chapterId=${encodeURIComponent(chapterId)}`;
  if (badgeType) path += `&badgeType=${encodeURIComponent(badgeType)}`;

  try {
    const data = await fetchFromUpstream(path);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching questions for category ${categoryParam}:`, error.message);
    res.status(500);
    throw new Error('Failed to load NCERT questions from source server.');
  }
});

// @desc    Save user progress for a question
// @route   POST /api/ncert/progress
// @access  Private
export const saveNCERTProgress = asyncHandler(async (req, res) => {
  const { questionId, chapterId, isCorrect } = req.body;
  if (!questionId || !chapterId || isCorrect === undefined) {
    res.status(400);
    throw new Error('questionId, chapterId, and isCorrect are required');
  }

  // Use the local authenticated student's user ID as the identifier
  const userId = req.user._id;

  try {
    const data = await postToUpstream('/api/ncert/progress', {
      userId,
      questionId,
      chapterId,
      isCorrect
    });
    res.json(data);
  } catch (error) {
    console.error(`Error saving user progress for user ${userId}:`, error.message);
    res.status(500);
    throw new Error('Failed to save NCERT progress to source server.');
  }
});
