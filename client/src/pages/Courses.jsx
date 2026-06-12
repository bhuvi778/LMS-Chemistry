import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import CourseCard from '../components/CourseCard.jsx';
import { Search } from 'lucide-react';

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [comboCourses, setComboCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const category = params.get('category') || 'ALL';
  const typeFilter = params.get('type') || 'ALL';
  const subCat = params.get('sub') || '';
  const q = params.get('q') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.map((c) => c.name || c)));
    api.get('/courses').then((r) => {
      setComboCourses(r.data.filter((c) => c.isCombo === true));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category !== 'ALL') qs.set('category', category);
    if (q) qs.set('q', q);
    api
      .get(`/courses?${qs}`)
      .then((r) => setCourses(r.data))
      .finally(() => setLoading(false));
  }, [category, q]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };

  // Derive unique sub-categories from loaded courses
  const allSubCats = [...new Set(courses.filter(c => !c.isCombo).flatMap((c) => c.subCategories || []))];

  // Client-side type + subcategory filter
  const filteredCourses = courses.filter((c) => {
    if (c.isCombo) return false;
    if (typeFilter === 'LIVE' && c.courseType !== 'live') return false;
    if (typeFilter === 'RECORDED' && c.courseType !== 'recorded' && c.courseType) return false;
    if (typeFilter === 'FREE' && c.price !== 0) return false;
    if (subCat && !(c.subCategories || []).includes(subCat)) return false;
    return true;
  });

  const TYPE_FILTERS = [
    { k: 'ALL', l: 'All Types' },
    { k: 'LIVE', l: '🔴 Live' },
    { k: 'RECORDED', l: '🎬 Recorded' },
    { k: 'FREE', l: '🆓 Free' },
  ];

  return (
    <div>
      <section className="bg-gradient-soft py-14">
        <div className="container-x">
          <h1 className="font-display text-4xl font-extrabold text-slate-900">
            All <span className="gradient-text">Courses</span>
          </h1>
          <p className="text-slate-600 mt-2">
            Handpicked Chemistry courses for CBSE, JEE, NEET and more.
          </p>
          <div className="mt-6 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="input !pl-11"
              placeholder="Search courses (e.g. JEE, Organic, NEET)…"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          {/* Main Category Filters (Live / Recorded / Free) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.k}
                onClick={() => setParam('type', t.k === 'ALL' ? '' : t.k)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${typeFilter === t.k
                    ? 'bg-slate-900 text-white shadow-soft'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* Subject / Exam Category Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
            {['ALL', ...categories].map((k) => (
              <button
                key={k}
                onClick={() => setParam('category', k === 'ALL' ? '' : k)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${category === k
                    ? 'bg-gradient-brand text-white shadow-soft'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Sub-Category Filters */}
          {allSubCats.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
              <button
                onClick={() => setParam('sub', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${!subCat
                    ? 'bg-violet-600 text-white shadow-soft'
                    : 'bg-white border border-violet-200 text-violet-700 hover:border-violet-400'
                  }`}
              >
                All Classes
              </button>
              {allSubCats.map((s) => (
                <button
                  key={s}
                  onClick={() => setParam('sub', s === subCat ? '' : s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${subCat === s
                      ? 'bg-violet-600 text-white shadow-soft'
                      : 'bg-white border border-violet-200 text-violet-700 hover:border-violet-400'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading…</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No courses found.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => (
                <CourseCard key={c._id} course={c} />
              ))}
            </div>
          )}

          {/* Combo Packages Section */}
          <div className="mt-16 border-t border-slate-100 pt-12">
            <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">
              📦 Combo Courses
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              Get multiple courses together at highly discounted bundle prices.
            </p>
            {comboCourses.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm font-medium">
                No Combo Courses available at the moment. You can create them from the Admin Panel!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {comboCourses.map((c) => (
                  <CourseCard key={c._id} course={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
