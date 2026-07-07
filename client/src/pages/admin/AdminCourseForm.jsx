import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';

const empty = {
  title: '',
  categories: [],
  subCategories: [],
  language: 'Hindi + English',
  thumbnail: '',
  shortDescription: '',
  description: '',
  price: 0,
  mrp: 0,
  plans: {
    batch: { enabled: true, price: 0, mrp: 0 },
    pro: { enabled: true, price: 0, mrp: 0 },
    infinity: { enabled: true, price: 0, mrp: 0, seatsLimit: 10, seatsReserved: 0, courses: [], testSeries: [] }
  },
  validity: { type: 'lifetime', durationValue: 12, durationUnit: 'months', endDate: '' },
  startDate: '',
  endDate: '',
  instructor: 'Ace2Examz Faculty',
  rating: 4.8,
  educator: { photo: '', bio: '' },
  highlights: [],
  syllabus: [],
  faqs: [],
  courseType: 'recorded',
  isPublished: true,
  isFeatured: false,
  discountCoupons: [],
  discountCoupon: { code: '', discountType: 'percent', discountValue: 0, isActive: false }, // legacy
  isCombo: false,
  isFree: false,
  comboDescription: '',
  comboCourses: [],
  comboTestSeries: [],
  allowExtendValidity: false,
  allowFreeze: false,
  extendValidityPrice: 0,
  extendValidityDurationValue: 1,
  extendValidityDurationUnit: 'months',
  upsell: { enabled: false, title: '', courseId: '', testSeriesId: '', targetType: 'course' },
  seo: { metaTitle: '', metaDescription: '' },
  timetable: [],
  demoVideoUrl: '',
  orientationVideoUrl: '',
  telegramJoinLink: '',
  batchInformation: '',
  isAdmissionClosed: false,
};

