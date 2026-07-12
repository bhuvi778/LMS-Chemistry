import asyncHandler from 'express-async-handler';
import Test from '../models/Test.js';
import TestSeries from '../models/TestSeries.js';
import TestAttempt from '../models/TestAttempt.js';
import Enrollment from '../models/Enrollment.js';
import SavedQuestion from '../models/SavedQuestion.js';
import ReportedQuestion from '../models/ReportedQuestion.js';
import CourseTest from '../models/CourseTest.js';
import User from '../models/User.js';
import CoinRedemption from '../models/CoinRedemption.js';
import RevisionQuestion from '../models/RevisionQuestion.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeSlug = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
  '-' + Date.now().toString(36);

// ─── ADMIN: Test CRUD ─────────────────────────────────────────────────────────
export const adminListTests = asyncHandler(async (_req, res) => {
  const tests = await Test.find()
    .sort({ createdAt: -1 })
    .select(
      '-questions.question -questions.options -questions.correct -questions.correctOptions -questions.correctNumerical -questions.videoSolutionUrl -questions.explanation -questions.image'
    );
  res.json(tests);
});

export const adminGetTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) { res.status(404); throw new Error('Test not found'); }
  res.json(test);
});

export const adminCreateTest = asyncHandler(async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id };
  if (!body.slug) body.slug = makeSlug(body.title || 'test');
  const test = await Test.create(body);
  res.status(201).json(test);
});

export const adminUpdateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) { res.status(404); throw new Error('Test not found'); }
  Object.assign(test, req.body);
  await test.save();
  res.json(test);
});

export const adminDeleteTest = asyncHandler(async (req, res) => {
  await Test.findByIdAndDelete(req.params.id);
  // Also remove from any test series
  await TestSeries.updateMany({}, { $pull: { tests: { test: req.params.id } } });
  res.json({ message: 'Test deleted' });
});

// ─── ADMIN: TestSeries CRUD ───────────────────────────────────────────────────
export const adminListTestSeries = asyncHandler(async (_req, res) => {
  const series = await TestSeries.find()
    .sort({ createdAt: -1 })
    .populate('tests.test', 'title durationMins totalMarks difficulty isFree');
  res.json(series);
});

export const adminGetTestSeries = asyncHandler(async (req, res) => {
  const series = await TestSeries.findById(req.params.id)
    .populate('tests.test', 'title durationMins totalMarks difficulty isFree questions');
  if (!series) { res.status(404); throw new Error('Test series not found'); }
  res.json(series);
});

export const adminCreateTestSeries = asyncHandler(async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id };
  if (!body.slug) body.slug = makeSlug(body.title || 'series');
  const series = await TestSeries.create(body);
  res.status(201).json(series);
});

export const adminUpdateTestSeries = asyncHandler(async (req, res) => {
  const series = await TestSeries.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('tests.test', 'title durationMins totalMarks difficulty isFree');
  if (!series) { res.status(404); throw new Error('Test series not found'); }
  res.json(series);
});

export const adminDeleteTestSeries = asyncHandler(async (req, res) => {
  await TestSeries.findByIdAndDelete(req.params.id);
  res.json({ message: 'Test series deleted' });
});

// ─── ADMIN: Test Attempts (analytics) ────────────────────────────────────────
export const adminGetTestAttempts = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ test: req.params.testId })
    .populate('user', 'name email')
    .sort({ submittedAt: -1 })
    .limit(100);
  res.json(attempts);
});

// ─── PUBLIC: List Tests (portal) ─────────────────────────────────────────────
export const publicListTests = asyncHandler(async (req, res) => {
  const { difficulty, subject, free, q, seriesId } = req.query;
  const filter = { isPublished: true, isActive: true };
  if (difficulty) filter.difficulty = difficulty;
  if (subject) filter.subject = subject;
  if (free === 'true') filter.isFree = true;
  if (q) filter.title = { $regex: q, $options: 'i' };
  const tests = await Test.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .select(
      '-questions.question -questions.options -questions.correct -questions.correctOptions -questions.correctNumerical -questions.videoSolutionUrl -questions.explanation -questions.image'
    );
  res.json(tests);
});

