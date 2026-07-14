import asyncHandler from 'express-async-handler';
import DailyTarget from '../models/DailyTarget.js';
import DailyTargetProgress from '../models/DailyTargetProgress.js';
import Enrollment from '../models/Enrollment.js';
import Test from '../models/Test.js';
import TestSeries from '../models/TestSeries.js';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const getIstParts = (value = new Date()) => {
  const shifted = new Date(new Date(value).getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
  };
};

const startOfDay = (value) => {
  if (typeof value === 'string' && DATE_ONLY_RE.test(value)) {
    return new Date(`${value}T00:00:00+05:30`);
  }
  const parts = getIstParts(value || new Date());
  return new Date(Date.UTC(parts.year, parts.month, parts.date) - IST_OFFSET_MS);
};

const endOfDay = (value) => {
  const start = startOfDay(value);
  return new Date(start.getTime() + DAY_MS - 1);
};

const DAY_MS = 24 * 60 * 60 * 1000;

const dayDiff = (from, to) => Math.floor((startOfDay(to) - startOfDay(from)) / DAY_MS);
const makeSlug = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
  '-' + Date.now().toString(36);

const normalizeCustomQuestions = (questions = []) => questions
  .map((question) => {
    const options = (question.options || [])
      .map((option) => ({ text: String(option?.text ?? option ?? '').trim() }))
      .filter((option) => option.text);
    const correct = Math.min(
      Math.max(0, Number(question.correct || 0)),
      Math.max(0, options.length - 1)
    );
    return {
      question: String(question.question || '').trim(),
      options,
      correct,
      type: 'mcq',
      explanation: question.explanation || '',
      marks: 1,
      negativeMarks: 0,
      chapter: question.chapter || '',
      topic: question.topic || '',
      fontFamily: question.fontFamily || 'default',
      image: question.image || '',
    };
  })
  .filter((question) => question.question && question.options.length >= 2);

const normalizePayload = (body = {}) => {
  const audienceType = body.audience?.type || body.audienceType || 'all';
  const plans = Array.isArray(body.audience?.plans)
    ? body.audience.plans
    : Array.isArray(body.plans)
      ? body.plans
      : [];

  return {
    title: String(body.title || '').trim(),
    description: body.description || '',
    startDate: startOfDay(body.startDate || body.targetDate),
    endDate: endOfDay(body.endDate || body.startDate || body.targetDate),
    durationMins: Math.max(0, Number(body.durationMins || 0)),
    questionsTarget: Math.max(0, Number(body.questionsTarget || 0)),
    coinsReward: Math.max(0, Number(body.coinsReward || 0)),
    targetType: body.targetType || 'practice',
    test: ['test', 'custom_test'].includes(body.targetType) && body.test ? body.test : null,
    testSeries: body.targetType === 'test_series' && body.testSeries ? body.testSeries : null,
    linkUrl: body.linkUrl || '',
    buttonLabel: body.buttonLabel || 'Start Practice',
    audience: {
      type: audienceType,
      plans: audienceType === 'plans' ? plans : [],
    },
    categories: Array.isArray(body.categories) ? body.categories.filter(Boolean) : [],
    loopEnabled: body.loopEnabled === true,
    loopCycleDays: Math.max(1, Number(body.loopCycleDays || 15)),
    loopEndsAt: body.loopEndsAt ? endOfDay(body.loopEndsAt) : null,
    priority: Number(body.priority || 0),
    isActive: body.isActive !== false,
  };
};