export default function AdminCourseForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get('duplicateFrom');
  const [categories, setCategories] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allTestSeries, setAllTestSeries] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [educatorImgUploading, setEducatorImgUploading] = useState(false);
  const [syllabusPdfUploading, setSyllabusPdfUploading] = useState({});
  const [batchInfoUploading, setBatchInfoUploading] = useState(false);
  const edit = !!id;

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    api.get('/courses?includeUnpublished=true').then((r) => setAllCourses(r.data)).catch(() => {});
    api.get('/tests/admin/series').then((r) => setAllTestSeries(r.data)).catch(() => {});
    
    const targetId = id || duplicateFrom;
    if (targetId) {
      api.get(`/courses/${targetId}`).then((r) => {
        const d = { ...r.data };
        
        // If duplicating, remove unique fields
        if (duplicateFrom) {
          delete d._id;
          delete d.slug;
          delete d.createdAt;
          delete d.updatedAt;
          d.title = `${d.title} (Copy)`;
        }

        // Migrate legacy single category to array
        if (!d.categories?.length && d.category) d.categories = [d.category];
        if (!d.validity?.type) d.validity = { type: 'lifetime', durationValue: d.durationMonths || 12, durationUnit: 'months', endDate: '' };
        if (!d.discountCoupon) d.discountCoupon = empty.discountCoupon;
        // Migrate legacy single coupon to new array if needed
        if (!d.discountCoupons || !Array.isArray(d.discountCoupons)) d.discountCoupons = [];
        if (d.discountCoupons.length === 0 && d.discountCoupon?.code) {
          d.discountCoupons = [{ ...d.discountCoupon }];
        }
        if (!d.upsell) d.upsell = empty.upsell;
        if (!d.upsell.targetType) d.upsell.targetType = 'course';
        if (!d.upsell.testSeriesId) d.upsell.testSeriesId = '';
        if (!d.seo) d.seo = empty.seo;
        if (!d.faqs) d.faqs = [];
        if (!d.timetable) d.timetable = [];
        if (!d.educator) d.educator = { photo: '', bio: '' };
        // Migrate legacy syllabus string[] → { title, description }[]
        if (Array.isArray(d.syllabus) && d.syllabus.length > 0 && typeof d.syllabus[0] === 'string') {
          d.syllabus = d.syllabus.map((s) => ({ title: s, description: '' }));
        }
        if (d.isFree === undefined) d.isFree = false;
        if (!d.comboCourses) {
          d.comboCourses = [];
        } else if (Array.isArray(d.comboCourses)) {
          d.comboCourses = d.comboCourses.map((cc) => (typeof cc === 'object' && cc !== null ? cc._id : cc));
        }
        if (!d.comboTestSeries) {
          d.comboTestSeries = [];
        } else if (Array.isArray(d.comboTestSeries)) {
          d.comboTestSeries = d.comboTestSeries.map((ts) => (typeof ts === 'object' && ts !== null ? ts._id : ts));
        }
        if (d.isCombo === undefined) d.isCombo = false;
        if (d.allowExtendValidity === undefined) d.allowExtendValidity = false;
        if (d.allowFreeze === undefined) d.allowFreeze = false;
        if (d.extendValidityPrice === undefined) d.extendValidityPrice = 0;
        if (d.extendValidityDurationValue === undefined) d.extendValidityDurationValue = 1;
        if (d.extendValidityDurationUnit === undefined) d.extendValidityDurationUnit = 'months';
        
        // Ensure plans are initialized
        if (!d.plans) {
          d.plans = {
            batch: { enabled: true, price: d.price || 0, mrp: d.mrp || 0 },
            pro: { enabled: true, price: Math.round((d.price || 0) * 1.25), mrp: Math.round((d.mrp || 0) * 1.25) },
            infinity: { enabled: true, price: Math.round((d.price || 0) * 1.5), mrp: Math.round((d.mrp || 0) * 1.5), seatsLimit: 10, seatsReserved: 0, courses: [], testSeries: [] }
          };
        } else {
          if (!d.plans.batch) d.plans.batch = { enabled: true, price: d.price || 0, mrp: d.mrp || 0 };
          if (!d.plans.pro) d.plans.pro = { enabled: true, price: Math.round((d.price || 0) * 1.25), mrp: Math.round((d.mrp || 0) * 1.25) };
          if (!d.plans.infinity) d.plans.infinity = { enabled: true, price: Math.round((d.price || 0) * 1.5), mrp: Math.round((d.mrp || 0) * 1.5), seatsLimit: 10, seatsReserved: 0, courses: [], testSeries: [] };
          // Ensure arrays are initialized
          if (!d.plans.infinity.courses) d.plans.infinity.courses = [];
          if (!d.plans.infinity.testSeries) d.plans.infinity.testSeries = [];
        }

        if (d.plans?.infinity?.courses) {
          d.plans.infinity.courses = d.plans.infinity.courses.map((cc) => (typeof cc === 'object' && cc !== null ? cc._id : cc));
        }
        if (d.plans?.infinity?.testSeries) {
          d.plans.infinity.testSeries = d.plans.infinity.testSeries.map((ts) => (typeof ts === 'object' && ts !== null ? ts._id : ts));
        }

        setForm(d);
      });
    }
  }, [id, duplicateFrom]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (k, k2, v) => setForm((f) => ({ ...f, [k]: { ...f[k], [k2]: v } }));
  const setList = (k, v) =>
    set(k, v.split('\n').map((x) => x.trim()).filter(Boolean));

  // Toggle category multi-select
  const toggleCategory = (name) => {
    setForm((f) => {
      const cats = f.categories || [];
      return {
        ...f,
        categories: cats.includes(name) ? cats.filter((c) => c !== name) : [...cats, name],
      };
    });
  };

  // Get subcategories for all selected categories
  const availableSubcats = categories
    .filter((c) => (form.categories || []).includes(c.name))
    .flatMap((c) => c.subcategories || []);

  const toggleSubcat = (name) => {
    setForm((f) => {
      const subs = f.subCategories || [];
      return {
        ...f,
        subCategories: subs.includes(name) ? subs.filter((s) => s !== name) : [...subs, name],
      };
    });
  };

  // FAQ helpers
  const addFaq = () => setForm((f) => ({ ...f, faqs: [...(f.faqs || []), { question: '', answer: '' }] }));
  const updateFaq = (i, field, val) =>
    setForm((f) => {
      const faqs = [...(f.faqs || [])];
      faqs[i] = { ...faqs[i], [field]: val };
      return { ...f, faqs };
    });
  const removeFaq = (i) => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) }));

  const addSyllabus = () => setForm((f) => ({
    ...f,
    syllabus: [...(f.syllabus || []), { title: '', description: '', pdfUrl: '' }],
  }));
  const updateSyllabus = (i, field, val) =>
    setForm((f) => {
      const syllabus = [...(f.syllabus || [])];
      syllabus[i] = { ...syllabus[i], [field]: val };
      return { ...f, syllabus };
    });
  const removeSyllabus = (i) => setForm((f) => ({ ...f, syllabus: f.syllabus.filter((_, idx) => idx !== i) }));

  // Timetable helpers
  const addTimetableSlot = () => setForm((f) => ({
    ...f,
    timetable: [...(f.timetable || []), { subject: '', timeFrom: '', timeTo: '', days: 'Mon-Fri', order: (f.timetable || []).length }],
  }));
  const updateTimetable = (i, field, val) =>
    setForm((f) => {
      const timetable = [...(f.timetable || [])];
      timetable[i] = { ...timetable[i], [field]: val };
      return { ...f, timetable };
    });
  const removeTimetableSlot = (i) => setForm((f) => ({ ...f, timetable: f.timetable.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.categories?.length) { toast.error('Select at least one category'); return; }
    
    // Validate number of active plans
    if (!form.isFree) {
      const enabledPlans = ['batch', 'pro', 'infinity'].filter(
        (key) => form.plans?.[key]?.enabled
      );
      if (enabledPlans.length < 2 || enabledPlans.length > 3) {
        toast.error('Please activate between 2 and 3 pricing plans (Min 2, Max 3)');
        return;
      }
    }

    setSaving(true);
    try {
      // Keep legacy category field in sync with first selected category
      const payload = { ...form, category: form.categories[0] || '' };
      if (edit) {
        await api.put(`/courses/${id}`, payload);
        toast.success('Course updated');
      } else {
        await api.post('/courses', payload);
        toast.success('Course created');
      }
      nav('/admin/courses');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin/courses" className="text-sm text-brand-700 font-semibold">
            <ArrowLeft size={14} className="inline" /> All Courses
          </Link>
          <h1 className="font-display text-3xl font-extrabold mt-2">
            {edit ? 'Edit Course' : duplicateFrom ? 'Duplicate Course' : 'Add New Course'}
          </h1>
        </div>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Basic Information</h2>
            <div>
              <label className="label">Title</label>
              <input required className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>

            {/* Categories (multi-select) */}
            <div>
              <label className="label">Categories <span className="text-xs text-slate-400 font-normal">(select one or more)</span></label>
              <div className="flex flex-wrap gap-2 mt-1">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.name || c}
                    onClick={() => toggleCategory(c.name || c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                      (form.categories || []).includes(c.name || c)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'
                    }`}
                  >
                    {c.name || c}
                  </button>
                ))}
                {categories.length === 0 && (
                  <span className="text-xs text-slate-400">No categories yet — <Link to="/admin/categories" className="text-brand-600 underline">Manage Categories</Link></span>
                )}
              </div>
            </div>

            {/* Sub-categories */}
            {availableSubcats.length > 0 && (
              <div>
                <label className="label">Sub-categories <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableSubcats.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSubcat(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                        (form.subCategories || []).includes(s)
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-violet-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnail */}
            <div>
              <label className="label">Thumbnail</label>
              {form.thumbnail && (
                <img
                  src={form.thumbnail}
                  alt="preview"
                  className="w-full h-36 object-cover rounded-xl mb-2 border border-slate-200"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={form.thumbnail?.startsWith?.('data:') ? '' : (form.thumbnail || '')}
                  onChange={(e) => set('thumbnail', e.target.value)}
                  placeholder="Paste image URL…"
                />
                <label className="btn-outline cursor-pointer shrink-0 flex items-center gap-1.5">
                  <span>📁 Upload</span>
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 600000) { toast.error('Image too large. Use under 600 KB.'); return; }
                      const reader = new FileReader();
                      reader.onload = () => set('thumbnail', reader.result);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Upload (max 600 KB) or paste a URL.</p>
            </div>

            <div>
              <label className="label">Short Description</label>
              <input className="input" value={form.shortDescription || ''} onChange={(e) => set('shortDescription', e.target.value)} />
            </div>

            {/* Rich Text Description */}
            <div>
              <label className="label">Full Description <span className="text-xs text-slate-400 font-normal">(supports formatting & tables)</span></label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SunEditor
                  setContents={form.description || ''}
                  onChange={(content) => set('description', content)}
                  setOptions={{
                    height: 250,
                    buttonList: [
                      ['undo', 'redo'],
                      ['font', 'fontSize', 'formatBlock'],
                      ['bold', 'underline', 'italic', 'strike'],
                      ['fontColor', 'hiliteColor'],
                      ['align', 'list', 'lineHeight'],
                      ['table', 'link', 'image'],
                      ['removeFormat', 'fullScreen'],
                    ],
                    font: ['Arial', 'Calibri', 'Comic Sans MS', 'Georgia', 'Tahoma', 'Times New Roman', 'Verdana'],
                  }}
                />
              </div>
            </div>

            <div>
              <label className="label">Highlights <span className="text-xs text-slate-400 font-normal">(one per line)</span></label>
              <textarea className="input min-h-[90px]" value={(form.highlights || []).join('\n')} onChange={(e) => setList('highlights', e.target.value)} />
            </div>

            <div className="space-y-1 mt-3 text-left">
              <label className="text-sm font-semibold text-slate-700 block">Batch Information PDF / Attachment (Optional)</label>
              <div className="flex gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Paste PDF/Doc URL (or upload)..."
                  value={form.batchInformation || ''}
                  onChange={(e) => set('batchInformation', e.target.value)}
                />
                <label className={`btn-outline cursor-pointer shrink-0 flex items-center gap-1 text-xs ${batchInfoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {batchInfoUploading ? <Loader2 size={13} className="animate-spin" /> : <span>📁 Upload PDF</span>}
                  <input type="file" accept=".pdf,.doc,.docx,.zip,.txt,image/*" className="sr-only" disabled={batchInfoUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 100 * 1024 * 1024) { toast.error('File too large. Max 100 MB.'); return; }
                      setBatchInfoUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const { data } = await api.post('/upload/pdf', fd, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        set('batchInformation', data.url);
                        toast.success('Batch Information PDF uploaded successfully');
                      } catch {
                        toast.error('Upload failed. Paste a URL instead.');
                      } finally {
                        setBatchInfoUploading(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Syllabus */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Syllabus</h2>
              <button type="button" onClick={addSyllabus} className="btn-outline text-xs flex items-center gap-1">
                <Plus size={13} /> Add Topic
              </button>
            </div>
            {(form.syllabus || []).length === 0 && (
              <p className="text-sm text-slate-400">No syllabus topics yet. Click "Add Topic" to add course content.</p>
            )}
            {(form.syllabus || []).map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">Topic #{i + 1}</span>
                  <button type="button" onClick={() => removeSyllabus(i)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  className="input text-sm"
                  placeholder="Topic title (e.g. Physical Chemistry)"
                  value={item.title}
                  onChange={(e) => updateSyllabus(i, 'title', e.target.value)}
                />
                <textarea
                  className="input text-sm min-h-[80px]"
                  placeholder="Description (subtopics, chapters covered, etc.)"
                  value={item.description}
                  onChange={(e) => updateSyllabus(i, 'description', e.target.value)}
                />
                <div className="space-y-1 mt-2 text-left">
                  <label className="text-xs font-bold text-slate-500 block">Syllabus Topic PDF / Attachment (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      className="input text-sm flex-1"
                      placeholder="Paste PDF/Doc URL (or upload)..."
                      value={item.pdfUrl || ''}
                      onChange={(e) => updateSyllabus(i, 'pdfUrl', e.target.value)}
                    />
                    <label className={`btn-outline cursor-pointer shrink-0 flex items-center gap-1 text-xs ${syllabusPdfUploading[i] ? 'opacity-50 pointer-events-none' : ''}`}>
                      {syllabusPdfUploading[i] ? <Loader2 size={13} className="animate-spin" /> : <span>📁 Upload PDF</span>}
                      <input type="file" accept=".pdf,.doc,.docx,.zip,.txt,image/*" className="sr-only" disabled={syllabusPdfUploading[i]}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 100 * 1024 * 1024) { toast.error('File too large. Max 100 MB.'); return; }
                          setSyllabusPdfUploading(prev => ({ ...prev, [i]: true }));
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const { data } = await api.post('/upload/pdf', fd, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            updateSyllabus(i, 'pdfUrl', data.url);
                            toast.success('Syllabus PDF uploaded successfully');
                          } catch {
                            toast.error('Upload failed. Paste a URL instead.');
                          } finally {
                            setSyllabusPdfUploading(prev => ({ ...prev, [i]: false }));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">FAQs</h2>
              <button type="button" onClick={addFaq} className="btn-outline text-xs flex items-center gap-1">
                <Plus size={13} /> Add FAQ
              </button>
            </div>
            {(form.faqs || []).length === 0 && (
              <p className="text-sm text-slate-400">No FAQs yet. Click "Add FAQ" to add common questions.</p>
            )}
            {(form.faqs || []).map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">FAQ #{i + 1}</span>
                  <button type="button" onClick={() => removeFaq(i)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  className="input text-sm"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                />
                <textarea
                  className="input text-sm min-h-[70px]"
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Timetable */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Class Time Table</h2>
              <button type="button" onClick={addTimetableSlot} className="btn-outline text-xs flex items-center gap-1">
                <Plus size={13} /> Add Slot
              </button>
            </div>
            {(form.timetable || []).length === 0 && (
              <p className="text-sm text-slate-400">No time slots yet. Click "Add Slot" to add the class schedule.</p>
            )}
            {(form.timetable || []).map((slot, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">Slot #{i + 1}</span>
                  <button type="button" onClick={() => removeTimetableSlot(i)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  className="input text-sm"
                  placeholder="Subject (e.g. Physical Chemistry)"
                  value={slot.subject}
                  onChange={(e) => updateTimetable(i, 'subject', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Time From</label>
                    <input
                      type="time"
                      className="input text-sm"
                      value={slot.timeFrom}
                      onChange={(e) => updateTimetable(i, 'timeFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Time To</label>
                    <input
                      type="time"
                      className="input text-sm"
                      value={slot.timeTo}
                      onChange={(e) => updateTimetable(i, 'timeTo', e.target.value)}
                    />
                  </div>
                </div>
                <input
                  className="input text-sm"
                  placeholder="Days (e.g. Mon-Fri or Mon, Wed, Fri)"
                  value={slot.days}
                  onChange={(e) => updateTimetable(i, 'days', e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* SEO Settings */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">SEO Settings</h2>
            <div>
              <label className="label">Meta Title</label>
              <input
                className="input"
                value={form.seo?.metaTitle || ''}
                onChange={(e) => setNested('seo', 'metaTitle', e.target.value)}
                placeholder="Custom page title for search engines (60 chars)"
                maxLength={60}
              />
              <p className="text-[11px] text-slate-400 mt-1">{(form.seo?.metaTitle || '').length}/60 characters</p>
            </div>
            <div>
              <label className="label">Meta Description</label>
              <textarea
                className="input min-h-[80px]"
                value={form.seo?.metaDescription || ''}
                onChange={(e) => setNested('seo', 'metaDescription', e.target.value)}
                placeholder="Brief description for search results (160 chars)"
                maxLength={160}
              />
              <p className="text-[11px] text-slate-400 mt-1">{(form.seo?.metaDescription || '').length}/160 characters</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          {/* Pricing */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Pricing (INR)</h2>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-brand-700">
                <input
                  type="checkbox"
                  checked={!!form.isFree}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      isFree: checked,
                      price: checked ? 0 : f.price,
                      mrp: checked ? 0 : f.mrp,
                      discountCoupons: checked ? [] : f.discountCoupons,
                      plans: checked
                        ? {
                            batch: { enabled: true, price: 0, mrp: 0 },
                            pro: { enabled: false, price: 0, mrp: 0 },
                            infinity: { enabled: false, price: 0, mrp: 0, seatsLimit: 10, seatsReserved: 0 }
                          }
                        : f.plans
                    }));
                  }}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Free Course
              </label>
            </div>

            {!form.isFree ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  Configure pricing for Batch, Pro, and Infinity plans. You must enable between 2 and 3 plans.
                </p>
                
                {/* Batch Plan */}
                <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex-1 max-w-[200px]">
                      <input
                        type="text"
                        placeholder="Plan Name"
                        className="input text-xs py-1.5 px-2.5 font-bold text-slate-800 border-slate-200"
                        value={form.plans?.batch?.name || 'Batch Plan'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((f) => ({
                            ...f,
                            plans: {
                              ...f.plans,
                              batch: { ...f.plans?.batch, name: val }
                            }
                          }));
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.plans?.batch?.enabled ?? true}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setForm((f) => ({
                            ...f,
                            plans: {
                              ...f.plans,
                              batch: { ...f.plans?.batch, enabled: val }
                            }
                          }));
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Active
                    </label>
                  </div>
                  {(form.plans?.batch?.enabled ?? true) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Price (INR)</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={form.plans?.batch?.price ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setForm((f) => ({
                              ...f,
                              price: val, // Backwards compat
                              plans: {
                                ...f.plans,
                                batch: { ...f.plans?.batch, price: val }
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="label text-xs">MRP (INR)</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={form.plans?.batch?.mrp ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setForm((f) => ({
                              ...f,
                              mrp: val, // Backwards compat
                              plans: {
                                ...f.plans,
                                batch: { ...f.plans?.batch, mrp: val }
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pro Plan */}
                <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex-1 max-w-[200px]">
                      <input
                        type="text"
                        placeholder="Plan Name"
                        className="input text-xs py-1.5 px-2.5 font-bold text-slate-800 border-slate-200"
                        value={form.plans?.pro?.name || 'Pro Plan'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((f) => ({
                            ...f,
                            plans: {
                              ...f.plans,
                              pro: { ...f.plans?.pro, name: val }
                            }
                          }));
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.plans?.pro?.enabled ?? true}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setForm((f) => ({
                            ...f,
                            plans: {
                              ...f.plans,
                              pro: { ...f.plans?.pro, enabled: val }
                            }
                          }));
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Active
                    </label>
                  </div>
                  {(form.plans?.pro?.enabled ?? true) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Price (INR)</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={form.plans?.pro?.price ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setForm((f) => ({
                              ...f,
                              plans: {
                                ...f.plans,
                                pro: { ...f.plans?.pro, price: val }
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="label text-xs">MRP (INR)</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={form.plans?.pro?.mrp ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setForm((f) => ({
                              ...f,
                              plans: {
                                ...f.plans,
                                pro: { ...f.plans?.pro, mrp: val }
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Infinity Plan */}
                <div className="border border-slate-150 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex-1 max-w-[200px]">
                      <input
                        type="text"
                        placeholder="Plan Name"
                        className="input text-xs py-1.5 px-2.5 font-bold text-slate-800 border-slate-200"
                        value={form.plans?.infinity?.name || 'Infinity Plan'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((f) => ({
                            ...f,
                            plans: {
                              ...f.plans,
                              infinity: { ...f.plans?.infinity, name: val }
                            }
                          }));
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.plans?.infinity?.enabled ?? true}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setForm((f) => ({
                            ...f,
                            plans: {
                              ...f.plans,
                              infinity: { ...f.plans?.infinity, enabled: val }
                            }
                          }));
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Active
                    </label>
                  </div>
                  {(form.plans?.infinity?.enabled ?? true) && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs">Price (INR)</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={form.plans?.infinity?.price ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setForm((f) => ({
                                ...f,
                                plans: {
                                  ...f.plans,
                                  infinity: { ...f.plans?.infinity, price: val }
                                }
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="label text-xs">MRP (INR)</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={form.plans?.infinity?.mrp ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setForm((f) => ({
                                ...f,
                                plans: {
                                  ...f.plans,
                                  infinity: { ...f.plans?.infinity, mrp: val }
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label text-xs">Seats Limit</label>
                        <input
                          type="number"
                          className="input text-sm"
                          value={form.plans?.infinity?.seatsLimit ?? 10}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setForm((f) => ({
                              ...f,
                              plans: {
                                ...f.plans,
                                infinity: { ...f.plans?.infinity, seatsLimit: val }
                              }
                            }));
                          }}
                        />
                      </div>

                      {/* Bundled Courses for Infinity */}
                      <div className="space-y-1">
                        <label className="label text-xs font-semibold text-slate-700">Bundle Courses (Free Access)</label>
                        <div className="border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 bg-white">
                          {allCourses.filter(c => c._id !== id).map((c) => {
                            const isChecked = (form.plans?.infinity?.courses || []).includes(c._id);
                            return (
                              <label key={c._id} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-800 transition">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentList = form.plans?.infinity?.courses || [];
                                    const updatedList = e.target.checked
                                      ? [...currentList, c._id]
                                      : currentList.filter(courseId => courseId !== c._id);
                                    
                                    setForm(f => ({
                                      ...f,
                                      plans: {
                                        ...f.plans,
                                        infinity: { ...f.plans?.infinity, courses: updatedList }
                                      }
                                    }));
                                  }}
                                  className="rounded text-brand-600 focus:ring-brand-500"
                                />
                                <span>{c.title}</span>
                              </label>
                            );
                          })}
                          {allCourses.filter(c => c._id !== id).length === 0 && (
                            <span className="text-[10px] text-slate-400 block text-center py-2">No other courses available.</span>
                          )}
                        </div>
                      </div>

                      {/* Bundled Test Series for Infinity */}
                      <div className="space-y-1">
                        <label className="label text-xs font-semibold text-slate-700">Bundle Test Series (Free Access)</label>
                        <div className="border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 bg-white">
                          {allTestSeries.map((ts) => {
                            const isChecked = (form.plans?.infinity?.testSeries || []).includes(ts._id);
                            return (
                              <label key={ts._id} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-800 transition">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentList = form.plans?.infinity?.testSeries || [];
                                    const updatedList = e.target.checked
                                      ? [...currentList, ts._id]
                                      : currentList.filter(tsId => tsId !== ts._id);
                                    
                                    setForm(f => ({
                                      ...f,
                                      plans: {
                                        ...f.plans,
                                        infinity: { ...f.plans?.infinity, testSeries: updatedList }
                                      }
                                    }));
                                  }}
                                  className="rounded text-brand-600 focus:ring-brand-500"
                                />
                                <span>{ts.title}</span>
                              </label>
                            );
                          })}
                          {allTestSeries.length === 0 && (
                            <span className="text-[10px] text-slate-400 block text-center py-2">No test series available.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-emerald-600 font-semibold bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                Free Course selected. All plan prices set to 0.
              </div>
            )}

            {/* Discount Coupons (multiple) */}
            {!form.isFree && (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-sm text-slate-700">Discount Coupons</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      discountCoupons: [...(f.discountCoupons || []), { code: '', discountType: 'percent', discountValue: 0, isActive: true, maxUses: 0, maxUsesPerUser: 0 }],
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
                      className="input text-sm"
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
                        className="input text-sm"
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
                        className="input text-sm"
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
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 block">Global Use Limit</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-400 font-semibold bg-white"
                          placeholder="0 (Unlimited)"
                          value={coupon.maxUses || ''}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            discountCoupons: f.discountCoupons.map((c, idx) =>
                              idx === i ? { ...c, maxUses: e.target.value === '' ? 0 : Number(e.target.value) } : c
                            ),
                          }))}
                          title="Global usage limit (0 = unlimited)"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 block">Limit per Student</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-400 font-semibold bg-white"
                          placeholder="0 (Unlimited)"
                          value={coupon.maxUsesPerUser || ''}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            discountCoupons: f.discountCoupons.map((c, idx) =>
                              idx === i ? { ...c, maxUsesPerUser: e.target.value === '' ? 0 : Number(e.target.value) } : c
                            ),
                          }))}
                          title="Usage limit per student (0 = unlimited)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Validity */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Course Validity</h2>
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
                  className="input"
                  min={1}
                  placeholder="Number"
                  value={form.validity?.durationValue || 12}
                  onChange={(e) => setNested('validity', 'durationValue', Number(e.target.value))}
                />
                <select className="input"
                  value={form.validity?.durationUnit || 'months'}
                  onChange={(e) => setNested('validity', 'durationUnit', e.target.value)}>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            )}
            {form.validity?.type === 'endDate' && (
              <input
                type="date"
                className="input"
                value={form.validity?.endDate ? form.validity.endDate.split('T')[0] : ''}
                onChange={(e) => setNested('validity', 'endDate', e.target.value)}
              />
            )}
            {form.validity?.type === 'lifetime' && (
              <p className="text-xs text-emerald-600 font-semibold">♾ Students get lifetime access to this course.</p>
            )}
            {/* Batch Start / End Dates */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Batch Dates (Optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Start Date</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={form.startDate ? form.startDate.split('T')[0] : ''}
                    onChange={(e) => set('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">End Date</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={form.endDate ? form.endDate.split('T')[0] : ''}
                    onChange={(e) => set('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Settings */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Course Settings</h2>
            <div>
              <label className="label">Course Type</label>
              <div className="flex gap-2">
                {[{ v: 'recorded', l: 'Recorded Batch' }, { v: 'live', l: 'Live Batch' }].map(({ v, l }) => (
                  <button
                    key={v} type="button"
                    onClick={() => set('courseType', v)}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                      form.courseType === v
                        ? v === 'live'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {v === 'live' ? '🔴' : '🎬'} {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Instructor</label>
              <input className="input" value={form.instructor || ''} onChange={(e) => set('instructor', e.target.value)} />
            </div>
            <div>
              <label className="label">Baseline Course Rating</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                className="input"
                value={form.rating || 4.8}
                onChange={(e) => set('rating', Number(e.target.value))}
              />
            </div>

            {/* About Educator */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">About Educator</p>
              <div>
                <label className="label text-xs">Educator Photo URL</label>
                {form.educator?.photo && (
                  <img
                    src={form.educator.photo}
                    alt="educator"
                    className="w-16 h-16 rounded-full object-cover mb-2 border border-slate-200"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                  <div className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    value={form.educator?.photo?.startsWith?.('data:') ? '' : (form.educator?.photo || '')}
                    onChange={(e) => setNested('educator', 'photo', e.target.value)}
                    placeholder="Paste photo URL…"
                  />
                  <label className={`btn-outline cursor-pointer shrink-0 flex items-center gap-1 text-xs ${educatorImgUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {educatorImgUploading ? <Loader2 size={13} className="animate-spin" /> : <span>📁 Upload</span>}
                    <input type="file" accept="image/*" className="sr-only" disabled={educatorImgUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5 MB.'); return; }
                        setEducatorImgUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          const { data } = await api.post('/upload/image', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          setNested('educator', 'photo', data.url);
                          toast.success('Photo uploaded');
                        } catch {
                          toast.error('Upload failed. Paste a URL instead.');
                        } finally {
                          setEducatorImgUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="label text-xs">Educator Bio <span className="text-slate-400 font-normal">(2–3 words/line)</span></label>
                <input
                  className="input text-sm"
                  value={form.educator?.bio || ''}
                  onChange={(e) => setNested('educator', 'bio', e.target.value)}
                  placeholder="e.g. IIT Delhi Alumni, 10+ yrs exp"
                  maxLength={80}
                />
                <p className="text-[11px] text-slate-400 mt-1">{(form.educator?.bio || '').length}/80 characters</p>
              </div>
            </div>
            <div>
              <label className="label">Language</label>
              <input className="input" value={form.language || ''} onChange={(e) => set('language', e.target.value)} />
            </div>
            <div>
              <label className="label">Telegram Join Link</label>
              <input className="input" placeholder="e.g. https://t.me/joinchat/..." value={form.telegramJoinLink || ''} onChange={(e) => set('telegramJoinLink', e.target.value)} />
              <p className="text-[11px] text-slate-400 mt-1">If set, students will see this link on their enrolled course page.</p>
            </div>

            {/* Demo & Orientation Videos */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">📹 Demo & Orientation Videos</p>
              <p className="text-[11px] text-slate-400">These videos are public — visible to all students without enrollment.</p>
              <div>
                <label className="label text-xs">Orientation Video URL</label>
                <input
                  className="input text-sm"
                  value={form.orientationVideoUrl || ''}
                  onChange={(e) => set('orientationVideoUrl', e.target.value)}
                  placeholder="YouTube / Bunny / direct URL…"
                />
                <p className="text-[11px] text-slate-400 mt-1">Shown in Demo tab — course introduction video</p>
              </div>
              <div>
                <label className="label text-xs">Demo Video URL</label>
                <input
                  className="input text-sm"
                  value={form.demoVideoUrl || ''}
                  onChange={(e) => set('demoVideoUrl', e.target.value)}
                  placeholder="YouTube / Bunny / direct URL…"
                />
                <p className="text-[11px] text-slate-400 mt-1">Shown in Demo tab — sample lecture video</p>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
              <span className="font-semibold text-sm">Published</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
              <span className="font-semibold text-sm">Featured on home</span>
            </label>
          </div>

          {/* Additional (Optional) Settings */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Additional Settings <span className="text-slate-400 font-normal normal-case">(Optional)</span></h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isAdmissionClosed || false} onChange={(e) => set('isAdmissionClosed', e.target.checked)} />
              <span className="font-semibold text-sm text-red-600">This batch admission has been closed (Disables payments)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isCombo || false} onChange={(e) => set('isCombo', e.target.checked)} />
              <span className="font-semibold text-sm">Make this a Combo course</span>
            </label>
            {form.isCombo && (
              <div className="space-y-3 pl-4 border-l-2 border-brand-200">
                <div>
                  <label className="label text-xs">Combo Description</label>
                  <input className="input text-sm" placeholder="e.g. Includes JEE Main + Advanced batches" value={form.comboDescription || ''} onChange={(e) => set('comboDescription', e.target.value)} />
                </div>
                <div>
                  <label className="label text-xs font-bold block mb-1.5 text-slate-600">Select Courses Included in Combo</label>
                  <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50">
                    {allCourses.filter((c) => c._id !== id && !c.isCombo).map((c) => {
                      const selected = (form.comboCourses || []).includes(c._id);
                      return (
                        <label key={c._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((f) => ({
                                ...f,
                                comboCourses: checked
                                  ? [...(f.comboCourses || []), c._id]
                                  : (f.comboCourses || []).filter((cid) => cid !== c._id)
                              }));
                            }}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          {c.title}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-bold block mb-1.5 text-slate-600">Select Test Series Included in Combo</label>
                  <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50">
                    {allTestSeries.map((ts) => {
                      const selected = (form.comboTestSeries || []).includes(ts._id);
                      return (
                        <label key={ts._id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setForm((f) => ({
                                ...f,
                                comboTestSeries: checked
                                  ? [...(f.comboTestSeries || []), ts._id]
                                  : (f.comboTestSeries || []).filter((tsid) => tsid !== ts._id)
                              }));
                            }}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          {ts.title}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.allowExtendValidity || false} onChange={(e) => set('allowExtendValidity', e.target.checked)} />
              <span className="font-semibold text-sm">Allow extend validity</span>
            </label>
            {form.allowExtendValidity && (
              <div className="space-y-3 pl-4 border-l-2 border-brand-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Extension Price (INR)</label>
                    <input
                      type="number"
                      min={0}
                      className="input text-sm"
                      placeholder="e.g. 99"
                      value={form.extendValidityPrice || 0}
                      onChange={(e) => set('extendValidityPrice', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Extension Duration</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        className="input text-sm flex-1"
                        placeholder="e.g. 6"
                        value={form.extendValidityDurationValue || 1}
                        onChange={(e) => set('extendValidityDurationValue', Number(e.target.value))}
                      />
                      <select
                        className="input text-sm flex-1"
                        value={form.extendValidityDurationUnit || 'months'}
                        onChange={(e) => set('extendValidityDurationUnit', e.target.value)}
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.allowFreeze || false} onChange={(e) => set('allowFreeze', e.target.checked)} />
              <span className="font-semibold text-sm">Allow course freezing</span>
            </label>
          </div>

          {/* Upsell */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Upsell</h2>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={form.upsell?.enabled || false} onChange={(e) => setNested('upsell', 'enabled', e.target.checked)} />
                Enable
              </label>
            </div>
            {form.upsell?.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Upsell Offer Title</label>
                  <input className="input text-sm" placeholder="e.g. Upgrade to Complete Bundle" value={form.upsell?.title || ''} onChange={(e) => setNested('upsell', 'title', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Upsell Item Type</label>
                    <select
                      className="input text-sm bg-white"
                      value={form.upsell?.targetType || 'course'}
                      onChange={(e) => {
                        setNested('upsell', 'targetType', e.target.value);
                        if (e.target.value === 'course') {
                          setNested('upsell', 'testSeriesId', '');
                        } else {
                          setNested('upsell', 'courseId', '');
                        }
                      }}
                    >
                      <option value="course">Course</option>
                      <option value="test_series">Test Series</option>
                    </select>
                  </div>
                  {form.upsell?.targetType === 'test_series' ? (
                    <div>
                      <label className="label text-xs">Suggest Test Series</label>
                      <select
                        className="input text-sm bg-white"
                        value={form.upsell?.testSeriesId || ''}
                        onChange={(e) => setNested('upsell', 'testSeriesId', e.target.value)}
                      >
                        <option value="">— Select a test series —</option>
                        {allTestSeries.map((ts) => (
                          <option key={ts._id} value={ts._id}>{ts.title}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="label text-xs">Suggest Course</label>
                      <select
                        className="input text-sm bg-white"
                        value={form.upsell?.courseId || ''}
                        onChange={(e) => setNested('upsell', 'courseId', e.target.value)}
                      >
                        <option value="">— Select a course —</option>
                        {allCourses.filter((c) => c._id !== id).map((c) => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!form.upsell?.enabled && (
              <p className="text-xs text-slate-400">Enable upsell to suggest a related course during enrollment.</p>
            )}
          </div>

          <button disabled={saving} className="btn-primary w-full justify-center">
            <Save size={16} /> {saving ? 'Saving…' : edit ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
