import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, CalendarDays, Star, FileText, ClipboardList, Target, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseCard({ course }) {
  const discount =
    course.mrp && course.mrp > course.price
      ? Math.round(((course.mrp - course.price) / course.mrp) * 100)
      : 0;

  const displayCategory = course.categories?.[0] || course.category || '';

  const validityText = () => {
    const v = course.validity;
    if (v?.type === 'lifetime') return 'Lifetime';
    if (v?.type === 'duration') return `${v.durationValue} ${v.durationUnit}`;
    if (v?.type === 'endDate' && v.endDate) return `Until ${new Date(v.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    if (course.durationMonths) return `${course.durationMonths} months`;
    return 'Lifetime';
  };
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <Link
      to={`/courses/${course.slug || course._id}`}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={course.thumbnail || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-white/95 text-brand-700 text-xs font-bold shadow-sm">
            {displayCategory}
          </span>
          {course.isCombo && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-sm">
              COMBO
            </span>
          )}
          {course.courseType === 'live' ? (
            <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-slate-700/80 text-white text-xs font-bold shadow-sm">
              RECORDED
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {discount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-brand-500 to-violet2-500 text-white text-xs font-black shadow">
              {discount}% OFF
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/courses/${course.slug || course._id}`;
              navigator.clipboard.writeText(url);
              toast.success('Course link copied to clipboard!');
            }}
            className="p-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-brand-600 transition shadow-sm flex items-center justify-center"
            title="Share Course"
          >
            <Share2 size={13} />
          </button>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-slate-900 leading-snug line-clamp-2 text-base">
          {course.title}
        </h3>
        {(course.subCategories?.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {course.subCategories.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100">
                {s}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{course.shortDescription}</p>

        {course.isCombo && course.comboDescription && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 font-semibold flex items-center gap-1">
            <span>🎁</span>
            <span className="truncate">{course.comboDescription}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3.5 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Clock size={13} /> {validityText()}</span>
          <span className="flex items-center gap-1"><BookOpen size={13} /> Lectures</span>
          <span className="flex items-center gap-1 text-[#4f46e5]/90 font-medium"><FileText size={13} /> Notes</span>
          <span className="flex items-center gap-1 text-[#7c3aed]/90 font-medium"><ClipboardList size={13} /> Tests</span>
          <span className="flex items-center gap-1 text-[#10b981]/90 font-medium"><Target size={13} /> DPPs</span>
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <Star size={13} fill="currentColor" /> {course.rating || 4.8}
          </span>
        </div>
        {(course.startDate || course.endDate) && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-brand-600 font-semibold">
            <CalendarDays size={13} />
            {fmtDate(course.startDate) && <span>{fmtDate(course.startDate)}</span>}
            {fmtDate(course.startDate) && fmtDate(course.endDate) && <span className="text-slate-300">→</span>}
            {fmtDate(course.endDate) && <span>{fmtDate(course.endDate)}</span>}
          </div>
        )}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-slate-900">
              ₹{course.price?.toLocaleString()}
            </div>
            {course.mrp > course.price && (
              <div className="text-xs text-slate-400 line-through">₹{course.mrp?.toLocaleString()}</div>
            )}
          </div>
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet2-500 text-white text-xs font-bold group-hover:shadow-soft transition-all">
            View Details <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
