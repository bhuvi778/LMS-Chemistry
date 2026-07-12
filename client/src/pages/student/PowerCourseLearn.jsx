import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  Lock,
  Play,
  FileText,
  ClipboardList,
  Download,
  X,
  HelpCircle,
  Flame,
  Award,
  MessageSquare,
  Share2,
  Star,
  Users,
  Video,
  ListTodo,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import SecureYTPlayer from '../../components/SecureYTPlayer.jsx';

export default function PowerCourseLearn() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily-plan');
  const [expandedDay, setExpandedDay] = useState(1);
  const [activeVideo, setActiveVideo] = useState(null); // { url, title } (for popup backup if needed, else inline)
  const [liveClasses, setLiveClasses] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [courseRes, progressRes, liveRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/power-courses/progress/${courseId}`),
          api.get(`/admin/live-classes/by-course/${courseId}`).catch(() => ({ data: [] }))
        ]);
        setCourse(courseRes.data);
        setProgress(progressRes.data);
        setLiveClasses(liveRes.data || []);

        // Pre-expand the first incomplete day
        const completedDays = new Set(progressRes.data?.completedDays || []);
        const duration = courseRes.data?.powerCourseDuration || 7;
        let selectDay = 1;
        for (let i = 1; i <= duration; i++) {
          if (!completedDays.has(i)) {
            selectDay = i;
            break;
          }
        }
        setExpandedDay(selectDay);
      } catch (err) {
        toast.error('Failed to load learning workbench');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  const loadProgress = async () => {
    try {
      const { data } = await api.get(`/power-courses/progress/${courseId}`);
      setProgress(data);
    } catch (e) {}
  };

  const handleCompleteTask = async (dayNum, taskType) => {
    try {
      const { data } = await api.post(`/power-courses/progress/${courseId}/complete-task`, {
        dayNumber: dayNum,
        taskType
      });
      setProgress(data.progress);
      toast.success(`${taskType.charAt(0).toUpperCase() + taskType.slice(1)} completed!`);
      
      if (data.dayCompletedNow) {
        toast.success(`🎉 Day ${dayNum} target completed successfully!`, { duration: 5000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to complete ${taskType} task.`);
    }
  };

  const toggleExpandDay = (dayNum) => {
    if (!isDayUnlocked(dayNum)) return;
    setExpandedDay(dayNum);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-3 font-semibold">Loading your daily targets...</p>
      </div>
    );
  }

  const duration = course.powerCourseDuration || 7;
  const completedDays = new Set(progress?.completedDays || []);
  const hasPerDayUnlockDates = (course.dailyPlan || []).some((day) => !!day.unlockDate);
  const hasCalendarMode = !!course.startDate || !!course.endDate || hasPerDayUnlockDates;
  const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';
  const formatFullDate = (value) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const dailyUnlockDates = (course.dailyPlan || [])
    .map((day) => day.unlockDate)
    .filter(Boolean)
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
  const firstUnlockDate = dailyUnlockDates[0] || (course.startDate ? new Date(course.startDate) : null);
  const getDayConfig = (dayNum) => (course.dailyPlan || []).find((p) => p.dayNumber === dayNum);
  const getDayDate = (dayNum) => {
    const dayConfig = getDayConfig(dayNum);
    if (dayConfig?.unlockDate) {
      const date = new Date(dayConfig.unlockDate);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    if (!course.startDate) return null;
    const date = new Date(course.startDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayNum - 1);
    return date;
  };
  const isDayAvailableByCalendar = (dayNum) => {
    const dayDate = getDayDate(dayNum);
    if (!dayDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate <= today;
  };

  const isDayUnlocked = (dayNum) => {
    if (!isDayAvailableByCalendar(dayNum)) return false;
    if (dayNum === 1) return true;
    return completedDays.has(dayNum - 1);
  };

  const isTaskCompleted = (dayNum, taskType) => {
    const dayProg = (progress?.dayProgress || []).find((d) => d.dayNumber === dayNum);
    return dayProg ? dayProg.tasksCompleted?.includes(taskType) : false;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.round(((progress?.completedDays?.length || 0) / duration) * 100)) : 0;

  // Stats calculation
  const dayProgressList = progress?.dayProgress || [];
  const totalLessons = (course.dailyPlan || []).filter(d => d.videoUrl).length;
  const completedLessons = dayProgressList.reduce((acc, curr) => acc + (curr.tasksCompleted?.includes('video') ? 1 : 0), 0);

  const totalQuizzes = (course.dailyPlan || []).filter(d => d.quizId).length;
  const completedQuizzes = dayProgressList.reduce((acc, curr) => acc + (curr.tasksCompleted?.includes('quiz') ? 1 : 0), 0);

  const totalLiveClasses = (course.dailyPlan || []).filter(d => d.liveClassId).length;
  const completedLiveClasses = dayProgressList.reduce((acc, curr) => acc + (curr.tasksCompleted?.includes('live') ? 1 : 0), 0);
  const totalClasses = totalLessons + totalLiveClasses;
  const completedClasses = completedLessons + completedLiveClasses;

  const totalAssignments = (course.dailyPlan || []).filter(d => d.assignmentUrl).length;
  const completedAssignments = dayProgressList.reduce((acc, curr) => acc + (curr.tasksCompleted?.includes('assignment') ? 1 : 0), 0);

  const totalNotes = (course.dailyPlan || []).filter(d => d.notesUrl).length;
  const completedNotes = dayProgressList.reduce((acc, curr) => acc + (curr.tasksCompleted?.includes('notes') ? 1 : 0), 0);

  // Type badge helper
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'micro':
        return 'bg-cyan-500 text-white';
      case 'mini':
        return 'bg-indigo-600 text-white';
      case 'crash':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-brand-600 text-white';
    }
  };

  const getTypeLabel = (type) => {
    if (type === 'micro') return 'Micro Batch';
    if (type === 'mini') return 'Mini Batch';
    if (type === 'crash') return 'Crash Course';
    return 'challenge';
  };

  const liveClassMap = new Map((liveClasses || []).map((lc) => [lc._id, lc]));

  const getAssignedLiveClass = (day) => {
    if (!day?.liveClassId) return null;
    return liveClassMap.get(String(day.liveClassId)) || null;
  };

  const getLearningDay = (dayNum) => (course.dailyPlan || []).find(p => p.dayNumber === dayNum) || {
    dayNumber: dayNum,
    title: `Target Day ${dayNum}`,
    topicsCovered: [],
    unlockDate: '',
    videoUrl: '', videoTitle: 'Lecture video',
    notesUrl: '', notesTitle: 'Notes PDF',
    quizId: '', quizTitle: 'Practice checkpoint',
    liveClassId: '', liveClassTitle: 'Attend live class',
    assignmentUrl: '', assignmentTitle: 'Assignment PDF'
  };
  const selectedDayNum = expandedDay || 1;
  const selectedDayData = getLearningDay(selectedDayNum);
  const selectedAssignedLiveClass = getAssignedLiveClass(selectedDayData);
  const selectedDayUnlocked = isDayUnlocked(selectedDayNum);
  const selectedDayCalendarAvailable = isDayAvailableByCalendar(selectedDayNum);
  const selectedDayCompleted = completedDays.has(selectedDayNum);

  const getLivePlatformLabel = (platform) => (
    platform === 'agora_call' ? 'Ace Video Call' :
    platform === 'agora_interactive' ? 'Ace Interactive' :
    platform === 'agora_broadcast' ? 'Ace Broadcast' :
    platform === 'agora_stream' ? 'Ace Stream (Legacy)' :
    platform === 'youtube' ? 'YouTube Live' :
    platform === 'zoom' ? 'Zoom Meeting' :
    platform === 'meet' ? 'Google Meet' :
    'Ace Video Call'
  );

  const isInAppLiveClass = (lc) => {
    const platform = lc?.platform || (lc?.useInternalRoom ? 'internal' : 'meet');
    return ['internal', 'agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast', 'youtube'].includes(platform);
  };

  const getLiveClassUrl = (day, lc) => {
    if (!lc) return `/live/${day.liveClassId}`;
    return isInAppLiveClass(lc) ? `/live/${lc._id}` : (lc.meetLink || lc.meetingUrl || `/live/${lc._id}`);
  };

  const LiveJoinButton = ({ day, lc, className = '' }) => {
    const href = getLiveClassUrl(day, lc);
    const inApp = !lc || isInAppLiveClass(lc);
    const Icon = inApp ? Video : ExternalLink;
    const label = lc?.status === 'live' ? 'Join Now' : inApp ? 'Open Room' : 'Join Class';
    const classes = `btn-primary justify-center ${className}`;

    return inApp ? (
      <Link to={href} className={classes}>
        <Icon size={12} /> {label}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        <Icon size={12} /> {label}
      </a>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back link */}
      <Link to="/student/power-batch" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-505 hover:text-brand-650 transition">
        <ArrowLeft size={13} /> My Enrolled Power Batch
      </Link>

      {/* ── TOP HERO HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        {/* Left Card content */}
        <div className="relative flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${getBadgeStyle(course.powerCourseType)}`}>
              {getTypeLabel(course.powerCourseType)}
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-display tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-sm font-bold text-indigo-300">Complete Target</p>
          </div>

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-300 pt-1">
            <div className="flex items-center gap-1.5"><Clock size={14} className="text-brand-400" /> Duration: {duration} Days</div>
            <div className="flex items-center gap-1.5"><Star size={14} className="text-brand-400" /> {hasCalendarMode ? 'Calendar Mode' : 'Flexible Mode'}</div>
            <div className="flex items-center gap-1.5"><Video size={14} className="text-brand-400" /> Classes: {totalClasses}</div>
            <div className="flex items-center gap-1.5"><Users size={14} className="text-brand-400" /> Live: {totalLiveClasses}</div>
            <div className="flex items-center gap-1.5"><ListTodo size={14} className="text-brand-400" /> Practice: {totalQuizzes}</div>
          </div>

          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed pt-1">
            {course.shortDescription || 'Master topics step-by-step with live/recorded classes, notes, formulas, PYQs, and daily practice.'}
          </p>

          {/* Progress summary bar */}
          <div className="space-y-1.5 pt-2 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Your Progress</span>
              <span className="text-brand-400">{progressPercent}% Completed</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-semibold">
              {completedDays.size} of {duration} Days Completed · {completedClasses} of {totalClasses} Classes Completed
            </div>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="relative shrink-0 w-full lg:w-72 bg-slate-850 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Course Access</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Access Mode</span>
              <span className="font-bold text-slate-200">Live + Recorded</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{firstUnlockDate ? 'First Unlock' : 'Start Date'}</span>
              <span className="font-bold text-slate-200">{firstUnlockDate ? formatFullDate(firstUnlockDate) : formatFullDate(progress?.createdAt || Date.now())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Language</span>
              <span className="font-bold text-slate-200">Hinglish</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Instructor</span>
              <span className="font-bold text-slate-200">{course.instructor || 'N.K. Sir'}</span>
            </div>
          </div>
          <div className="bg-indigo-950/40 border border-indigo-900/40 rounded-xl p-3 text-center mt-2">
            <div className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Remaining Days</div>
            <div className="text-base font-black text-brand-400 mt-0.5">{hasCalendarMode ? 'Calendar Tracker' : 'Active Tracker'}</div>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Main column: Sub-navigation & Timeline (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-6 whitespace-nowrap scrollbar-hide py-1">
            {[
              { id: 'daily-plan', label: 'Daily Plan' },
              { id: 'content', label: 'Content Index' },
              { id: 'live', label: 'Live Classes' },
              { id: 'quizzes', label: 'Practice' },
              { id: 'assignments', label: 'Assignments' },
              { id: 'notes', label: 'Notes' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold border-b-2 transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-450 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Daily Plan timeline */}
          {activeTab === 'daily-plan' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-150 rounded-2xl p-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Daily Planner</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Complete one day at a time to unlock subsequent targets and stay consistent!</p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-brand-655 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 cursor-help">
                  <HelpCircle size={13} /> How It Works?
                </div>
              </div>

              <div className="grid xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-4">
                <div className="rounded-2xl border border-slate-150 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs">Day Map</h4>
                      <p className="text-[10px] font-semibold text-slate-450">Tap any unlocked day</p>
                    </div>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600 border border-slate-150">
                      {completedDays.size}/{duration}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 xl:grid-cols-5 2xl:grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
                    {Array.from({ length: duration }, (_, idx) => {
                      const dayNum = idx + 1;
                      const isCompleted = completedDays.has(dayNum);
                      const isCalendarAvailable = isDayAvailableByCalendar(dayNum);
                      const isUnlocked = isDayUnlocked(dayNum);
                      const isActive = selectedDayNum === dayNum;
                      const dayData = getLearningDay(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => toggleExpandDay(dayNum)}
                          disabled={!isUnlocked}
                          title={dayData.title}
                          className={`relative h-12 rounded-xl border text-center transition disabled:cursor-not-allowed ${
                            isActive
                              ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                              : isCompleted
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : isUnlocked
                                  ? 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                                  : 'border-slate-100 bg-slate-50 text-slate-350'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-1 text-xs font-black leading-none">
                            {!isUnlocked ? <Lock size={10} /> : isCompleted ? <CheckCircle size={10} /> : null}
                            {dayNum}
                          </span>
                          {hasCalendarMode && getDayDate(dayNum) && (
                            <span className={`mt-1 block text-[8px] font-bold leading-none ${isActive ? 'text-white/75' : 'text-slate-400'}`}>
                              {formatDate(getDayDate(dayNum))}
                            </span>
                          )}
                          {!isCalendarAvailable && (
                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`border rounded-2xl bg-white shadow-sm overflow-hidden ${
                  selectedDayCompleted ? 'border-emerald-200' : selectedDayUnlocked ? 'border-brand-200' : 'border-slate-150'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">
                        Day {selectedDayNum}{hasCalendarMode && getDayDate(selectedDayNum) ? ` · ${formatDate(getDayDate(selectedDayNum))}` : ''}
                      </span>
                      <h4 className="mt-1 font-black text-slate-900 text-sm truncate">{selectedDayData.title}</h4>
                    </div>
                    <span className={`chip text-[10px] font-bold shrink-0 ${
                      selectedDayCompleted
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-150'
                        : !selectedDayCalendarAvailable
                          ? 'bg-amber-50 text-amber-700 border border-amber-150'
                          : selectedDayUnlocked
                            ? 'bg-brand-50 text-brand-700 border border-brand-100'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedDayCompleted ? '100%' : !selectedDayCalendarAvailable ? 'Date Locked' : selectedDayUnlocked ? 'Active' : 'Locked'}
                    </span>
                  </div>

                  {selectedDayUnlocked ? (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Recorded Class</span>
                          {selectedDayData.videoUrl ? (
                            <div className="rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 shadow-inner">
                              <SecureYTPlayer url={selectedDayData.videoUrl} title={selectedDayData.videoTitle} />
                            </div>
                          ) : (
                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 italic text-xs border border-slate-200 border-dashed">
                              No recorded class configured
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Topics Covered</span>
                          {selectedDayData.topicsCovered?.length > 0 ? (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {selectedDayData.topicsCovered.map((topic, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-slate-650 font-semibold leading-tight">
                                  <span className="text-brand-500 mt-0.5">✓</span>
                                  <span>{topic}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No specific syllabus topics listed.</p>
                          )}
                        </div>

                        <div className="space-y-3 bg-white rounded-xl p-4 border border-slate-150/80 shadow-xs">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b pb-1">Day Class & Material Status</span>
                          <div className="space-y-3">
                            {selectedDayData.videoUrl && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Play size={11} className="text-slate-400" /> Watch Recorded Class</span>
                                {isTaskCompleted(selectedDayNum, 'video') ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Complete</span>
                                ) : (
                                  <button onClick={() => handleCompleteTask(selectedDayNum, 'video')} className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full">Mark Done</button>
                                )}
                              </div>
                            )}

                            {selectedDayData.notesUrl && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <a href={selectedDayData.notesUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-650 hover:underline flex items-center gap-1.5">
                                  <FileText size={11} className="text-brand-500" /> {selectedDayData.notesTitle || 'Notes PDF'}
                                </a>
                                {isTaskCompleted(selectedDayNum, 'notes') ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Read</span>
                                ) : (
                                  <button onClick={() => handleCompleteTask(selectedDayNum, 'notes')} className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full">Mark Done</button>
                                )}
                              </div>
                            )}

                            {selectedDayData.quizId && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <Link to={`/student/practice`} className="font-semibold text-brand-650 hover:underline flex items-center gap-1.5">
                                  <ClipboardList size={11} className="text-brand-500" /> Practice Checkpoint
                                </Link>
                                {isTaskCompleted(selectedDayNum, 'quiz') ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Scored</span>
                                ) : (
                                  <button onClick={() => handleCompleteTask(selectedDayNum, 'quiz')} className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full">Mark Done</button>
                                )}
                              </div>
                            )}

                            {selectedDayData.liveClassId && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                  <LiveJoinButton
                                    day={selectedDayData}
                                    lc={selectedAssignedLiveClass}
                                    className="inline-flex !py-0 !px-0 !bg-transparent !shadow-none !text-brand-650 hover:!bg-transparent hover:underline font-semibold gap-1.5"
                                  />
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {selectedDayData.liveClassTitle || selectedAssignedLiveClass?.title || 'Live Class'}
                                    {selectedAssignedLiveClass?.platform ? ` · ${getLivePlatformLabel(selectedAssignedLiveClass.platform)}` : ''}
                                  </p>
                                </div>
                                {isTaskCompleted(selectedDayNum, 'live') ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Attended</span>
                                ) : (
                                  <button onClick={() => handleCompleteTask(selectedDayNum, 'live')} className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full">Mark Done</button>
                                )}
                              </div>
                            )}

                            {selectedDayData.assignmentUrl && (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <a href={selectedDayData.assignmentUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-650 hover:underline flex items-center gap-1.5">
                                  <Download size={11} className="text-brand-500" /> {selectedDayData.assignmentTitle || 'Assignment PDF'}
                                </a>
                                {isTaskCompleted(selectedDayNum, 'assignment') ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Submitted</span>
                                ) : (
                                  <button onClick={() => handleCompleteTask(selectedDayNum, 'assignment')} className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full">Mark Done</button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs font-semibold text-slate-450">
                      <Lock size={18} className="mx-auto mb-2 text-slate-350" />
                      {!selectedDayCalendarAvailable ? 'This day will unlock on its scheduled date.' : 'Complete the previous target to unlock this day.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Content Index list */}
          {activeTab === 'content' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Recorded Classes Playlist</h3>
              <div className="space-y-3">
                {(course.dailyPlan || []).filter(d => d.videoUrl).map((day) => (
                  <div key={day.dayNumber} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {day.dayNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{day.videoTitle || `Recorded class Day ${day.dayNumber}`}</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">Duration target: {day.durationText || '60 min'}</p>
                      </div>
                    </div>
                    {day.videoUrl && (
                      <button
                        onClick={() => setActiveVideo({ url: day.videoUrl, title: day.videoTitle })}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        <Play size={12} fill="currentColor" /> Play Class
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Live Classes */}
          {activeTab === 'live' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Power Batch Live Classes</h3>
              {(course.dailyPlan || []).filter(d => d.liveClassId).length === 0 ? (
                <div className="text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl p-6 text-center">
                  No live classes are assigned to this Power Batch yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(course.dailyPlan || []).filter(d => d.liveClassId).map((day) => {
                    const lc = getAssignedLiveClass(day);
                    const start = lc?.scheduledAt ? new Date(lc.scheduledAt) : null;
                    return (
                      <div key={day.dayNumber} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-rose-600">Day {day.dayNumber} Live</span>
                            <span className="text-[9px] font-black rounded-full bg-white border border-slate-150 px-2 py-0.5 text-slate-500 uppercase">
                              {getLivePlatformLabel(lc?.platform)}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-xs mt-0.5 truncate">{day.liveClassTitle || lc?.title || 'Live Class'}</h4>
                          {start && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                              <Calendar size={11} />
                              {start.toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {lc?.durationMins ? ` · ${lc.durationMins} min` : ''}
                            </div>
                          )}
                          {lc?.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-2">{lc.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <LiveJoinButton day={day} lc={lc} className="text-xs font-bold py-1.5 flex-1" />
                          {isTaskCompleted(day.dayNumber, 'live') ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Done</span>
                          ) : (
                            <button
                              onClick={() => handleCompleteTask(day.dayNumber, 'live')}
                              className="btn-outline justify-center text-xs font-bold py-1.5"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Quizzes */}
          {activeTab === 'quizzes' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm font-display">Daily Practice Checkpoints</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(course.dailyPlan || []).filter(d => d.quizId).map((day) => (
                  <div key={day.dayNumber} className="p-4 border border-slate-155 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-brand-600">Day {day.dayNumber} Target</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5 truncate">{day.quizTitle || 'Practice checkpoint'}</h4>
                    </div>
                    <Link to={`/student/practice`} className="btn-outline justify-center text-xs font-bold py-1.5">
                      <ClipboardList size={12} /> Start Practice
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Assignments */}
          {activeTab === 'assignments' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Assignments</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(course.dailyPlan || []).filter(d => d.assignmentUrl).map((day) => (
                  <div key={day.dayNumber} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Day {day.dayNumber} Assignment</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-0.5 truncate">{day.assignmentTitle || 'Assignment PDF'}</h4>
                    </div>
                    <a href={day.assignmentUrl} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center text-xs font-bold py-1.5 text-center">
                      <Download size={12} /> View Assignment
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Notes */}
          {activeTab === 'notes' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Notes</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(course.dailyPlan || []).filter(d => d.notesUrl).map((day) => (
                  <div key={day.dayNumber} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Day {day.dayNumber} Notes</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-0.5 truncate">{day.notesTitle || 'Notes PDF'}</h4>
                    </div>
                    <a href={day.notesUrl} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center text-xs font-bold py-1.5 text-center">
                      <FileText size={12} /> View Notes
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: SIDEBAR PANELS (col-span-1) ── */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Progress Circular Panel */}
          <div className="card p-5 bg-white border border-slate-150 rounded-2xl shadow-sm text-center flex flex-col items-center space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider self-start">Your Progress</h3>
            
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="#4f46e5" strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercent / 100)}
                  className="transition-all duration-700 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-800">{progressPercent}%</span>
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Completed</span>
              </div>
            </div>

            <div className="w-full text-xs space-y-2 border-t pt-3.5 text-left">
              <div className="flex justify-between font-bold text-slate-650">
                <span>Days Completed</span>
                <span className="text-slate-850">{completedDays.size} / {duration}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-650">
                <span>Recorded Classes</span>
                <span className="text-slate-850">{completedLessons} / {totalLessons}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-650">
                <span>Practice Done</span>
                <span className="text-slate-850">{completedQuizzes} / {totalQuizzes}</span>
              </div>
            </div>
          </div>

          {/* Daily Streak Panel */}
          <div className="card p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="text-orange-500 animate-bounce" size={14} /> Daily Streak
            </h3>
            <p className="text-[10px] text-slate-400 font-bold leading-tight">Keep it up! Watch your targets and maintain consistency.</p>
            
            <div className="flex justify-between pt-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-505">
                    {day}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Course Includes Summary Panel */}
          <div className="card p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Course Includes</h3>
            <div className="space-y-3.5 text-xs text-slate-650 font-semibold">
              <div className="flex items-center gap-2"><Play size={13} className="text-brand-500" /> {totalLessons} Recorded Classes</div>
              <div className="flex items-center gap-2"><Users size={13} className="text-brand-500" /> {totalLiveClasses} Live Classes</div>
              <div className="flex items-center gap-2"><ClipboardList size={13} className="text-brand-500" /> {totalQuizzes} Practice Checkpoints</div>
              <div className="flex items-center gap-2"><Download size={13} className="text-brand-500" /> {totalAssignments} Assignments</div>
              <div className="flex items-center gap-2"><FileText size={13} className="text-brand-500" /> {totalNotes} Notes</div>
            </div>
          </div>

        </div>
      </div>

      {/* Video Popup Modal (Backup if needed, else inline) */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-slate-600 transition p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <SecureYTPlayer url={activeVideo.url} title={activeVideo.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
