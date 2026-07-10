import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Filter,
  Info,
  Award,
  Loader2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import NtaAbhyasPanel from './NtaAbhyasPanel.jsx';

// Available categories for NCERT Toolbox
const CATEGORIES = [
  { id: 'line-by-line', label: 'NCERT Line-by-Line', desc: 'Questions from every line of NCERT', type: 'chapter' },
  { id: 'questions', label: 'NCERT Questions', desc: 'Complete chapter-wise questions & answers', type: 'badge' },
  { id: 'exemplars', label: 'NCERT Exemplar', desc: 'Official high-level exemplar problems', type: 'badge' },
  { id: 'diagrams', label: 'Diagram Based', desc: 'Visual and label identification questions', type: 'badge' },
  { id: 'nta-abhyas', label: 'NTA Abhyas', desc: 'National Testing Agency official practice sets', type: 'badge' }
];

export default function NcertToolbox() {
  const { user } = useAuth();
  
  // Tab and chapter selection state
  const [activeCategory, setActiveCategory] = useState('line-by-line');
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Question portal state
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Filters inside active chapter
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Track session answers (persist in localStorage for student experience)
  const [userAnswers, setUserAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(`ncert_answers_${user?._id || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync answers with localStorage
  useEffect(() => {
    localStorage.setItem(`ncert_answers_${user?._id || 'guest'}`, JSON.stringify(userAnswers));
  }, [userAnswers, user]);

  // Fetch chapters when category changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (activeCategory === 'nta-abhyas') {
        setChapters([]);
        setLoadingChapters(false);
        return;
      }

      setLoadingChapters(true);
      try {
        const catConfig = CATEGORIES.find(c => c.id === activeCategory);
        const endpoint = catConfig?.type === 'badge' ? `/ncert/badges/${activeCategory}` : `/ncert/chapters/${activeCategory}`;
        const response = await api.get(endpoint);
        setChapters(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching chapters/badges:', err);
        toast.error(err.message || 'Failed to fetch NCERT chapters');
      } finally {
        setLoadingChapters(false);
      }
    };
    fetchChapters();
  }, [activeCategory]);

  // Fetch questions when chapter is selected
  useEffect(() => {
    if (!selectedChapter) return;

    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setCurrentIdx(0);
      setSelectedTopic('all');
      setSelectedDifficulty('all');
      try {
        const catConfig = CATEGORIES.find(c => c.id === activeCategory);
        const params = { category: activeCategory };
        if (catConfig?.type === 'badge') {
          params.badgeType = selectedChapter.badgeType;
        } else {
          params.chapterId = selectedChapter._id;
        }

        const response = await api.get(`/ncert/questions`, { params });
        setQuestions(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching questions:', err);
        toast.error(err.message || 'Failed to fetch questions for this chapter');
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [selectedChapter, activeCategory]);

  // Dynamic helper to strip HTML tags for comparing answers cleanly
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim().toLowerCase();
  };

  // Group questions by topics dynamically to populate filters
  const uniqueTopics = [];
  const topicMap = new Map();
  questions.forEach((q) => {
    if (q.topicId && q.topicId._id && !topicMap.has(q.topicId._id)) {
      topicMap.set(q.topicId._id, true);
      uniqueTopics.push(q.topicId);
    }
  });

  // Apply filters
  const filteredQuestions = questions.filter((q) => {
    const matchesTopic = selectedTopic === 'all' || q.topicId?._id === selectedTopic;
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    return matchesTopic && matchesDifficulty;
  });

  const activeQuestion = filteredQuestions[currentIdx];

  // Handle choice selection
  const handleSelectChoice = async (option) => {
    if (!activeQuestion || !user) return;
    
    const questionId = activeQuestion._id;
    // Don't allow changing answers once submitted
    if (userAnswers[questionId]) return;

    const isCorrect = stripHtml(option) === stripHtml(activeQuestion.correctAnswer);
    
    // Save locally
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selected: option,
        isCorrect
      }
    }));

    // Save on upstream server
    try {
      await api.post('/ncert/progress', {
        questionId,
        chapterId: selectedChapter._id,
        isCorrect
      });
    } catch (err) {
      console.error('Failed to sync progress to server:', err);
    }
  };

  // Helper color map for chapter cards
  const getCardColors = (colorName) => {
    const maps = {
      cyan: { bg: 'bg-cyan-50/80', border: 'border-cyan-100', text: 'text-cyan-800', iconBg: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100/60 text-cyan-800' },
      blue: { bg: 'bg-blue-50/80', border: 'border-blue-100', text: 'text-blue-800', iconBg: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100/60 text-blue-800' },
      green: { bg: 'bg-emerald-50/80', border: 'border-emerald-100', text: 'text-emerald-800', iconBg: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100/60 text-emerald-800' },
      purple: { bg: 'bg-purple-50/80', border: 'border-purple-100', text: 'text-purple-800', iconBg: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100/60 text-purple-800' },
      orange: { bg: 'bg-amber-50/80', border: 'border-amber-100', text: 'text-amber-800', iconBg: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100/60 text-amber-800' },
      rose: { bg: 'bg-rose-50/80', border: 'border-rose-100', text: 'text-rose-800', iconBg: 'bg-rose-100 text-rose-600', badge: 'bg-rose-100/60 text-rose-800' }
    };
    return maps[colorName?.toLowerCase()] || maps.blue;
  };

  // Helper to map difficulty colors in question view
  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-100 text-emerald-800';
      case 'Hard':
        return 'bg-rose-100 text-rose-800';
      case 'Medium':
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  // Reset chapter progress locally
  const handleResetChapterProgress = () => {
    if (!window.confirm('Are you sure you want to reset your local progress for all questions in this chapter?')) return;
    
    const updated = { ...userAnswers };
    questions.forEach((q) => {
      delete updated[q._id];
    });
    setUserAnswers(updated);
    setCurrentIdx(0);
    toast.success('Chapter progress reset successfully!');
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 relative">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-brand-100/20 rounded-full filter blur-3xl opacity-70 pointer-events-none" />
      
      {!selectedChapter ? (
        // --- 1. Chapters View ---
        <div className="space-y-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold border border-brand-100/60">
                <Sparkles size={12} className="text-brand-500" />
                NCERT Learning Kit
              </span>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display">NCERT Toolbox</h1>
              <p className="text-slate-500 text-sm max-w-xl">
                Strengthen your core foundation by practicing NCERT questions, exemplars, and logic problems.
              </p>
            </div>
            
            <div className="flex gap-4 bg-white/70 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                <span className="text-lg font-bold text-slate-800">
                  {Object.keys(userAnswers).length}
                </span>
                <span>Solved Total</span>
              </div>
              <div className="flex items-center gap-2 pl-1">
                <span className="text-lg font-bold text-emerald-600">
                  {Object.values(userAnswers).filter(a => a.isCorrect).length}
                </span>
                <span>Correct Answers</span>
              </div>
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedChapter(null);
                  }}
                  className={`relative py-3 px-2 rounded-xl text-center text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-brand-650 shadow-md scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-white/40'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Chapters Grid list */}
          {activeCategory === 'nta-abhyas' ? (
            <NtaAbhyasPanel />
          ) : loadingChapters ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-brand-600" size={32} />
              <p className="text-slate-500 text-sm font-semibold">Loading chapter database...</p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <HelpCircle size={28} />
              </div>
              <h3 className="font-display font-bold text-slate-700 text-lg">No Chapters Found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                No chapters are available in the {CATEGORIES.find(c => c.id === activeCategory)?.label} category yet.
              </p>
            </div>
          ) : (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {chapters.map((ch) => {
                const colors = getCardColors(ch.color || 'blue');
                return (
                  <motion.div
                    key={ch._id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative group`}
                  >
                    {/* Color Accent bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r from-brand-400 to-indigo-400`} />
                    
                    <div className="p-6 space-y-4">
                      {/* Badge Details */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                          {ch.chapterNumber || 'Chapter'}
                        </span>
                        
                        <div className="flex gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                            Class {ch.classLevel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-650">
                            {ch.subject}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h3 className="font-display font-black text-slate-800 text-base leading-snug group-hover:text-brand-700 transition duration-200">
                          {ch.name}
                        </h3>
                        <p className="text-slate-400 text-xs line-clamp-2">
                          {ch.description || 'Practice line-by-line questions to perfect concepts.'}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <span className="text-xs text-slate-500 font-semibold">
                        {ch.category === 'line-by-line' ? 'Line-by-Line' : ch.category}
                      </span>
                      <button
                        onClick={() => setSelectedChapter(ch)}
                        className="btn-primary text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-md"
                      >
                        Practice Now
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      ) : (
        // --- 2. Interactive Practice View ---
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <button
              onClick={() => setSelectedChapter(null)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-brand-650 font-bold transition text-sm self-start"
            >
              <ArrowLeft size={16} />
              <span>Back to Chapters</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleResetChapterProgress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-bold transition duration-200"
              >
                <RefreshCw size={12} />
                <span>Reset Chapter Progress</span>
              </button>
            </div>
          </div>

          {/* Chapter Metadata block */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  {selectedChapter.chapterNumber || 'NCERT Chapter'}
                </span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                <span className="text-xs font-bold text-brand-600 capitalize">
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                </span>
              </div>
              <h2 className="font-display font-black text-slate-800 text-lg leading-tight">
                {selectedChapter.name}
              </h2>
            </div>
            
            <div className="flex gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-center min-w-[70px]">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Questions</div>
                <div className="text-sm font-black text-slate-800">{filteredQuestions.length}</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          {questions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 bg-white/50 backdrop-blur border border-slate-100 rounded-2xl p-4 text-xs font-bold">
              {/* Topic Select */}
              <div className="flex-1 space-y-1.5">
                <label className="text-slate-450 block uppercase tracking-wider text-[10px]">Filter Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    setCurrentIdx(0);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                >
                  <option value="all">All Topics ({questions.length})</option>
                  {uniqueTopics.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({questions.filter(q => q.topicId?._id === t._id).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Select */}
              <div className="sm:w-48 space-y-1.5">
                <label className="text-slate-450 block uppercase tracking-wider text-[10px]">Filter Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                    setCurrentIdx(0);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          )}

          {/* Main Question Panel */}
          {loadingQuestions ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-brand-600" size={32} />
              <p className="text-slate-500 text-sm font-semibold">Loading questions dataset...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Filter size={28} />
              </div>
              <h3 className="font-display font-bold text-slate-700 text-lg">No Questions Found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Try selecting a different topic or difficulty filter, or clear filters to view questions.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden flex flex-col justify-between">
                
                {/* Progress Indicators */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase">
                      Q {currentIdx + 1} of {filteredQuestions.length}
                    </span>
                    {activeQuestion.difficulty && (
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${getDifficultyBadge(activeQuestion.difficulty)}`}>
                        {activeQuestion.difficulty}
                      </span>
                    )}
                  </div>
                  {activeQuestion.ncertLine && (
                    <span className="text-slate-450 italic text-[11px]">
                      📖 NCERT Ref: {activeQuestion.ncertLine}
                    </span>
                  )}
                </div>

                {/* Progress bar line */}
                <div className="w-full h-1 bg-slate-100">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / filteredQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Content body */}
                <div className="p-6 md:p-8 space-y-6">
                  {/* Topic Tag */}
                  {activeQuestion.topicId && (
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={13} className="text-slate-400" />
                      <span>{activeQuestion.topicId.name}</span>
                    </div>
                  )}

                  {/* Question */}
                  <div 
                    className="text-slate-800 font-semibold text-base leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: activeQuestion.question }}
                  />

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {activeQuestion.options?.map((opt, oIdx) => {
                      const ans = userAnswers[activeQuestion._id];
                      const isSelected = ans?.selected === opt;
                      const isThisCorrect = stripHtml(opt) === stripHtml(activeQuestion.correctAnswer);
                      
                      let optStyle = 'border-slate-200 hover:border-brand-350 hover:bg-slate-50/50 text-slate-700';
                      let badgeIcon = null;

                      if (ans) {
                        if (isThisCorrect) {
                          // Correct option is highlighted green
                          optStyle = 'border-emerald-250 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20';
                          badgeIcon = <Check size={16} className="text-emerald-600 shrink-0" />;
                        } else if (isSelected) {
                          // Wrong clicked option is highlighted red
                          optStyle = 'border-rose-250 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20';
                          badgeIcon = <X size={16} className="text-rose-600 shrink-0" />;
                        } else {
                          // Disabled state for other choices
                          optStyle = 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectChoice(opt)}
                          disabled={!!ans}
                          className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all duration-200 flex items-center justify-between gap-3 ${optStyle}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                              ans 
                                ? isThisCorrect 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : isSelected 
                                    ? 'bg-rose-100 text-rose-700' 
                                    : 'bg-slate-100 text-slate-400'
                                : 'bg-slate-150 text-slate-500 group-hover:bg-brand-50'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: opt }} />
                          </div>
                          {badgeIcon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Footer Navigation bar */}
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0}
                    className="btn-secondary text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-800 disabled:opacity-40 transition font-bold"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setCurrentIdx(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                    disabled={currentIdx === filteredQuestions.length - 1}
                    className="btn-secondary text-xs flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-800 disabled:opacity-40 transition font-bold"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Explanations section - appears after option selected */}
              <AnimatePresence>
                {userAnswers[activeQuestion._id] && (activeQuestion.solution || activeQuestion.explanation) && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-6 md:p-8 space-y-3.5"
                  >
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Award size={18} className="text-emerald-600" />
                      <h4 className="font-display font-black text-sm uppercase tracking-wide">NCERT Concept Solution</h4>
                    </div>
                    <div 
                      className="text-slate-700 text-sm leading-relaxed font-medium break-words solution-content"
                      dangerouslySetInnerHTML={{ __html: activeQuestion.solution || activeQuestion.explanation }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
