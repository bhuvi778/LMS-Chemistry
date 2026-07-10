import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import { Search, Clock, Zap, Star, Filter, Calendar, ChevronRight, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PowerCoursesCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Filter state
  const searchQuery = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'ALL'; // ALL, micro, mini, crash
  const sortBy = searchParams.get('sort') || 'popular';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses?isPowerCourse=true');
        setCourses(data || []);
      } catch (err) {
        toast.error('Failed to load Power Courses catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Filter & Sort Logic
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((c) => c.powerCourseType === typeFilter);
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'duration') {
      result.sort((a, b) => (b.powerCourseDuration || 0) - (a.powerCourseDuration || 0));
    }

    return result;
  }, [courses, searchQuery, typeFilter, sortBy]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-3 font-semibold">Loading Power Challenges...</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* ── HEADER BANNER SECTION ── */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white py-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        
        <div className="container-x flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 text-brand-400 px-3 py-1 rounded-full text-xs font-bold">
              <Zap size={12} className="animate-pulse" /> Power Challenges
            </div>
            <h1 className="text-4xl font-black font-display tracking-tight">
              Power <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Courses</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Short courses. Big impact. Fast results. Complete calendar-based revision in 7, 15, or 30 days!
            </p>
          </div>

          {/* Public Search Bar */}
          <div className="w-full md:w-80 relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search for Power Courses..."
              value={searchQuery}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-450 focus:outline-none focus:border-brand-500 transition text-sm"
            />
          </div>
        </div>
      </section>

      {/* ── FILTER & CONTENT GRID SECTION ── */}
      <section className="section mt-8">
        <div className="container-x space-y-8">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { k: 'ALL', l: 'All Power Courses' },
                { k: 'micro', l: 'Micro Courses' },
                { k: 'mini', l: 'Mini Courses' },
                { k: 'crash', l: 'Crash Courses' }
              ].map((tab) => (
                <button
                  key={tab.k}
                  onClick={() => updateParam('type', tab.k)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all border ${
                    typeFilter === tab.k
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  {tab.l}
                </button>
              ))}
            </div>

            {/* Sort Filter dropdowns */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold">
                <Filter size={13} /> Filters
              </div>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-650 focus:outline-none focus:border-brand-500"
              >
                <option value="popular">Sort By: Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="duration">Days Duration</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Calendar className="text-slate-350 mx-auto" size={40} />
              <div>
                <p className="text-slate-700 font-bold text-sm">No Power Challenges matched your search</p>
                <p className="text-slate-450 text-xs mt-1">Try resetting the filters or modifying your search terms.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCourses.map((course) => {
                const duration = course.powerCourseDuration || 7;
                const lessonsCount = (course.dailyPlan || []).filter(d => d.videoUrl).length || (duration * 3);
                const quizCount = (course.dailyPlan || []).filter(d => d.quizId).length || duration;
                const discPercent = course.mrp && course.mrp > course.price ? Math.round(((course.mrp - course.price) / course.mrp) * 100) : 0;

                return (
                  <div
                    key={course._id}
                    onClick={() => navigate(`/power-courses/${course._id}`)}
                    className="group cursor-pointer bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex flex-col justify-between"
                  >
                    {/* Thumbnail & duration Badge */}
                    <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-brand flex items-center justify-center text-white font-extrabold text-lg">
                          {duration} Days
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded">
                        {duration} Days
                      </span>
                    </div>

                    {/* Body Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        {/* Course Category / Level badge */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getBadgeStyle(course.powerCourseType)}`}>
                            {course.powerCourseType || 'mini'} Course
                          </span>
                          <span className="text-[10px] text-slate-450 font-extrabold">{course.category || 'Class 12 · Chemistry'}</span>
                        </div>

                        {/* Title & subtitle */}
                        <h3 className="font-extrabold text-slate-850 text-sm leading-snug line-clamp-1 group-hover:text-brand-650 transition">
                          {course.title}
                        </h3>
                        <p className="text-slate-450 text-[11px] font-semibold line-clamp-1">
                          {course.subtitle || 'Complete Target Revision'}
                        </p>

                        {/* Lessons & Quiz counts */}
                        <div className="text-[10px] text-slate-450 font-bold">
                          {lessonsCount} Lessons · {quizCount} Quizzes
                        </div>

                        {/* Review star */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <Star size={11} className="text-amber-500 fill-amber-500" />
                          <span>4.8 (256 reviews)</span>
                        </div>
                      </div>

                      {/* Footer Actions / Prices */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">₹{course.price}</span>
                          {discPercent > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                              <span className="line-through">₹{course.mrp}</span>
                              <span className="text-emerald-500">{discPercent}% OFF</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/power-courses/${course._id}`);
                          }}
                          className="btn-primary text-[10px] font-black py-1.5 px-3 rounded-xl"
                        >
                          Enroll Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PROMO BANNER ── */}
          <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">New Power Courses Added Every Week!</h4>
                <p className="text-slate-500 text-xs mt-0.5">Stay tuned and don't miss our upcoming high-impact challenges.</p>
              </div>
            </div>
            <button className="btn-outline text-xs py-2 font-bold shrink-0">
              View Upcoming Courses <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
