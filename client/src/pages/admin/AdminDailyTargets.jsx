import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit2,
  Eye,
  EyeOff,
  ListChecks,
  Plus,
  Repeat,
  Save,
  Search,
  Target,
  Trash2,
  Type,
  ImagePlus,
  Loader2,
  Users,
  X,
} from 'lucide-react';

const blankCustomQuestion = () => ({
  question: '',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correct: 0,
  explanation: '',
  fontFamily: 'default',
  image: '',
});

const getIndiaDateInput = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const blankForm = {
  title: '',
  description: '',
  startDate: getIndiaDateInput(),
  endDate: getIndiaDateInput(),
  durationMins: 30,
  questionsTarget: 0,
  coinsReward: 0,
  targetType: 'custom_test',
  test: '',
  testSeries: '',
  customQuestions: [blankCustomQuestion()],
  linkUrl: '',
  buttonLabel: 'Start Test',
  audienceType: 'all',
  plans: [],
  categories: [],
  loopEnabled: false,
  loopCycleDays: 15,
  loopEndsAt: '',
  priority: 0,
  isActive: true,
};

const planOptions = [
  { value: 'batch', label: 'Batch' },
  { value: 'pro', label: 'Pro' },
  { value: 'infinity', label: 'Infinity' },
];

const audienceLabels = {
  all: 'All students',
  free: 'Free students',
  paid: 'Any paid plan',
  plans: 'Selected plans',
};

const fontOptions = [
  { value: 'default', label: 'Default', family: 'inherit' },
  { value: 'sans', label: 'Clean Sans', family: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { value: 'serif', label: 'Formula Serif', family: 'Georgia, "Times New Roman", serif' },
  { value: 'mono', label: 'Code / Mono', family: '"Courier New", ui-monospace, monospace' },
  { value: 'devanagari', label: 'Hindi / Devanagari', family: '"Noto Sans Devanagari", Mangal, sans-serif' },
  { value: 'handwritten', label: 'Handwritten', family: '"Comic Sans MS", cursive' },
];

const getQuestionFontFamily = (value) => (
  fontOptions.find((font) => font.value === value)?.family || 'inherit'
);

const formulaSnippets = [
  { label: 'H2O', value: 'H<sub>2</sub>O' },
  { label: 'CO2', value: 'CO<sub>2</sub>' },
  { label: 'NH4+', value: 'NH<sub>4</sub><sup>+</sup>' },
  { label: 'e-', value: 'e<sup>-</sup>' },
  { label: 'Δ', value: '&Delta;' },
  { label: '⇌', value: '&rightleftharpoons;' },
  { label: '→', value: '&rarr;' },
  { label: '°C', value: '&deg;C' },
];

const toDateInput = (value) => (value ? getIndiaDateInput(value) : '');

const getValidQuestionCount = (questions = []) => questions.filter((question) => (
  question.question.trim() &&
  question.options.filter((option) => option.text.trim()).length >= 2
)).length;

const formatShortDate = (value) => (
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) : 'Set date'
);

