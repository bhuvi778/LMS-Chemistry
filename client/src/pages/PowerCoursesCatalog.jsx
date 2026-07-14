import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  IndianRupee,
  Search,
  Target,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PowerCoursesCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'ALL';
  const categoryFilter = searchParams.get('category') || 'ALL';
  const subCategoryFilter = searchParams.get('sub') || 'ALL';
  const sortBy = searchParams.get('sort') || 'popular';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses?isPowerCourse=true');
        setCourses(data || []);
      } catch (err) {
        toast.error('Failed to load Power Batch catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const getCourseCategories = (course) => {
    const values = [...(course.categories || []), course.category].filter(Boolean);
    return Array.from(new Set(values));
  };

  const getCourseSubCategories = (course) => Array.from(new Set((course.subCategories || []).filter(Boolean)));

  const categoryOptions = useMemo(
    () => Array.from(new Set(courses.flatMap(getCourseCategories))).sort(),
    [courses]
  );

  const subCategoryOptions = useMemo(() => {
    const scoped = categoryFilter === 'ALL'
      ? courses
      : courses.filter((course) => getCourseCategories(course).includes(categoryFilter));
    return Array.from(new Set(scoped.flatMap(getCourseSubCategories))).sort();
  }, [courses, categoryFilter]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          getCourseCategories(c).some((cat) => cat.toLowerCase().includes(q)) ||
          getCourseSubCategories(c).some((sub) => sub.toLowerCase().includes(q)) ||
          c.shortDescription?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'ALL') {
      result = result.filter((c) => c.powerCourseType === typeFilter);
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter((c) => getCourseCategories(c).includes(categoryFilter));
    }

    if (subCategoryFilter !== 'ALL') {
      result = result.filter((c) => getCourseSubCategories(c).includes(subCategoryFilter));
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'duration') {
      result.sort((a, b) => (a.powerCourseDuration || 0) - (b.powerCourseDuration || 0));
    }

    return result;
  }, [courses, searchQuery, typeFilter, categoryFilter, subCategoryFilter, sortBy]);

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    const isDefault =
      (key === 'type' && val === 'ALL') ||
      (key === 'category' && val === 'ALL') ||
      (key === 'sub' && val === 'ALL') ||
      (key === 'sort' && val === 'popular');
    if (val && !isDefault) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    if (key === 'category') next.delete('sub');
    setSearchParams(next);
  };

  const typeMeta = (type) => {
    switch (type) {
      case 'micro':
        return { label: 'Micro Batch', style: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'mini':
        return { label: 'Mini Batch', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'crash':
        return { label: 'Crash Course', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Target', style: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getScheduleWindow = (course) => {
    const dailyDates = (course.dailyPlan || [])
      .map((day) => day.unlockDate)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (dailyDates.length) {
      return { start: dailyDates[0], end: dailyDates[dailyDates.length - 1], source: 'daily' };
    }

    if (course.startDate || course.endDate) {
      return { start: course.startDate ? new Date(course.startDate) : null, end: course.endDate ? new Date(course.endDate) : null, source: 'course' };
    }

    return null;
  };

  const getClassCounts = (course) => {
    const recorded = (course.dailyPlan || []).filter((day) => day.videoUrl).length;
    const live = (course.dailyPlan || []).filter((day) => day.liveClassId).length;
    return { recorded, live, total: recorded + live };
  };

  const getPrimaryClassMeta = (classCounts) => (
    classCounts.live > 0
      ? { label: 'Live', count: classCounts.live, configuredText: `${classCounts.live} live classes configured` }
      : { label: 'Recorded', count: classCounts.recorded, configuredText: `${classCounts.recorded} recorded classes configured` }
  );

  const hasCalendar = (course) => !!getScheduleWindow(course);
  const minPrice = courses.length ? Math.min(...courses.map((c) => c.price || 29)) : 29;
  const activeCount = courses.length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-3 font-semibold">Loading Power Batch...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f8fb] pb-16">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-x py-8 md:py-12">
          <div className="grid lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 items-stretch">
            <div className="rounded-[28px] bg-slate-950 text-white p-6 md:p-9 overflow-hidden relative">
              <div className="relative z-10 max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-200">
                  <Zap size={13} /> Power Batch
                </div>
                <div>
                  <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[0.98]">
                    Quick chemistry wins, one target at a time.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-slate-300">
                    Short, focused batches for targets, PYQs, practice and class execution. Start flexible or follow date-wise daily plans.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Daily targets', 'Live / recorded classes', 'Date-wise unlock', `From ₹${minPrice || 29}`].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-200">
                      <CheckCircle2 size={12} className="text-emerald-300" /> {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-32 bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.14))]" />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-black text-slate-400">Find a batch</p>
                    <h2 className="font-display text-2xl font-black text-slate-900">Choose your target</h2>
                  </div>
                  <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search chapter, exam, batch..."
                    value={searchQuery}
                    onChange={(e) => updateParam('q', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                  <div className="text-xl font-black text-slate-900">{activeCount}</div>
                  <div className="text-[10px] font-bold text-slate-500">Active batches</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                  <div className="text-xl font-black text-emerald-700">₹{minPrice || 29}</div>
                  <div className="text-[10px] font-bold text-emerald-800/70">Starting</div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                  <div className="text-xl font-black text-amber-800">1x</div>
                  <div className="text-[10px] font-bold text-amber-800/70">Daily focus</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x mt-7 space-y-6">
        <div className="rounded-[24px] border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { k: 'ALL', l: 'All Batch' },
                { k: 'micro', l: 'Micro Batch' },
                { k: 'mini', l: 'Mini Batch' },
                { k: 'crash', l: 'Crash Course' },
              ].map((tab) => (
                <button
                  key={tab.k}
                  onClick={() => updateParam('type', tab.k)}
                  className={`shrink-0 rounded-2xl border px-4 py-2.5 text-xs font-black transition ${
                    typeFilter === tab.k
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-650 hover:bg-white'
                  }`}
                >
                  {tab.l}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="hidden sm:inline-flex items-center gap-1 text-slate-500 text-xs font-bold">
                <Filter size={13} /> Sort
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-500"
              >
                <option value="ALL">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={subCategoryFilter}
                onChange={(e) => updateParam('sub', e.target.value)}
                className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-500"
              >
                <option value="ALL">All sub-categories</option>
                {subCategoryOptions.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>{subCategory}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-slate-500"
              >
                <option value="popular">Popular first</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
                <option value="duration">Shortest duration</option>
              </select>
            </div>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white py-16 text-center">
            <Calendar className="text-slate-350 mx-auto" size={42} />
            <p className="mt-4 text-sm font-black text-slate-800">No Power Batch matched your search</p>
            <p className="mt-1 text-xs font-semibold text-slate-450">Try another chapter name or reset filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCourses.map((course) => {
              const duration = course.powerCourseDuration || 7;
              const classCounts = getClassCounts(course);
              const classMode = getPrimaryClassMeta(classCounts);
              const discPercent = course.mrp && course.mrp > course.price ? Math.round(((course.mrp - course.price) / course.mrp) * 100) : 0;
              const calendarMode = hasCalendar(course);
              const scheduleWindow = getScheduleWindow(course);
              const badge = typeMeta(course.powerCourseType);
              const categories = getCourseCategories(course);
              const subCategories = getCourseSubCategories(course);

              return (
                <article
                  key={course._id}
                  onClick={() => navigate(`/power-batch/${course._id}`)}
                  className="group cursor-pointer overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="h-full w-full bg-[linear-gradient(135deg,#e0f2fe,#eef2ff_48%,#fef3c7)] flex items-center justify-center">
                        <BookOpen size={42} className="text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${badge.style}`}>
                        {badge.label}
                      </span>
                      <span className="rounded-full border border-white/20 bg-slate-950/60 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                        {calendarMode ? 'Calendar' : 'Flexible'}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-white/70">Power Batch</p>
                        <h3 className="line-clamp-2 text-lg font-black leading-tight text-white">
                          {course.title}
                        </h3>
                      </div>
                      <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-lg">
                        <span className="block text-[9px] font-black uppercase text-slate-400">Starts</span>
                        <span className="inline-flex items-center text-lg font-black text-slate-950">
                          <IndianRupee size={14} />{course.price || 29}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="line-clamp-2 min-h-[40px] text-xs font-semibold leading-relaxed text-slate-500">
                      {course.shortDescription || `Focused day-wise target plan with ${classMode.label.toLowerCase()} classes, notes, practice, and assignments.`}
                    </p>

                    {(categories.length > 0 || subCategories.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {categories.slice(0, 2).map((category) => (
                          <span key={category} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-[9px] font-black text-indigo-700">
                            {category}
                          </span>
                        ))}
                        {subCategories.slice(0, 2).map((subCategory) => (
                          <span key={subCategory} className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">
                            {subCategory}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <Clock size={14} className="text-slate-500" />
                        <div className="mt-1 text-xs font-black text-slate-800">{duration}d</div>
                        <div className="text-[9px] font-bold text-slate-400">Duration</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <BookOpen size={14} className="text-slate-500" />
                        <div className="mt-1 text-xs font-black text-slate-800">{classMode.count}</div>
                        <div className="text-[9px] font-bold text-slate-400">{classMode.label}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <Target size={14} className="text-slate-500" />
                        <div className="mt-1 text-xs font-black text-slate-800">{classCounts.total}</div>
                        <div className="text-[9px] font-bold text-slate-400">Classes</div>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-3 ${calendarMode ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <Calendar size={14} className={calendarMode ? 'text-emerald-700' : 'text-amber-700'} />
                        {calendarMode ? 'Fixed calendar window' : 'Start after purchase'}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {calendarMode
                          ? `${scheduleWindow?.start ? formatDate(scheduleWindow.start) : 'Open'} - ${scheduleWindow?.end ? formatDate(scheduleWindow.end) : 'Complete'}`
                          : 'Follow targets sequentially at your own start date.'}
                      </p>
                      {classMode.count > 0 && (
                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          {classMode.configuredText}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center text-xl font-black text-slate-950">
                          <IndianRupee size={16} />{course.price || 29}
                        </span>
                        {course.mrp > course.price && (
                          <span className="text-xs line-through text-slate-400">₹{course.mrp.toLocaleString()}</span>
                        )}
                        {discPercent > 0 && (
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            {discPercent}% off
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/power-batch/${course._id}`);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
                        aria-label={`View ${course.title}`}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
              <Target size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">Pick by your goal</h4>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Choose shorter batches for quick revision, or calendar batches when you want fixed day-wise targets.
              </p>
            </div>
          </div>
          <button onClick={() => updateParam('sort', 'duration')} className="btn-outline justify-center text-xs font-bold">
            Show shortest first <ChevronRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