export const publicGetTest = asyncHandler(async (req, res) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(req.params.id);
  let test = isObjectId
    ? await Test.findById(req.params.id)
    : await Test.findOne({ slug: req.params.id });

  if (!test) {
    if (isObjectId) {
      const courseTest = await CourseTest.findById(req.params.id);
      if (courseTest) {
        const cTest = courseTest.toObject();
        cTest.isFree = false;
        cTest.subject = 'Chemistry';
        cTest.difficulty = 'intermediate';
        cTest.instructions = 'Please read each question carefully before submitting your answer.';
        cTest.totalMarks = (courseTest.questions || []).length * 4;
        cTest.testType = 'quiz';
        cTest.questions = (cTest.questions || []).map(q => ({
          ...q,
          marks: 4,
          negativeMarks: 0
        }));
        test = cTest;
      }
    }
  } else {
    test = test.toObject();
  }

  if (!test) { res.status(404); throw new Error('Test not found'); }

  // Check live test schedule: don't let students start if it is upcoming
  if (test.testType === 'live_test' && test.liveStartDate) {
    const now = new Date();
    const start = new Date(test.liveStartDate);
    if (now < start && req.user?.role !== 'admin') {
      res.status(400);
      throw new Error('This live test has not started yet');
    }
  }

  // Check access: free tests open to all; paid tests need enrollment or purchase
  const isFree = test.isFree;
  const user = req.user;

  if (!isFree && !user) {
    res.status(401); throw new Error('Login required to access this test');
  }

  if (user && user.role !== 'admin' && test.attemptsAllowed > 0) {
    const previousAttemptCount = await TestAttempt.countDocuments({
      user: user._id,
      test: test._id,
    });
    if (previousAttemptCount >= test.attemptsAllowed) {
      res.status(400);
      throw new Error('You have used all allowed attempts for this test.');
    }
  }

  res.json(test);
});

// ─── PUBLIC: List Test Series ─────────────────────────────────────────────────
export const publicListTestSeries = asyncHandler(async (req, res) => {
  const filter = { isPublished: true, isActive: true };
  if (req.query.free === 'true') filter.isFree = true;
  const series = await TestSeries.find(filter)
    .sort({ createdAt: -1 })
    .populate('tests.test', 'title durationMins totalMarks difficulty isFree');
  res.json(series);
});

export const publicGetTestSeries = asyncHandler(async (req, res) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(req.params.id);
  const series = isObjectId
    ? await TestSeries.findById(req.params.id)
    : await TestSeries.findOne({ slug: req.params.id });
  if (!series || !series.isPublished) { res.status(404); throw new Error('Test series not found'); }
  await series.populate('tests.test', 'title durationMins totalMarks difficulty isFree pdfUrl examTags');
  res.json(series);
});

