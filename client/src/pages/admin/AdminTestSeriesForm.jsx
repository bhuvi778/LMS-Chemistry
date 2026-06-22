import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Layers,
  Clock,
  CheckCircle,
  Upload,
  FileText,
} from 'lucide-react';

export default function AdminTestSeriesForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = !!id && id !== 'new';

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: 'Chemistry',
    examTags: [],
    isFree: false,
    isPublished: true,
    price: 0,
    mrp: 0,
    discountCoupons: [],
    discountCoupon: { code: '', discountType: 'percent', discountValue: 0, isActive: false }, // legacy
    tests: [],
    syllabusText: '',
    syllabusFileUrl: '',
    validity: { type: 'lifetime', durationValue: 12, durationUnit: 'months', endDate: '' },
  });
  const [syllabusUploading, setSyllabusUploading] = useState(false);

  const [allTests, setAllTests] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [testTagInputs, setTestTagInputs] = useState({});

  useEffect(() => {
    api.get('/tests/admin/tests').then(({ data }) => setAllTests(data));
    api.get('/categories').then(({ data }) => setAllCategories(Array.isArray(data) ? data : [])).catch(() => {});
    if (isEdit) {
      api.get(`/tests/admin/series/${id}`)
        .then(({ data }) => {
          setForm({
            ...data,
            price: data.price || 0,
            mrp: data.mrp || 0,
            discountCoupon: data.discountCoupon || { code: '', discountType: 'percent', discountValue: 0, isActive: false },
            // Migrate legacy single coupon to new array
            discountCoupons: Array.isArray(data.discountCoupons) && data.discountCoupons.length > 0
              ? data.discountCoupons
              : (data.discountCoupon?.code ? [{ ...data.discountCoupon }] : []),
            tests: (data.tests || []).map((t) => ({
              ...t,
              test: t.test?._id || t.test,
              testData: t.test,
              mainType: t.mainType || 'mock',
              subType: t.subType || 'full_test',
              customTags: t.customTags || [],
            })),
            validity: data.validity || { type: 'lifetime', durationValue: 12, durationUnit: 'months', endDate: '' },
          });
        })
        .catch((err) => toast.error(err.message));
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (k, sk, v) => setForm((f) => ({ ...f, [k]: { ...(f[k] || {}), [sk]: v } }));

  const addTag = () => {
    const t = tagInput.trim().toUpperCase();
    if (!t || (form.examTags || []).includes(t)) return;
    setForm((f) => ({ ...f, examTags: [...(f.examTags || []), t] }));
    setTagInput('');
  };

  const assignedIds = new Set((form.tests || []).map((t) => t.test?.toString()));

  const addTest = (t) => {
    if (assignedIds.has(t._id)) return;
    setForm((f) => ({
      ...f,
      tests: [...f.tests, { test: t._id, testData: t, order: f.tests.length, mainType: 'mock', subType: 'full_test', customTags: [] }],
    }));
  };

  const removeTest = (idx) =>
    setForm((f) => ({ ...f, tests: f.tests.filter((_, i) => i !== idx) }));

  const moveTest = (idx, dir) => {
    setForm((f) => {
      const ts = [...f.tests];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= ts.length) return f;
      [ts[idx], ts[swapIdx]] = [ts[swapIdx], ts[idx]];
      return { ...f, tests: ts.map((t, i) => ({ ...t, order: i })) };
    });
  };

  const updateTestField = (idx, key, val) => {
    setForm((f) => {
      const ts = [...f.tests];
      ts[idx] = { ...ts[idx], [key]: val };
      return { ...f, tests: ts };
    });
  };

  const addTagToTest = (idx) => {
    const val = (testTagInputs[idx] || '').trim();
    if (!val) return;
    const current = form.tests[idx]?.customTags || [];
    if (!current.includes(val)) updateTestField(idx, 'customTags', [...current, val]);
    setTestTagInputs((p) => ({ ...p, [idx]: '' }));
  };

  const removeTagFromTest = (idx, tag) => {
    updateTestField(idx, 'customTags', (form.tests[idx]?.customTags || []).filter((t) => t !== tag));
  };

  const filteredTests = allTests.filter(
    (t) =>
      !assignedIds.has(t._id) &&
      (!searchQ || t.title.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tests: form.tests.map(({ testData, ...t }, i) => ({ ...t, order: i })),
      };
      if (isEdit) {
        await api.put(`/tests/admin/series/${id}`, payload);
        toast.success('Test series updated');
      } else {
        await api.post('/tests/admin/series', payload);
        toast.success('Test series created');
      }
      nav('/admin/test-series');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const DIFFICULTY_COLORS = {
    basic: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/test-series" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Test Series' : 'New Test Series'}</h1>
          <p className="text-sm text-slate-500">Bundle tests together and assign to courses</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? 'Update Series' : 'Create Series'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Series Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">SERIES TITLE *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              placeholder="e.g. JEE Mains Full Mock Test Series"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">SUBJECT</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">EXAM TAGS</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="JEE / NEET…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.examTags || []).map((t, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                  {t}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, examTags: f.examTags.filter((_, j) => j !== i) }))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          {/* Categories */}
          {allCategories.length > 0 && (
            <div className="col-span-2 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">CATEGORIES</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => {
                    const active = (form.categories || []).includes(cat.name);
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? (form.categories || []).filter((c) => c !== cat.name)
                            : [...(form.categories || []), cat.name];
                          const validSubcats = allCategories
                            .filter((c) => next.includes(c.name))
                            .flatMap((c) => c.subcategories || []);
                          set('categories', next);
                          set('subCategories', (form.subCategories || []).filter((s) => validSubcats.includes(s)));
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
                          active
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Sub-categories */}
              {(() => {
                const subcats = allCategories
                  .filter((c) => (form.categories || []).includes(c.name))
                  .flatMap((c) => c.subcategories || []);
                if (!subcats.length) return null;
                return (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">SUB-CATEGORIES</label>
                    <div className="flex flex-wrap gap-2">
                      {subcats.map((sc) => {
                        const active = (form.subCategories || []).includes(sc);
                        return (
                          <button
                            key={sc}
                            type="button"
                            onClick={() =>
                              set(
                                'subCategories',
                                active
                                  ? (form.subCategories || []).filter((s) => s !== sc)
                                  : [...(form.subCategories || []), sc]
                              )
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                              active
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                            }`}
                          >
                            {sc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">DESCRIPTION</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} className="w-4 h-4 rounded accent-emerald-500" />
            <span className="text-sm font-medium text-slate-700">Free Series</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm font-medium text-slate-700">Published</span>
          </label>
        </div>

        {/* Pricing (only if not free) */}
        {!form.isFree && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pricing (INR)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">INR</span>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg pl-12 pr-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                    value={form.price}
                    onChange={(e) => set('price', Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">MRP (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">INR</span>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg pl-12 pr-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                    value={form.mrp}
                    onChange={(e) => set('mrp', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            {/* Discount Coupons (multiple) */}
            <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-slate-700">Discount Coupons</label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    discountCoupons: [...(f.discountCoupons || []), { code: '', discountType: 'percent', discountValue: 0, isActive: true }],
                  }))}
                  className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition"
                >
                  <Plus size={12} /> Add Coupon
                </button>
              </div>
              {(!form.discountCoupons || form.discountCoupons.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-2">No coupons yet. Click "Add Coupon" to create one.</p>
              )}
              {(form.discountCoupons || []).map((coupon, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Coupon #{i + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={coupon.isActive}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            discountCoupons: f.discountCoupons.map((c, idx) =>
                              idx === i ? { ...c, isActive: e.target.checked } : c
                            ),
                          }))}
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({
                          ...f,
                          discountCoupons: f.discountCoupons.filter((_, idx) => idx !== i),
                        }))}
                        className="text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                    placeholder="Coupon code (e.g. SAVE20)"
                    value={coupon.code}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      discountCoupons: f.discountCoupons.map((c, idx) =>
                        idx === i ? { ...c, code: e.target.value.toUpperCase() } : c
                      ),
                    }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      value={coupon.discountType}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        discountCoupons: f.discountCoupons.map((c, idx) =>
                          idx === i ? { ...c, discountType: e.target.value } : c
                        ),
                      }))}
                    >
                      <option value="percent">% Percent</option>
                      <option value="amount">INR Amount</option>
                    </select>
                    <input
                      type="number"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      placeholder="Value"
                      value={coupon.discountValue}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        discountCoupons: f.discountCoupons.map((c, idx) =>
                          idx === i ? { ...c, discountValue: Number(e.target.value) } : c
                        ),
                      }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Test Series Validity */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Test Series Validity</h2>
        <div className="grid grid-cols-3 gap-2">
          {['lifetime', 'duration', 'endDate'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setNested('validity', 'type', t)}
              className={`py-2 px-2 rounded-lg text-xs font-semibold border transition text-center ${
                form.validity?.type === t
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'
              }`}
            >
              {t === 'lifetime' ? '♾ Lifetime' : t === 'duration' ? '📅 Duration' : '🗓 End Date'}
            </button>
          ))}
        </div>
        {form.validity?.type === 'duration' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              min={1}
              placeholder="Number"
              value={form.validity?.durationValue || 12}
              onChange={(e) => setNested('validity', 'durationValue', Number(e.target.value))}
            />
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 bg-white"
              value={form.validity?.durationUnit || 'months'}
              onChange={(e) => setNested('validity', 'durationUnit', e.target.value)}
            >
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        )}
        {form.validity?.type === 'endDate' && (
          <input
            type="date"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
            value={form.validity?.endDate ? form.validity.endDate.split('T')[0] : ''}
            onChange={(e) => setNested('validity', 'endDate', e.target.value)}
          />
        )}
        {form.validity?.type === 'lifetime' && (
          <p className="text-xs text-emerald-600 font-semibold">♾ Students get lifetime access to this test series.</p>
        )}
      </div>

      {/* Schedule Section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Test Schedule</h2>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-2 block">SCHEDULE PDF (Upload)</label>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition ${
              syllabusUploading ? 'opacity-50 pointer-events-none border-slate-200 text-slate-400' : 'border-brand-300 text-brand-700 hover:bg-brand-50'
            }`}>
              {syllabusUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {syllabusUploading ? 'Uploading…' : form.syllabusFileUrl ? 'Replace PDF' : 'Upload Schedule PDF'}
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                disabled={syllabusUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSyllabusUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const { data } = await api.post('/upload/pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    set('syllabusFileUrl', data.url);
                    toast.success('Schedule PDF uploaded');
                  } catch {
                    toast.error('Upload failed');
                  } finally {
                    setSyllabusUploading(false);
                  }
                }}
              />
            </label>
            {form.syllabusFileUrl && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <FileText size={14} />
                <a href={form.syllabusFileUrl} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-xs">
                  {form.syllabusFileUrl.split('/').pop()}
                </a>
                <button type="button" onClick={() => set('syllabusFileUrl', '')} className="text-rose-500 hover:text-rose-700">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Assignment */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Test bank */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm">Test Bank — click to add</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
              placeholder="Search tests…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTests.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">All tests assigned</div>
            )}
            {filteredTests.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => addTest(t)}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{t.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${DIFFICULTY_COLORS[t.difficulty] || 'bg-slate-100 text-slate-500'}`}>
                        {t.difficulty}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-slate-400">
                        <Clock size={10} /> {t.durationMins}m
                      </span>
                    </div>
                  </div>
                  <Plus size={16} className="text-slate-300 group-hover:text-brand-500 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Assigned tests */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div>
            <h2 className="font-semibold text-slate-700 text-sm">Assigned Tests ({form.tests.length})</h2>
            <p className="text-xs text-slate-400">Set type, sub-type and custom tags per test</p>
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto">
            {form.tests.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                Add tests from the left panel
              </div>
            )}
            {form.tests.map((t, idx) => {
              const data = t.testData || allTests.find((a) => a._id === t.test);
              return (
                <div key={`${t.test}-${idx}`} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  {/* Title row */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button type="button" disabled={idx === 0} onClick={() => moveTest(idx, -1)} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronUp size={12} /></button>
                      <button type="button" disabled={idx === form.tests.length - 1} onClick={() => moveTest(idx, 1)} className="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronDown size={12} /></button>
                    </div>
                    <GripVertical size={14} className="text-slate-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{idx + 1}. {data?.title || 'Unknown test'}</div>
                      {data && <div className="text-xs text-slate-400 mt-0.5">{data.durationMins}m · {data.questions?.length || 0} Qs</div>}
                    </div>
                    <button type="button" onClick={() => removeTest(idx)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 flex-shrink-0"><X size={13} /></button>
                  </div>
                  {/* Main type */}
                  <div className="flex gap-1">
                    {[['mock', 'Mock'], ['previous_year', 'Prev. Year']].map(([v, l]) => (
                      <button
                        key={v} type="button"
                        onClick={() => updateTestField(idx, 'mainType', v)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${t.mainType === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'}`}
                      >{l}</button>
                    ))}
                  </div>
                  {/* Sub type */}
                  <div className="flex flex-wrap gap-1">
                    {[['full_test', 'Full Test'], ['sectional', 'Sectional'], ['chapter', 'Chapter'], ['other', 'Other']].map(([v, l]) => (
                      <button
                        key={v} type="button"
                        onClick={() => updateTestField(idx, 'subType', v)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${t.subType === v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300'}`}
                      >{l}</button>
                    ))}
                  </div>
                  {/* Custom tags */}
                  <div>
                    <div className="flex gap-1">
                      <input
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand-400"
                        placeholder="Add tag…"
                        value={testTagInputs[idx] || ''}
                        onChange={(e) => setTestTagInputs((p) => ({ ...p, [idx]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTagToTest(idx))}
                      />
                      <button type="button" onClick={() => addTagToTest(idx)} className="px-2 py-1 bg-slate-100 rounded-lg text-xs hover:bg-slate-200">+</button>
                    </div>
                    {(t.customTags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(t.customTags || []).map((tag) => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                            {tag}
                            <button type="button" onClick={() => removeTagFromTest(idx, tag)}><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link to="/admin/test-series" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? 'Update Series' : 'Create Series'}
        </button>
      </div>
    </form>
  );
}
