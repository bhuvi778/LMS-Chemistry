import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Upload,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  CheckCircle,
  FileText,
} from 'lucide-react';

const RICH_TEXT_OPTS = {
  height: 120,
  buttonList: [
    ['bold', 'underline', 'italic', 'strike'],
    ['font', 'fontSize'],
    ['fontColor', 'hiliteColor'],
    ['subscript', 'superscript'],
    ['removeFormat'],
    ['image'],
  ],
};

const blankQ = () => ({
  _tempId: Math.random().toString(36).slice(2),
  question: '',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correct: 0,
  correctOptions: [],
  correctNumerical: 0,
  type: 'mcq',
  videoSolutionUrl: '',
  explanation: '',
  marks: 4,
  negativeMarks: -1,
  partialMarking: true,
  partialMarkingMethod: 'correct_count',
  image: '',
  section: '',
  chapter: '',
  topic: '',
});

function QuestionCard({ q, idx, onChange, onDelete, onMove, total, sections }) {
  const [open, setOpen] = useState(!q._id);
  // Strip HTML tags for title preview
  const plainText = q.question ? q.question.replace(/<[^>]*>/g, '').slice(0, 60) : '';
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <GripVertical size={16} className="text-slate-400" />
        <span className="font-semibold text-slate-700 flex-1 text-sm">
          Q{idx + 1}. {plainText ? plainText + (q.question.replace(/<[^>]*>/g, '').length > 60 ? '…' : '') : 'New Question'}
        </span>
        <div className="flex items-center gap-1 mr-2">
          <button
            type="button"
            disabled={idx === 0}
            onClick={(e) => { e.stopPropagation(); onMove(idx, -1); }}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={idx === total - 1}
            onClick={(e) => { e.stopPropagation(); onMove(idx, 1); }}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </div>
      {open && (
        <div className="p-4 space-y-4">
          {/* Section Selector */}
          {sections && sections.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">ASSIGN TO SECTION</label>
              <select
                className="w-full sm:w-64 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400 bg-white font-medium"
                value={q.section || ''}
                onChange={(e) => onChange(idx, 'section', e.target.value)}
              >
                <option value="">— Select a Section —</option>
                {sections.filter(s => s.name?.trim() !== '').map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Question Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">QUESTION TYPE</label>
            <select
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400 bg-white"
              value={q.type || 'mcq'}
              onChange={(e) => {
                const newType = e.target.value;
                onChange(idx, 'type', newType);
                if (newType === 'msq') {
                  onChange(idx, 'correctOptions', q.correctOptions || [q.correct || 0]);
                } else if (newType === 'numerical') {
                  onChange(idx, 'correctNumerical', q.correctNumerical || 0);
                }
              }}
            >
              <option value="mcq">Multiple Choice Question (MCQ)</option>
              <option value="msq">Multiple Select Question (MSQ)</option>
              <option value="numerical">Numerical Value Question</option>
            </select>
          </div>

          {/* Question Text - Rich Editor */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">QUESTION TEXT</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <SunEditor
                key={`q-${q._tempId || q._id}`}
                defaultValue={q.question || ''}
                onChange={(c) => onChange(idx, 'question', c)}
                setOptions={RICH_TEXT_OPTS}
              />
            </div>
          </div>

          {/* Options - Rich Editor per option */}
          {(q.type || 'mcq') !== 'numerical' ? (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-2 block font-bold">
                {q.type === 'msq'
                  ? 'OPTIONS — select all correct options (checkboxes)'
                  : 'OPTIONS — select the correct option (radio)'}
              </label>
              <div className="space-y-3">
                {q.options.map((opt, oi) => {
                  const isMsq = q.type === 'msq';
                  const isCorrect = isMsq
                    ? (q.correctOptions || []).includes(oi)
                    : q.correct === oi;

                  return (
                    <div key={oi} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isMsq) {
                            const current = q.correctOptions || [];
                            const nextOpts = current.includes(oi)
                              ? current.filter((item) => item !== oi)
                              : [...current, oi].sort();
                            onChange(idx, 'correctOptions', nextOpts);
                          } else {
                            onChange(idx, 'correct', oi);
                          }
                        }}
                        className={`w-5 h-5 flex-shrink-0 transition mt-3 flex items-center justify-center border-2 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 bg-white'
                        } ${isMsq ? 'rounded' : 'rounded-full'}`}
                      >
                        {isCorrect && (
                          isMsq ? (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          ) : (
                            <span className="block w-3.5 h-3.5 rounded-full bg-white scale-50" />
                          )
                        )}
                      </button>
                      <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider select-none">
                          <span>Option {String.fromCharCode(65 + oi)} {oi === 4 ? <span className="text-amber-600 font-bold normal-case ml-1 text-[9px] bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">(Optional)</span> : ''}</span>
                        </div>
                        <SunEditor
                          key={`opt-${q._tempId || q._id}-${oi}`}
                          defaultValue={opt.text || ''}
                          onChange={(c) => {
                            const opts = [...q.options];
                            opts[oi] = { ...opts[oi], text: c };
                            onChange(idx, 'options', opts);
                          }}
                          setOptions={{ ...RICH_TEXT_OPTS, height: 80 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">CORRECT NUMERICAL VALUE</label>
              <input
                type="number"
                step="any"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="e.g. 5.23 or -12"
                value={q.correctNumerical ?? ''}
                onChange={(e) => onChange(idx, 'correctNumerical', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">MARKS (+)</label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
                value={q.marks}
                onChange={(e) => onChange(idx, 'marks', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">NEGATIVE MARKS</label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
                value={q.negativeMarks}
                onChange={(e) => onChange(idx, 'negativeMarks', Number(e.target.value))}
              />
            </div>
          </div>

          {q.type === 'msq' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">PARTIAL MARKING</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400 bg-white font-medium"
                  value={q.partialMarking !== false ? 'true' : 'false'}
                  onChange={(e) => onChange(idx, 'partialMarking', e.target.value === 'true')}
                >
                  <option value="true">ON (Enabled)</option>
                  <option value="false">OFF (Disabled)</option>
                </select>
              </div>
              {q.partialMarking !== false && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">PARTIAL MARKING METHOD</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400 bg-white font-medium"
                    value={q.partialMarkingMethod || 'correct_count'}
                    onChange={(e) => onChange(idx, 'partialMarkingMethod', e.target.value)}
                  >
                    <option value="correct_count">Correct Count (1 mark per option)</option>
                    <option value="percentage_based">Percentage Based (Proportional to total correct)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">CHAPTER (optional)</label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
                placeholder="e.g. Chemical Bonding"
                value={q.chapter || ''}
                onChange={(e) => onChange(idx, 'chapter', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">TOPIC (optional)</label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
                placeholder="e.g. Hybridization"
                value={q.topic || ''}
                onChange={(e) => onChange(idx, 'topic', e.target.value)}
              />
            </div>
          </div>

          {/* Video Solution Link (YT/Bunny) */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">VIDEO SOLUTION LINK (YT / Bunny.net URL - optional)</label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
              placeholder="e.g. https://www.youtube.com/watch?v=... or bunny.net video URL"
              value={q.videoSolutionUrl || ''}
              onChange={(e) => onChange(idx, 'videoSolutionUrl', e.target.value)}
            />
          </div>

          {/* Explanation - Rich Editor */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block font-bold">EXPLANATION (optional)</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <SunEditor
                key={`exp-${q._tempId || q._id}`}
                defaultValue={q.explanation || ''}
                onChange={(c) => onChange(idx, 'explanation', c)}
                setOptions={{ ...RICH_TEXT_OPTS, height: 100 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatDateTimeLocal = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminTestForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get('duplicateFrom');
  const isEdit = !!id && id !== 'new';
  const pdfRef = useRef(null);
  const solPdfRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    syllabus: '',
    subject: 'Chemistry',
    topics: [],
    difficulty: 'intermediate',
    durationMins: 60,
    passMarks: 0,
    isFree: false,
    isActive: true,
    isPublished: true,
    testType: 'test_series',
    displayMode: 'standalone', // standalone | series_only | both
    liveStartDate: '',
    liveEndDate: '',
    categories: [],
    subCategories: [],
    attemptsAllowed: 0,
    maxQuestionsToAttempt: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    pdfUrl: '',
    pdfLabel: 'Question Paper',
    solutionPdfUrl: '',
    videoSolutionUrl: '',
    examTags: [],
    questions: [],
    isDailyTest: false,
    sections: [],
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ pdf: false, sol: false });
  const [topicInput, setTopicInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setAllCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const targetId = isEdit ? id : duplicateFrom;
    if (targetId) {
      api.get(`/tests/admin/tests/${targetId}`)
        .then(({ data }) => {
          // Normalize questions
          const questions = (data.questions || []).map((q) => {
            const opts = (q.options || []).map((o) =>
              typeof o === 'string' ? { text: o } : o
            );
            while (opts.length < 5) {
              opts.push({ text: '' });
            }
            return {
              ...q,
              _tempId: q._id || Math.random().toString(36).slice(2),
              type: q.type || 'mcq',
              correctOptions: q.correctOptions || [],
              correctNumerical: q.correctNumerical || 0,
              videoSolutionUrl: q.videoSolutionUrl || '',
              partialMarking: q.partialMarking !== false,
              partialMarkingMethod: q.partialMarkingMethod || 'correct_count',
              options: opts,
            };
          });
          const normalized = {
            ...data,
            questions,
            isActive: data.isActive !== false,
            testType: data.testType || 'test_series',
            categories: data.categories || [],
            subCategories: data.subCategories || [],
            attemptsAllowed: data.attemptsAllowed ?? 0,
            maxQuestionsToAttempt: data.maxQuestionsToAttempt ?? 0,
            shuffleQuestions: data.shuffleQuestions || false,
            shuffleOptions: data.shuffleOptions || false,
            videoSolutionUrl: data.videoSolutionUrl || '',
            isDailyTest: data.isDailyTest || false,
            liveStartDate: data.liveStartDate ? formatDateTimeLocal(data.liveStartDate) : '',
            liveEndDate: data.liveEndDate ? formatDateTimeLocal(data.liveEndDate) : '',
            sections: data.sections || [],
          };

          if (duplicateFrom) {
            delete normalized._id;
            delete normalized.slug;
            delete normalized.createdAt;
            delete normalized.updatedAt;
            normalized.title = `${normalized.title} (Copy)`;
          }

          setForm(normalized);
        })
        .catch((err) => toast.error(err.message));
    }
  }, [id, isEdit, duplicateFrom]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePdfUpload = async (file, type) => {
    if (!file) return;
    const key = type === 'pdf' ? 'pdf' : 'sol';
    setUploading((u) => ({ ...u, [key]: true }));
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/upload/pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded * 100) / p.total);
          toast.loading(`Uploading… ${pct}%`, { id: `pdf-${key}` });
        },
      });
      toast.success('File uploaded!', { id: `pdf-${key}` });
      if (type === 'pdf') set('pdfUrl', data.url);
      else set('solutionPdfUrl', data.url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: `pdf-${key}` });
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  const addQuestion = () =>
    setForm((f) => ({ ...f, questions: [...f.questions, blankQ()] }));

  const removeQ = (idx) =>
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));

  const changeQ = (idx, key, val) => {
    setForm((f) => {
      const qs = [...f.questions];
      qs[idx] = { ...qs[idx], [key]: val };
      return { ...f, questions: qs };
    });
  };

  const moveQ = (idx, dir) => {
    setForm((f) => {
      const qs = [...f.questions];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= qs.length) return f;
      [qs[idx], qs[swapIdx]] = [qs[swapIdx], qs[idx]];
      return { ...f, questions: qs };
    });
  };

  const addTopic = () => {
    const t = topicInput.trim();
    if (!t) return;
    setForm((f) => ({ ...f, topics: [...(f.topics || []), t] }));
    setTopicInput('');
  };

  const addTag = () => {
    const t = tagInput.trim().toUpperCase();
    if (!t) return;
    setForm((f) => ({ ...f, examTags: [...(f.examTags || []), t] }));
    setTagInput('');
  };

  const isOptionEmpty = (html) => {
    if (!html) return true;
    if (html.includes('<img') || html.includes('<svg') || html.includes('<iframe') || html.includes('<audio') || html.includes('<video')) {
      return false;
    }
    const clean = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    return clean.length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }

    // Validate section names
    if (form.sections && form.sections.length > 0) {
      const secNames = form.sections.map(s => s.name?.trim()).filter(Boolean);
      if (secNames.length !== form.sections.length) {
        toast.error('All sections must have a valid name');
        return;
      }
      const uniqueNames = new Set(secNames);
      if (uniqueNames.size !== secNames.length) {
        toast.error('Section names must be unique');
        return;
      }
    }

    // Validate questions and options
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      const qNum = i + 1;
      const plainText = q.question ? q.question.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() : '';
      if (!plainText) {
        toast.error(`Question ${qNum} text is required`);
        return;
      }

      if (q.type === 'mcq' || q.type === 'msq') {
        if (!q.options || q.options.length < 4) {
          toast.error(`Question ${qNum} must have at least 4 options`);
          return;
        }
        // Enforce first 4 options are not empty
        for (let oi = 0; oi < 4; oi++) {
          if (isOptionEmpty(q.options[oi]?.text)) {
            toast.error(`Question ${qNum}: Option ${String.fromCharCode(65 + oi)} cannot be empty`);
            return;
          }
        }
        // Check if correct option is set and valid
        if (q.type === 'mcq') {
          if (q.correct === undefined || q.correct === null || q.correct < 0 || q.correct >= q.options.length) {
            toast.error(`Question ${qNum}: Correct option must be selected`);
            return;
          }
          if (isOptionEmpty(q.options[q.correct]?.text)) {
            toast.error(`Question ${qNum}: Correct option cannot be an empty option`);
            return;
          }
        } else {
          // MSQ
          if (!q.correctOptions || q.correctOptions.length === 0) {
            toast.error(`Question ${qNum}: At least one correct option must be selected`);
            return;
          }
          for (const oi of q.correctOptions) {
            if (isOptionEmpty(q.options[oi]?.text)) {
              toast.error(`Question ${qNum}: Selected correct option ${String.fromCharCode(65 + oi)} cannot be empty`);
              return;
            }
          }
        }
      } else if (q.type === 'numerical') {
        if (q.correctNumerical === undefined || q.correctNumerical === null || q.correctNumerical === '' || isNaN(Number(q.correctNumerical))) {
          toast.error(`Question ${qNum}: Correct numerical value is required`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        questions: form.questions.map(({ _tempId, ...q }) => q),
        liveStartDate: form.testType === 'live_test' && form.liveStartDate ? new Date(form.liveStartDate) : null,
        liveEndDate: form.testType === 'live_test' && form.liveEndDate ? new Date(form.liveEndDate) : null,
      };
      if (isEdit) {
        await api.put(`/tests/admin/tests/${id}`, payload);
        toast.success('Test updated');
      } else {
        await api.post('/tests/admin/tests', payload);
        toast.success('Test created');
      }
      nav('/admin/tests');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/tests" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Test' : duplicateFrom ? 'Duplicate Test' : 'New Test'}</h1>
          <p className="text-sm text-slate-500">Create once, assign to multiple courses or test series</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? 'Update Test' : 'Create Test'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">TEST TITLE *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              placeholder="e.g. Organic Chemistry - Chapter 1 MCQ"
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
            <label className="text-xs font-semibold text-slate-500 mb-1 block">DIFFICULTY</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              value={form.difficulty}
              onChange={(e) => set('difficulty', e.target.value)}
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">DURATION (minutes)</label>
            <input
              type="number"
              min={5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              value={form.durationMins}
              onChange={(e) => set('durationMins', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">PASS MARKS</label>
            <input
              type="number"
              min={0}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              value={form.passMarks}
              onChange={(e) => set('passMarks', Number(e.target.value))}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">DESCRIPTION</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">INSTRUCTIONS (shown before test starts)</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
              rows={3}
              value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">SYLLABUS (written description)</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
              rows={3}
              placeholder="Enter syllabus details for this test..."
              value={form.syllabus || ''}
              onChange={(e) => set('syllabus', e.target.value)}
            />
          </div>
        </div>

        {/* Test Type */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-2 block">TEST TYPE</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'test_series', label: 'Test Series' },
                { value: 'previous_paper', label: 'Previous Paper' },
                { value: 'quiz', label: 'Quiz' },
                { value: 'live_test', label: 'Live Test' },
                { value: 'infinite_practice', label: 'Infinite Practice' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('testType', value)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${
                    form.testType === value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.testType === 'live_test' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">LIVE START TIME *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                  value={form.liveStartDate || ''}
                  onChange={(e) => set('liveStartDate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">LIVE END TIME *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                  value={form.liveEndDate || ''}
                  onChange={(e) => set('liveEndDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Display Mode — only for Previous Paper */}
          {form.testType === 'previous_paper' && (
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <label className="text-xs font-semibold text-slate-500 mb-2 block">DISPLAY MODE (Previous Paper)</label>
              <p className="text-xs text-slate-400 mb-3">Choose where this previous paper appears in the frontend.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'standalone', label: 'Standalone (PYQ Tab)', desc: 'Visible in Practice → PYQs tab' },
                  { value: 'series_only', label: 'Series Only', desc: 'Only shows inside a Test Series' },
                  { value: 'both', label: 'Both', desc: 'Shows in PYQ tab AND inside series' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('displayMode', value)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                      form.displayMode === value
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    <div>{label}</div>
                    <div className={`text-[10px] mt-0.5 font-normal ${form.displayMode === value ? 'text-white/70' : 'text-slate-400'}`}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        {allCategories.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-2 block">CATEGORIES</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allCategories.map((cat) => {
                const active = (form.categories || []).includes(cat.name);
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? form.categories.filter((c) => c !== cat.name)
                        : [...(form.categories || []), cat.name];
                      // Remove subcategories that no longer belong
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

        {/* Topics */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">TOPICS</label>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
              placeholder="e.g. Organic Chemistry"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
            />
            <button type="button" onClick={addTopic} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(form.topics || []).map((t, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                {t}
                <button type="button" onClick={() => setForm((f) => ({ ...f, topics: f.topics.filter((_, j) => j !== i) }))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Exam tags */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">EXAM TAGS (JEE, NEET, etc.)</label>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-400"
              placeholder="e.g. JEE, NEET"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
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

        {/* Access settings */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => set('isFree', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className="text-sm font-medium text-slate-700">Free Access (no login needed)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set('isPublished', e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Published (visible in portal)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDailyTest || false}
              onChange={(e) => set('isDailyTest', e.target.checked)}
              className="w-4 h-4 rounded accent-yellow-500"
            />
            <span className="text-sm font-medium text-slate-700">Daily Test (+2 Coins)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
        </div>
      </div>

      {/* Test Settings */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Test Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">ATTEMPTS ALLOWED <span className="font-normal text-slate-400">(0 = unlimited)</span></label>
            <input
              type="number"
              min={0}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
              value={form.attemptsAllowed}
              onChange={(e) => set('attemptsAllowed', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.shuffleQuestions}
              onChange={(e) => set('shuffleQuestions', e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Shuffle Questions</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.shuffleOptions}
              onChange={(e) => set('shuffleOptions', e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Shuffle Options</span>
          </label>
        </div>
      </div>

      {/* Sections Management */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="font-semibold text-slate-700">Test Sections</h2>
          <button
            type="button"
            onClick={() => {
              setForm((f) => ({
                ...f,
                sections: [...(f.sections || []), { name: '', attemptAllowed: 0 }]
              }));
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-650 hover:text-brand-800 transition"
          >
            <Plus size={14} /> Add Section
          </button>
        </div>
        
        {(!form.sections || form.sections.length === 0) ? (
          <p className="text-xs text-slate-450 italic">No sections created. The entire test will be treated as a single section.</p>
        ) : (
          <div className="space-y-3">
            {form.sections.map((sec, sIdx) => {
              const countAssigned = (form.questions || []).filter(q => q.section === sec.name && sec.name !== '').length;
              return (
                <div key={sIdx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 relative">
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 block">Section Name</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white font-medium"
                        placeholder="e.g. Section A"
                        value={sec.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const oldName = sec.name;
                          setForm((f) => {
                            const secs = [...f.sections];
                            secs[sIdx] = { ...secs[sIdx], name: val };
                            const qs = (f.questions || []).map(q => q.section === oldName ? { ...q, section: val } : q);
                            return { ...f, sections: secs, questions: qs };
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 block">Attempt Allowed (0 = all)</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white font-medium"
                        value={sec.attemptAllowed}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setForm((f) => {
                            const secs = [...f.sections];
                            secs[sIdx] = { ...secs[sIdx], attemptAllowed: val };
                            return { ...f, sections: secs };
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-md">
                      Attempt {sec.attemptAllowed > 0 ? sec.attemptAllowed : countAssigned} of {countAssigned} Qs
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => {
                          const secs = f.sections.filter((_, idx) => idx !== sIdx);
                          const qs = (f.questions || []).map(q => q.section === sec.name ? { ...q, section: '' } : q);
                          return { ...f, sections: secs, questions: qs };
                        });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-55 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF / File Upload */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Test Materials & Files</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Question Paper PDF */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">QUESTION PAPER FILE</label>
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="Paste URL or upload below"
                value={form.pdfUrl}
                onChange={(e) => set('pdfUrl', e.target.value)}
              />
            </div>
            <input ref={pdfRef} type="file" accept=".pdf,.doc,.docx,.zip,.txt,image/*" className="hidden" onChange={(e) => handlePdfUpload(e.target.files[0], 'pdf')} />
            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              disabled={uploading.pdf}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 w-full justify-center"
            >
              {uploading.pdf ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload File
            </button>
            {form.pdfUrl && (
              <a href={form.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 mt-2 text-xs text-brand-600 hover:underline">
                <FileText size={12} /> View uploaded File
              </a>
            )}
          </div>

          {/* Solution PDF */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">SOLUTION / ANSWER KEY FILE</label>
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="Paste URL or upload below"
                value={form.solutionPdfUrl}
                onChange={(e) => set('solutionPdfUrl', e.target.value)}
              />
            </div>
            <input ref={solPdfRef} type="file" accept=".pdf,.doc,.docx,.zip,.txt,image/*" className="hidden" onChange={(e) => handlePdfUpload(e.target.files[0], 'sol')} />
            <button
              type="button"
              onClick={() => solPdfRef.current?.click()}
              disabled={uploading.sol}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 w-full justify-center"
            >
              {uploading.sol ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload Solution File
            </button>
            {form.solutionPdfUrl && (
              <a href={form.solutionPdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 mt-2 text-xs text-brand-600 hover:underline">
                <FileText size={12} /> View solution File
              </a>
            )}
          </div>
        </div>

        {/* Video Solution */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">VIDEO SOLUTION URL <span className="font-normal text-slate-400">(YouTube / embed link)</span></label>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
            placeholder="https://youtube.com/watch?v=..."
            value={form.videoSolutionUrl}
            onChange={(e) => set('videoSolutionUrl', e.target.value)}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-700">Questions</h2>
            <p className="text-xs text-slate-400">{form.questions.length} questions — total marks: {form.questions.reduce((s, q) => s + (q.marks || 4), 0)}</p>
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>

        {form.questions.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            No questions yet. Click "Add Question" to begin.
          </div>
        )}

        <div className="space-y-3">
          {form.questions.map((q, idx) => (
            <QuestionCard
              key={q._tempId || q._id || idx}
              q={q}
              idx={idx}
              total={form.questions.length}
              onChange={changeQ}
              onDelete={removeQ}
              onMove={moveQ}
              sections={form.sections || []}
            />
          ))}
        </div>

        {form.questions.length > 0 && (
          <button
            type="button"
            onClick={addQuestion}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-brand-300 hover:text-brand-600"
          >
            <Plus size={15} /> Add Another Question
          </button>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Link to="/admin/tests" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? 'Update Test' : 'Create Test'}
        </button>
      </div>
    </form>
  );
}
