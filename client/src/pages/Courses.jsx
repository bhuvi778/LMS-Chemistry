import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import CourseCard from '../components/CourseCard.jsx';
import { Search, X } from 'lucide-react';

const CAT_ICONS = ['📘', '🧪', '⚗️', '🔬', '📐', '🧬', '🔭', '💡', '📊', '🎯'];

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [comboCourses, setComboCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const category = params.get('category') || 'ALL';
  const subCategory = params.get('subCategory') || '';
  const typeFilter = params.get('type') || 'ALL';
  const q = params.get('q') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
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
    if (v) {
      next.set(k, v);
      if (k === 'category') {
        next.delete('subCategory');
      }
    } else {
      next.delete(k);
      if (k === 'category') {
        next.delete('subCategory');
      }
    }
    setParams(next);
  };

  // Client-side filtering of courses
  const filteredCourses = courses.filter((c) => {
    if (c.isCombo) return false;
    if (typeFilter === 'LIVE' && c.courseType !== 'live') return false;
    if (typeFilter === 'RECORDED' && c.courseType !== 'recorded') return false;
    if (typeFilter === 'FREE' && c.price !== 0) return false;
    if (subCategory && !(c.subCategories || []).includes(subCategory)) return false;
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
          {/* Exam Category Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 justify-start md:justify-center px-4 md:px-0">
            <button
              onClick={() => setParam('category', '')}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                category === 'ALL'
                  ? 'bg-gradient-brand text-white border-transparent shadow-soft scale-105 font-black'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              🌐 All Exams
            </button>
            {categories.map((c, i) => (
              <button
                key={c._id || c.name || c}
                onClick={() => setParam('category', c.name || c)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  category === (c.name || c)
                    ? 'bg-gradient-brand text-white border-transparent shadow-soft scale-105 font-black'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                <span>{c.icon || CAT_ICONS[i % CAT_ICONS.length]}</span> {c.name || c}
              </button>
            ))}
          </div>

          {/* Sub-Category Filters */}
          {category !== 'ALL' && (
            (() => {
              const activeCatObj = categories.find((c) => (c.name || c) === category);
              const subs = activeCatObj?.subcategories || [];
              if (subs.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-2 mb-6 justify-center items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 max-w-3xl mx-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Sub-Categories:</span>
                  <button
                    onClick={() => setParam('subCategory', '')}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      !subCategory
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All
                  </button>
                  {subs.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setParam('subCategory', subCategory === sub ? '' : sub)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        subCategory === sub
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-brand-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              );
            })()
          )}

          {/* Main Filters (Live / Recorded / Free) */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 mb-6 justify-start md:justify-center px-4 md:px-0">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.k}
                onClick={() => setParam('type', t.k)}
                className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm border ${
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
