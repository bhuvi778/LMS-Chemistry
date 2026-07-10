import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import {
  ArrowLeft,
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
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Share2,
  Star,
  Users,
  Video,
  ListTodo
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/power-courses/progress/${courseId}`)
        ]);
        setCourse(courseRes.data);
        setProgress(progressRes.data);

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
    setExpandedDay(expandedDay === dayNum ? null : dayNum);
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

  const isDayUnlocked = (dayNum) => {
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

  return (
    <div className="space-y-6 pb-12">
      {/* Back link */}
      <Link to="/student/power-courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-505 hover:text-brand-650 transition">
        <ArrowLeft size={13} /> My Enrolled Power Courses
      </Link>

      {/* ── TOP HERO HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        {/* Left Card content */}
        <div className="relative flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${getBadgeStyle(course.powerCourseType)}`}>
              {course.powerCourseType ? `${course.powerCourseType} course` : 'challenge'}
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-display tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-sm font-bold text-indigo-300">Complete Revision</p>
          </div>

          {/* Metadata Grid */}
          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-300 pt-1">
            <div className="flex items-center gap-1.5"><Clock size={14} className="text-brand-400" /> Duration: {duration} Days</div>
            <div className="flex items-center gap-1.5"><Star size={14} className="text-brand-400" /> Level: Class 12</div>
            <div className="flex items-center gap-1.5"><Video size={14} className="text-brand-400" /> Lessons: {totalLessons}</div>
            <div className="flex items-center gap-1.5"><ListTodo size={14} className="text-brand-400" /> Quizzes: {totalQuizzes}</div>
          </div>

          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed pt-1">
            {course.shortDescription || 'Master topics step-by-step with high impact concept clarity, formulas, PYQs, and daily targeted tasks.'}
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
              {completedDays.size} of {duration} Days Completed · {completedLessons} of {totalLessons} Lessons Completed
            </div>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="relative shrink-0 w-full lg:w-72 bg-slate-850 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Course Access</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Access Mode</span>
              <span className="font-bold text-slate-200">Recorded + Notes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Start Date</span>
              <span className="font-bold text-slate-200">{new Date(progress?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
            <div className="text-base font-black text-brand-400 mt-0.5">Active Tracker</div>
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
              { id: 'quizzes', label: 'Quizzes' },
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

              {/* Day accordion cards list */}
              <div className="space-y-3">
                {Array.from({ length: duration }, (_, idx) => {
                  const dayNum = idx + 1;
                  const isCompleted = completedDays.has(dayNum);
                  const isUnlocked = isDayUnlocked(dayNum);
                  const isExpanded = expandedDay === dayNum;

                  const dayData = (course.dailyPlan || []).find(p => p.dayNumber === dayNum) || {
                    dayNumber: dayNum,
                    title: `Target Day ${dayNum}`,
                    topicsCovered: [],
                    videoUrl: '', videoTitle: 'Lecture video',
                    notesUrl: '', notesTitle: 'Study notes pdf',
                    quizId: '', quizTitle: 'Practice quiz test',
                    assignmentUrl: '', assignmentTitle: 'Homework assignment'
                  };

                  return (
                    <div
                      key={dayNum}
                      className={`border rounded-2xl overflow-hidden bg-white shadow-xs transition duration-200 ${
                        isExpanded ? 'border-brand-300 ring-2 ring-brand-500/5' : 'border-slate-155'
                      } ${!isUnlocked ? 'opacity-70 bg-slate-50/50' : ''}`}
                    >
                      {/* Accordion Row Header */}
                      <div
                        onClick={() => toggleExpandDay(dayNum)}
                        className={`flex items-center justify-between p-4 cursor-pointer select-none transition ${
                          isUnlocked ? 'hover:bg-slate-55' : 'cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <CheckCircle size={13} />
                            </div>
                          ) : isUnlocked ? (
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isExpanded ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-350 text-slate-500'
                            }`}>
                              {dayNum}
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                              <Lock size={10} />
                            </div>
                          )}
                          
                          <div className="min-w-0">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">Day {dayNum}</span>
                            <span className="font-extrabold text-slate-800 text-sm truncate block mt-0.5">{dayData.title}</span>
                          </div>
                        </div>

                        {/* Right side stats on accordion header */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-450 font-bold uppercase">
                            {dayData.videoUrl && <span>Lesson</span>}
                            {dayData.notesUrl && <span>Notes</span>}
                            {dayData.quizId && <span>Quiz</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`chip text-[10px] font-bold ${
                              isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isCompleted ? '100%' : '0%'}
                            </span>
                            {isUnlocked ? (
                              isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />
                            ) : (
                              <Lock size={12} className="text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible content (Accordion Drawer Body) */}
                      {isExpanded && isUnlocked && (
                        <div className="border-t border-slate-150 bg-slate-50/20 p-5 space-y-5">
                          
                          {/* Inner grid layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Inner Col 1: Video Player */}
                            <div className="lg:col-span-1 space-y-2">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Lecture Lecture</span>
                              {dayData.videoUrl ? (
                                <div className="rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 shadow-inner">
                                  <SecureYTPlayer url={dayData.videoUrl} title={dayData.videoTitle} />
                                </div>
                              ) : (
                                <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 italic text-xs border border-slate-200 border-dashed">
                                  No video lecture configured
                                </div>
                              )}
                            </div>

                            {/* Inner Col 2: Topics list */}
                            <div className="lg:col-span-1 space-y-3">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Topics Covered</span>
                              {dayData.topicsCovered?.length > 0 ? (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {dayData.topicsCovered.map((topic, idx) => (
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

                            {/* Inner Col 3: Task grid checklist */}
                            <div className="lg:col-span-1 space-y-3 bg-white rounded-xl p-4 border border-slate-150/80 shadow-xs">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b pb-1">Day Tasks Status</span>
                              
                              <div className="space-y-3">
                                {/* Task 1: Video */}
                                {dayData.videoUrl && (
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Play size={11} className="text-slate-400" /> Watch Video</span>
                                    {isTaskCompleted(dayNum, 'video') ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Complete</span>
                                    ) : (
                                      <button
                                        onClick={() => handleCompleteTask(dayNum, 'video')}
                                        className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Task 2: Notes */}
                                {dayData.notesUrl && (
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <a href={dayData.notesUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-650 hover:underline flex items-center gap-1.5">
                                      <FileText size={11} className="text-brand-500" /> Get Notes PDF
                                    </a>
                                    {isTaskCompleted(dayNum, 'notes') ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Read</span>
                                    ) : (
                                      <button
                                        onClick={() => handleCompleteTask(dayNum, 'notes')}
                                        className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Task 3: Quiz */}
                                {dayData.quizId && (
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <Link to={`/student/practice`} className="font-semibold text-brand-650 hover:underline flex items-center gap-1.5">
                                      <ClipboardList size={11} className="text-brand-500" /> Take Test Quiz
                                    </Link>
                                    {isTaskCompleted(dayNum, 'quiz') ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Scored</span>
                                    ) : (
                                      <button
                                        onClick={() => handleCompleteTask(dayNum, 'quiz')}
                                        className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Task 4: Assignment */}
                                {dayData.assignmentUrl && (
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <a href={dayData.assignmentUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-650 hover:underline flex items-center gap-1.5">
                                      <Download size={11} className="text-brand-500" /> Homework sheet
                                    </a>
                                    {isTaskCompleted(dayNum, 'assignment') ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">✓ Submitted</span>
                                    ) : (
                                      <button
                                        onClick={() => handleCompleteTask(dayNum, 'assignment')}
                                        className="text-[10px] font-black text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Content Index list */}
          {activeTab === 'content' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Full Lectures Playlist</h3>
              <div className="space-y-3">
                {(course.dailyPlan || []).filter(d => d.videoUrl).map((day) => (
                  <div key={day.dayNumber} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {day.dayNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{day.videoTitle || `Lecture video Day ${day.dayNumber}`}</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">Duration target: {day.durationText || '60 min'}</p>
                      </div>
                    </div>
                    {day.videoUrl && (
                      <button
                        onClick={() => setActiveVideo({ url: day.videoUrl, title: day.videoTitle })}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        <Play size={12} fill="currentColor" /> Play Lesson
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Quizzes */}
          {activeTab === 'quizzes' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm font-display">Daily Quizzes Checkpoints</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(course.dailyPlan || []).filter(d => d.quizId).map((day) => (
                  <div key={day.dayNumber} className="p-4 border border-slate-155 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-brand-600">Day {day.dayNumber} Target</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5 truncate">{day.quizTitle || 'Practice test quiz'}</h4>
                    </div>
                    <Link to={`/student/practice`} className="btn-outline justify-center text-xs font-bold py-1.5">
                      <ClipboardList size={12} /> Start Quiz Portal
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Assignments */}
          {activeTab === 'assignments' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Target Assignments & Homework</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(course.dailyPlan || []).filter(d => d.assignmentUrl).map((day) => (
                  <div key={day.dayNumber} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Day {day.dayNumber} Homework</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-0.5 truncate">{day.assignmentTitle || 'Daily Assignment Sheet'}</h4>
                    </div>
                    <a href={day.assignmentUrl} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center text-xs font-bold py-1.5 text-center">
                      <Download size={12} /> Get Homework PDF
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Notes */}
          {activeTab === 'notes' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Study Notes & Revision Materials</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {(course.dailyPlan || []).filter(d => d.notesUrl).map((day) => (
                  <div key={day.dayNumber} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Day {day.dayNumber} Notes</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-0.5 truncate">{day.notesTitle || 'Class Summary Notes'}</h4>
                    </div>
                    <a href={day.notesUrl} target="_blank" rel="noopener noreferrer" className="btn-outline justify-center text-xs font-bold py-1.5 text-center">
                      <FileText size={12} /> View Notes PDF
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
                <span>Lessons Completed</span>
                <span className="text-slate-850">{completedLessons} / {totalLessons}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-650">
                <span>Quizzes Taken</span>
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
              <div className="flex items-center gap-2"><Play size={13} className="text-brand-500" /> {totalLessons} Video Lessons</div>
              <div className="flex items-center gap-2"><ClipboardList size={13} className="text-brand-500" /> {totalQuizzes} Daily Quizzes</div>
              <div className="flex items-center gap-2"><Download size={13} className="text-brand-500" /> {totalAssignments} Assignments</div>
              <div className="flex items-center gap-2"><FileText size={13} className="text-brand-500" /> {totalNotes} Detailed Notes PDFs</div>
            </div>
          </div>

          {/* Discussion Help Panel */}
          <div className="card p-5 bg-white border border-slate-150 rounded-2xl shadow-sm text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <MessageSquare size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs">Stuck Somewhere?</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Ask your doubts in discussion dashboard.</p>
            </div>
            <button className="w-full btn-outline justify-center text-xs py-2 font-bold">
              Ask Doubt
            </button>
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