const syncLinkedQuestionCount = async (payload) => {
  if (payload.targetType === 'custom_test') return payload;

  if (payload.targetType === 'test') {
    if (!payload.test) {
      const error = new Error('Select a linked test. Questions for a Daily Target come from Test Bank.');
      error.statusCode = 400;
      throw error;
    }

    const test = await Test.findById(payload.test).select('questions durationMins');
    if (!test) {
      const error = new Error('Linked test not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      ...payload,
      questionsTarget: test.questions?.length || 0,
      durationMins: payload.durationMins || test.durationMins || 0,
    };
  }

  if (payload.targetType === 'test_series' && payload.testSeries) {
    const series = await TestSeries.findById(payload.testSeries)
      .populate('tests.test', 'questions durationMins');
    if (!series) {
      const error = new Error('Linked test series not found');
      error.statusCode = 404;
      throw error;
    }
    const questionCount = (series.tests || []).reduce((sum, item) => (
      sum + (item.test?.questions?.length || 0)
    ), 0);
    const durationMins = (series.tests || []).reduce((sum, item) => (
      sum + (item.test?.durationMins || 0)
    ), 0);
    return {
      ...payload,
      questionsTarget: questionCount,
      durationMins: payload.durationMins || durationMins,
    };
  }

  return payload;
};

const syncCustomQuestionTest = async (payload, req, existingTarget = null) => {
  if (payload.targetType !== 'custom_test') return syncLinkedQuestionCount(payload);

  const customQuestions = normalizeCustomQuestions(req.body.customQuestions || []);
  if (customQuestions.length === 0 && !payload.test) {
    const error = new Error('Add at least one valid custom question with 2 options.');
    error.statusCode = 400;
    throw error;
  }

  const testPayload = {
    title: payload.title,
    description: payload.description,
    instructions: 'Daily target custom practice. Answer all questions and submit to complete your practice.',
    subject: 'Chemistry',
    difficulty: 'intermediate',
    durationMins: payload.durationMins || 30,
    isFree: ['all', 'free'].includes(payload.audience?.type),
    isActive: true,
    isPublished: false,
    testType: 'quiz',
    attemptsAllowed: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    isDailyTest: true,
    categories: payload.categories || [],
    createdBy: req.user._id,
  };

  const existingTestId = existingTarget?.targetType === 'custom_test'
    ? existingTarget.test
    : payload.test;
  let test = existingTestId ? await Test.findById(existingTestId) : null;

  if (test) {
    Object.assign(test, testPayload);
    if (customQuestions.length > 0) test.questions = customQuestions;
    await test.save();
  } else {
    test = await Test.create({
      ...testPayload,
      questions: customQuestions,
      slug: makeSlug(payload.title || 'daily-target'),
    });
  }

  return {
    ...payload,
    test: test._id,
    questionsTarget: test.questions?.length || 0,
    durationMins: test.durationMins || payload.durationMins,
    buttonLabel: payload.buttonLabel || 'Start Practice',
  };
};

const getTargetCycleInfo = (target, value = new Date()) => {
  const today = startOfDay(value);
  const targetStart = startOfDay(target.startDate);
  const targetEnd = startOfDay(target.endDate);
  const windowDays = Math.max(1, dayDiff(targetStart, targetEnd) + 1);

  if (!target.loopEnabled) {
    return {
      isVisibleToday: targetStart <= today && targetEnd >= today,
      cycleNumber: 1,
      cycleLengthDays: windowDays,
      daysUntilNext: targetStart > today ? dayDiff(today, targetStart) : 0,
      effectiveStartDate: target.startDate,
      effectiveEndDate: target.endDate,
    };
  }

  const cycleLengthDays = Math.max(windowDays, Number(target.loopCycleDays || windowDays));
  const elapsedDays = dayDiff(targetStart, today);
  if (elapsedDays < 0) {
    return {
      isVisibleToday: false,
      cycleNumber: 0,
      cycleLengthDays,
      daysUntilNext: Math.abs(elapsedDays),
      effectiveStartDate: target.startDate,
      effectiveEndDate: target.endDate,
    };
  }
  if (target.loopEndsAt && endOfDay(target.loopEndsAt) < today) {
    return {
      isVisibleToday: false,
      cycleNumber: Math.floor(elapsedDays / cycleLengthDays) + 1,
      cycleLengthDays,
      daysUntilNext: null,
      effectiveStartDate: target.startDate,
      effectiveEndDate: target.endDate,
    };
  }

  const cycleOffset = elapsedDays % cycleLengthDays;
  const cycleNumber = Math.floor(elapsedDays / cycleLengthDays) + 1;
  const currentCycleStart = new Date(targetStart);
  currentCycleStart.setDate(targetStart.getDate() + ((cycleNumber - 1) * cycleLengthDays));
  const effectiveStartDate = new Date(currentCycleStart);
  const effectiveEndDate = new Date(currentCycleStart);
  effectiveEndDate.setDate(currentCycleStart.getDate() + windowDays - 1);
  effectiveEndDate.setHours(23, 59, 59, 999);

  return {
    isVisibleToday: cycleOffset < windowDays,
    cycleNumber,
    cycleLengthDays,
    cycleDayNumber: cycleOffset + 1,
    daysUntilNext: cycleOffset < windowDays ? 0 : cycleLengthDays - cycleOffset,
    effectiveStartDate,
    effectiveEndDate,
  };
};

const getActionUrl = (target) => {
  if (['test', 'custom_test'].includes(target.targetType) && target.test) return `/take-test/${target.test._id || target.test}`;
  if (target.targetType === 'test_series' && target.testSeries) return `/test-series/${target.testSeries._id || target.testSeries}`;
  if (target.targetType === 'flashcards') return '/student/flashcards';
  if (target.targetType === 'ncert') return '/student/ncert-toolbox';
  if (target.targetType === 'resource' && target.linkUrl) return target.linkUrl;
  if (target.targetType === 'custom' && target.linkUrl) return target.linkUrl;
  return '/student/practice';
};

const serializeTarget = (target, completedSet = new Set()) => {
  const obj = target.toObject ? target.toObject() : target;
  const cycleInfo = getTargetCycleInfo(obj);
  const progressKey = `${obj._id.toString()}:${cycleInfo.cycleNumber || 1}`;
  return {
    ...obj,
    isCompleted: completedSet.has(progressKey),
    actionUrl: getActionUrl(obj),
    cycleInfo,
    isUpcoming: !cycleInfo.isVisibleToday && cycleInfo.daysUntilNext !== null && cycleInfo.daysUntilNext > 0,
  };
};

const getStudentPlanContext = async (studentId) => {
  const now = new Date();
  const enrollments = await Enrollment.find({
    student: studentId,
    paymentStatus: 'paid',
    $or: [{ validUntil: null }, { validUntil: { $gte: now } }],
  }).populate('course', 'category categories');

  const plans = [...new Set(enrollments.map((enrollment) => enrollment.planType).filter(Boolean))];
  const categories = new Set();
  enrollments.forEach((enrollment) => {
    if (enrollment.course?.category) categories.add(enrollment.course.category);
    (enrollment.course?.categories || []).forEach((category) => categories.add(category));
  });

  return {
    isPaid: enrollments.length > 0,
    plans,
    categories: [...categories],
  };
};

const isTargetVisibleToStudent = (target, planContext, user) => {
  const cycleInfo = getTargetCycleInfo(target);
  if (!target.isActive || !cycleInfo.isVisibleToday) return false;

  const audienceType = target.audience?.type || 'all';
  if (audienceType === 'free' && planContext.isPaid) return false;
  if (audienceType === 'paid' && !planContext.isPaid) return false;
  if (audienceType === 'plans') {
    const allowedPlans = target.audience?.plans || [];
    if (!planContext.plans.some((plan) => allowedPlans.includes(plan))) return false;
  }

  if (target.categories?.length) {
    return target.categories.some((category) => (
      category === user.category || planContext.categories.includes(category)
    ));
  }
  return true;
};

export const adminListDailyTargets = asyncHandler(async (_req, res) => {
  const targets = await DailyTarget.find()
    .populate('test', 'title testType durationMins isFree questions')
    .populate('testSeries', 'title isFree price')
    .sort({ startDate: -1, priority: -1, createdAt: -1 });
  res.json(targets);
});

export const adminCreateDailyTarget = asyncHandler(async (req, res) => {
  const payload = await syncCustomQuestionTest(normalizePayload(req.body), req);
  if (!payload.title) {
    res.status(400);
    throw new Error('Title is required');
  }
  if (payload.endDate < payload.startDate) {
    res.status(400);
    throw new Error('End date cannot be before start date');
  }

  const target = await DailyTarget.create({ ...payload, createdBy: req.user._id });
  res.status(201).json(target);
});

export const adminUpdateDailyTarget = asyncHandler(async (req, res) => {
  const target = await DailyTarget.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('Daily target not found');
  }

  const payload = await syncCustomQuestionTest(normalizePayload({ ...target.toObject(), ...req.body }), req, target);
  if (!payload.title) {
    res.status(400);
    throw new Error('Title is required');
  }
  if (payload.endDate < payload.startDate) {
    res.status(400);
    throw new Error('End date cannot be before start date');
  }

  Object.assign(target, payload);
  await target.save();
  res.json(target);
});