// ─── STUDENT: Submit Test Attempt ─────────────────────────────────────────────
export const submitAttempt = asyncHandler(async (req, res) => {
  const { testId, answers, timeTakenSecs, courseId, testSeriesId } = req.body;

  let test = await Test.findById(testId);
  let isCourseTest = false;

  if (!test) {
    test = await CourseTest.findById(testId);
    if (test) {
      isCourseTest = true;
      const cTest = test.toObject();
      cTest.totalMarks = (test.questions || []).length * 4;
      cTest.questions = (cTest.questions || []).map(q => ({
        ...q,
        marks: 4,
        negativeMarks: 0
      }));
      test = cTest;
    }
  }

  if (!test) { res.status(404); throw new Error('Test not found'); }

  if (!isCourseTest && test.attemptsAllowed > 0) {
    const previousAttemptCount = await TestAttempt.countDocuments({
      user: req.user._id,
      test: testId,
    });
    if (previousAttemptCount >= test.attemptsAllowed && req.user?.role !== 'admin') {
      res.status(400);
      throw new Error('You have used all allowed attempts for this test.');
    }
  }

  // Prevent submissions of upcoming live tests
  if (test.testType === 'live_test' && test.liveStartDate) {
    const now = new Date();
    const start = new Date(test.liveStartDate);
    if (now < start && req.user?.role !== 'admin') {
      res.status(400);
      throw new Error('This live test has not started yet');
    }
  }

  let scored = 0;
  let correct = 0;
  let wrong = 0;
  let unattempted = 0;

  const processedAnswers = [];
  const sectionAttemptCounts = {};

  test.questions.forEach((q) => {
    const secName = q.section || '';
    const sectionObj = (test.sections || []).find((s) => s.name === secName);
    const limit = sectionObj?.attemptAllowed || 0;

    const ans = (answers || []).find(
      (a) => a.questionId?.toString() === q._id.toString()
    );
    const selected = ans ? ans.selected : -1;

    // Determine if it is unattempted
    const isUnattempted =
      selected === -1 ||
      selected === null ||
      selected === undefined ||
      selected === '' ||
      (Array.isArray(selected) && selected.length === 0);

    if (isUnattempted) {
      unattempted++;
      processedAnswers.push({ questionId: q._id, selected: -1, isCorrect: false, marksAwarded: 0 });
      return;
    }

    // It is attempted. Check if we have already reached the limit for this section.
    if (secName !== '' && limit > 0) {
      const currentAttempts = sectionAttemptCounts[secName] || 0;
      if (currentAttempts >= limit) {
        // Over the limit: treat as unattempted for grading
        unattempted++;
        processedAnswers.push({ questionId: q._id, selected, isCorrect: false, marksAwarded: 0 });
        return;
      }
      sectionAttemptCounts[secName] = currentAttempts + 1;
    }

    let isCorrect = false;
    let marksAwarded = 0;
    const qType = q.type || 'mcq';

    if (qType === 'mcq') {
      isCorrect = Number(selected) === q.correct;
      if (isCorrect) {
        correct++;
        marksAwarded = q.marks || 4;
      } else {
        wrong++;
        marksAwarded = q.negativeMarks ?? -1;
      }
    } else if (qType === 'numerical') {
      isCorrect = Math.abs(Number(selected) - Number(q.correctNumerical || 0)) < 0.01;
      if (isCorrect) {
        correct++;
        marksAwarded = q.marks || 4;
      } else {
        wrong++;
        marksAwarded = q.negativeMarks ?? 0;
      }
    } else if (qType === 'msq') {
      const correctSet = q.correctOptions && q.correctOptions.length > 0 ? q.correctOptions : [q.correct];
      const selectedList = Array.isArray(selected) ? selected : [selected];

      // Check if any selected option is incorrect
      const hasIncorrect = selectedList.some(idx => !correctSet.includes(idx));

      if (hasIncorrect) {
        wrong++;
        isCorrect = false;
        marksAwarded = q.negativeMarks ?? -1;
      } else {
        const numCorrectSelected = selectedList.length;
        const totalCorrect = correctSet.length;

        if (numCorrectSelected === totalCorrect) {
          correct++;
          isCorrect = true;
          marksAwarded = q.marks || 4;
        } else if (numCorrectSelected > 0 && q.partialMarking !== false) {
          isCorrect = true;
          correct++;
          if (q.partialMarkingMethod === 'percentage_based') {
            // Proportional marking: (C / T) * full_marks
            const calculated = (numCorrectSelected / totalCorrect) * (q.marks || 4);
            marksAwarded = Math.round((calculated + Number.EPSILON) * 100) / 100;
          } else {
            // 'correct_count': Marks = C
            marksAwarded = numCorrectSelected;
          }
        } else {
          isCorrect = false;
          marksAwarded = 0;
        }
      }
    }

    scored += marksAwarded;
    processedAnswers.push({ questionId: q._id, selected, isCorrect, marksAwarded });
  });

  const percentage = test.totalMarks > 0 ? Math.round((scored / test.totalMarks) * 100) : 0;

  const attempt = await TestAttempt.create({
    user: req.user._id,
    test: testId,
    course: courseId || null,
    testSeries: testSeriesId || null,
    answers: processedAnswers,
    totalMarks: test.totalMarks,
    scored,
    correct,
    wrong,
    unattempted,
    timeTakenSecs: timeTakenSecs || 0,
    percentage,
    submittedAt: new Date(),
  });

  // Award +2 coins for Daily Test if it's the user's first attempt of this test
  if (test.isDailyTest) {
    const alreadyAttempted = await TestAttempt.exists({
      user: req.user._id,
      test: testId,
      _id: { $ne: attempt._id },
    });
    if (!alreadyAttempted) {
      const { default: User } = await import('../models/User.js');
      await User.findByIdAndUpdate(req.user._id, { $inc: { coins: 2 } });
    }
  }

  res.status(201).json(attempt);
});

