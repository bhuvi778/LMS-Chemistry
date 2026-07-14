import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { playAnswerSound } from '../utils/audio.js';
import {
  BookOpen, GraduationCap, Coins, Flame, Video, ExternalLink,
  Calendar, Clock, ArrowRight, Play, ChevronRight, Bell, Zap,
  TrendingUp, Users, Award, Target, CheckCircle, FileText, ListTodo,
  X, Loader2, ChevronLeft, RotateCcw
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveClasses, setLiveClasses] = useState({ ongoing: [], upcoming: [] });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [countdowns, setCountdowns] = useState([]);
  const [dailyTargets, setDailyTargets] = useState([]);
  const [practiceTargets, setPracticeTargets] = useState([]);
  const [timers, setTimers] = useState({});
  const [dailyTestSession, setDailyTestSession] = useState(null);
  const [dailyTestLoadingId, setDailyTestLoadingId] = useState(null);
  const [dailyTestSubmitting, setDailyTestSubmitting] = useState(false);

  const loadNotifications = () => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.list || []);
      setUnreadCount(r.data.unread || 0);
    }).catch(() => {});
  };
  const handleNotifClick = async (n) => {
    if (!n.read) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        loadNotifications();
      } catch (_) {}
    }
  };

  const fmtTime = (ts) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3650) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  };

  useEffect(() => {
    api.get('/enroll/me').then(r => setEnrollments((r.data || []).filter(e => !e.course?.isPowerCourse))).finally(() => setLoading(false));
    api.get('/admin/live-classes/all').then(r => setLiveClasses(r.data)).catch(() => {});
    api.get('/exam-countdown/active').then(r => setCountdowns(r.data || [])).catch(() => {});
    api.get('/power-courses/daily-targets').then(r => setDailyTargets(r.data || [])).catch(() => {});
    api.get('/daily-targets/me').then(r => setPracticeTargets(r.data || [])).catch(() => {});
    loadNotifications();
  }, []);

  useEffect(() => {
    if (countdowns.length === 0) return;

    const calculateTimeLeft = () => {
      const newTimers = {};
      countdowns.forEach(c => {
        const diff = new Date(c.examDate) - new Date();
        if (diff > 0) {
          newTimers[c._id] = {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60)
          };
        } else {
          newTimers[c._id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
      });
      setTimers(newTimers);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [countdowns]);

  useEffect(() => {
    if (!dailyTestSession?.countdown) return undefined;

    const timer = setTimeout(() => {
      setDailyTestSession((prev) => {
        if (!prev?.countdown) return prev;
        const nextCountdown = prev.countdown - 1;
        return {
          ...prev,
          countdown: nextCountdown,
          startedAt: nextCountdown === 0 ? Date.now() : prev.startedAt,
        };
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [dailyTestSession?.countdown]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const stats = [
    { icon: BookOpen, label: 'Enrolled Courses', value: enrollments.length, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
    { icon: Flame, label: 'Day Streak', value: `${user?.streak || 0}🔥`, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-600' },
    { icon: Coins, label: 'Ace Coins', value: user?.coins || 0, color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
    { icon: TrendingUp, label: 'Total Invested', value: `₹${enrollments.reduce((a, e) => a + (e.pricePaid || 0), 0).toLocaleString()}`, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];

  const quickLinks = [
    { to: '/student/courses', label: 'My Courses', icon: BookOpen, color: 'from-brand-500 to-indigo-600', desc: 'Continue learning' },
    { to: '/student/practice', label: 'Practice Tests', icon: Award, color: 'from-emerald-500 to-teal-600', desc: 'Test your skills' },
    { to: '/student/streak', label: 'Daily Streak', icon: Flame, color: 'from-amber-500 to-orange-600', desc: 'Maintain your streak' },
    { to: '/student/wallet', label: 'Ace Coins', icon: Coins, color: 'from-yellow-400 to-amber-500', desc: 'Earn & redeem rewards' },
    { to: '/student/refer', label: 'Refer & Earn', icon: Users, color: 'from-rose-500 to-pink-600', desc: 'Invite friends for coins' },
    { to: '/student/library', label: 'E-Library', icon: GraduationCap, color: 'from-blue-500 to-cyan-600', desc: 'Books & resources' },
  ];

  const allLive = [...(liveClasses.ongoing || []), ...(liveClasses.upcoming || [])].slice(0, 3);
  const mainTarget = dailyTargets[0];
  const targetProgress = mainTarget?.requiredTaskCount
    ? Math.round((mainTarget.completedTaskCount / mainTarget.requiredTaskCount) * 100)
    : 0;
  const completedPracticeTargets = practiceTargets.filter((target) => target.isCompleted).length;

  const isDailyAnswerCorrect = (question, selected) => {
    if (!question) return false;
    const type = question.type || 'mcq';
    if (type === 'msq') {
      const correctSet = (question.correctOptions?.length ? question.correctOptions : [question.correct])
        .map(Number)
        .sort((a, b) => a - b);
      const selectedSet = (Array.isArray(selected) ? selected : [selected])
        .map(Number)
        .sort((a, b) => a - b);
      return correctSet.length === selectedSet.length && correctSet.every((value, idx) => value === selectedSet[idx]);
    }
    if (type === 'numerical') {
      return Math.abs(Number(selected) - Number(question.correctNumerical || 0)) < 0.01;
    }
    return Number(selected) === Number(question.correct);
  };

  const getCorrectOptionText = (question) => {
    const correctIdx = question?.type === 'msq'
      ? question.correctOptions?.[0] ?? question.correct
      : question?.correct;
    const option = question?.options?.[correctIdx];
    return typeof option === 'string' ? option : option?.text;
  };

  const startDailyTargetTest = async (target) => {
    if (target.isUpcoming || target.cycleInfo?.isVisibleToday === false) {
      toast.error(`This target unlocks in ${target.cycleInfo?.daysUntilNext || 1} day(s).`);
      return;
    }
    setDailyTestLoadingId(target._id);
    try {
      const { data } = await api.get(`/daily-targets/${target._id}/start`);
      const answers = {};
      (data.test?.questions || []).forEach((question) => {
        answers[question._id] = question.type === 'msq' ? [] : question.type === 'numerical' ? '' : -1;
      });
      setDailyTestSession({
        target: data.target,
        test: data.test,
        answers,
        feedback: {},
        current: 0,
        countdown: 3,
        startedAt: null,
        result: null,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to start daily target');
    } finally {
      setDailyTestLoadingId(null);
    }
  };

  const setDailyAnswer = (question, value) => {
    if (!question?._id) return;
    const isCorrect = isDailyAnswerCorrect(question, value);
    playAnswerSound(isCorrect);
    setDailyTestSession((prev) => {
      if (!prev || prev.feedback?.[question._id]) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [question._id]: value },
        feedback: {
          ...prev.feedback,
          [question._id]: {
            selected: value,
            isCorrect,
            correct: question.type === 'msq' ? (question.correctOptions || [question.correct]) : question.correct,
          },
        },
      };
    });

    const questionsLength = dailyTestSession?.test?.questions?.length || 0;
    const currentIndex = dailyTestSession?.current || 0;
    if (questionsLength > 0 && currentIndex < questionsLength - 1) {
      setTimeout(() => {
        setDailyTestSession((prev) => {
          if (!prev || prev.current !== currentIndex) return prev;
          return { ...prev, current: Math.min(questionsLength - 1, currentIndex + 1) };
        });
      }, isCorrect ? 2500 : 3500);
    }
  };

  const submitDailyTargetTest = async () => {
    if (!dailyTestSession || dailyTestSubmitting) return;
    setDailyTestSubmitting(true);
    const answerPayload = Object.entries(dailyTestSession.answers).map(([questionId, selected]) => ({
      questionId,
      selected,
    }));

    try {
      const { data } = await api.post('/tests/attempts', {
        testId: dailyTestSession.test._id,
        answers: answerPayload,
        timeTakenSecs: Math.round((Date.now() - (dailyTestSession.startedAt || Date.now())) / 1000),
      });
      setPracticeTargets((prev) => prev.map((target) => (
        target._id === dailyTestSession.target._id
          ? { ...target, isCompleted: true, lastScore: data.scored, lastTotalMarks: data.totalMarks, lastPercentage: data.percentage }
          : target
      )));
      setDailyTestSession(null);
      toast.success('Practice submitted. Retake is ready on your card.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit daily target');
    } finally {
      setDailyTestSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white p-7 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white blur-3xl translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-2xl -translate-x-10 translate-y-10" />
        </div>
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">{greeting} 👋</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight">
              {user?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-white/80 text-sm mt-2">
              Student ID: <span className="font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg text-xs">{user?.studentId}</span>
            </p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-sm font-semibold">
                <Flame size={16} className="text-amber-300" /> {user?.streak || 0} Day Streak
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-sm font-semibold">
                <Coins size={16} className="text-yellow-300" /> {user?.coins || 0} Coins
              </div>
            </div>
          </div>
          <Link
            to="/student/courses"
            className="flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto text-center justify-center"
          >
            <Play size={15} fill="currentColor" /> Continue Learning
          </Link>
        </div>
      </div>

      {/* Exam Countdowns Section */}
      {countdowns.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider">
            <Clock className="text-brand-500 w-4 h-4" /> Upcoming Exam Counters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countdowns.map(c => {
              const colorClasses = {
                cyan: 'from-cyan-500 via-cyan-600 to-blue-600 border-cyan-100 bg-cyan-50/5 text-cyan-600',
                blue: 'from-blue-500 via-blue-600 to-indigo-600 border-blue-100 bg-blue-50/5 text-blue-600',
                red: 'from-red-500 via-red-600 to-pink-600 border-red-100 bg-red-50/5 text-red-600',
                green: 'from-green-500 via-green-600 to-emerald-600 border-green-100 bg-green-50/5 text-green-600',
                purple: 'from-purple-500 via-purple-600 to-pink-600 border-purple-100 bg-purple-50/5 text-purple-600',
                orange: 'from-orange-500 via-orange-600 to-red-600 border-orange-100 bg-orange-50/5 text-orange-600',
                pink: 'from-pink-500 via-pink-600 to-rose-600 border-pink-100 bg-pink-50/5 text-pink-600'
              };
              const grad = colorClasses[c.color] || colorClasses.cyan;
              const timer = timers[c._id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
              return (
                <div key={c._id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-extrabold text-slate-800 text-xs truncate flex items-center gap-1.5">
                      <i className={`fas ${c.icon} text-slate-500`}></i>
                      {c.examName}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{c.category}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[
                      { v: timer.days, l: 'Days' },
                      { v: timer.hours, l: 'Hrs' },
                      { v: timer.minutes, l: 'Mins' },
                      { v: timer.seconds, l: 'Secs' }
                    ].map((t, idx) => (
                      <div key={idx} className="text-center">
                        <div className={`bg-gradient-to-br ${grad.split(' ').slice(0, 3).join(' ')} text-white font-extrabold text-xs py-1.5 rounded-xl shadow-sm`}>
                          {String(t.v).padStart(2, '0')}
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-1">{t.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dashboard-only looping daily target */}
      {mainTarget && (
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.25fr,0.75fr]">
            <div className="relative bg-slate-950 p-6 text-white">
              <div className="absolute inset-y-0 right-0 w-24 bg-emerald-500/10" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-300">
                    <Target size={13} /> Today Target
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">{mainTarget.courseTitle}</p>
                    <h2 className="mt-1 max-w-2xl text-xl font-black leading-tight text-white">{mainTarget.title}</h2>
                    {mainTarget.description && (
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-300">{mainTarget.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-black">
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-slate-200">Cycle {mainTarget.cycleNumber}</span>
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-slate-200">Day {mainTarget.cycleDayNumber}/{mainTarget.cycleLength}</span>
                    <span className="rounded-lg bg-white/10 px-2.5 py-1 text-slate-200">{mainTarget.durationText || '60 min'}</span>
                  </div>
                </div>
                <Link
                  to={`/student/power-batch/${mainTarget.courseId}/learn`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  Start Target <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Execution</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-850">{targetProgress}% complete</p>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  mainTarget.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'
                }`}>
                  {mainTarget.isCompleted ? <CheckCircle size={22} /> : <ListTodo size={22} />}
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${targetProgress}%` }} />
              </div>
              <div className="mt-4 space-y-2">
                {(mainTarget.tasks || []).slice(0, 4).map((task) => (
                  <div key={task.type} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <span className="flex items-center gap-2 truncate text-xs font-bold text-slate-700">
                      <FileText size={12} className="shrink-0 text-slate-400" /> {task.title}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                      task.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400 border border-slate-150'
                    }`}>
                      {task.completed ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
                {(mainTarget.tasks || []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs font-semibold text-slate-400">
                    Target topics are configured. Add video, notes, quiz, live class, or assignment tasks from admin to track completion.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin-controlled practice daily targets */}
      {practiceTargets.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-amber-50 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-teal-700">
                  <Zap size={12} /> Practice Session
                </div>
                <h2 className="mt-2 font-display text-lg font-black tracking-tight text-slate-900">My Daily Target</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {completedPracticeTargets}/{practiceTargets.length} completed today. Tap start and begin after 3, 2, 1.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:min-w-[190px]">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-slate-400">
                  <span>Progress</span>
                  <span className="text-teal-700">{Math.round((completedPracticeTargets / practiceTargets.length) * 100)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${Math.round((completedPracticeTargets / practiceTargets.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto p-4 sm:p-5">
            {practiceTargets.map((target) => {
              return (
                <div key={target._id} className="min-w-[272px] max-w-[272px] rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-w-[330px] sm:max-w-[330px]">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-700">
                        <Calendar size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900">{target.isUpcoming ? 'Upcoming Topic' : "Today's Topic"}</div>
                        <div className="mt-0.5 text-[10px] font-bold text-slate-400">
                          {new Date(target.startDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                        </div>
                      </div>
                      {target.isUpcoming ? (
                        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                          <Clock size={11} /> {target.cycleInfo?.daysUntilNext || 1}d
                        </span>
                      ) : target.isCompleted && (
                        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                          <CheckCircle size={11} /> Done
                        </span>
                      )}
                    </div>

                    <div className="mt-6 min-h-[70px]">
                      <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">{target.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-500">
                        {target.description || 'Daily practice questions'}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black text-slate-600">
                      <span>{target.durationMins || 10} Min Practice</span>
                      <span>{target.questionsTarget || target.test?.questions?.length || 10} Qs</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                      <div className={`h-full rounded-full ${target.isCompleted ? 'bg-emerald-400' : 'bg-teal-500'}`} style={{ width: target.isCompleted ? '100%' : '12%' }} />
                    </div>
                    {target.lastPercentage !== undefined && (
                      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">
                        Last score: {target.lastPercentage}% ({target.lastScore || 0}/{target.lastTotalMarks || 0})
                      </div>
                    )}

                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => startDailyTargetTest(target)}
                        disabled={dailyTestLoadingId === target._id || target.isUpcoming}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
                          target.isUpcoming
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-500'
                        }`}
                      >
                        {dailyTestLoadingId === target._id ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Opening...
                          </>
                        ) : target.isUpcoming ? (
                          <>
                            <Clock size={13} /> Upcoming
                          </>
                        ) : (
                          <>
                            {target.isCompleted ? <RotateCcw size={13} /> : <Play size={13} fill="currentColor" />}
                            {target.isCompleted ? 'Retake Test' : 'Start Test'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-[9px] font-bold text-slate-400">
                    {target.isUpcoming ? `Unlocks in ${target.cycleInfo?.daysUntilNext || 1} day(s).` : target.isCompleted ? 'Completed. You can revise it again.' : 'Practice mode gives instant answers.'}
                  </div>
                </div>
              );
            })}
            <div className="min-w-[272px] max-w-[272px] rounded-2xl border border-dashed border-teal-200 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-3 shadow-sm sm:min-w-[330px] sm:max-w-[330px]">
              <div className="flex h-full min-h-[322px] flex-col justify-between rounded-xl bg-white/75 p-3">
                <div>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                      <Clock size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900">More Upcoming Soon</div>
                      <div className="mt-0.5 text-[10px] font-bold text-slate-400">Next practice slot</div>
                    </div>
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-100 px-2 py-1 text-[10px] font-black text-teal-700">
                      Soon
                    </span>
                  </div>

                  <div className="mt-6 min-h-[70px]">
                    <h3 className="text-sm font-black leading-snug text-slate-900">More practice targets are coming.</h3>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                      New daily topics will show here as soon as they are scheduled.
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black text-slate-600">
                    <span>Fresh Topic</span>
                    <span>Coming</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/3 rounded-full bg-amber-400" />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    disabled
                    className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-500"
                  >
                    <Clock size={13} /> Coming Soon
                  </button>
                  <div className="pt-2 text-center text-[9px] font-bold text-slate-400">
                    Stay ready for the next practice session.
                  </div>
                </div>
              </div>
            </div>
            </div>
        </div>
      )}

      {dailyTestSession && createPortal((
        <div className="fixed inset-0 z-[9999] h-screen h-dvh w-screen bg-slate-50 text-slate-900">
          {dailyTestSession.countdown > 0 ? (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 p-5">
              <div className="text-center">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-teal-600 text-6xl font-black text-white shadow-xl shadow-teal-600/20 sm:h-36 sm:w-36 sm:text-7xl">
                  {dailyTestSession.countdown}
                </div>
                <div className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-slate-400">Get Ready</div>
                <h2 className="mt-2 max-w-md text-xl font-black leading-tight text-slate-900">{dailyTestSession.target.title}</h2>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <header className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-5">
                {(() => {
                  const questions = dailyTestSession.test.questions || [];
                  const feedback = dailyTestSession.feedback || {};
                  const answeredCount = Object.keys(feedback).length;
                  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
                  return (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setDailyTestSession(null)}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                      >
                        <X size={18} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-black text-slate-900">{dailyTestSession.target.title}</div>
                        <div className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Practice · {answeredCount}/{questions.length} answered · {progress}%
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={submitDailyTargetTest}
                        disabled={dailyTestSubmitting || answeredCount < questions.length}
                        className="rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {dailyTestSubmitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  );
                })()}
              </header>

              <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-5">
                  {(() => {
                    const questions = dailyTestSession.test.questions || [];
                    const currentQuestion = questions[dailyTestSession.current] || {};
                    const selected = dailyTestSession.answers[currentQuestion._id];
                    const feedback = dailyTestSession.feedback || {};
                    const currentFeedback = feedback[currentQuestion._id];
                    const answeredCount = Object.keys(feedback).length;
                    const correctCount = Object.values(feedback).filter((item) => item.isCorrect).length;
                    const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
                    const questionFont = {
                      fontFamily: {
                        default: 'inherit',
                        sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
                        serif: 'Georgia, "Times New Roman", serif',
                        mono: '"Courier New", ui-monospace, monospace',
                        devanagari: '"Noto Sans Devanagari", Mangal, sans-serif',
                        handwritten: '"Comic Sans MS", cursive',
                      }[currentQuestion.fontFamily] || 'inherit',
                    };

                    return (
                      <div className="mx-auto max-w-4xl">
                        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                Question {dailyTestSession.current + 1} of {questions.length}
                              </div>
                              <div className="mt-1 text-sm font-black text-slate-900">
                                {correctCount} correct · {answeredCount - correctCount} wrong
                              </div>
                            </div>
                            <div className="w-full sm:w-56">
                              <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-slate-400">
                                <span>Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-6">
                          <div
                            className="rounded-2xl border border-slate-100 bg-slate-900 p-5 text-lg font-black leading-relaxed text-white sm:p-6"
                            style={questionFont}
                            dangerouslySetInnerHTML={{ __html: currentQuestion.question || 'Question not available.' }}
                          />
                          {currentQuestion.image && (
                            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                              <img
                                src={currentQuestion.image}
                                alt="Question reference"
                                className="mx-auto max-h-72 w-full object-contain"
                              />
                            </div>
                          )}

                          <div className="mt-5 space-y-3">
                            {(currentQuestion.options || []).map((option, optionIdx) => {
                              const optionText = typeof option === 'string' ? option : option.text;
                              const isSelected = selected === optionIdx;
                              const correctIndexes = currentQuestion.type === 'msq'
                                ? (currentQuestion.correctOptions?.length ? currentQuestion.correctOptions : [currentQuestion.correct])
                                : [currentQuestion.correct];
                              const isCorrectOption = correctIndexes.map(Number).includes(optionIdx);
                              const optionClass = currentFeedback && isCorrectOption
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                                : currentFeedback && isSelected
                                  ? 'border-rose-300 bg-rose-50 text-rose-950'
                                  : isSelected
                                    ? 'border-teal-500 bg-teal-50 text-teal-950'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
                              const badgeClass = currentFeedback && isCorrectOption
                                ? 'bg-emerald-600 text-white'
                                : currentFeedback && isSelected
                                  ? 'bg-rose-600 text-white'
                                  : isSelected
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-100 text-slate-500';
                              return (
                                <button
                                  key={optionIdx}
                                  type="button"
                                  onClick={() => setDailyAnswer(currentQuestion, optionIdx)}
                                  disabled={!!currentFeedback}
                                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${optionClass} disabled:cursor-default`}
                                >
                                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${badgeClass}`}>
                                    {String.fromCharCode(65 + optionIdx)}
                                  </span>
                                  <span
                                    className="min-w-0 flex-1 text-sm font-bold"
                                    style={questionFont}
                                    dangerouslySetInnerHTML={{ __html: optionText || `Option ${optionIdx + 1}` }}
                                  />
                                  {currentFeedback && isCorrectOption && <CheckCircle size={18} className="shrink-0 text-emerald-600" />}
                                  {currentFeedback && isSelected && !isCorrectOption && <X size={18} className="shrink-0 text-rose-600" />}
                                </button>
                              );
                            })}
                          </div>

                          {currentFeedback && (
                            <div className={`mt-4 rounded-2xl border px-4 py-4 text-sm font-bold shadow-sm ${
                              currentFeedback.isCorrect
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-rose-200 bg-rose-50 text-rose-800'
                            }`}>
                              <div className="flex items-center gap-2">
                                {currentFeedback.isCorrect ? <CheckCircle size={18} /> : <X size={18} />}
                                <span>{currentFeedback.isCorrect ? 'Correct answer' : 'Wrong answer'}</span>
                              </div>
                              {!currentFeedback.isCorrect && (
                                <div className="mt-2 text-xs font-black text-slate-700">
                                  Correct: <span dangerouslySetInnerHTML={{ __html: getCorrectOptionText(currentQuestion) || 'Shown above' }} />
                                </div>
                              )}
                              {currentQuestion.explanation && (
                                <div className="mt-1 text-xs font-semibold opacity-80" dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }} />
                              )}
                              <div className="mt-2 text-[10px] font-black uppercase tracking-wide opacity-70">
                                Next question will open automatically after review.
                              </div>
                            </div>
                          )}

                          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <button
                              type="button"
                              onClick={() => setDailyTestSession((prev) => prev ? { ...prev, current: Math.max(0, prev.current - 1) } : prev)}
                              disabled={dailyTestSession.current === 0}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={14} /> Previous
                            </button>
                            {answeredCount === questions.length ? (
                              <button
                                type="button"
                                onClick={submitDailyTargetTest}
                                disabled={dailyTestSubmitting}
                                className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-teal-500 disabled:cursor-wait disabled:opacity-60"
                              >
                                {dailyTestSubmitting ? 'Submitting...' : 'Submit Practice'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDailyTestSession((prev) => prev ? { ...prev, current: Math.min(questions.length - 1, prev.current + 1) } : prev)}
                                disabled={dailyTestSession.current >= questions.length - 1}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Next <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </main>

                <aside className="shrink-0 border-t border-slate-200 bg-white p-4 shadow-sm lg:w-72 lg:border-l lg:border-t-0">
                  <div className="mb-3 hidden lg:block">
                    <div className="text-sm font-black text-slate-900">Questions</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-400">Green is correct, red is wrong</div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
                    {(dailyTestSession.test.questions || []).map((question, idx) => {
                      const itemFeedback = dailyTestSession.feedback?.[question._id];
                      return (
                        <button
                          key={question._id}
                          type="button"
                          onClick={() => setDailyTestSession((prev) => prev ? { ...prev, current: idx } : prev)}
                          className={`grid h-10 place-items-center rounded-xl text-xs font-black ${
                            idx === dailyTestSession.current
                              ? 'bg-slate-900 text-white shadow-sm'
                              : itemFeedback?.isCorrect
                                ? 'bg-emerald-50 text-emerald-700'
                                : itemFeedback
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      ), document.body)}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.text} flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-800 font-display truncate">{s.value}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1 truncate">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-extrabold text-slate-800 text-lg">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((q, i) => (
            <Link
              key={i}
              to={q.to}
              className="group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <q.icon size={18} />
              </div>
              <div className="font-bold text-slate-800 text-sm">{q.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{q.desc}</div>
              <ChevronRight size={14} className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-500 transition" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
        {/* Enrolled Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-slate-800 text-lg">My Courses</h2>
            <Link to="/student/courses" className="text-sm text-brand-600 font-bold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-20 h-14 bg-slate-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                      <div className="h-2 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm font-semibold mb-4">No courses enrolled yet</p>
              <Link to="/student/courses" className="inline-flex items-center gap-2 bg-gradient-brand text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-soft">
                Browse Courses <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 4).map(e => (
                <div key={e._id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all duration-200 group">
                  <div className="relative shrink-0 w-full sm:w-20 h-32 sm:h-14 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={e.course?.thumbnail}
                      alt={e.course?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-brand-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play size={18} className="text-white" fill="white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-brand-700 transition">{e.course?.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{e.course?.category}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>{e.watchedHours || 0} hrs watched</span>
                        <span>{e.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-brand rounded-full transition-all" style={{ width: `${e.progress || 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-1.5 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                    <Link to={`/student/learn/${e.course?._id}`} className="flex-1 sm:flex-initial px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-xl hover:bg-brand-100 transition text-center whitespace-nowrap">
                      Continue
                    </Link>
                    {e.planType !== 'infinity' && (
                      <Link
                        to={`/courses/${e.course?.slug || e.course?._id}`}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-extrabold rounded-xl transition text-center whitespace-nowrap"
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {enrollments.length > 4 && (
                <Link to="/student/courses" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 font-semibold hover:text-brand-700 transition py-3 border border-dashed border-slate-200 rounded-2xl hover:border-brand-300">
                  +{enrollments.length - 4} more courses <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Live Classes + Notifications */}
        <div className="space-y-5">
          {/* Live Classes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                Live Classes
              </h2>
            </div>
            {allLive.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm">
                <Video size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400 text-sm font-semibold">No upcoming live classes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allLive.map(lc => (
                  <div key={lc._id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0">
                        <Video size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{lc.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <Calendar size={11} />
                          <span>{new Date(lc.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      {['internal', 'agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast', 'youtube'].includes(lc.platform || (lc.useInternalRoom ? 'internal' : 'meet')) ? (
                        <Link to={`/live/${lc._id}`} className="shrink-0 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition whitespace-nowrap">
                          {lc.status === 'live' ? '🔴 Join' : 'Open'}
                        </Link>
                      ) : (
                        <a href={lc.meetLink} target="_blank" rel="noreferrer" className="shrink-0 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Bell size={18} className="text-brand-600" />
                Recent Notifications
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await api.put('/notifications/read-all');
                      loadNotifications();
                    } catch (_) {}
                  }}
                  className="text-xs font-semibold text-brand-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotifClick(n)}
                    className={`p-3 rounded-2xl border transition relative cursor-pointer ${
                      n.read
                        ? 'bg-slate-50/50 border-slate-100'
                        : 'bg-brand-50/40 border-brand-100/50 hover:bg-brand-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-800 text-xs leading-snug">{n.title}</div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />}
                    </div>
                    {n.message && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    )}
                    {n.image && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 max-h-36">
                        <img src={n.image} alt="Notification Banner" className="w-full h-auto object-cover max-h-36" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold">{fmtTime(n.createdAt)}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          className="text-[10px] font-bold text-brand-700 hover:underline flex items-center gap-0.5"
                        >
                          View <ChevronRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak Motivation Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-sm">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
              <Flame size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="font-display font-extrabold text-lg">
                {user?.streak ? `${user.streak} Day Streak! 🔥` : 'Start Your Streak!'}
              </h3>
              <p className="text-white/85 text-xs mt-1 leading-relaxed">
                {user?.streak
                  ? `Amazing! You've been active for ${user.streak} consecutive days. Keep it up!`
                  : 'Visit the Streak page to log today\'s activity and start earning bonus coins!'}
              </p>
              <Link
                to="/student/streak"
                className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                <Zap size={13} /> View Streak <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