export const adminDeleteDailyTarget = asyncHandler(async (req, res) => {
  const target = await DailyTarget.findByIdAndDelete(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('Daily target not found');
  }
  await DailyTargetProgress.deleteMany({ target: req.params.id });
  if (target.targetType === 'custom_test' && target.test) {
    await Test.findByIdAndDelete(target.test).catch(() => {});
  }
  res.json({ message: 'Daily target deleted' });
});

export const getMyDailyTargets = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const upcomingUntil = new Date(todayStart.getTime() + 7 * DAY_MS);
  const planContext = await getStudentPlanContext(req.user._id);
  const audienceClauses = [{ 'audience.type': 'all' }];

  if (planContext.isPaid) {
    audienceClauses.push({ 'audience.type': 'paid' });
    if (planContext.plans.length > 0) {
      audienceClauses.push({
        'audience.type': 'plans',
        'audience.plans': { $in: planContext.plans },
      });
    }
  } else {
    audienceClauses.push({ 'audience.type': 'free' });
  }

  const targets = await DailyTarget.find({
    isActive: true,
    startDate: { $lte: upcomingUntil },
    $or: [
      { loopEnabled: true, $or: [{ loopEndsAt: null }, { loopEndsAt: { $gte: todayStart } }] },
      { loopEnabled: { $ne: true }, endDate: { $gte: todayStart } },
    ],
    $and: [{ $or: audienceClauses }],
  })
    .populate('test', 'title testType durationMins isFree')
    .populate('testSeries', 'title isFree price')
    .sort({ priority: -1, startDate: 1, createdAt: -1 });

  const filtered = targets.filter((target) => {
    const cycleInfo = getTargetCycleInfo(target, now);
    const isTodayOrUpcoming = cycleInfo.isVisibleToday
      || (cycleInfo.daysUntilNext !== null && cycleInfo.daysUntilNext >= 0 && cycleInfo.daysUntilNext <= 7);
    if (!isTodayOrUpcoming) return false;
    if (!target.categories?.length) return true;
    return target.categories.some((category) => (
      category === req.user.category || planContext.categories.includes(category)
    ));
  });

  const cycleInfoByTarget = new Map(filtered.map((target) => {
    const cycleInfo = getTargetCycleInfo(target, now);
    return [target._id.toString(), cycleInfo];
  }));
  const progresses = await DailyTargetProgress.find({
    student: req.user._id,
    target: { $in: filtered.map((target) => target._id) },
    isCompleted: true,
  }).select('target cycleNumber');
  const completedSet = new Set(
    progresses
      .filter((progress) => {
        const cycleInfo = cycleInfoByTarget.get(progress.target.toString());
        return cycleInfo && Number(progress.cycleNumber || 1) === Number(cycleInfo.cycleNumber || 1);
      })
      .map((progress) => `${progress.target.toString()}:${progress.cycleNumber || 1}`)
  );

  res.json(filtered.map((target) => serializeTarget(target, completedSet)));
});