// ─── STUDENT: My Attempts ─────────────────────────────────────────────────────
export const myAttempts = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ user: req.user._id })
    .populate('test', 'title difficulty durationMins totalMarks isDailyTest')
    .sort({ submittedAt: -1 });

  const attemptsObj = attempts.map(a => a.toObject());
  for (let a of attemptsObj) {
    if (!a.test) {
      const courseTest = await CourseTest.findById(a.test);
      if (courseTest) {
        a.test = {
          _id: courseTest._id,
          title: courseTest.title,
          difficulty: 'intermediate',
          durationMins: courseTest.durationMins,
          totalMarks: (courseTest.questions || []).length * 4,
        };
      }
    }
  }

  res.json(attemptsObj);
});

export const getAttemptResult = asyncHandler(async (req, res) => {
  let attempt = await TestAttempt.findById(req.params.id)
    .populate('test')
    .populate('user', 'name email');
  if (!attempt) { res.status(404); throw new Error('Attempt not found'); }
  if (attempt.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Access denied');
  }

  if (!attempt.test) {
    const courseTest = await CourseTest.findById(attempt.toObject().test);
    if (courseTest) {
      const attemptObj = attempt.toObject();
      attemptObj.test = {
        _id: courseTest._id,
        title: courseTest.title,
        description: courseTest.description,
        durationMins: courseTest.durationMins,
        totalMarks: (courseTest.questions || []).length * 4,
        questions: (courseTest.questions || []).map(q => ({
          ...q,
          marks: 4,
          negativeMarks: 0,
          options: (q.options || []).map(opt => typeof opt === 'string' ? { text: opt } : opt)
        }))
      };
      return res.json(attemptObj);
    }
  }

  res.json(attempt);
});

// ─── COURSE: Tests for a specific course (enrolled students + free) ───────────
export const getCourseTests = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = req.user;

  // Import Course model lazily
  const { default: Course } = await import('../models/Course.js');
  const course = await Course.findById(courseId)
    .populate({
      path: 'testSeries',
      populate: {
        path: 'tests.test',
        select: 'title durationMins totalMarks difficulty isFree pdfUrl solutionPdfUrl videoSolutionUrl attemptsAllowed questions',
      },
    })
    .populate('standaloneTests', 'title durationMins totalMarks difficulty isFree pdfUrl solutionPdfUrl videoSolutionUrl attemptsAllowed');

  if (!course) { res.status(404); throw new Error('Course not found'); }

  let isEnrolled = false;
  if (user) {
    const enrollment = await Enrollment.findOne({ student: user._id, course: courseId });
    isEnrolled = !!enrollment;
  }

  res.json({
    standaloneTests: course.standaloneTests || [],
    testSeries: course.testSeries || [],
    isEnrolled,
  });
});

// ─── STUDENT: Save a question ────────────────────────────────────────────────
export const saveQuestion = asyncHandler(async (req, res) => {
  const { questionId, testId, questionText, options, correct, explanation, image, testTitle } = req.body;
  if (!questionId) { res.status(400); throw new Error('questionId is required'); }
  try {
    const saved = await SavedQuestion.findOneAndUpdate(
      { user: req.user._id, questionId },
      { user: req.user._id, questionId, testId: testId || null, questionText: questionText || '', options: options || [], correct: correct ?? 0, explanation: explanation || '', image: image || '', testTitle: testTitle || '' },
      { upsert: true, new: true }
    );
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      res.status(200).json({ message: 'Already saved' });
    } else throw err;
  }
});

// ─── STUDENT: Unsave a question ──────────────────────────────────────────────
export const unsaveQuestion = asyncHandler(async (req, res) => {
  await SavedQuestion.findOneAndDelete({ user: req.user._id, questionId: req.params.questionId });
  res.json({ ok: true });
});

// ─── STUDENT: My saved questions ─────────────────────────────────────────────
export const mySavedQuestions = asyncHandler(async (req, res) => {
  const list = await SavedQuestion.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(list);
});

// ─── STUDENT: Report a question ──────────────────────────────────────────────
export const reportQuestion = asyncHandler(async (req, res) => {
  const { questionId, testId, questionText, testTitle, reason, description } = req.body;
  if (!questionId) { res.status(400); throw new Error('questionId is required'); }
  const report = await ReportedQuestion.create({
    user: req.user._id,
    questionId,
    testId: testId || null,
    questionText: questionText || '',
    testTitle: testTitle || '',
    reason: reason || 'other',
    description: description || '',
  });
  res.status(201).json(report);
});

// ─── STUDENT: My reported questions ──────────────────────────────────────────
export const myReportedQuestions = asyncHandler(async (req, res) => {
  const list = await ReportedQuestion.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(list);
});

