import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Layers,
  Clock,
  Star,
  Lock,
  Unlock,
  Search,
  ChevronRight,
  Filter,
  BookOpen,
  CheckCircle,
  BarChart2,
  Zap,
  Trophy,
  FileText,
  Share2,
  Coins,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  basic: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  intermediate: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

function TestCard({ test, myAttempts = [] }) {
  const { user } = useAuth();
  const dc = DIFFICULTY_COLORS[test.difficulty] || DIFFICULTY_COLORS.intermediate;
  const attempt = myAttempts.find((a) => a.test?._id === test._id || a.test === test._id);
  const canAccess = test.isFree || !!user;

  const now = new Date();
  const start = test.liveStartDate ? new Date(test.liveStartDate) : null;
  const end = test.liveEndDate ? new Date(test.liveEndDate) : null;
  const isUpcoming = test.testType === 'live_test' && start && now < start;
  const isEnded = test.testType === 'live_test' && end && now > end;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${dc.bg} ${dc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dc.dot}`} />
              {test.difficulty}
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${test.isFree ? 'text-emerald-600' : 'text-slate-500'}`}>
              {test.isFree ? <><Unlock size={12} /> Free</> : <><Lock size={12} /> Enrolled</>}
            </div>
          </div>

          <h3 className="font-bold text-slate-800 mb-1 leading-snug text-[15px] group-hover:text-brand-700 transition-colors line-clamp-2">
            {test.title}
          </h3>
          {test.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{test.description}</p>
          )}

          {test.testType === 'live_test' && (start || end) && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-1 text-xs">
              {start && (
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium text-slate-500">Starts:</span>
                  <span className="font-semibold">{start.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {end && (
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium text-slate-500">Ends:</span>
                  <span className="font-semibold">{end.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 flex-wrap">
            <span className="flex items-center gap-1"><Clock size={12} /> {test.durationMins} min</span>
            <span className="flex items-center gap-1"><ClipboardList size={12} /> {test.questions?.length || 0} Qs</span>
            {test.totalMarks > 0 && (
              <span className="flex items-center gap-1"><Star size={12} /> {test.totalMarks} marks</span>
            )}
            <span className="flex items-center gap-1 text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-150"><Coins size={12} className="text-amber-500 animate-pulse" /> 1 Coin</span>
          </div>

          {(test.examTags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {test.examTags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          {attempt ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs text-slate-500">
                  Score: <strong className="text-slate-700">{attempt.percentage}%</strong>
                </span>
              </div>
              <Link
                to={`/test-result/${attempt._id}`}
                className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold"
              >
                View Result <ChevronRight size={12} />
              </Link>
            </div>
          ) : isUpcoming ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            >
              <Lock size={14} /> Upcoming Live Test
            </button>
          ) : isEnded ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-400 border border-red-100 cursor-not-allowed"
            >
              <Clock size={14} /> Live Test Ended
            </button>
          ) : (
            <Link
              to={canAccess ? `/take-test/${test._id}` : '/login'}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                canAccess
                  ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {canAccess ? (
                <><Zap size={14} /> Start Test</>
              ) : (
                <><Lock size={14} /> Login to Start</>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SeriesCard({ series }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
      <div className="h-2 bg-gradient-to-r from-brand-500 to-purple-600" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
            <Layers size={18} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/test-series/${series._id}`;
                navigator.clipboard.writeText(url);
                toast.success('Test Series link copied to clipboard!');
              }}
              className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-brand-600 transition flex items-center justify-center"
              title="Share Test Series"
            >
              <Share2 size={13} />
            </button>
            <div className={`flex items-center gap-1 text-xs font-medium ${series.isFree ? 'text-emerald-600' : 'text-slate-500'}`}>
              {series.isFree ? <><Unlock size={12} /> Free</> : <><Lock size={12} /> Enrolled</>}
            </div>
          </div>
        </div>
        <h3 className="font-bold text-slate-800 mb-1 leading-snug">{series.title}</h3>
        {series.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{series.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><ClipboardList size={12} /> {series.tests?.length || 0} tests</span>
        </div>
        {(series.examTags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {series.examTags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">{tag}</span>
            ))}
          </div>
        )}
        <Link
          to={`/test-series/${series._id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:opacity-90 transition"
        >
          <Layers size={14} /> View Series
        </Link>
      </div>
    </div>
  );
}

export default function TestPortal() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tests'); // tests | series
  const [practiceTab, setPracticeTab] = useState('quiz'); // quiz | live | infinite | pyq
  const [liveStatus, setLiveStatus] = useState('ongoing'); // ongoing | upcoming | attempted
  const [q, setQ] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [seriesCategory, setSeriesCategory] = useState(''); // category filter for series tab
  const [practiceCategory, setPracticeCategory] = useState(''); // category filter for practice tab
  const [practiceSubCategory, setPracticeSubCategory] = useState('');
  const [seriesSubCategory, setSeriesSubCategory] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [tRes, sRes, cRes] = await Promise.all([
          api.get('/tests/tests'),
          api.get('/tests/series'),
          api.get('/categories').catch(() => ({ data: [] })),
        ]);
        setTests(tRes.data);
        setSeries(sRes.data);
        setCategories(cRes.data || []);
        if (user) {
          const aRes = await api.get('/tests/attempts/me');
          setMyAttempts(aRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const filteredTests = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchD = !difficulty || t.difficulty === difficulty;
    const matchF = !freeOnly || t.isFree;
    const matchCat = !practiceCategory || (t.categories || []).includes(practiceCategory);
    const matchSubCat = !practiceSubCategory || (t.subCategories || []).includes(practiceSubCategory);
    if (!matchQ || !matchD || !matchF || !matchCat || !matchSubCat) return false;

    if (practiceTab === 'quiz') {
      return t.testType === 'quiz';
    } else if (practiceTab === 'live') {
      if (t.testType !== 'live_test') return false;
      const attempt = myAttempts.find((a) => a.test?._id === t._id || a.test === t._id);
      const now = new Date();
      const start = t.liveStartDate ? new Date(t.liveStartDate) : null;
      const end = t.liveEndDate ? new Date(t.liveEndDate) : null;

      if (liveStatus === 'attempted') {
        return !!attempt;
      }
      if (liveStatus === 'upcoming') {
        return !attempt && start && now < start;
      }
      // ongoing
      const isUpcoming = start && now < start;
      const isEnded = end && now > end;
      return !attempt && !isUpcoming && !isEnded;
    } else if (practiceTab === 'infinite') {
      return t.testType === 'infinite_practice';
    } else if (practiceTab === 'pyq') {
      // Show only PYQ tests that are NOT series_only
      return t.testType === 'previous_paper' && t.displayMode !== 'series_only';
    }
    return false;
  });

  const practiceCount = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchD = !difficulty || t.difficulty === difficulty;
    const matchF = !freeOnly || t.isFree;
    const isPracticeType = ['quiz', 'live_test', 'infinite_practice'].includes(t.testType) ||
      (t.testType === 'previous_paper' && t.displayMode !== 'series_only');
    return matchQ && matchD && matchF && isPracticeType;
  }).length;

  const quizCount = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchD = !difficulty || t.difficulty === difficulty;
    const matchF = !freeOnly || t.isFree;
    return matchQ && matchD && matchF && t.testType === 'quiz';
  }).length;

  const liveCount = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchD = !difficulty || t.difficulty === difficulty;
    const matchF = !freeOnly || t.isFree;
    return matchQ && matchD && matchF && t.testType === 'live_test';
  }).length;

  const infiniteCount = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchD = !difficulty || t.difficulty === difficulty;
    const matchF = !freeOnly || t.isFree;
    return matchQ && matchD && matchF && t.testType === 'infinite_practice';
  }).length;

  const pyqCount = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchD = !difficulty || t.difficulty === difficulty;
    const matchF = !freeOnly || t.isFree;
    return matchQ && matchD && matchF && t.testType === 'previous_paper' && t.displayMode !== 'series_only';
  }).length;

  const filteredSeries = series.filter((s) => {
    const matchQ = !q || s.title.toLowerCase().includes(q.toLowerCase());
    const matchF = !freeOnly || s.isFree;
    const matchCat = !seriesCategory || (s.categories || []).includes(seriesCategory);
    const matchSubCat = !seriesSubCategory || (s.subCategories || []).includes(seriesSubCategory);
    return matchQ && matchF && matchCat && matchSubCat;
  });

  // Extract all unique categories from all series
  const allSeriesCategories = [...new Set(series.flatMap((s) => s.categories || []))].filter(Boolean);

  // Pre-calculate active categories for practice tests tab (count > 0)
  const activePracticeCategories = [...new Set(tests.flatMap((t) => t.categories || []))]
    .filter(Boolean)
    .map((cat) => {
      const count = tests.filter((t) => {
        const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
        const matchD = !difficulty || t.difficulty === difficulty;
        const matchF = !freeOnly || t.isFree;
        const matchCat = (t.categories || []).includes(cat);
        if (!matchQ || !matchD || !matchF || !matchCat) return false;

        if (practiceTab === 'quiz') {
          return t.testType === 'quiz';
        } else if (practiceTab === 'live') {
          if (t.testType !== 'live_test') return false;
          const attempt = myAttempts.find((a) => a.test?._id === t._id || a.test === t._id);
          const now = new Date();
          const start = t.liveStartDate ? new Date(t.liveStartDate) : null;
          const end = t.liveEndDate ? new Date(t.liveEndDate) : null;

          if (liveStatus === 'attempted') return !!attempt;
          if (liveStatus === 'upcoming') return !attempt && start && now < start;
          // ongoing
          const isUpcoming = start && now < start;
          const isEnded = end && now > end;
          return !attempt && !isUpcoming && !isEnded;
        } else if (practiceTab === 'infinite') {
          return t.testType === 'infinite_practice';
        } else if (practiceTab === 'pyq') {
          return t.testType === 'previous_paper' && t.displayMode !== 'series_only';
        }
        return false;
      }).length;
      return { cat, count };
    })
    .filter((item) => item.count > 0);

  // Pre-calculate active categories for test series tab (count > 0)
  const activeSeriesCategories = allSeriesCategories
    .map((cat) => {
      const count = series.filter(
        (s) =>
          (!q || s.title.toLowerCase().includes(q.toLowerCase())) &&
          (!freeOnly || s.isFree) &&
          (s.categories || []).includes(cat)
      ).length;
      return { cat, count };
    })
    .filter((item) => item.count > 0);

  const attempted = myAttempts.length;
  const passed = myAttempts.filter((a) => a.percentage >= 60).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#050B1F] via-[#0D1B4B] to-[#1a0733] text-white py-14">
        <div className="container-x">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200">
                ONLINE PRACTICE PORTAL
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
              Practice Tests & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Mock Exams</span>
            </h1>
            <p className="text-slate-300 text-lg mb-6">
              Sharpen your skills with JEE, NEET and subject-specific tests. Instant results & detailed analysis.
            </p>
            {user && (
              <div className="flex gap-4">
                <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold">{attempted}</div>
                  <div className="text-xs text-slate-300">Tests Taken</div>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-bold">{passed}</div>
                  <div className="text-xs text-slate-300">Passed (≥60%)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-x py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
              placeholder="Search tests…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className="text-sm font-medium text-slate-700">Free Only</span>
          </label>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('tests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'tests' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={15} /> Practice ({practiceCount})
          </button>
          <button
            onClick={() => setTab('series')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'series' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={15} /> Test Series ({filteredSeries.length})
          </button>
        </div>

        {/* Sub-tabs under Practice */}
        {tab === 'tests' && (
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
            {[
              { id: 'quiz', label: 'Quiz', count: quizCount },
              { id: 'live', label: 'Live', count: liveCount },
              { id: 'infinite', label: 'Infinite Practice', count: infiniteCount },
              { id: 'pyq', label: 'PYQs', count: pyqCount },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setPracticeTab(sub.id);
                  setPracticeCategory(''); // Reset category filter
                  if (sub.id !== 'live') setLiveStatus('ongoing');
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  practiceTab === sub.id
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sub.label} ({sub.count})
              </button>
            ))}
          </div>
        )}

        {/* Category filter chips for Practice */}
        {tab === 'tests' && activePracticeCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Categories:</span>
            <button
              onClick={() => {
                setPracticeCategory('');
                setPracticeSubCategory('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                !practiceCategory
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {activePracticeCategories.map(({ cat, count }) => (
              <button
                key={cat}
                onClick={() => {
                  setPracticeCategory(practiceCategory === cat ? '' : cat);
                  setPracticeSubCategory('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  practiceCategory === cat
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-50 hover:border-brand-300'
                }`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Sub-Category filter chips for Practice */}
        {tab === 'tests' && practiceCategory && (
          (() => {
            const catObj = categories.find(c => c.name === practiceCategory);
            const subs = catObj?.subcategories || [];
            if (subs.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-2 mb-6 items-center bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Sub-Categories:</span>
                <button
                  onClick={() => setPracticeSubCategory('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    !practiceSubCategory
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                {subs.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setPracticeSubCategory(practiceSubCategory === sub ? '' : sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      practiceSubCategory === sub
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-50 hover:border-brand-300'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            );
          })()
        )}

        {/* Sub-sub-tabs under Live */}
        {tab === 'tests' && practiceTab === 'live' && (
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit items-center">
            {[
              { id: 'ongoing', label: 'Ongoing' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'attempted', label: 'Attempted' },
            ].map((status) => {
              const count = tests.filter((t) => {
                const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
                const matchD = !difficulty || t.difficulty === difficulty;
                const matchF = !freeOnly || t.isFree;
                if (!matchQ || !matchD || !matchF) return false;
                if (t.testType !== 'live_test') return false;

                const attempt = myAttempts.find((a) => a.test?._id === t._id || a.test === t._id);
                const now = new Date();
                const start = t.liveStartDate ? new Date(t.liveStartDate) : null;
                const end = t.liveEndDate ? new Date(t.liveEndDate) : null;

                if (status.id === 'attempted') return !!attempt;
                if (status.id === 'upcoming') return !attempt && start && now < start;
                // ongoing
                const isUpcoming = start && now < start;
                const isEnded = end && now > end;
                return !attempt && !isUpcoming && !isEnded;
              }).length;

              return (
                <button
                  key={status.id}
                  onClick={() => setLiveStatus(status.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    liveStatus === status.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {status.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : tab === 'tests' ? (
          filteredTests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p>No tests available in this section. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTests.map((t) => (
                <TestCard key={t._id} test={t} myAttempts={myAttempts} />
              ))}
            </div>
          )
        ) : (
          <>
            {/* Category filter chips for series */}
            {activeSeriesCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5 items-center">
                <span className="text-xs font-semibold text-slate-500 mr-1">Filter by Category:</span>
                <button
                  onClick={() => {
                    setSeriesCategory('');
                    setSeriesSubCategory('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    !seriesCategory
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({series.filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase())).length})
                </button>
                {activeSeriesCategories.map(({ cat, count }) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSeriesCategory(seriesCategory === cat ? '' : cat);
                      setSeriesSubCategory('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      seriesCategory === cat
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-brand-300'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                ))}
              </div>
            )}

            {/* Sub-Category filter chips for series */}
            {seriesCategory && (
              (() => {
                const catObj = categories.find(c => c.name === seriesCategory);
                const subs = catObj?.subcategories || [];
                if (subs.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-2 mb-5 items-center bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">Sub-Categories:</span>
                    <button
                      onClick={() => setSeriesSubCategory('')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        !seriesSubCategory
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      All
                    </button>
                    {subs.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSeriesSubCategory(seriesSubCategory === sub ? '' : sub)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          seriesSubCategory === sub
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-brand-300'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                );
              })()
            )}
            {filteredSeries.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Layers size={40} className="mx-auto mb-3 opacity-30" />
                <p>No test series available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSeries.map((s) => (
                  <SeriesCard key={s._id} series={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
