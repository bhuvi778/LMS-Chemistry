import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Tag,
  Plus,
  Trash2,
  Save,
  Search,
  BookOpen,
  Layers,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ─── Blank coupon template ────────────────────────────────────────────────────
const blankCoupon = () => ({ code: '', discountType: 'percent', discountValue: 0, isActive: true, maxUses: 0, maxUsesPerUser: 0 });

// ─── Single item card ─────────────────────────────────────────────────────────
function ItemCouponCard({ item, type, onSaved }) {
  const [coupons, setCoupons] = useState(() => {
    const base = Array.isArray(item.discountCoupons) ? item.discountCoupons : [];
    // migrate legacy
    if (base.length === 0 && item.discountCoupon?.code) {
      return [{ ...item.discountCoupon }];
    }
    return base;
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateCoupon = (i, field, val) => {
    setCoupons((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: val } : c))
    );
    setDirty(true);
  };

  const addCoupon = () => {
    setCoupons((prev) => [...prev, blankCoupon()]);
    setDirty(true);
  };

  const removeCoupon = (i) => {
    setCoupons((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const save = useCallback(async () => {
    // Basic validation
    for (const c of coupons) {
      if (c.code && !c.code.trim()) {
        toast.error('Coupon code cannot be blank');
        return;
      }
    }
    // Remove coupons with empty code before saving
    const toSave = coupons.filter((c) => c.code.trim() !== '');
    setSaving(true);
    try {
      const endpoint =
        type === 'course'
          ? `/courses/${item._id}`
          : `/tests/admin/series/${item._id}`;
      await api.put(endpoint, { discountCoupons: toSave });
      setCoupons(toSave);
      setDirty(false);
      toast.success(`Coupons saved for "${item.title}"`);
      onSaved?.(item._id, toSave);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [coupons, item._id, item.title, type, onSaved]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            {type === 'course' ? (
              <BookOpen size={20} className="text-brand-600" />
            ) : (
              <Layers size={20} className="text-brand-600" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 text-sm truncate">{item.title}</div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>₹{item.price?.toLocaleString() ?? 0}</span>
            <span className="text-slate-300">•</span>
            <span>
              {coupons.length === 0
                ? 'No coupons'
                : `${coupons.filter((c) => c.isActive && c.code).length} active`}{' '}
              / {coupons.filter((c) => c.code).length} total
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={addCoupon}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 transition"
          >
            <Plus size={13} /> Add Coupon
          </button>
          {dirty && (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Save
            </button>
          )}
        </div>
      </div>

      {/* Coupon list */}
      <div className="px-5 py-4 space-y-3">
        {coupons.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">
            No coupons yet. Click "Add Coupon" to create one.
          </p>
        )}
        {coupons.length > 0 && (
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1.2fr_72px_auto] gap-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
            <div>Coupon Code</div>
            <div>Discount Type</div>
            <div className="text-right">Value</div>
            <div className="text-center">Global Limit</div>
            <div className="text-center">Limit per User</div>
            <div className="text-center">Status</div>
            <div></div>
          </div>
        )}
        {coupons.map((coupon, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1.2fr_72px_auto] gap-2 items-center p-3 rounded-xl border transition ${
              coupon.isActive && coupon.code
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-slate-100 bg-slate-50'
            }`}
          >
            {/* Code */}
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-brand-400 bg-white w-full"
              placeholder="Code (e.g. SAVE20)"
              value={coupon.code}
              onChange={(e) => updateCoupon(i, 'code', e.target.value.toUpperCase())}
            />
            {/* Type */}
            <select
              className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400 bg-white w-full"
              value={coupon.discountType}
              onChange={(e) => updateCoupon(i, 'discountType', e.target.value)}
            >
              <option value="percent">% Percent</option>
              <option value="amount">INR Amount</option>
            </select>
            {/* Value */}
            <input
              type="number"
              min="0"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-brand-400 bg-white w-full"
              placeholder="Value"
              value={coupon.discountValue}
              onChange={(e) => updateCoupon(i, 'discountValue', Number(e.target.value))}
            />
            {/* Max Uses Global */}
            <input
              type="number"
              min="0"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-brand-400 bg-white w-full font-semibold"
              placeholder="0 (Unlimited)"
              value={coupon.maxUses || ''}
              onChange={(e) => updateCoupon(i, 'maxUses', e.target.value === '' ? 0 : Number(e.target.value))}
              title="Global usage limit (0 = unlimited)"
            />
            {/* Max Uses Per User */}
            <input
              type="number"
              min="0"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-brand-400 bg-white w-full font-semibold"
              placeholder="0 (Unlimited)"
              value={coupon.maxUsesPerUser || ''}
              onChange={(e) => updateCoupon(i, 'maxUsesPerUser', e.target.value === '' ? 0 : Number(e.target.value))}
              title="Usage limit per student (0 = unlimited, e.g. 1)"
            />
            {/* Active toggle */}
            <button
              type="button"
              onClick={() => updateCoupon(i, 'isActive', !coupon.isActive)}
              className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold border transition w-full ${
                coupon.isActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
              title={coupon.isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
            >
              {coupon.isActive ? (
                <CheckCircle size={14} />
              ) : (
                <XCircle size={14} />
              )}
              {coupon.isActive ? 'ON' : 'OFF'}
            </button>
            {/* Delete */}
            <button
              type="button"
              onClick={() => removeCoupon(i)}
              className="text-red-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {/* Preview row for active coupons */}
        {coupons.filter((c) => c.isActive && c.code).length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1.5 font-medium">Students will see:</p>
            <div className="flex flex-wrap gap-1.5">
              {coupons
                .filter((c) => c.isActive && c.code)
                .map((c, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-700"
                  >
                    <Tag size={11} />
                    {c.code}
                    <span className="font-normal text-amber-500">
                      — {c.discountType === 'percent'
                        ? `${c.discountValue}% off`
                        : `₹${c.discountValue} off`}
                    </span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminCoupons() {
  const [tab, setTab] = useState('courses');
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/courses?includeUnpublished=true'),
      api.get('/tests/admin/series'),
    ])
      .then(([c, s]) => {
        setCourses(c.data || []);
        setSeries(s.data || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (tab === 'courses' ? courses : series).filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tag size={22} className="text-amber-500" /> Coupon Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Add and manage discount coupons for courses and test series.
          </p>
        </div>
      </div>

      {/* Tab + Search bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <button
            onClick={() => setTab('courses')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === 'courses'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={15} /> Courses
            {courses.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'courses' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {courses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('series')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition border-l border-slate-200 ${
              tab === 'series'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers size={15} /> Test Series
            {series.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'series' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {series.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm"
            placeholder={`Search ${tab === 'courses' ? 'courses' : 'test series'}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No {tab === 'courses' ? 'courses' : 'test series'} found</p>
          {search && (
            <p className="text-sm mt-1">
              Try clearing the search filter.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <ItemCouponCard
              key={item._id}
              item={item}
              type={tab === 'courses' ? 'course' : 'series'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
