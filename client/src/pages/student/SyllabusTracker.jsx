import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Calendar, 
  Play, 
  FileText, 
  BookOpen, 
  FileCheck, 
  Video, 
  Award,
  Plus,
  ClipboardList
} from 'lucide-react';
import LogoLoader from '../../components/LogoLoader.jsx';

export default function SyllabusTracker() {
  const [syllabus, setSyllabus] = useState([]);
  const [progress, setProgress] = useState({}); // subTopicId -> array of completed items
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [selectedItemForPlanner, setSelectedItemForPlanner] = useState(null); // { subject, chapter, topic, subTopic, itemType }
  const [plannerDate, setPlannerDate] = useState(new Date().toISOString().split('T')[0]);

  // Plan gating and category filtering states
  const [enrollments, setEnrollments] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [hasAccess, setHasAccess] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    checkAccessAndFetchSyllabus();
  }, []);

  const checkAccessAndFetchSyllabus = async () => {
    try {
      setLoadingAccess(true);
      const enrollsRes = await api.get('/enroll/me');
      const enrolls = enrollsRes.data || [];
      setEnrollments(enrolls);

      // Extract active categories from enrollments with planType 'pro' or 'infinity' and status paid
      const activeCats = [];
      enrolls.forEach(e => {
        if (e.paymentStatus === 'paid' && (e.planType === 'pro' || e.planType === 'infinity')) {
          if (e.course) {
            const courseCats = e.course.categories || [];
            if (courseCats.length > 0) {
              courseCats.forEach(c => {
                if (!activeCats.includes(c)) activeCats.push(c);
              });
            } else if (e.course.category && !activeCats.includes(e.course.category)) {
              activeCats.push(e.course.category);
            }
          }
        }
      });

      setActiveCategories(activeCats);
      const eligible = activeCats.length > 0;
      setHasAccess(eligible);

      if (eligible) {
        setLoading(true);
        const [syllabusRes, progressRes] = await Promise.all([
          api.get('/ace-track/syllabus'),
          api.get('/ace-track/progress')
        ]);
        setSyllabus(syllabusRes.data);
        if (syllabusRes.data.length > 0) {
          setActiveSubject(syllabusRes.data[0]._id);
        }
        
        const progMap = {};
        progressRes.data.forEach(item => {
          progMap[item.subTopicId] = item.completedItems;
        });
        setProgress(progMap);
      }
    } catch (error) {
      toast.error('Failed to load syllabus data');
      console.error(error);
    } finally {
      setLoadingAccess(false);
      setLoading(false);
    }
  };

  const handleCategoryChange = async (cat) => {
    setSelectedCategory(cat);
    try {
      setLoading(true);
      const url = cat === 'ALL' ? '/ace-track/syllabus' : `/ace-track/syllabus?category=${encodeURIComponent(cat)}`;
      const res = await api.get(url);
      setSyllabus(res.data);
      if (res.data.length > 0) {
         setActiveSubject(res.data[0]._id);
      } else {
         setActiveSubject(null);
      }
    } catch (error) {
      toast.error('Failed to load syllabus for this category');
    } finally {
      setLoading(false);
    }
  };

  // Keep for compatibility
  const fetchSyllabusAndProgress = checkAccessAndFetchSyllabus;

  const handleToggleProgress = async (subTopicId, itemType) => {
    try {
      // Optimistic update
      const currentCompleted = progress[subTopicId] || [];
      const updated = currentCompleted.includes(itemType)
        ? currentCompleted.filter(i => i !== itemType)
        : [...currentCompleted, itemType];
      
      setProgress(prev => ({
        ...prev,
        [subTopicId]: updated
      }));

      const res = await api.post('/ace-track/progress/toggle', { subTopicId, itemType });
      setProgress(prev => ({
        ...prev,
        [subTopicId]: res.data.completedItems
      }));
      toast.success(currentCompleted.includes(itemType) ? 'Marked incomplete' : 'Marked complete! 🎉');
    } catch (error) {
      toast.error('Failed to update progress');
      // Revert in case of failure
      fetchSyllabusAndProgress();
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleOpenPlannerModal = (subject, chapter, topic, subTopic, itemType) => {
    setSelectedItemForPlanner({ subject, chapter, topic, subTopic, itemType });
    setShowPlannerModal(true);
  };

  const handleAddGoalToPlanner = async () => {
    if (!selectedItemForPlanner) return;
    try {
      const { subject, chapter, subTopic, itemType } = selectedItemForPlanner;
      const formattedItemType = {
        video: 'Video Lecture 🎥',
        notes: 'Revision Notes 📝',
        dpp: 'DPP Questions 📄',
        dppVideo: 'DPP Video Solution 🎬',
        mockTest: 'Mock Test 🏆'
      }[itemType];

      const title = `Complete ${subject.name} - ${chapter.name} (${subTopic.name}): ${formattedItemType}`;
      
      await api.post('/ace-track/planner', {
        date: plannerDate,
        title,
        associatedSubTopic: subTopic._id,
        associatedActivity: itemType
      });

      toast.success('Goal added to your Planner! 📅');
      setShowPlannerModal(false);
      setSelectedItemForPlanner(null);
    } catch (error) {
      toast.error('Failed to add goal to planner');
      console.error(error);
    }
  };

  // Helper calculation functions
  const calculateSubjectProgress = (subject) => {
    let totalItems = 0;
    let completedItems = 0;

    subject.chapters.forEach(chapter => {
      chapter.topics.forEach(topic => {
        topic.subTopics.forEach(subTopic => {
          const comp = progress[subTopic._id] || [];
          if (subTopic.hasVideo) { totalItems++; if (comp.includes('video')) completedItems++; }
          if (subTopic.hasNotes) { totalItems++; if (comp.includes('notes')) completedItems++; }
          if (subTopic.hasDpp) { totalItems++; if (comp.includes('dpp')) completedItems++; }
          if (subTopic.hasDppVideo) { totalItems++; if (comp.includes('dppVideo')) completedItems++; }
          if (subTopic.hasMockTest) { totalItems++; if (comp.includes('mockTest')) completedItems++; }
          if (subTopic.hasPyq) { totalItems++; if (comp.includes('pyq')) completedItems++; }
        });
      });
    });

    return {
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      completed: completedItems,
      total: totalItems
    };
  };

  const calculateChapterProgress = (chapter) => {
    let totalItems = 0;
    let completedItems = 0;

    chapter.topics.forEach(topic => {
      topic.subTopics.forEach(subTopic => {
        const comp = progress[subTopic._id] || [];
        if (subTopic.hasVideo) { totalItems++; if (comp.includes('video')) completedItems++; }
        if (subTopic.hasNotes) { totalItems++; if (comp.includes('notes')) completedItems++; }
        if (subTopic.hasDpp) { totalItems++; if (comp.includes('dpp')) completedItems++; }
        if (subTopic.hasDppVideo) { totalItems++; if (comp.includes('dppVideo')) completedItems++; }
        if (subTopic.hasMockTest) { totalItems++; if (comp.includes('mockTest')) completedItems++; }
        if (subTopic.hasPyq) { totalItems++; if (comp.includes('pyq')) completedItems++; }
      });
    });

    return {
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      completed: completedItems,
      total: totalItems
    };
  };

  const getOverallSyllabusProgress = () => {
    let totalItems = 0;
    let completedItems = 0;

    syllabus.forEach(subject => {
      subject.chapters.forEach(chapter => {
        chapter.topics.forEach(topic => {
          topic.subTopics.forEach(subTopic => {
            const comp = progress[subTopic._id] || [];
            if (subTopic.hasVideo) { totalItems++; if (comp.includes('video')) completedItems++; }
            if (subTopic.hasNotes) { totalItems++; if (comp.includes('notes')) completedItems++; }
            if (subTopic.hasDpp) { totalItems++; if (comp.includes('dpp')) completedItems++; }
            if (subTopic.hasDppVideo) { totalItems++; if (comp.includes('dppVideo')) completedItems++; }
            if (subTopic.hasMockTest) { totalItems++; if (comp.includes('mockTest')) completedItems++; }
            if (subTopic.hasPyq) { totalItems++; if (comp.includes('pyq')) completedItems++; }
          });
        });
      });
    });

    return {
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      completed: completedItems,
      total: totalItems
    };
  };

  if (loadingAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LogoLoader size={60} text="Checking access permissions..." />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden border border-slate-800/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-indigo-400">
              <ClipboardList size={38} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                Premium Feature
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Unlock Syllabus Tracker & Planner</h1>
              <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                Supercharge your preparation! The **Syllabus Tracker** and **My Planner** tools are available exclusively for **Pro** and **Infinity** plan subscribers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Category-specific Exam Syllabi (JEE, NEET, CBSE, etc.)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Daily Study Planner with task tracking and rewards</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Earn Ace Coins for completing scheduled daily goals</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/courses"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-brand text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition duration-200 text-center"
              >
                Upgrade Plan / Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LogoLoader size={60} text="Loading Chemistry Syllabus Tracker..." />
      </div>
    );
  }

  const selectedSubjectData = syllabus.find(s => s._id === activeSubject);
  const overall = getOverallSyllabusProgress();

  return (
    <div className="space-y-8 w-full max-w-5xl">
      {/* Page Header & Progress Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
        
        <div className="relative z-10 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              Learning Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Syllabus Tracker</h1>
            <p className="text-slate-300 text-sm max-w-lg">
              Monitor your prep progress across all Chemistry chapters. Keep track of videos, study notes, practice problems (DPPs), and mock tests to secure high scores.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Overall Completion</h3>
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Circular progress container */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="url(#progressGrad)" strokeWidth="8" fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * overall.percentage) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-xl font-black text-white">{overall.percentage}%</div>
            </div>
            <div className="text-xs text-indigo-200 font-medium mt-3">
              {overall.completed} / {overall.total} Topics Finished
            </div>
          </div>
        </div>
      </div>

      {/* Exam Category Filter Tabs */}
      {activeCategories.length > 1 && (
        <div className="space-y-2 pb-2 border-b border-slate-200/60">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Filter by Exam / Category:</span>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => handleCategoryChange('ALL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm font-black'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              🌐 All My Exams
            </button>
            {activeCategories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                🎓 {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject Selector Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {syllabus.map(subject => {
          const isActive = subject._id === activeSubject;
          const { percentage } = calculateSubjectProgress(subject);
          return (
            <button
              key={subject._id}
              onClick={() => setActiveSubject(subject._id)}
              className={`flex items-center gap-3 shrink-0 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 border ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 hover:text-slate-800'
              }`}
            >
              <span>{subject.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Accordion List of Chapters */}
      {selectedSubjectData && (
        <div className="space-y-4">
          {selectedSubjectData.chapters.map(chapter => {
            const isExpanded = !!expandedChapters[chapter._id];
            const chapProgress = calculateChapterProgress(chapter);
            
            return (
              <div key={chapter._id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-300">
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter._id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition duration-200"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">Chapter</span>
                    <h2 className="text-sm font-extrabold text-slate-800 truncate">{chapter.name}</h2>
                    
                    {/* Chapter Progress Bar */}
                    <div className="flex items-center gap-3 w-full max-w-md pt-1">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${chapProgress.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{chapProgress.percentage}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                      {chapProgress.completed}/{chapProgress.total} resources
                    </span>
                    <div className="p-1.5 rounded-lg bg-slate-100/80 text-slate-500">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {/* Chapter Topics & Subtopics (Expanded View) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/20 p-5 space-y-6">
                    {chapter.topics.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No topics added in this chapter.</p>
                    ) : (
                      chapter.topics.map(topic => (
                        <div key={topic._id} className="space-y-3">
                          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase pl-1">
                            Topic: {topic.name}
                          </h3>
                          
                          {/* Sub-topics list */}
                          <div className="grid gap-3.5">
                            {topic.subTopics.map(subTopic => {
                              const compItems = progress[subTopic._id] || [];
                              
                              const resources = [
                                { type: 'video', label: 'Video', icon: Video, enabled: subTopic.hasVideo, color: 'text-rose-500 bg-rose-50 border-rose-100' },
                                { type: 'notes', label: 'Notes', icon: FileText, enabled: subTopic.hasNotes, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                                { type: 'dpp', label: 'DPPs', icon: BookOpen, enabled: subTopic.hasDpp, color: 'text-sky-600 bg-sky-50 border-sky-100' },
                                { type: 'dppVideo', label: 'DPP Video', icon: Play, enabled: subTopic.hasDppVideo, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                                { type: 'mockTest', label: 'Mock Test', icon: Award, enabled: subTopic.hasMockTest, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                                { type: 'pyq', label: 'PYQs', icon: FileCheck, enabled: subTopic.hasPyq, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
                              ];

                              const enabledCount = resources.filter(r => r.enabled).length;
                              const compCount = resources.filter(r => r.enabled && compItems.includes(r.type)).length;
                              const subProgressPercentage = enabledCount > 0 ? Math.round((compCount / enabledCount) * 100) : 0;

                              return (
                                <div 
                                  key={subTopic._id}
                                  className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs"
                                >
                                  {/* Title & Micro Progress */}
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-slate-700 truncate">{subTopic.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${
                                        subProgressPercentage === 100 
                                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                      }`}>
                                        {subProgressPercentage === 100 ? (
                                          <>
                                            <CheckCircle2 size={10} className="stroke-[3px]" /> Completed
                                          </>
                                        ) : (
                                          `Progress: ${subProgressPercentage}%`
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Resource Track Checklist */}
                                  <div className="flex flex-wrap gap-2 items-center">
                                    {resources.map(res => {
                                      if (!res.enabled) return null;
                                      const isDone = compItems.includes(res.type);
                                      const ResIcon = res.icon;

                                      return (
                                        <div key={res.type} className="flex items-center gap-1 group/item">
                                          <button
                                            onClick={() => handleToggleProgress(subTopic._id, res.type)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                              isDone 
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                          >
                                            <ResIcon size={12} className={isDone ? 'text-white' : 'text-slate-400'} />
                                            <span>{res.label}</span>
                                            {isDone && <CheckCircle2 size={12} fill="white" className="text-indigo-600 shrink-0 ml-0.5" />}
                                          </button>
                                          
                                          {/* Add directly to planner button */}
                                          <button
                                            type="button"
                                            onClick={() => handleOpenPlannerModal(selectedSubjectData, chapter, topic, subTopic, res.type)}
                                            className="p-1.5 rounded-lg border border-slate-200/50 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition cursor-pointer"
                                            title="Add to daily goals"
                                          >
                                            <Plus size={11} className="stroke-[3px]" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Syllabus Item to Planner Modal */}
      {showPlannerModal && selectedItemForPlanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Add to My Planner</h3>
                <p className="text-[11px] text-slate-400">Schedule this learning goal as a daily task</p>
              </div>
            </div>

            <div className="space-y-4 py-1 text-slate-600 text-xs">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                <div>
                  <span className="text-[9px] font-black text-indigo-600 tracking-wide uppercase">Sub-topic</span>
                  <div className="font-bold text-slate-800">{selectedItemForPlanner.subTopic.name}</div>
                </div>
                <div>
                  <span className="text-[9px] font-black text-indigo-600 tracking-wide uppercase">Activity</span>
                  <div className="font-bold text-slate-700 capitalize">{selectedItemForPlanner.itemType}</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Target Date</label>
                <input 
                  type="date"
                  value={plannerDate}
                  onChange={(e) => setPlannerDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowPlannerModal(false); setSelectedItemForPlanner(null); }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddGoalToPlanner}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
