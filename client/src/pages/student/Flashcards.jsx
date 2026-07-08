import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Check, 
  X, 
  Sparkles, 
  Filter, 
  RotateCcw, 
  BookOpen, 
  HelpCircle,
  Award,
  Layers,
  Star,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

export default function Flashcards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data State
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [allCards, setAllCards] = useState([]);

  // Selections
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('all');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Deck State
  const [filteredCards, setFilteredCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Local Storage for tracking known/review cards
  const [knownCards, setKnownCards] = useState(() => {
    try {
      const saved = localStorage.getItem('known_flashcards');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [reviewCards, setReviewCards] = useState(() => {
    try {
      const saved = localStorage.getItem('review_flashcards');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const cardRef = useRef(null);

  // Save to Local Storage when state changes
  useEffect(() => {
    localStorage.setItem('known_flashcards', JSON.stringify(knownCards));
  }, [knownCards]);

  useEffect(() => {
    localStorage.setItem('review_flashcards', JSON.stringify(reviewCards));
  }, [reviewCards]);

  // Fetch all flashcard data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/flashcards');
        
        // Response matches structure: { success: true, chapters: [...], topics: [...], cards: [...] }
        const data = response.data;
        
        if (data.success) {
          setChapters(data.chapters || []);
          setTopics(data.topics || []);
          setAllCards(data.cards || []);
          
          if (data.chapters && data.chapters.length > 0) {
            setSelectedChapterId(data.chapters[0]._id);
          }
        } else {
          setError('Failed to retrieve flashcards');
        }
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError(err.message || 'Failed to connect to API server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter cards based on selected chapter, topic, search query, difficulty, and status
  useEffect(() => {
    if (!selectedChapterId) return;

    let cards = allCards.filter(card => card.chapterId === selectedChapterId);

    if (selectedTopicId !== 'all') {
      cards = cards.filter(card => card.topicId === selectedTopicId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(card => 
        (card.question && card.question.toLowerCase().includes(query)) ||
        (card.answer && card.answer.toLowerCase().includes(query))
      );
    }

    if (difficultyFilter !== 'all') {
      cards = cards.filter(card => card.difficulty === difficultyFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'known') {
        cards = cards.filter(card => knownCards[card._id]);
      } else if (statusFilter === 'review') {
        cards = cards.filter(card => reviewCards[card._id]);
      } else if (statusFilter === 'unseen') {
        cards = cards.filter(card => !knownCards[card._id] && !reviewCards[card._id]);
      }
    }

    // Sort cards by order/createdAt
    cards.sort((a, b) => (a.order || 0) - (b.order || 0));

    setFilteredCards(cards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [selectedChapterId, selectedTopicId, searchQuery, difficultyFilter, statusFilter, allCards, knownCards, reviewCards]);

  // Handle keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredCards.length === 0) return;
      
      // Don't trigger shortcuts if focus is on inputs
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        if (filteredCards[currentCardIndex]) {
          markAsKnown(filteredCards[currentCardIndex]._id);
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        if (filteredCards[currentCardIndex]) {
          markAsReview(filteredCards[currentCardIndex]._id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCards, currentCardIndex, isFlipped]);

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 150);
  };

  const markAsKnown = (cardId) => {
    setKnownCards(prev => ({ ...prev, [cardId]: true }));
    setReviewCards(prev => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
    toast.success('Marked as Known! 🎓', { id: 'status-toast', duration: 1500 });
    // Auto advance after short delay
    setTimeout(() => {
      handleNextCard();
    }, 800);
  };

  const markAsReview = (cardId) => {
    setReviewCards(prev => ({ ...prev, [cardId]: true }));
    setKnownCards(prev => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
    toast.error('Flagged for Review! 🔄', { id: 'status-toast', duration: 1500 });
    // Auto advance
    setTimeout(() => {
      handleNextCard();
    }, 800);
  };

  const resetStatus = (cardId) => {
    setKnownCards(prev => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
    setReviewCards(prev => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
    toast.success('Reset card status', { id: 'status-toast', duration: 1500 });
  };

  const resetAllProgressForChapter = () => {
    if (!window.confirm('Are you sure you want to reset study progress for all cards in this chapter?')) return;
    
    const chapterCardIds = allCards
      .filter(card => card.chapterId === selectedChapterId)
      .map(card => card._id);

    setKnownCards(prev => {
      const updated = { ...prev };
      chapterCardIds.forEach(id => delete updated[id]);
      return updated;
    });

    setReviewCards(prev => {
      const updated = { ...prev };
      chapterCardIds.forEach(id => delete updated[id]);
      return updated;
    });

    toast.success('Chapter progress reset successfully!');
  };

  // Get topics filtered for the current chapter
  const currentTopics = topics.filter(topic => topic.chapterId === selectedChapterId);

  // Get active chapter detail
  const activeChapter = chapters.find(ch => ch._id === selectedChapterId);

  // Card counts helper
  const getChapterCardStats = (chapterId) => {
    const chapterCards = allCards.filter(c => c.chapterId === chapterId);
    const total = chapterCards.length;
    const known = chapterCards.filter(c => knownCards[c._id]).length;
    const percentage = total > 0 ? Math.round((known / total) * 100) : 0;
    return { total, known, percentage };
  };

  // Get details for currently active card
  const activeCard = filteredCards[currentCardIndex];

  // Map difficulty levels to color badges
  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Medium':
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold animate-pulse">Loading ace2examz flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center max-w-lg mx-auto mt-12">
        <h3 className="text-red-800 font-bold text-lg mb-2">Error Connecting to Flashcards API</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* 3D Flip Card Styles injection */}
      <style>{`
        .flashcard-container {
          perspective: 1200px;
        }
        .flashcard-inner {
          transition: transform 0.55s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform-style: preserve-3d;
        }
        .flashcard-flipped {
          transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-brand-500 animate-pulse" size={24} />
            Flashcard Study Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Master Chemistry concepts with interactive flashcards. Progress is autosaved.
          </p>
        </div>
        {activeChapter && (
          <button
            onClick={resetAllProgressForChapter}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-700 px-4 py-2.5 rounded-xl transition"
          >
            <RotateCcw size={14} />
            Reset Chapter Progress
          </button>
        )}
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Chapters & Topics Sidebar (Lg: 4/12 width) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Chapter Selector */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft space-y-4">
            <h2 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              Chapters
            </h2>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {chapters.map((chapter) => {
                const isSelected = selectedChapterId === chapter._id;
                const stats = getChapterCardStats(chapter._id);

                return (
                  <button
                    key={chapter._id}
                    onClick={() => {
                      setSelectedChapterId(chapter._id);
                      setSelectedTopicId('all');
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border text-sm transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-bold transition-colors ${
                        isSelected ? 'text-brand-700' : 'text-slate-700'
                      }`}>
                        {chapter.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        {stats.total} Cards
                      </span>
                    </div>

                    {/* Chapter Progress */}
                    {stats.total > 0 && (
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                          <span>{stats.known} mastered</span>
                          <span>{stats.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-brand h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Selector */}
          {activeChapter && (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft space-y-4">
              <h2 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Layers size={18} className="text-purple-600" />
                Topics
              </h2>
              
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTopicId('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    selectedTopicId === 'all'
                      ? 'bg-purple-50 border border-purple-100 text-purple-700 font-extrabold'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  All Topics ({allCards.filter(c => c.chapterId === selectedChapterId).length})
                </button>
                
                {currentTopics.map((topic) => {
                  const topicCardsCount = allCards.filter(c => c.topicId === topic._id).length;
                  
                  return (
                    <button
                      key={topic._id}
                      onClick={() => setSelectedTopicId(topic._id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        selectedTopicId === topic._id
                          ? 'bg-purple-50 border border-purple-100 text-purple-700 font-extrabold'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="truncate pr-2">{topic.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md flex-shrink-0 font-medium">
                        {topicCardsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Deck Card (Lg: 8/12 width) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Filtering Header Bar */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search flashcards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition"
              />
            </div>

            {/* Select dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter size={13} />
                <span>Filters:</span>
              </div>
              
              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-400"
              >
                <option value="all">All Cards</option>
                <option value="unseen">Unseen</option>
                <option value="known">Mastered (Known)</option>
                <option value="review">Needs Review</option>
              </select>
            </div>
          </div>

          {/* Cards Deck View */}
          {filteredCards.length > 0 ? (
            <div className="space-y-6">
              
              {/* Deck Stats Bar */}
              <div className="flex items-center justify-between text-sm px-2">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl text-xs">
                    Card {currentCardIndex + 1} of {filteredCards.length}
                  </span>
                  
                  {/* Status Indicator for Current Card */}
                  {activeCard && (
                    <>
                      {knownCards[activeCard._id] && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                          <Check size={12} /> Mastered
                        </span>
                      )}
                      {reviewCards[activeCard._id] && (
                        <span className="flex items-center gap-1 text-xs text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
                          <Star size={12} /> Needs Review
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <Info size={12} />
                  <span>Use [Left/Right] arrows or [Space] to study</span>
                </div>
              </div>

              {/* Card deck slider progress */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%` }}
                ></div>
              </div>

              {/* HERO: 3D Flip Card Container */}
              <div className="flashcard-container relative h-[380px] w-full cursor-pointer select-none" onClick={toggleFlip}>
                <div className={`flashcard-inner relative w-full h-full preserve-3d shadow-soft rounded-3xl ${
                  isFlipped ? 'flashcard-flipped' : ''
                }`}>
                  
                  {/* FRONT SIDE (Question) */}
                  <div className="flashcard-front bg-gradient-to-tr from-white to-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-sm">
                    {/* Badge headers */}
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">
                        {activeChapter?.name}
                      </span>
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${getDifficultyBadge(activeCard?.difficulty)}`}>
                          {activeCard?.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Question text center area */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-4 max-h-[220px] overflow-y-auto">
                      <div 
                        className="font-display font-extrabold text-xl md:text-2xl text-slate-800 leading-relaxed max-w-xl"
                        dangerouslySetInnerHTML={{ __html: activeCard?.question }}
                      />
                    </div>

                    {/* Footer cue */}
                    <div className="text-center w-full">
                      <span className="text-xs text-brand-500 font-bold tracking-wide uppercase bg-brand-50 border border-brand-100 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
                        <RotateCw size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                        Click Card to Reveal Answer
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE (Answer) */}
                  {/* Note: click stops propagation on button clicks to prevent flipping back immediately */}
                  <div className="flashcard-back bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-glow">
                    {/* Header */}
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] tracking-wider uppercase font-bold text-slate-500">
                        Answer View
                      </span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold ${getDifficultyBadge(activeCard?.difficulty)}`}>
                        {activeCard?.difficulty}
                      </span>
                    </div>

                    {/* Answer text area */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-4 max-h-[210px] overflow-y-auto">
                      <div 
                        className="font-sans font-medium text-base md:text-lg text-slate-200 leading-relaxed max-w-xl prose prose-invert"
                        dangerouslySetInnerHTML={{ __html: activeCard?.answer }}
                      />
                    </div>

                    {/* Footer with action buttons (known/review) */}
                    <div className="flex items-center justify-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => markAsReview(activeCard._id)}
                        className="flex-1 max-w-[160px] flex items-center justify-center gap-1.5 py-2.5 px-4 bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-2xl transition"
                      >
                        <X size={14} />
                        Review Needed
                      </button>

                      <button
                        onClick={() => resetStatus(activeCard._id)}
                        className="p-2.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-2xl transition text-xs"
                        title="Reset this card status"
                      >
                        <RotateCcw size={14} />
                      </button>

                      <button
                        onClick={() => markAsKnown(activeCard._id)}
                        className="flex-1 max-w-[160px] flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-950/80 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 text-xs font-bold rounded-2xl transition"
                      >
                        <Check size={14} />
                        I Know This
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Slider Bottom Navigation Controls */}
              <div className="flex items-center justify-between max-w-sm mx-auto">
                <button
                  onClick={handlePrevCard}
                  className="w-12 h-12 rounded-full border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm transition hover:scale-105 active:scale-95"
                  title="Previous Card (Left Arrow)"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  onClick={toggleFlip}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 hover:border-slate-200 text-slate-700 rounded-full font-bold text-sm shadow-sm transition hover:scale-105 active:scale-95"
                >
                  <RotateCw size={16} />
                  Flip Card
                </button>

                <button
                  onClick={handleNextCard}
                  className="w-12 h-12 rounded-full border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm transition hover:scale-105 active:scale-95"
                  title="Next Card (Right Arrow)"
                >
                  <ChevronRight size={22} />
                </button>
              </div>

            </div>
          ) : (
            /* EMPTY STATE: No flashcards matching active filters */
            <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-soft text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <HelpCircle size={32} />
              </div>
              <h3 className="font-display font-extrabold text-slate-800 text-lg">No Flashcards Found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                We couldn't find any flashcards matching your current search parameters, topic, or status filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDifficultyFilter('all');
                  setStatusFilter('all');
                  setSelectedTopicId('all');
                }}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 shadow-soft transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Quick study keyboard guide */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Award className="text-amber-500" size={15} />
              Keyboard Shortcuts Guide:
            </span>
            <div className="flex gap-4 text-[10px] font-mono text-slate-400">
              <span><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-bold mr-1">Space</kbd> Flip</span>
              <span><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-bold mr-1">←</kbd> / <kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-bold mr-1">→</kbd> Prev/Next</span>
              <span><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-bold mr-1">K</kbd> Known</span>
              <span><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-600 font-bold mr-1">R</kbd> Review</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