// ─── ADMIN: All reported questions ───────────────────────────────────────────
export const adminListReportedQuestions = asyncHandler(async (_req, res) => {
  const list = await ReportedQuestion.find()
    .populate('user', 'name email studentId')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(list);
});

// ─── ADMIN: Update report status ─────────────────────────────────────────────
export const adminUpdateReport = asyncHandler(async (req, res) => {
  const report = await ReportedQuestion.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, adminNote: req.body.adminNote || '' },
    { new: true }
  );
  if (!report) { res.status(404); throw new Error('Report not found'); }
  res.json(report);
});

// ─── STUDENT: Spend 1 Coin to Attempt a Test ──────────────────────────────────
export const spendCoinForTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const test = await Test.findById(id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  // Deduct 1 coin (admins are exempt)
  if (user.role !== 'admin') {
    if ((user.coins || 0) < 1) {
      res.status(400);
      throw new Error('Insufficient Ace Coins. Attempting this test costs 1 Ace Coin.');
    }
    user.coins = (user.coins || 0) - 1;
    await user.save();

    // Log coin spend redemption
    await CoinRedemption.create({
      student: user._id,
      itemType: 'test_attempt',
      itemId: test._id,
      itemName: `Attempted Test: ${test.title}`,
      coinsSpent: 1,
    });
  }

  res.json({ ok: true, coins: user.coins });
});

// ─── STUDENT: My Mistakes ───────────────────────────────────────────────────
export const getMyMistakes = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ user: req.user._id })
    .populate('test')
    .sort({ submittedAt: -1 });

  const mistakesMap = new Map();

  for (const attempt of attempts) {
    let testObj = attempt.test;
    if (!testObj) {
      const courseTest = await CourseTest.findById(attempt.toObject().test);
      if (courseTest) {
        testObj = {
          _id: courseTest._id,
          title: courseTest.title,
          questions: courseTest.questions
        };
      }
    }
    if (!testObj || !testObj.questions) continue;

    const questionsMap = new Map();
    testObj.questions.forEach((q) => {
      questionsMap.set(q._id.toString(), q);
    });

    for (const ans of attempt.answers) {
      if (!ans.isCorrect && ans.selected !== -1 && ans.selected !== null && ans.selected !== undefined) {
        if (Array.isArray(ans.selected) && ans.selected.length === 0) continue;
        const qIdStr = ans.questionId ? ans.questionId.toString() : '';
        const qObj = questionsMap.get(qIdStr);
        if (qObj && !mistakesMap.has(qIdStr)) {
          mistakesMap.set(qIdStr, {
            questionId: qIdStr,
            testId: testObj._id,
            testTitle: testObj.title,
            questionText: qObj.question,
            options: (qObj.options || []).map(opt => typeof opt === 'string' ? { text: opt } : opt),
            correct: qObj.correct,
            correctOptions: qObj.correctOptions,
            correctNumerical: qObj.correctNumerical,
            type: qObj.type || 'mcq',
            explanation: qObj.explanation,
            image: qObj.image,
            selected: ans.selected,
            submittedAt: attempt.submittedAt
          });
        }
      }
    }
  }

  const mistakes = Array.from(mistakesMap.values());
  res.json(mistakes);
});

// ─── STUDENT: Revision Queue ────────────────────────────────────────────────
export const getRevisionQueue = asyncHandler(async (req, res) => {
  const list = await RevisionQuestion.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(list);
});

export const addToRevisionQueue = asyncHandler(async (req, res) => {
  const { questionId, testId, questionText, options, correct, correctOptions, correctNumerical, type, explanation, image, testTitle } = req.body;
  if (!questionId) {
    res.status(400);
    throw new Error('questionId is required');
  }

  const exists = await RevisionQuestion.findOne({ user: req.user._id, questionId });
  if (exists) {
    return res.status(200).json(exists);
  }

  const item = await RevisionQuestion.create({
    user: req.user._id,
    testId: testId || null,
    questionId,
    questionText,
    options,
    correct,
    correctOptions,
    correctNumerical,
    type,
    explanation,
    image,
    testTitle,
  });

  res.status(201).json(item);
});

export const removeFromRevisionQueue = asyncHandler(async (req, res) => {
  await RevisionQuestion.findOneAndDelete({ user: req.user._id, questionId: req.params.questionId });
  res.json({ ok: true });
});
