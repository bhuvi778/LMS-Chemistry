import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import CourseCard from '../components/CourseCard.jsx';
import { Search, X } from 'lucide-react';

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [comboCourses, setComboCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const category = params.get('category') || 'ALL';
  const typeFilter = params.get('type') || 'ALL';
  const q = params.get('q') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.map((c) => c.name || c)));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category !== 'ALL') qs.set('category', category);
    if (q) qs.set('q', q);
    api
      .get(`/courses?${qs}`)
      .then((r) => {
        setCourses(r.data);
        setComboCourses(r.data.filter((c) => c.isCombo === true));
      })
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

  // Client-side type filter
  const filteredCourses = courses.filter((c) => {
    if (c.isCombo) return false;
    if (typeFilter === 'LIVE' && c.courseType !== 'live') return false;
    if (typeFilter === 'RECORDED' && c.courseType !== 'recorded') return false;
    if (typeFilter === 'FREE' && c.price !== 0) return false;
    return true;
  });

  const TYPE_FILTERS = [
    { k: 'ALL', l: '📚 All Courses' },
    { k: 'LIVE', l: '🔴 Live Courses' },
    { k: 'RECORDED', l: '🎬 Recorded Courses' },
    { k: 'FREE', l: '🆓 Free Courses' },
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
          {category !== 'ALL' && (
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-xs font-bold text-brand-700">
                Filtered Category: {category}
                <button
                  onClick={() => setParam('category', '')}
                  className="hover:bg-brand-100 rounded-full p-0.5 text-brand-500 hover:text-brand-700"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {/* Main Category Filters (Live / Recorded / Free) */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 mb-6 justify-center">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.k}
                onClick={() => setParam('type', t.k)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm border ${
                  typeFilter === t.k
                    ? 'bg-gradient-brand text-white border-transparent scale-105 font-black shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

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
            {comboCourses.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm font-medium">
                No Combo Courses available at the moment.
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