export default function AdminDailyTargets() {
  const [targets, setTargets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [uploadingQuestionIdx, setUploadingQuestionIdx] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [targetRes, catRes] = await Promise.all([
        api.get('/daily-targets/admin'),
        api.get('/categories').catch(() => ({ data: [] })),
      ]);
      setTargets(targetRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load daily targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const customQuestionCount = useMemo(
    () => getValidQuestionCount(form.customQuestions),
    [form.customQuestions]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      targetType: 'custom_test',
      questionsTarget: customQuestionCount,
      buttonLabel: prev.buttonLabel || 'Start Practice',
    }));
  }, [customQuestionCount]);

  const filteredTargets = useMemo(() => {
    const term = q.trim().toLowerCase();
    return targets.filter((target) => !term || target.title.toLowerCase().includes(term));
  }, [targets, q]);

  const categoryNames = categories.map((category) => category.name).filter(Boolean);
  const activeTargets = targets.filter((target) => target.isActive !== false).length;
  const firstQuestion = form.customQuestions.find((question) => question.question.trim()) || form.customQuestions[0] || blankCustomQuestion();

  const resetForm = () => {
    setForm({ ...blankForm, customQuestions: [blankCustomQuestion()] });
    setEditingId(null);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const togglePlan = (plan) => {
    setForm((prev) => ({
      ...prev,
      plans: prev.plans.includes(plan)
        ? prev.plans.filter((item) => item !== plan)
        : [...prev.plans, plan],
    }));
  };

  const toggleCategory = (category) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };

  const updateCustomQuestion = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.map((question, qIdx) => (
        qIdx === idx ? { ...question, [key]: value } : question
      )),
    }));
  };

  const updateCustomOption = (questionIdx, optionIdx, value) => {
    setForm((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.map((question, qIdx) => {
        if (qIdx !== questionIdx) return question;
        return {
          ...question,
          options: question.options.map((option, oIdx) => (
            oIdx === optionIdx ? { ...option, text: value } : option
          )),
        };
      }),
    }));
  };

  const appendToCustomQuestion = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.map((question, qIdx) => (
        qIdx === idx ? { ...question, [key]: `${question[key] || ''}${value}` } : question
      )),
    }));
  };

  const uploadQuestionImage = async (idx, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingQuestionIdx(idx);
    try {
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateCustomQuestion(idx, 'image', data.url);
      toast.success('Question image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingQuestionIdx(null);
    }
  };

  const addCustomQuestion = () => {
    setForm((prev) => ({
      ...prev,
      customQuestions: [...prev.customQuestions, blankCustomQuestion()],
    }));
  };

  const makeTenQuestionSet = () => {
    setForm((prev) => {
      const nextQuestions = [...prev.customQuestions];
      while (nextQuestions.length < 10) nextQuestions.push(blankCustomQuestion());
      return {
        ...prev,
        customQuestions: nextQuestions.slice(0, Math.max(10, nextQuestions.length)),
      };
    });
  };

  const removeCustomQuestion = (idx) => {
    setForm((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.length === 1
        ? [blankCustomQuestion()]
        : prev.customQuestions.filter((_, qIdx) => qIdx !== idx),
    }));
  };

  const editTarget = (target) => {
    const customQuestions = target.targetType === 'custom_test' && target.test?.questions?.length
      ? target.test.questions.map((question) => ({
        question: question.question || '',
        options: [
          ...(question.options || []).map((option) => ({ text: option.text || '' })),
          { text: '' },
          { text: '' },
          { text: '' },
          { text: '' },
        ].slice(0, 4),
        correct: question.correct || 0,
        explanation: question.explanation || '',
        fontFamily: question.fontFamily || 'default',
        image: question.image || '',
      }))
      : [blankCustomQuestion()];

    setEditingId(target._id);
    setForm({
      title: target.title || '',
      description: target.description || '',
      startDate: toDateInput(target.startDate),
      endDate: toDateInput(target.endDate),
      durationMins: target.durationMins || 0,
      questionsTarget: target.questionsTarget || 0,
      coinsReward: target.coinsReward || 0,
      targetType: 'custom_test',
      test: target.test?._id || target.test || '',
      testSeries: '',
      customQuestions,
      linkUrl: '',
      buttonLabel: target.buttonLabel || 'Start Test',
      audienceType: target.audience?.type || 'all',
      plans: target.audience?.plans || [],
      categories: target.categories || [],
      loopEnabled: target.loopEnabled === true,
      loopCycleDays: target.loopCycleDays || 15,
      loopEndsAt: toDateInput(target.loopEndsAt),
      priority: target.priority || 0,
      isActive: target.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveTarget = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.startDate || !form.endDate) return toast.error('Start and end date are required');
    if (form.audienceType === 'plans' && form.plans.length === 0) {
      return toast.error('Select at least one plan');
    }
    if (customQuestionCount === 0) {
      return toast.error('Add at least one custom question with 2 options');
    }

    const payload = {
      ...form,
      targetType: 'custom_test',
      audience: { type: form.audienceType, plans: form.plans },
      test: form.test,
      testSeries: '',
      linkUrl: '',
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/daily-targets/admin/${editingId}`, payload);
        toast.success('Daily target updated');
      } else {
        await api.post('/daily-targets/admin', payload);
        toast.success('Daily target created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save target');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (target) => {
    try {
      await api.put(`/daily-targets/admin/${target._id}`, { isActive: !target.isActive });
      toast.success(target.isActive ? 'Target paused' : 'Target activated');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to update target');
    }
  };

  const deleteTarget = async (target) => {
    if (!confirm(`Delete "${target.title}"? Student completion records for this target will also be removed.`)) return;
    try {
      await api.delete(`/daily-targets/admin/${target._id}`);
      toast.success('Daily target deleted');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete target');
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[#231b58] text-white shadow-xl">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr,340px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/80">
              <Target size={14} /> Daily Practice
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Daily Target</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-white/70">
              Create a short practice set, assign schedule and audience, then publish it to the student dashboard.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-2xl font-black">{targets.length}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">Targets</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-2xl font-black">{activeTargets}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">Active</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-2xl font-black">{customQuestionCount}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">Qs</div>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={saveTarget} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2e266b] text-white">
                  {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-850">{editingId ? 'Edit Daily Set' : 'New Daily Set'}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">Custom Questions</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{form.durationMins || 0} min</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{customQuestionCount} questions</span>
                  </div>
                </div>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  <X size={14} /> Cancel Edit
                </button>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Organic Chemistry Sprint"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  className="input min-h-[86px]"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Short student-facing instruction"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Button Label</label>
                <input className="input" value={form.buttonLabel} onChange={(e) => setField('buttonLabel', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Minutes</label>
                  <input type="number" min="0" className="input" value={form.durationMins} onChange={(e) => setField('durationMins', Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Priority</label>
                  <input type="number" className="input" value={form.priority} onChange={(e) => setField('priority', Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Start Date</label>
                  <input type="date" className="input" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">End Date</label>
                  <input type="date" className="input" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Questions</label>
                <input disabled className="input disabled:bg-slate-100 disabled:text-slate-500" value={form.questionsTarget} readOnly />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-black text-slate-850">
                  <ListChecks size={18} className="text-[#2e266b]" /> Questions
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={makeTenQuestionSet}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2e266b]/20 bg-white px-4 py-2.5 text-xs font-black text-[#2e266b] hover:bg-slate-50"
                >
                  10 Questions Set
                </button>
                <button
                  type="button"
                  onClick={addCustomQuestion}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2e266b] px-4 py-2.5 text-xs font-black text-white hover:bg-[#251f56]"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {form.customQuestions.map((question, idx) => (
                <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-[#2e266b] p-3 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-black text-[#2e266b]">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wide text-white/80">Question</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Type size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          className="h-9 min-w-[176px] rounded-xl border-0 bg-white pl-8 pr-3 text-xs font-black text-slate-700 outline-none"
                          value={question.fontFamily || 'default'}
                          onChange={(e) => updateCustomQuestion(idx, 'fontFamily', e.target.value)}
                          style={{ fontFamily: getQuestionFontFamily(question.fontFamily) }}
                        >
                          {fontOptions.map((font) => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomQuestion(idx)}
                        className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-rose-500"
                        title="Remove question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2">
                      <span className="px-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Formula</span>
                      {formulaSnippets.map((snippet) => (
                        <button
                          key={snippet.label}
                          type="button"
                          onClick={() => appendToCustomQuestion(idx, 'question', snippet.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700 hover:border-[#2e266b]/30 hover:bg-[#2e266b]/5"
                        >
                          {snippet.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => appendToCustomQuestion(idx, 'question', '<sub>2</sub>')}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700 hover:border-[#2e266b]/30 hover:bg-[#2e266b]/5"
                      >
                        sub
                      </button>
                      <button
                        type="button"
                        onClick={() => appendToCustomQuestion(idx, 'question', '<sup>+</sup>')}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700 hover:border-[#2e266b]/30 hover:bg-[#2e266b]/5"
                      >
                        sup
                      </button>
                    </div>
                    <textarea
                      className="input min-h-[92px] bg-white"
                      value={question.question}
                      onChange={(e) => updateCustomQuestion(idx, 'question', e.target.value)}
                      placeholder="Type question here... e.g. CH3COOH + NaOH → CH3COONa + H2O"
                      style={{ fontFamily: getQuestionFontFamily(question.fontFamily) }}
                    />
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-black text-slate-800">Question photo</div>
                          <div className="mt-0.5 text-[10px] font-semibold text-slate-400">Upload reaction image, graph, structure, or handwritten question.</div>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#2e266b]/20 px-3 py-2 text-xs font-black text-[#2e266b] hover:bg-slate-50">
                          {uploadingQuestionIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                          {uploadingQuestionIdx === idx ? 'Uploading...' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingQuestionIdx !== null}
                            onChange={(e) => uploadQuestionImage(idx, e.target.files?.[0])}
                          />
                        </label>
                      </div>
                      {question.image && (
                        <div className="mt-3 flex items-start gap-3">
                          <img src={question.image} alt="Question upload" className="h-24 w-32 rounded-xl border border-slate-100 object-contain bg-slate-50" />
                          <button
                            type="button"
                            onClick={() => updateCustomQuestion(idx, 'image', '')}
                            className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {question.options.map((option, optionIdx) => {
                        const isCorrect = Number(question.correct) === optionIdx;
                        return (
                          <label
                            key={optionIdx}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                              isCorrect ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={isCorrect}
                              onChange={() => updateCustomQuestion(idx, 'correct', optionIdx)}
                              className="h-4 w-4 accent-teal-600"
                            />
                            <input
                              className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                              value={option.text}
                              onChange={(e) => updateCustomOption(idx, optionIdx, e.target.value)}
                              placeholder={`Option ${optionIdx + 1}`}
                              style={{ fontFamily: getQuestionFontFamily(question.fontFamily) }}
                            />
                          </label>
                        );
                      })}
                    </div>
                    <div>
                      <input
                        className="input bg-white"
                        value={question.explanation}
                        onChange={(e) => updateCustomQuestion(idx, 'explanation', e.target.value)}
                        placeholder="Explanation optional. Formula HTML is supported, e.g. H<sub>2</sub>O."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-850">
                <Users size={16} className="text-[#2e266b]" /> Audience
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(audienceLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setField('audienceType', value)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-black transition ${
                      form.audienceType === value
                        ? 'border-[#2e266b] bg-[#2e266b] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#2e266b]/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {form.audienceType === 'plans' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {planOptions.map((plan) => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => togglePlan(plan.value)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-black ${
                        form.plans.includes(plan.value)
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <h3 className="mb-3 text-sm font-black text-slate-850">Category Filter</h3>
              <div className="flex flex-wrap gap-2">
                {categoryNames.length === 0 ? (
                  <span className="text-xs font-semibold text-slate-400">No categories found.</span>
                ) : categoryNames.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-black ${
                      form.categories.includes(category)
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <div className="rounded-3xl bg-[#20194f] p-4 text-white shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black">Student Preview</div>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-white/70">9:41</span>
            </div>
            <div className="rounded-[28px] bg-white p-3 text-slate-950 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-black text-[#20194f]">
                  <CheckCircle2 size={16} className="text-teal-600" /> Ace2Examz
                </div>
                <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700">Live</span>
              </div>
              <div className="mb-3 flex gap-2 text-[10px] font-black">
                {['All', 'Saved', 'Easy', 'Hard'].map((tab, idx) => (
                  <span key={tab} className={`rounded-full px-3 py-1 ${idx === 0 ? 'bg-[#2e266b] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab}
                  </span>
                ))}
              </div>
              <div className="rounded-2xl bg-[#2e266b] p-3 text-white">
                <div
                  className="min-h-[72px] text-lg font-black leading-snug"
                  style={{ fontFamily: getQuestionFontFamily(firstQuestion.fontFamily) }}
                  dangerouslySetInnerHTML={{ __html: firstQuestion.question || 'Question preview will appear here.' }}
                />
                {firstQuestion.image && (
                  <div className="mt-3 rounded-xl bg-white/10 p-2">
                    <img src={firstQuestion.image} alt="Question preview" className="max-h-32 w-full rounded-lg object-contain" />
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {firstQuestion.options.map((option, idx) => {
                    const isCorrect = Number(firstQuestion.correct) === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                          isCorrect ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-white/20 bg-white text-slate-700'
                        }`}
                        style={{ fontFamily: getQuestionFontFamily(firstQuestion.fontFamily) }}
                        dangerouslySetInnerHTML={{ __html: `${String.fromCharCode(65 + idx)}) ${option.text || `Option ${idx + 1}`}` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-[#2e266b] p-3 text-white">
                <div className="text-[10px] font-bold uppercase text-white/60">Day 1</div>
                <div className="mt-1 line-clamp-2 text-sm font-black">{form.title || 'Daily Practice Set'}</div>
                <div className="mt-3 flex gap-2">
                  <span className="flex-1 rounded-full border border-white/40 px-3 py-2 text-center text-[10px] font-black">Revision</span>
                  <span className="flex-1 rounded-full bg-white px-3 py-2 text-center text-[10px] font-black text-[#2e266b]">
                    {form.buttonLabel || 'Start Test'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <label className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
              <input
                type="checkbox"
                checked={form.loopEnabled}
                onChange={(e) => setField('loopEnabled', e.target.checked)}
                className="mt-1 h-4 w-4 accent-amber-600"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-black text-slate-850">
                  <Repeat size={14} /> Repeat target
                </span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">Cycle settings</span>
              </span>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Cycle Days</label>
                <input
                  type="number"
                  min="1"
                  disabled={!form.loopEnabled}
                  className="input disabled:bg-slate-100 disabled:text-slate-400"
                  value={form.loopCycleDays}
                  onChange={(e) => setField('loopCycleDays', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-500">Loop End</label>
                <input
                  type="date"
                  disabled={!form.loopEnabled}
                  className="input disabled:bg-slate-100 disabled:text-slate-400"
                  value={form.loopEndsAt}
                  onChange={(e) => setField('loopEndsAt', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <label className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-700">
              <span>Active on dashboard</span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="h-4 w-4 accent-[#2e266b]"
              />
            </label>
            <button
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 disabled:opacity-60"
            >
              <Save size={16} /> {saving ? 'Saving...' : editingId ? 'Update Target' : 'Create Target'}
            </button>
          </div>
        </aside>
      </form>

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-850">Configured Targets</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">{targets.length} total targets</p>
          </div>
          <div className="relative max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search targets..."
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm font-semibold text-slate-400">Loading...</div>
        ) : filteredTargets.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <ListChecks size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">No daily targets found</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredTargets.map((target) => (
              <div key={target._id} className="rounded-3xl bg-[#2e266b] p-4 text-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-wide">
                      <span className="rounded-full bg-white/15 px-2 py-0.5">{target.questionsTarget || 0} Qs</span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5">{target.durationMins || 0} min</span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5">Priority {target.priority || 0}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-black leading-snug">{target.title}</h3>
                    {target.description && (
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-white/60">{target.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                    target.isActive ? 'bg-teal-400 text-[#182042]' : 'bg-white/15 text-white/70'
                  }`}>
                    {target.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} /> {formatShortDate(target.startDate)} - {formatShortDate(target.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> {audienceLabels[target.audience?.type || 'all']}
                  </span>
                  {target.loopEnabled && (
                    <span className="inline-flex items-center gap-1">
                      <Repeat size={13} /> {target.loopCycleDays || 15}d loop
                    </span>
                  )}
                </div>

                {(target.categories || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(target.categories || []).map((category) => (
                      <span key={category} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#2e266b]">{category}</span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-white/60">
                    <Clock3 size={12} /> Daily Set
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editTarget(target)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" title="Edit">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => toggleActive(target)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" title={target.isActive ? 'Pause' : 'Activate'}>
                      {target.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => deleteTarget(target)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-rose-500" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