export const getDailyTargetTest = asyncHandler(async (req, res) => {
  const target = await DailyTarget.findById(req.params.id)
    .populate('test')
    .populate('testSeries', 'title isFree price');

  if (!target) {
    res.status(404);
    throw new Error('Daily target not found');
  }

  const planContext = await getStudentPlanContext(req.user._id);
  if (!isTargetVisibleToStudent(target, planContext, req.user)) {
    res.status(403);
    throw new Error('This daily target is not available for your plan.');
  }

  if (!target.test || !['test', 'custom_test'].includes(target.targetType)) {
    res.status(400);
    throw new Error('This daily target does not have an inline test.');
  }

  res.json({
    target: serializeTarget(target),
    test: {
      _id: target.test._id,
      title: target.test.title,
      description: target.test.description,
      subject: target.test.subject,
      durationMins: target.test.durationMins,
      totalMarks: target.test.totalMarks,
      isDailyTest: true,
      questions: target.test.questions || [],
    },
  });
});

export const completeMyDailyTarget = asyncHandler(async (req, res) => {
  const target = await DailyTarget.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('Daily target not found');
  }
  const planContext = await getStudentPlanContext(req.user._id);
  const cycleInfo = getTargetCycleInfo(target);
  if (!isTargetVisibleToStudent(target, planContext, req.user)) {
    res.status(403);
    throw new Error('This daily target is not available for your plan.');
  }

  const progress = await DailyTargetProgress.findOneAndUpdate(
    { student: req.user._id, target: target._id, cycleNumber: cycleInfo.cycleNumber || 1 },
    {
      isCompleted: true,
      completedAt: new Date(),
      cycleStartDate: cycleInfo.effectiveStartDate || target.startDate,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ progress, targetId: target._id, isCompleted: true });
});
