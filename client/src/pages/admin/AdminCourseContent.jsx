import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  PlayCircle,
  FileText,
  ClipboardList,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Video,
  Upload,
  Link as LinkIcon,
  Calendar,
  Clock,
  ExternalLink,
  Layers,
  BookMarked,
  BookOpen,
  BarChart2,
  Download,
  ChevronRight,
  Lock,
  Unlock,
  ListChecks,
  Search,
  Bell,
} from 'lucide-react';

// ─── Lessons Tab ──────────────────────────────────────────────────────────────
function LessonsTab({ courseId }) {
  const [lessons, setLessons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/course-content/admin/lessons/${courseId}`).then((r) => setLessons(r.data));

  useEffect(() => { load(); }, [courseId]);

  const blankLesson = { title: '', videoUrl: '', duration: '', notes: '', isFree: false };

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    if (!editing.videoUrl.trim()) { toast.error('Video URL is required'); return; }
    setSaving(true);
    try {
      if (editing._id) {
        await api.put(`/course-content/admin/lessons/${courseId}/${editing._id}`, editing);
        toast.success('Lesson updated');
      } else {
        await api.post(`/course-content/admin/lessons/${courseId}`, editing);
        toast.success('Lesson added');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    await api.delete(`/course-content/admin/lessons/${courseId}/${lessonId}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Video Classes</h2>
          <p className="text-sm text-slate-500">Add recorded video lessons. Supports YouTube links or Bunny.net video embeds.</p>
        </div>
        <button onClick={() => setEditing(blankLesson)} className="btn-primary">
          <Plus size={15} /> Add Lesson
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div className="card p-6 mb-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{editing._id ? 'Edit Lesson' : 'New Lesson'}</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                required
                className="input"
                value={editing.title}
                onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Chapter 1 – Atomic Structure"
              />
            </div>

            {/* Video Input */}
            <div>
              <label className="label">Video URL *</label>
              <input
                required
                className="input"
                value={editing.videoUrl || ''}
                onChange={(e) => setEditing((f) => ({ ...f, videoUrl: e.target.value }))}
                placeholder="Paste YouTube or Bunny.net embed URL"
              />
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="bg-slate-50 rounded-lg p-2 border">
                  <div className="font-semibold text-slate-700 mb-0.5">YouTube</div>
                  youtube.com/watch?v=… or youtu.be/…
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border">
                  <div className="font-semibold text-slate-700 mb-0.5">Bunny.net</div>
                  iframe.mediadelivery.net/embed/…
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Duration</label>
                <input
                  className="input"
                  value={editing.duration || ''}
                  onChange={(e) => setEditing((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 45 min"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={editing.isFree || false}
                  onChange={(e) => setEditing((f) => ({ ...f, isFree: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600"
                />
                <label htmlFor="isFree" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Free preview (visible without enrollment)
                </label>
              </div>
            </div>
            <div>
              <label className="label">Notes / Description</label>
              <textarea
                className="input min-h-[80px]"
                value={editing.notes || ''}
                onChange={(e) => setEditing((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Brief description or chapter notes…"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Lesson'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson List */}
      <div className="space-y-2">
        {lessons.length === 0 && !editing && (
          <div className="card p-10 text-center text-slate-500">
            No lessons yet. Click "Add Lesson" to add the first class.
          </div>
        )}
        {lessons.map((l, i) => (
          <div key={l._id} className="card p-4 flex items-center gap-3">
            <GripVertical size={16} className="text-slate-300 shrink-0" />
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 grid place-items-center text-xs font-bold shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 line-clamp-1">{l.title}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                {l.duration && <span>{l.duration}</span>}
                {l.videoUrl && (
                  <span className="text-brand-600 flex items-center gap-1">
                    <PlayCircle size={11} />
                    {l.videoUrl.includes('youtube') || l.videoUrl.includes('youtu.be') ? 'YouTube' :
                     (l.videoUrl.includes('bunny.net') || l.videoUrl.includes('mediadelivery.net')) ? 'Bunny.net' : 'Video'}
                  </span>
                )}
                {l.isFree && <span className="text-emerald-600">Free preview</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditing(l)}
                className="btn-outline !py-1.5 !px-2.5 text-xs"
              >
                <Edit size={13} />
              </button>
              <button
                onClick={() => del(l._id)}
                className="btn !py-1.5 !px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PDFs Tab ─────────────────────────────────────────────────────────────────
function PdfsTab({ courseId }) {
  const [pdfs, setPdfs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(true);
  const pdfInputRef = useRef(null);

  const load = () =>
    api.get(`/course-content/admin/pdfs/${courseId}`).then((r) => setPdfs(r.data));

  useEffect(() => { load(); }, [courseId]);

  const blank = { title: '', description: '', fileUrl: '', order: 0, isActive: true };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be under 50 MB'); return; }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/upload/pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded * 100) / p.total);
          toast.loading(`Uploading… ${pct}%`, { id: 'pdfup' });
        },
      });
      toast.success('File uploaded!', { id: 'pdfup' });
      setEditing((f) => ({ ...f, fileUrl: data.url }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: 'pdfup' });
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title.trim() || !editing.fileUrl.trim()) {
      toast.error('Title and file URL are required');
      return;
    }
    setSaving(true);
    try {
      if (editing._id) {
        await api.put(`/course-content/admin/pdfs/${editing._id}`, editing);
        toast.success('File updated');
      } else {
        await api.post(`/course-content/admin/pdfs/${courseId}`, editing);
        toast.success('File added');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this file?')) return;
    await api.delete(`/course-content/admin/pdfs/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">File / Notes</h2>
          <p className="text-sm text-slate-500">Upload files directly or link from Google Drive / OneDrive.</p>
        </div>
        <button onClick={() => { setEditing(blank); setUrlMode(true); }} className="btn-primary">
          <Plus size={15} /> Add File
        </button>
      </div>

      {editing && (
        <div className="card p-6 mb-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{editing._id ? 'Edit File' : 'New File'}</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                required
                className="input"
                value={editing.title}
                onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Chapter 1 Notes – Atomic Structure"
              />
            </div>

            {/* File Source Toggle */}
            <div>
              <label className="label">File Source</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setUrlMode(true)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition ${
                    urlMode ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  <LinkIcon size={14} /> Paste URL
                </button>
                <button type="button" onClick={() => setUrlMode(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition ${
                    !urlMode ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  <Upload size={14} /> Upload File
                </button>
              </div>

              {urlMode ? (
                <div>
                  <input
                    className="input"
                    value={editing.fileUrl}
                    onChange={(e) => setEditing((f) => ({ ...f, fileUrl: e.target.value }))}
                    placeholder="https://drive.google.com/file/d/… or direct file link"
                  />
                  <p className="text-xs text-slate-400 mt-1">Google Drive, OneDrive, Dropbox or direct file URL</p>
                </div>
              ) : (
                <div>
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-brand-600">
                        <Loader2 size={28} className="animate-spin" />
                        <span className="text-sm font-semibold">Uploading File…</span>
                      </div>
                    ) : editing.fileUrl && editing.fileUrl.startsWith('/uploads/') ? (
                      <div className="flex flex-col items-center gap-2 text-emerald-600">
                        <FileText size={28} />
                        <span className="text-sm font-semibold">File uploaded ✓</span>
                        <span className="text-xs text-slate-500">{editing.fileUrl.split('/').pop()}</span>
                        <span className="text-xs text-brand-600">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload size={28} />
                        <span className="text-sm font-semibold">Click to select File (PDF, Word, ZIP, Images, Text)</span>
                        <span className="text-xs">Max 50 MB</span>
                      </div>
                    )}
                  </div>
                  <input ref={pdfInputRef} type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed,text/plain,image/*" className="hidden"
                    onChange={(e) => handlePdfUpload(e.target.files?.[0])} />
                </div>
              )}

              {editing.fileUrl && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                  <FileText size={13} />
                  <span className="truncate flex-1">{editing.fileUrl}</span>
                  <button type="button" onClick={() => setEditing((f) => ({ ...f, fileUrl: '' }))}
                    className="shrink-0 text-rose-500 hover:text-rose-700"><X size={13} /></button>
                </div>
              )}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[70px]"
                value={editing.description || ''}
                onChange={(e) => setEditing((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this material…"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Display Order</label>
                <input type="number" className="input" value={editing.order || 0}
                  onChange={(e) => setEditing((f) => ({ ...f, order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="pdfActive" checked={editing.isActive !== false}
                  onChange={(e) => setEditing((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600" />
                <label htmlFor="pdfActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Active (visible to students)
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving || uploading} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save File'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {pdfs.length === 0 && !editing && (
          <div className="col-span-full card p-10 text-center text-slate-500">
            No files yet. Click "Add File" to add study material.
          </div>
        )}
        {pdfs.map((pdf) => (
          <div key={pdf._id} className={`card p-4 ${!pdf.isActive ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 grid place-items-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 line-clamp-2">{pdf.title}</div>
                {pdf.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{pdf.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {!pdf.isActive && <span className="text-xs text-slate-400">(Hidden)</span>}
                  {pdf.fileUrl && (
                    <a href={pdf.fileUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-brand-600 flex items-center gap-1 hover:underline">
                      <ExternalLink size={11} /> Preview
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setEditing(pdf); setUrlMode(!pdf.fileUrl || !pdf.fileUrl.startsWith('/uploads/')); }}
                className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1">
                <Edit size={13} /> Edit
              </button>
              <button onClick={() => del(pdf._id)}
                className="btn !py-1.5 !px-3 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100 flex items-center gap-1">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tests Tab ────────────────────────────────────────────────────────────────
function TestsTab({ courseId }) {
  const [tests, setTests] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedTest, setExpandedTest] = useState(null);

  const load = () =>
    api.get(`/course-content/admin/tests/${courseId}`).then((r) => setTests(r.data));

  useEffect(() => { load(); }, [courseId]);

  const blank = {
    title: '',
    description: '',
    durationMins: 30,
    order: 0,
    isActive: true,
    questions: [],
  };

  const addQuestion = () =>
    setEditing((f) => ({
      ...f,
      questions: [...(f.questions || []), { question: '', options: ['', '', '', ''], correct: 0, explanation: '' }],
    }));

  const updateQ = (qi, field, val) =>
    setEditing((f) => {
      const questions = [...f.questions];
      questions[qi] = { ...questions[qi], [field]: val };
      return { ...f, questions };
    });

  const updateOption = (qi, oi, val) =>
    setEditing((f) => {
      const questions = [...f.questions];
      const options = [...questions[qi].options];
      options[oi] = val;
      questions[qi] = { ...questions[qi], options };
      return { ...f, questions };
    });

  const removeQuestion = (qi) =>
    setEditing((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== qi),
    }));

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    for (const q of editing.questions) {
      if (!q.question.trim()) { toast.error('All questions need text'); return; }
      if (q.options.some((o) => !o.trim())) { toast.error('All options must be filled'); return; }
    }
    setSaving(true);
    try {
      if (editing._id) {
        await api.put(`/course-content/admin/tests/${editing._id}`, editing);
        toast.success('Test updated');
      } else {
        await api.post(`/course-content/admin/tests/${courseId}`, editing);
        toast.success('Test created');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this test?')) return;
    await api.delete(`/course-content/admin/tests/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Tests / Quizzes</h2>
          <p className="text-sm text-slate-500">Create MCQ tests for enrolled students to practice.</p>
        </div>
        <button onClick={() => setEditing(blank)} className="btn-primary">
          <Plus size={15} /> Create Test
        </button>
      </div>

      {editing && (
        <div className="card p-6 mb-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{editing._id ? 'Edit Test' : 'New Test'}</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>
          <form onSubmit={save} className="space-y-4">
            {/* Test meta */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Test Title *</label>
                <input
                  required
                  className="input"
                  value={editing.title}
                  onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Chapter 1 Practice Test"
                />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={editing.durationMins}
                  onChange={(e) => setEditing((f) => ({ ...f, durationMins: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[60px]"
                value={editing.description || ''}
                onChange={(e) => setEditing((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional instructions for students…"
              />
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-semibold text-sm text-slate-700">
                  Questions ({editing.questions.length})
                </label>
                <button type="button" onClick={addQuestion} className="btn-outline text-xs flex items-center gap-1">
                  <Plus size={13} /> Add Question
                </button>
              </div>
              <div className="space-y-4">
                {editing.questions.map((q, qi) => (
                  <div key={qi} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Question {qi + 1}</span>
                      <button type="button" onClick={() => removeQuestion(qi)} className="text-rose-400 hover:text-rose-600">
                        <X size={15} />
                      </button>
                    </div>
                    <div>
                      <label className="label">Question Text</label>
                      <textarea
                        className="input min-h-[60px]"
                        value={q.question}
                        onChange={(e) => updateQ(qi, 'question', e.target.value)}
                        placeholder="Type your question…"
                      />
                    </div>
                    <div>
                      <label className="label">Options <span className="text-xs font-normal text-slate-400">(mark correct with radio)</span></label>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-q${qi}`}
                              checked={q.correct === oi}
                              onChange={() => updateQ(qi, 'correct', oi)}
                              className="w-4 h-4 accent-brand-600 shrink-0"
                            />
                            <input
                              className="input flex-1 text-sm"
                              value={opt}
                              onChange={(e) => updateOption(qi, oi, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            />
                            {q.correct === oi && (
                              <span className="text-xs text-emerald-600 font-semibold shrink-0">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Explanation <span className="text-xs font-normal text-slate-400">(shown after submit)</span></label>
                      <input
                        className="input text-sm"
                        value={q.explanation || ''}
                        onChange={(e) => updateQ(qi, 'explanation', e.target.value)}
                        placeholder="Optional explanation for the correct answer…"
                      />
                    </div>
                  </div>
                ))}
                {editing.questions.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
                    No questions yet. Click "Add Question" above.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Test'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {tests.length === 0 && !editing && (
          <div className="card p-10 text-center text-slate-500">
            No tests yet. Click "Create Test" to add the first test.
          </div>
        )}
        {tests.map((t) => (
          <div key={t._id} className={`card overflow-hidden ${!t.isActive ? 'opacity-60' : ''}`}>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 grid place-items-center shrink-0">
                <ClipboardList size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{t.title}</div>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{t.questions?.length || 0} questions</span>
                  {t.durationMins > 0 && <span>• {t.durationMins} min</span>}
                  {!t.isActive && <span className="text-slate-400">• Hidden</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setExpandedTest(expandedTest === t._id ? null : t._id)}
                  className="btn-outline !py-1.5 !px-2.5 text-xs"
                >
                  {expandedTest === t._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button onClick={() => setEditing(t)} className="btn-outline !py-1.5 !px-2.5 text-xs">
                  <Edit size={13} />
                </button>
                <button
                  onClick={() => del(t._id)}
                  className="btn !py-1.5 !px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {expandedTest === t._id && t.questions?.length > 0 && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
                {t.questions.map((q, i) => (
                  <div key={q._id || i} className="text-sm">
                    <span className="font-semibold text-slate-700">Q{i + 1}.</span>{' '}
                    <span className="text-slate-600">{q.question}</span>
                    {q.options?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {q.options.map((o, j) => (
                          <span
                            key={j}
                            className={`px-2 py-0.5 rounded text-xs ${j === q.correct ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'bg-slate-100 text-slate-600'}`}
                          >
                            {j === q.correct ? '✓ ' : ''}{o}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live Classes Tab ─────────────────────────────────────────────────────────
function LiveClassesTab({ courseId }) {
  const [classes, setClasses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);

  const load = () =>
    api.get(`/admin/live-classes?course=${courseId}`)
      .then((r) => {
        const list = r.data.liveClasses || r.data || [];
        setClasses(list.filter((c) => {
          const matchedCourse = c.course === courseId || c.course?._id === courseId;
          const matchedCourses = c.courses?.some(cid => (cid === courseId || cid?._id === courseId));
          return matchedCourse || matchedCourses;
        }));
      })
      .catch(() => setClasses([]));

  useEffect(() => {
    load();
    Promise.all([
      api.get('/courses?includeUnpublished=true').then((r) => r.data || []).catch(() => []),
      api.get('/courses?includeUnpublished=true&isPowerCourse=true').then((r) => r.data || []).catch(() => []),
    ]).then(([normalCourses, powerCourses]) => {
      const merged = [...normalCourses, ...powerCourses];
      const unique = Array.from(new Map(merged.map((c) => [c._id, c])).values());
      setCourses(unique);
    });
  }, [courseId]);

  const blank = {
    title: '',
    scheduledAt: '',
    durationMins: 60,
    instructor: '',
    platform: 'agora_call', // agora_call | agora_stream | agora_interactive | agora_broadcast | youtube | zoom | meet
    meetingUrl: '',
    meetLink: '',
    description: '',
    isActive: true,
    courses: [courseId],
    course: courseId,
  };

  const fmtDateTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const statusBadge = (cls) => {
    const now = new Date();
    const start = new Date(cls.scheduledAt);
    const end = new Date(start.getTime() + (cls.durationMins || 60) * 60000);
    if (now >= start && now <= end) return { label: 'LIVE NOW', cls: 'bg-red-100 text-red-700 animate-pulse' };
    if (now > end) return { label: 'Ended', cls: 'bg-slate-100 text-slate-500' };
    return { label: 'Upcoming', cls: 'bg-emerald-100 text-emerald-700' };
  };

  const platformLabel = (p) =>
    ({
      agora_call: 'Ace Video Call',
      agora_stream: 'Ace Stream (Legacy)',
      agora_interactive: 'Ace Interactive',
      agora_broadcast: 'Ace Broadcast',
      youtube: 'YouTube Live',
      zoom: 'Zoom Meeting',
      meet: 'Google Meet',
    })[p] || p;

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title.trim() || !editing.scheduledAt) {
      toast.error('Title and scheduled date/time are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...editing };
      if (!payload.platform) {
        payload.platform = 'agora_call';
      }
      if (['zoom', 'meet', 'youtube'].includes(payload.platform)) {
        payload.useInternalRoom = false;
        payload.meetLink = payload.meetingUrl || payload.meetLink || '';
        payload.meetingUrl = payload.meetLink;
      } else {
        payload.useInternalRoom = true;
        payload.meetLink = '';
        payload.meetingUrl = '';
      }
      if (editing._id) {
        await api.put(`/admin/live-classes/${editing._id}`, payload);
        toast.success('Class updated');
      } else {
        await api.post('/admin/live-classes', payload);
        toast.success('Class scheduled!');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this live class?')) return;
    await api.delete(`/admin/live-classes/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Live Classes</h2>
          <p className="text-sm text-slate-500">Schedule live sessions via Zoom, Google Meet, or in-app room.</p>
        </div>
        <button onClick={() => setEditing(blank)} className="btn-primary">
          <Plus size={15} /> Schedule Class
        </button>
      </div>

      {editing && (
        <div className="card p-6 mb-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{editing._id ? 'Edit Live Class' : 'New Live Class'}</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Class Title *</label>
              <input required className="input" value={editing.title}
                onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Doubt Clearing Session – Organic Chemistry" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Scheduled Date & Time *</label>
                <input required type="datetime-local" className="input"
                  value={editing.scheduledAt ? editing.scheduledAt.slice(0, 16) : ''}
                  onChange={(e) => setEditing((f) => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input type="number" min="15" max="480" className="input"
                  value={editing.durationMins || 60}
                  onChange={(e) => setEditing((f) => ({ ...f, durationMins: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Instructor Name</label>
                <input className="input" value={editing.instructor || ''}
                  onChange={(e) => setEditing((f) => ({ ...f, instructor: e.target.value }))}
                  placeholder="e.g. Dr. Sharma" />
              </div>
              <div>
                <label className="label">Platform</label>
                <select className="input" value={editing.platform || 'agora_call'}
                  onChange={(e) => setEditing((f) => ({ ...f, platform: e.target.value }))}>
                  <option value="agora_call">Ace Video Call (All Participants)</option>
                  <option value="agora_interactive">Ace Interactive Live Stream (Raise Hand / Co-host)</option>
                  <option value="agora_broadcast">Ace One-Way Broadcast (No Interaction)</option>
                  <option value="agora_stream">Ace Stream (Legacy)</option>
                  <option value="youtube">YouTube Live Stream</option>
                  <option value="zoom">Zoom Meeting</option>
                  <option value="meet">Google Meet</option>
                </select>
              </div>
            </div>

            {['zoom', 'meet', 'youtube'].includes(editing.platform) && (
              <div>
                <label className="label">
                  {editing.platform === 'youtube' ? 'YouTube Stream / Video URL *' : 'Meeting URL *'}
                </label>
                <input
                  required
                  type="url"
                  className="input"
                  value={editing.meetingUrl || editing.meetLink || ''}
                  onChange={(e) => {
                    setEditing((f) => ({ ...f, meetingUrl: e.target.value, meetLink: e.target.value }));
                  }}
                  placeholder={
                    editing.platform === 'youtube'
                      ? 'e.g. https://www.youtube.com/watch?v=...'
                      : 'e.g. https://zoom.us/j/...'
                  }
                />
              </div>
            )}

            <div>
              <label className="label">Linked Courses (Select one or more)</label>
              <div className="border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 bg-slate-55 bg-slate-50">
                {courses.map((c) => {
                  const selectedCourses = editing.courses || (editing.course ? [editing.course] : []);
                  const isSelected = selectedCourses.includes(c._id);
                  return (
                    <label key={c._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition text-xs">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          let nextCourses = [...selectedCourses];
                          if (e.target.checked) {
                            if (!nextCourses.includes(c._id)) nextCourses.push(c._id);
                          } else {
                            nextCourses = nextCourses.filter((id) => id !== c._id);
                          }
                          setEditing((prev) => ({
                            ...prev,
                            courses: nextCourses,
                            course: nextCourses[0] || null,
                            courseName: nextCourses.length > 0 
                              ? courses.find(x => x._id === nextCourses[0])?.title || ''
                              : ''
                          }));
                        }}
                      />
                      <span className="text-slate-700">
                        <span className="font-semibold text-slate-500 mr-1">[{c.category}]</span>
                        {c.title}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-800">
              <strong>Platform Info:</strong>{' '}
              {editing.platform === 'agora_call'
                ? 'Ace RTC Session: Everyone can turn on camera/microphone and speak directly (Video Calling).'
                : editing.platform === 'agora_interactive'
                  ? 'Ace RTC Session: Students join as audience but can raise hand to co-host and speak (Interactive).'
                  : editing.platform === 'agora_broadcast' || editing.platform === 'agora_stream'
                    ? 'Ace RTC Session: One-way broadcast stream from instructor to all students. No interaction.'
                    : editing.platform === 'youtube'
                      ? 'YouTube Live: Stream will be embedded inside the in-app room for students.'
                      : `External Platform: Students will be redirected to the provided ${editing.platform} link.`}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[70px]" value={editing.description || ''}
                onChange={(e) => setEditing((f) => ({ ...f, description: e.target.value }))}
                placeholder="Topics to be covered, instructions for students…" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="liveActive" checked={editing.isActive !== false}
                onChange={(e) => setEditing((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-brand-600" />
              <label htmlFor="liveActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Visible to students
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Class'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {classes.length === 0 && !editing && (
          <div className="card p-10 text-center text-slate-500">
            No live classes scheduled. Click "Schedule Class" to add one.
          </div>
        )}
        {classes.map((cls) => {
          const badge = statusBadge(cls);
          return (
            <div key={cls._id} className={`card p-4 flex items-start gap-4 ${!cls.isActive ? 'opacity-60' : ''}`}>
              <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 grid place-items-center shrink-0">
                <Video size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800">{cls.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  {!cls.isActive && <span className="text-xs text-slate-400">(Hidden)</span>}
                </div>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  {cls.scheduledAt && (
                    <span className="flex items-center gap-1"><Calendar size={11} />{fmtDateTime(cls.scheduledAt)}</span>
                  )}
                  {cls.durationMins && (
                    <span className="flex items-center gap-1"><Clock size={11} />{cls.durationMins} min</span>
                  )}
                  <span className="text-violet-600">{platformLabel(cls.platform)}</span>
                  {cls.courses && cls.courses.length > 1 && (
                    <span className="text-slate-450 font-semibold" title={cls.courses.map(c => c.title).join(', ')}>
                      (+{cls.courses.length - 1} other courses)
                    </span>
                  )}
                  {cls.instructor && <span>{cls.instructor}</span>}
                </div>
                {cls.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cls.description}</p>}
                {cls.meetingUrl && (
                  <a href={cls.meetingUrl} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    <ExternalLink size={11} /> Meeting Link
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing({
                  ...cls,
                  courses: cls.courses?.map(c => c._id || c) || (cls.course ? [cls.course._id || cls.course] : [])
                })} className="btn-outline !py-1.5 !px-2.5 text-xs">
                  <Edit size={13} />
                </button>
                <button onClick={() => del(cls._id)}
                  className="btn !py-1.5 !px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Subjects Tab ─────────────────────────────────────────────────────────────

const CONTENT_TYPES_ADMIN = [
  { key: 'videoClasses',   label: 'Video Classes',   icon: PlayCircle,    hasVideo: true,  hasPdf: false },
  { key: 'classNotes',     label: 'Class Notes',     icon: FileText,      hasVideo: false, hasPdf: true  },
  { key: 'tests',          label: 'Tests',           icon: ClipboardList, hasVideo: false, hasPdf: false, isTest: true },
  { key: 'dpps',           label: 'DPPs',            icon: BarChart2,     hasVideo: false, hasPdf: false, isTest: true },
  { key: 'pyqs',           label: 'PYQs',            icon: BookOpen,      hasVideo: false, hasPdf: false, isTest: true },
  { key: 'dppPdfs',        label: 'DPP PDFs',        icon: Download,      hasVideo: false, hasPdf: true  },
  { key: 'dppVideos',      label: 'DPP Videos',      icon: Video,         hasVideo: true,  hasPdf: false },
  { key: 'studyMaterials', label: 'Study Materials', icon: BookMarked,    hasVideo: false, hasPdf: true  },
  { key: 'assignmentsPdfs',   label: 'Assignments (in Pdf)',        icon: Download,      hasVideo: false, hasPdf: true  },
  { key: 'assignmentsVideos', label: 'Assignments Solutions (In Video)', icon: Video,         hasVideo: true,  hasPdf: false },
];

function ContentTypeSection({ chapterData, setChapterData, ctKey, courseId }) {
  const ct = CONTENT_TYPES_ADMIN.find((c) => c.key === ctKey);
  const items = chapterData[ctKey] || [];
  const Icon = ct.icon;
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    if (!courseId) return;
    let url = '';
    if (ct.hasVideo) {
      url = `/course-content/admin/lessons/${courseId}`;
    } else if (ct.hasPdf) {
      url = `/course-content/admin/pdfs/${courseId}`;
    } else if (ct.isTest) {
      url = `/course-content/admin/tests/${courseId}`;
    }

    if (url) {
      api.get(url)
        .then((res) => {
          setAvailableItems(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => {});
    }
  }, [courseId, ctKey]);

  const addItem = () => {
    const blank = ct.isTest
      ? { title: '', durationMins: 30, questionCount: 0, isFree: false, description: '' }
      : { title: '', videoUrl: '', fileUrl: '', duration: '', description: '', isFree: false };
    setChapterData((prev) => ({ ...prev, [ctKey]: [...(prev[ctKey] || []), { ...blank, _tmpId: Date.now() }] }));
  };

  const updateItem = (idx, field, value) => {
    setChapterData((prev) => {
      const arr = [...(prev[ctKey] || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [ctKey]: arr };
    });
  };

  const removeItem = (idx) => {
    setChapterData((prev) => {
      const arr = [...(prev[ctKey] || [])];
      arr.splice(idx, 1);
      return { ...prev, [ctKey]: arr };
    });
  };

  const handleFileUpload = async (file, idx) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB');
      return;
    }
    setUploadingIdx(idx);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/upload/pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded * 100) / p.total);
          toast.loading(`Uploading… ${pct}%`, { id: `item-upload-${idx}` });
        },
      });
      toast.success('Uploaded successfully!', { id: `item-upload-${idx}` });
      updateItem(idx, 'fileUrl', data.url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: `item-upload-${idx}` });
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Icon size={15} className="text-brand-600" /> {ct.label}
          {items.length > 0 && (
            <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">{items.length}</span>
          )}
        </span>
        <button onClick={addItem} className="flex items-center gap-1 text-xs text-brand-700 font-semibold hover:text-brand-900 transition">
          <Plus size={13} /> Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <div key={item._id || item._tmpId || idx} className="px-4 py-3 space-y-2">
              {availableItems.length > 0 && (
                <div className="flex gap-2 items-center">
                  <select
                    className="input flex-1 !py-1 !text-xs bg-brand-50 border-brand-200 text-brand-800"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const match = availableItems.find(av => av._id === selectedId);
                      if (match) {
                        updateItem(idx, 'title', match.title);
                        if (ct.hasVideo) {
                          updateItem(idx, 'videoUrl', match.videoUrl);
                          if (match.duration) updateItem(idx, 'duration', match.duration);
                        } else if (ct.hasPdf) {
                          updateItem(idx, 'fileUrl', match.fileUrl || match.pdfUrl);
                        } else if (ct.isTest) {
                          updateItem(idx, 'testId', match._id);
                          updateItem(idx, 'questionCount', match.questionCount || (match.questions ? match.questions.length : 0));
                          updateItem(idx, 'durationMins', match.durationMins || 0);
                        }
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">-- Quick Select from uploaded {ct.label} --</option>
                    {availableItems.map((av) => (
                      <option key={av._id} value={av._id}>
                        {av.title} {av.duration ? `(${av.duration})` : ''} {av.durationMins ? `(${av.durationMins} mins)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1 !py-1.5 !text-sm"
                  placeholder="Title *"
                  value={item.title || ''}
                  onChange={(e) => updateItem(idx, 'title', e.target.value)}
                />
                <button onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-700 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
              {ct.isTest && item.testId && (
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Linked to Test Bank Item
                </div>
              )}
              {ct.hasVideo && (
                <input
                  className="input !py-1.5 !text-sm"
                  placeholder="Video URL (YouTube / Drive / MP4)"
                  value={item.videoUrl || ''}
                  onChange={(e) => updateItem(idx, 'videoUrl', e.target.value)}
                />
              )}
              {ct.hasPdf && (
                <div className="flex gap-2 items-center">
                  <input
                    className="input flex-1 !py-1.5 !text-sm"
                    placeholder="File URL (Google Drive / PDF link)"
                    value={item.fileUrl || ''}
                    onChange={(e) => updateItem(idx, 'fileUrl', e.target.value)}
                  />
                  <label className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer hover:border-brand-400 hover:text-brand-600 transition bg-white">
                    {uploadingIdx === idx ? (
                      <Loader2 size={13} className="animate-spin text-brand-600" />
                    ) : (
                      <Upload size={13} />
                    )}
                    {uploadingIdx === idx ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed,text/plain,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files?.[0], idx)}
                      disabled={uploadingIdx !== null}
                    />
                  </label>
                </div>
              )}
              {ct.isTest && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="input !py-1.5 !text-sm"
                    placeholder="Questions count"
                    value={item.questionCount || ''}
                    onChange={(e) => updateItem(idx, 'questionCount', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="input !py-1.5 !text-sm"
                    placeholder="Duration (mins)"
                    value={item.durationMins || ''}
                    onChange={(e) => updateItem(idx, 'durationMins', Number(e.target.value))}
                  />
                </div>
              )}
              {ct.hasVideo && (
                <input
                  className="input !py-1.5 !text-sm"
                  placeholder="Duration e.g. 45 min"
                  value={item.duration || ''}
                  onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`free-${ctKey}-${idx}`}
                  checked={item.isFree || false}
                  onChange={(e) => updateItem(idx, 'isFree', e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                <label htmlFor={`free-${ctKey}-${idx}`} className="text-xs text-slate-600 cursor-pointer">
                  Free preview (visible without enrollment)
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div className="px-4 py-4 text-xs text-slate-400 text-center">
          No {ct.label.toLowerCase()} yet. Click Add.
        </div>
      )}
    </div>
  );
}

function ChapterEditor({ chapter, subjectId, courseId, onSaved, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [data, setData] = useState(() => ({
    title: chapter.title || '',
    order: chapter.order ?? 0,
    videoClasses: chapter.videoClasses || [],
    classNotes: chapter.classNotes || [],
    tests: chapter.tests || [],
    dpps: chapter.dpps || [],
    pyqs: chapter.pyqs || [],
    dppPdfs: chapter.dppPdfs || [],
    dppVideos: chapter.dppVideos || [],
    studyMaterials: chapter.studyMaterials || [],
    assignmentsPdfs: chapter.assignmentsPdfs || [],
    assignmentsVideos: chapter.assignmentsVideos || [],
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData({
      title: chapter.title || '',
      order: chapter.order ?? 0,
      videoClasses: chapter.videoClasses || [],
      classNotes: chapter.classNotes || [],
      tests: chapter.tests || [],
      dpps: chapter.dpps || [],
      pyqs: chapter.pyqs || [],
      dppPdfs: chapter.dppPdfs || [],
      dppVideos: chapter.dppVideos || [],
      studyMaterials: chapter.studyMaterials || [],
      assignmentsPdfs: chapter.assignmentsPdfs || [],
      assignmentsVideos: chapter.assignmentsVideos || [],
    });
  }, [chapter]);

  const save = async () => {
    if (!data.title.trim()) { toast.error('Chapter title required'); return; }
    setSaving(true);
    try {
      const res = await api.put(
        `/subjects/admin/subject/${subjectId}/chapters/${chapter._id}`,
        data
      );
      toast.success('Chapter saved');
      onSaved(res.data);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this chapter and all its content?')) return;
    try {
      await api.delete(`/subjects/admin/subject/${subjectId}/chapters/${chapter._id}`);
      toast.success('Chapter deleted');
      onDeleted(chapter._id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const counts = [];
  if (chapter.videoClasses?.length) counts.push(`${chapter.videoClasses.length} Videos`);
  if (chapter.classNotes?.length) counts.push(`${chapter.classNotes.length} Notes`);
  if (chapter.tests?.length) counts.push(`${chapter.tests.length} Tests`);
  if (chapter.dpps?.length) counts.push(`${chapter.dpps.length} DPPs`);
  if (chapter.pyqs?.length) counts.push(`${chapter.pyqs.length} PYQs`);
  if (chapter.dppPdfs?.length) counts.push(`${chapter.dppPdfs.length} DPP PDFs`);
  if (chapter.dppVideos?.length) counts.push(`${chapter.dppVideos.length} DPP Videos`);
  if (chapter.studyMaterials?.length) counts.push(`${chapter.studyMaterials.length} Study Materials`);
  if (chapter.assignmentsPdfs?.length) counts.push(`${chapter.assignmentsPdfs.length} Assignments (PDF)`);
  if (chapter.assignmentsVideos?.length) counts.push(`${chapter.assignmentsVideos.length} Assignment Solutions (Video)`);
  const hasContent = counts.length > 0;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shrink-0">
            {(chapter.order ?? 0) + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 truncate">{chapter.title || 'Untitled Chapter'}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {hasContent ? counts.join(' • ') : 'No content added yet'}
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0 items-center justify-end">
          {hasContent && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className={`!py-1.5 !px-3 text-xs flex items-center gap-1 font-semibold rounded-lg border transition ${
                showPreview
                  ? 'bg-slate-200 border-slate-300 text-slate-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showPreview ? 'Hide Contents' : 'View Contents'}
            </button>
          )}
          <button type="button" onClick={() => setOpen((v) => !v)} className={`btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1 ${open ? 'bg-brand-50 border-brand-200 text-brand-700 font-semibold' : ''}`}>
            <Edit size={12} /> {open ? 'Close' : 'Edit'}
          </button>
          <button type="button" onClick={del} className="btn !py-1.5 !px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {showPreview && !open && (
        <div className="px-5 py-4 bg-slate-50/30 space-y-3 border-b border-slate-100 animate-in fade-in duration-200">
          {CONTENT_TYPES_ADMIN.map((ct) => {
            const items = chapter[ct.key] || [];
            if (items.length === 0) return null;
            const Icon = ct.icon;
            return (
              <div key={ct.key} className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon size={12} className="text-brand-500" />
                  {ct.label}
                </div>
                <div className="pl-5 space-y-1 border-l-2 border-slate-100 ml-1.5">
                  {items.map((item, idx) => (
                    <div key={item._id || item._tmpId || idx} className="text-sm text-slate-700 flex flex-wrap items-center gap-2 py-0.5">
                      <span className="text-xs text-slate-400 font-medium shrink-0">{idx + 1}.</span>
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      {item.isFree && (
                        <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1 py-0.5 rounded font-extrabold uppercase tracking-wider">
                          Free Preview
                        </span>
                      )}
                      {item.duration && (
                        <span className="text-xs text-slate-500">({item.duration})</span>
                      )}
                      {item.durationMins > 0 && (
                        <span className="text-xs text-slate-500">({item.durationMins} mins)</span>
                      )}
                      {item.questionCount > 0 && (
                        <span className="text-xs text-slate-500">({item.questionCount} questions)</span>
                      )}
                      {item.videoUrl && (
                        <span className="text-xs text-slate-400 truncate max-w-[250px] font-mono italic">({item.videoUrl})</span>
                      )}
                      {item.fileUrl && (
                        <span className="text-xs text-slate-400 truncate max-w-[250px] font-mono italic">({item.fileUrl})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="p-5 space-y-4 border-t border-slate-100">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Chapter Title *</label>
              <input
                className="input"
                value={data.title}
                onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Chapter 1 – Atomic Structure"
              />
            </div>
            <div>
              <label className="label">Order</label>
              <input
                type="number"
                className="input"
                value={data.order}
                onChange={(e) => setData((p) => ({ ...p, order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            {CONTENT_TYPES_ADMIN.map((ct) => (
              <ContentTypeSection
                key={ct.key}
                chapterData={data}
                setChapterData={setData}
                ctKey={ct.key}
                courseId={courseId}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Chapter'}
            </button>
            <button onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectEditor({ subject, courseId, onUpdated, onDeleted, isFirst, isLast, onMoveUp, onMoveDown }) {
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editName, setEditName] = useState(subject.name);
  const [editOrder, setEditOrder] = useState(subject.order ?? 0);
  const [chapters, setChapters] = useState(subject.chapters || []);
  const [saving, setSaving] = useState(false);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const saveSubject = async () => {
    if (!editName.trim()) { toast.error('Subject name required'); return; }
    setSaving(true);
    try {
      const res = await api.put(`/subjects/admin/subject/${subject._id}`, { name: editName, order: editOrder });
      toast.success('Subject updated');
      onUpdated({ ...subject, name: res.data.name, order: res.data.order });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = async () => {
    if (!confirm('Delete this subject and all its chapters?')) return;
    try {
      await api.delete(`/subjects/admin/subject/${subject._id}`);
      toast.success('Subject deleted');
      onDeleted(subject._id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const addChapter = async () => {
    if (!newChapterTitle.trim()) { toast.error('Chapter title required'); return; }
    setAddingChapter(true);
    try {
      const res = await api.post(`/subjects/admin/subject/${subject._id}/chapters`, {
        title: newChapterTitle,
        order: chapters.length,
      });
      setChapters((prev) => [...prev, res.data]);
      setNewChapterTitle('');
      toast.success('Chapter added');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setAddingChapter(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-brand-100 overflow-hidden">
      {/* Subject header */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-brand-50 to-violet-50 cursor-pointer select-none"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0">
          <Layers size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 text-base flex items-center gap-2">
            {subject.name}
            {isCollapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{chapters.length} chapters</div>
        </div>
        <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Reordering buttons */}
          <div className="flex gap-1 mr-2">
            <button 
              disabled={isFirst} 
              onClick={onMoveUp}
              className={`p-1.5 rounded-lg border transition ${
                isFirst 
                  ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer bg-white'
              }`}
              title="Move Up"
            >
              <ArrowUp size={13} />
            </button>
            <button 
              disabled={isLast} 
              onClick={onMoveDown}
              className={`p-1.5 rounded-lg border transition ${
                isLast 
                  ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50' 
                  : 'text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer bg-white'
              }`}
              title="Move Down"
            >
              <ArrowDown size={13} />
            </button>
          </div>

          <button onClick={() => setOpen((v) => !v)} className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1">
            <Edit size={12} /> {open ? 'Close' : 'Edit'}
          </button>
          <button onClick={deleteSubject} className="btn !py-1.5 !px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Edit subject name */}
      {open && (
        <div className="px-6 py-4 border-t border-brand-100 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Subject Name *</label>
              <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="w-24">
              <label className="label">Order</label>
              <input type="number" className="input" value={editOrder} onChange={(e) => setEditOrder(Number(e.target.value))} />
            </div>
            <button onClick={saveSubject} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Chapters list */}
      {!isCollapsed && (
        <div className="px-6 pb-5 space-y-2 border-t border-brand-100 bg-white pt-4">
          {chapters.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-6">No chapters yet. Add the first chapter below.</div>
          )}
          {chapters
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((ch, i) => (
              <ChapterEditor
                key={ch._id}
                chapter={{ ...ch, order: i }}
                subjectId={subject._id}
                courseId={courseId}
                onSaved={(updated) => {
                  setChapters((prev) => prev.map((c) => c._id === updated._id ? updated : c));
                }}
                onDeleted={(id) => setChapters((prev) => prev.filter((c) => c._id !== id))}
              />
            ))}

          {/* Add new chapter */}
          <div className="flex gap-2 pt-1">
            <input
              className="input flex-1"
              placeholder="New chapter title…"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChapter()}
            />
            <button onClick={addChapter} disabled={addingChapter} className="btn-primary shrink-0">
              {addingChapter ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Chapter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectsTab({ courseId }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/subjects/admin/${courseId}`)
      .then((r) => setSubjects(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId]);

  const addSubject = async () => {
    if (!newSubjectName.trim()) { toast.error('Subject name required'); return; }
    setAdding(true);
    try {
      const res = await api.post(`/subjects/admin/${courseId}`, {
        name: newSubjectName,
        order: subjects.length,
      });
      setSubjects((prev) => [...prev, res.data]);
      setNewSubjectName('');
      toast.success('Subject added');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setAdding(false);
    }
  };

  const sortedSubjects = [...subjects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const moveSubject = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSubjects.length) return;
    
    const currentSubject = sortedSubjects[index];
    const targetSubject = sortedSubjects[targetIndex];
    
    const normalized = sortedSubjects.map((s, idx) => ({ ...s, order: idx }));
    const temp = normalized[index].order;
    normalized[index].order = normalized[targetIndex].order;
    normalized[targetIndex].order = temp;
    
    const originalSubjects = [...subjects];
    setSubjects(normalized);
    
    try {
      await Promise.all([
        api.put(`/subjects/admin/subject/${normalized[index]._id}`, { order: normalized[index].order }),
        api.put(`/subjects/admin/subject/${normalized[targetIndex]._id}`, { order: normalized[targetIndex].order })
      ]);
      toast.success('Subject order updated');
    } catch (err) {
      toast.error('Failed to update subject order');
      setSubjects(originalSubjects);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={28} /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Subjects &amp; Chapters</h2>
          <p className="text-sm text-slate-500">
            Organize course content into subjects → chapters → content types (Video, Notes, Tests, DPPs, etc.)
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {subjects.length === 0 && (
          <div className="card p-10 text-center text-slate-500">
            No subjects yet. Add the first subject below.
          </div>
        )}
        {sortedSubjects.map((subject, index) => (
          <SubjectEditor
            key={subject._id}
            subject={subject}
            courseId={courseId}
            isFirst={index === 0}
            isLast={index === sortedSubjects.length - 1}
            onMoveUp={() => moveSubject(index, 'up')}
            onMoveDown={() => moveSubject(index, 'down')}
            onUpdated={(updated) => setSubjects((prev) => prev.map((s) => s._id === updated._id ? updated : s))}
            onDeleted={(id) => setSubjects((prev) => prev.filter((s) => s._id !== id))}
          />
        ))}
      </div>

      {/* Add subject */}
      <div className="card p-5 border-2 border-dashed border-brand-200 bg-brand-50/30">
        <h3 className="font-bold text-slate-800 mb-3">Add New Subject</h3>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. Organic Chemistry, Physical Chemistry…"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <button onClick={addSubject} disabled={adding} className="btn-primary shrink-0">
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
            Add Subject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Tests Tab ────────────────────────────────────────────────────────
function AssignTestsTab({ courseId }) {
  const [allTests, setAllTests] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [assigned, setAssigned] = useState({ standaloneTests: [], testSeries: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSearch, setTestSearch] = useState('');
  const [seriesSearch, setSeriesSearch] = useState('');
  const [activeSection, setActiveSection] = useState('series'); // 'series' | 'tests'

  const load = async () => {
    setLoading(true);
    try {
      const [testsRes, seriesRes, courseRes] = await Promise.all([
        api.get('/tests/admin/tests'),
        api.get('/tests/admin/series'),
        api.get(`/courses/${courseId}`),
      ]);
      setAllTests(testsRes.data);
      setAllSeries(seriesRes.data);
      const course = courseRes.data;
      setAssigned({
        standaloneTests: (course.standaloneTests || []).map((t) => (typeof t === 'object' ? t._id : t)),
        testSeries: (course.testSeries || []).map((s) => (typeof s === 'object' ? s._id : s)),
      });
    } catch (err) {
      toast.error('Failed to load test bank data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId]);

  const toggleItem = (type, id) => {
    setAssigned((prev) => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/courses/${courseId}`, {
        standaloneTests: assigned.standaloneTests,
        testSeries: assigned.testSeries,
      });
      toast.success('Test assignments saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTests = allTests.filter((t) =>
    !testSearch || t.title.toLowerCase().includes(testSearch.toLowerCase())
  );
  const filteredSeries = allSeries.filter((s) =>
    !seriesSearch || s.title.toLowerCase().includes(seriesSearch.toLowerCase())
  );

  const DIFF_COLORS = {
    basic: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700',
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={28} /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Assign Test Bank</h2>
          <p className="text-sm text-slate-500">
            Assign reusable tests &amp; series from the global Test Bank to this course.
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Assignments'}
        </button>
      </div>

      {/* Section toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveSection('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${
            activeSection === 'series'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <ListChecks size={15} /> Test Series
          {assigned.testSeries.length > 0 && (
            <span className="bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded-full">{assigned.testSeries.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition ${
            activeSection === 'tests'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <ClipboardList size={15} /> Standalone Tests
          {assigned.standaloneTests.length > 0 && (
            <span className="bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded-full">{assigned.standaloneTests.length}</span>
          )}
        </button>
      </div>

      {/* Test Series */}
      {activeSection === 'series' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search test series…"
              value={seriesSearch}
              onChange={(e) => setSeriesSearch(e.target.value)}
            />
          </div>
          {filteredSeries.length === 0 && (
            <div className="card p-8 text-center text-slate-400">
              No test series found in the Test Bank. Create some in{' '}
              <a href="/admin/test-series" className="text-brand-600 hover:underline">Test Series</a>.
            </div>
          )}
          {filteredSeries.map((s) => {
            const isAssigned = assigned.testSeries.includes(s._id);
            return (
              <div
                key={s._id}
                onClick={() => toggleItem('testSeries', s._id)}
                className={`card p-4 flex items-center gap-4 cursor-pointer transition border-2 ${
                  isAssigned ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                  isAssigned ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                }`}>
                  {isAssigned && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 grid place-items-center shrink-0">
                  <ListChecks size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    {s.title}
                    {s.isFree && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Free</span>}
                    {!s.isPublished && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Draft</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>{s.tests?.length || 0} tests</span>
                    {s.examTags?.length > 0 && <span>{s.examTags.join(', ')}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standalone Tests */}
      {activeSection === 'tests' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search tests…"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
            />
          </div>
          {filteredTests.length === 0 && (
            <div className="card p-8 text-center text-slate-400">
              No tests found in the Test Bank. Create some in{' '}
              <a href="/admin/tests" className="text-brand-600 hover:underline">Test Bank</a>.
            </div>
          )}
          {filteredTests.map((t) => {
            const isAssigned = assigned.standaloneTests.includes(t._id);
            return (
              <div
                key={t._id}
                onClick={() => toggleItem('standaloneTests', t._id)}
                className={`card p-4 flex items-center gap-4 cursor-pointer transition border-2 ${
                  isAssigned ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                  isAssigned ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                }`}>
                  {isAssigned && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 grid place-items-center shrink-0">
                  <ClipboardList size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                    {t.title}
                    {t.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[t.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                        {t.difficulty}
                      </span>
                    )}
                    {t.isFree && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Free</span>}
                    {!t.isPublished && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Draft</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    {t.durationMins > 0 && <span>{t.durationMins} min</span>}
                    {t.totalMarks > 0 && <span>• {t.totalMarks} marks</span>}
                    {t.examTags?.length > 0 && <span>• {t.examTags.join(', ')}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Daily Plan Tab ────────────────────────────────────────────────────────────
function DailyPlanTab({ course }) {
  const courseId = course._id;
  const duration = course.powerCourseDuration || 7;
  const [dailyPlan, setDailyPlan] = useState([]);
  const [tests, setTests] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState(1);

  useEffect(() => {
    // Fetch daily plan
    api.get(`/course-content/admin/daily-plan/${courseId}`)
      .then((res) => {
        const plan = res.data || [];
        // Pre-fill days up to course duration
        const fullPlan = [];
        for (let i = 1; i <= duration; i++) {
          const existing = plan.find((p) => p.dayNumber === i);
          fullPlan.push(
            existing || {
              dayNumber: i,
              title: `Day ${i} Target`,
              description: '',
              unlockDate: '',
              durationText: '60 min',
              topicsCovered: [],
              videoUrl: '',
              videoTitle: 'Watch Lecture Video',
              notesUrl: '',
              notesTitle: 'Read Class Notes',
              quizId: '',
              quizTitle: 'Attempt Quiz',
              liveClassId: '',
              liveClassTitle: 'Attend Live Class',
              assignmentUrl: '',
              assignmentTitle: 'Daily Assignment'
            }
          );
        }
        setDailyPlan(fullPlan);
      })
      .catch((err) => toast.error('Failed to load daily plan'))
      .finally(() => setLoading(false));

    // Fetch tests
    api.get('/tests/admin/tests')
      .then((res) => setTests(res.data || []))
      .catch(() => {});

    api.get(`/admin/live-classes?course=${courseId}`)
      .then((res) => {
        const list = res.data.liveClasses || res.data || [];
        setLiveClasses(list.filter((cls) => {
          const matchedCourse = cls.course === courseId || cls.course?._id === courseId;
          const matchedCourses = cls.courses?.some((cid) => cid === courseId || cid?._id === courseId);
          return matchedCourse || matchedCourses;
        }));
      })
      .catch(() => setLiveClasses([]));
  }, [courseId, duration]);

  const updateDay = (dayNum, fields) => {
    setDailyPlan((prev) =>
      prev.map((day) => (day.dayNumber === dayNum ? { ...day, ...fields } : day))
    );
  };

  const handleFileUpload = async (file, dayNum, field) => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      toast.loading('Uploading...', { id: 'dp-upload' });
      const { data } = await api.post('/upload/pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateDay(dayNum, { [field]: data.url });
      toast.success('Uploaded successfully!', { id: 'dp-upload' });
    } catch (err) {
      toast.error('Upload failed', { id: 'dp-upload' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sanitizedPlan = dailyPlan.map((day) => ({
        ...day,
        unlockDate: day.unlockDate || null,
        quizId: day.quizId || null,
        liveClassId: day.liveClassId || null,
      }));
      await api.put(`/course-content/admin/daily-plan/${courseId}`, sanitizedPlan);
      toast.success('Daily plan saved successfully!');
    } catch (err) {
      toast.error('Failed to save daily plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading daily plan...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendar Daily Targets</h2>
          <p className="text-xs text-slate-500">Configure content, videos, tests, and assignments for each day of the {duration}-day power batch.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Daily Plan'}
        </button>
      </div>

      <div className="space-y-3">
        {dailyPlan.map((day) => {
          const isExpanded = expandedDay === day.dayNumber;
          return (
            <div key={day.dayNumber} className="card border border-slate-150 overflow-hidden bg-white shadow-sm">
              {/* Header Toggle */}
              <button
                type="button"
                onClick={() => setExpandedDay(isExpanded ? null : day.dayNumber)}
                className={`w-full flex items-center justify-between p-4 text-left transition ${
                  isExpanded ? 'bg-slate-50 border-b border-slate-150' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {day.dayNumber}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{day.title || `Day ${day.dayNumber} Target`}</h3>
                    <p className="text-[11px] text-slate-400">
                      {day.durationText || '60 min'} • {day.topicsCovered?.length || 0} topics configured
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Day Editor Form */}
              {isExpanded && (
                <div className="p-5 space-y-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label text-xs">Day Title</label>
                      <input
                        className="input text-sm"
                        value={day.title}
                        onChange={(e) => updateDay(day.dayNumber, { title: e.target.value })}
                        placeholder="e.g. Introduction to Aldehydes"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Unlock Date (Optional)</label>
                      <input
                        type="date"
                        className="input text-sm"
                        value={day.unlockDate ? String(day.unlockDate).split('T')[0] : ''}
                        onChange={(e) => updateDay(day.dayNumber, { unlockDate: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">If set, this day opens on this date.</p>
                    </div>
                    <div>
                      <label className="label text-xs">Duration Text</label>
                      <input
                        className="input text-sm"
                        value={day.durationText}
                        onChange={(e) => updateDay(day.dayNumber, { durationText: e.target.value })}
                        placeholder="e.g. 60 min"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label text-xs">Topics Covered (One per line)</label>
                    <textarea
                      rows={3}
                      className="input text-sm"
                      value={day.topicsCovered?.join('\n') || ''}
                      onChange={(e) =>
                        updateDay(day.dayNumber, {
                          topicsCovered: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean)
                        })
                      }
                      placeholder="e.g.&#10;Galvanic vs Electrolytic Cell&#10;Components of Galvanic Cell"
                    />
                  </div>

                  {/* Daily target tasks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    {/* Task 1: Video */}
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                      <h4 className="font-bold text-xs text-brand-700 uppercase tracking-wider">🎬 Video Lecture</h4>
                      <div>
                        <label className="label text-[10px]">Video Task Title</label>
                        <input
                          className="input text-xs"
                          value={day.videoTitle}
                          onChange={(e) => updateDay(day.dayNumber, { videoTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">YouTube / Bunny.net Video URL</label>
                        <input
                          className="input text-xs"
                          value={day.videoUrl}
                          onChange={(e) => updateDay(day.dayNumber, { videoUrl: e.target.value })}
                          placeholder="Paste link..."
                        />
                      </div>
                    </div>

                    {/* Task 2: Notes */}
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                      <h4 className="font-bold text-xs text-brand-700 uppercase tracking-wider">📘 Study Notes (PDF)</h4>
                      <div>
                        <label className="label text-[10px]">Notes Task Title</label>
                        <input
                          className="input text-xs"
                          value={day.notesTitle}
                          onChange={(e) => updateDay(day.dayNumber, { notesTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">Notes PDF URL</label>
                        <div className="flex gap-2">
                          <input
                            className="input text-xs flex-1"
                            value={day.notesUrl}
                            onChange={(e) => updateDay(day.dayNumber, { notesUrl: e.target.value })}
                            placeholder="Paste or upload..."
                          />
                          <label className="btn-outline text-[11px] cursor-pointer shrink-0 py-1.5 px-3 flex items-center justify-center bg-white hover:bg-slate-50">
                            Upload
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="sr-only"
                              onChange={(e) =>
                                handleFileUpload(e.target.files?.[0], day.dayNumber, 'notesUrl')
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Task 3: Quiz */}
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                      <h4 className="font-bold text-xs text-brand-700 uppercase tracking-wider">🧪 Daily Quiz / MCQ</h4>
                      <div>
                        <label className="label text-[10px]">Quiz Task Title</label>
                        <input
                          className="input text-xs"
                          value={day.quizTitle}
                          onChange={(e) => updateDay(day.dayNumber, { quizTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">Link Quiz from Test Bank</label>
                        <select
                          className="input text-xs bg-white"
                          value={day.quizId || ''}
                          onChange={(e) => updateDay(day.dayNumber, { quizId: e.target.value })}
                        >
                          <option value="">-- No Quiz assigned --</option>
                          {tests.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Task 4: Live Class */}
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                      <h4 className="font-bold text-xs text-brand-700 uppercase tracking-wider">🔴 Live Class</h4>
                      <div>
                        <label className="label text-[10px]">Live Class Task Title</label>
                        <input
                          className="input text-xs"
                          value={day.liveClassTitle || ''}
                          onChange={(e) => updateDay(day.dayNumber, { liveClassTitle: e.target.value })}
                          placeholder="Attend Live Class"
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">Select Scheduled Live Class</label>
                        <select
                          className="input text-xs bg-white"
                          value={day.liveClassId || ''}
                          onChange={(e) => {
                            const selected = liveClasses.find((cls) => cls._id === e.target.value);
                            updateDay(day.dayNumber, {
                              liveClassId: e.target.value,
                              liveClassTitle: selected?.title || day.liveClassTitle || 'Attend Live Class',
                            });
                          }}
                        >
                          <option value="">-- No Live Class assigned --</option>
                          {liveClasses.map((cls) => (
                            <option key={cls._id} value={cls._id}>
                              {cls.title} {cls.scheduledAt ? `(${new Date(cls.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Create classes from the Live Classes tab, then assign them to a target day here.
                        </p>
                      </div>
                    </div>

                    {/* Task 5: Assignment */}
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                      <h4 className="font-bold text-xs text-brand-700 uppercase tracking-wider">📝 Daily Assignment</h4>
                      <div>
                        <label className="label text-[10px]">Assignment Task Title</label>
                        <input
                          className="input text-xs"
                          value={day.assignmentTitle}
                          onChange={(e) => updateDay(day.dayNumber, { assignmentTitle: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label text-[10px]">Assignment PDF or Instruction URL</label>
                        <div className="flex gap-2">
                          <input
                            className="input text-xs flex-1"
                            value={day.assignmentUrl}
                            onChange={(e) => updateDay(day.dayNumber, { assignmentUrl: e.target.value })}
                            placeholder="Paste or upload..."
                          />
                          <label className="btn-outline text-[11px] cursor-pointer shrink-0 py-1.5 px-3 flex items-center justify-center bg-white hover:bg-slate-50">
                            Upload
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="sr-only"
                              onChange={(e) =>
                                handleFileUpload(e.target.files?.[0], day.dayNumber, 'assignmentUrl')
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCourseContent() {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [tab, setTab] = useState('subjects');

  useEffect(() => {
    api.get(`/courses/${courseId}`).then((r) => {
      setCourse(r.data);
      setCourseName(r.data.title);
      if (r.data.isPowerCourse) {
        setTab('daily-plan');
      }
    }).catch(() => {});
  }, [courseId]);

  const tabs = course?.isPowerCourse
    ? [
        { k: 'daily-plan', l: 'Daily Plan', icon: Calendar },
        { k: 'live', l: 'Live Classes', icon: Video },
        { k: 'announcements', l: 'Announcements', icon: Bell },
      ]
    : [
        { k: 'subjects', l: 'Subjects & Chapters', icon: Layers },
        { k: 'lessons', l: 'Video Classes', icon: PlayCircle },
        { k: 'pdfs', l: 'PDF / Notes', icon: FileText },
        { k: 'assign-tests', l: 'Test Bank', icon: ListChecks },
        { k: 'live', l: 'Live Classes', icon: Video },
        { k: 'announcements', l: 'Announcements', icon: Bell },
      ];

  return (
    <div>
      <div className="mb-6">
        <Link to={course?.isPowerCourse ? "/admin/power-batch" : "/admin/courses"} className="text-sm text-brand-700 font-semibold flex items-center gap-1">
          <ArrowLeft size={14} /> Back to {course?.isPowerCourse ? 'Power Batch' : 'Courses'}
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-2">Course Content</h1>
        {courseName && (
          <p className="text-slate-500 mt-0.5">
            Managing: <span className="font-semibold text-slate-700">{courseName}</span>
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition whitespace-nowrap ${
              tab === t.k
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <t.icon size={15} /> {t.l}
          </button>
        ))}
      </div>

      {tab === 'daily-plan' && course && <DailyPlanTab course={course} />}
      {tab === 'subjects' && <SubjectsTab courseId={courseId} />}
      {tab === 'lessons' && <LessonsTab courseId={courseId} />}
      {tab === 'pdfs' && <PdfsTab courseId={courseId} />}
      {tab === 'assign-tests' && <AssignTestsTab courseId={courseId} />}
      {tab === 'live' && <LiveClassesTab courseId={courseId} />}
      {tab === 'announcements' && <AnnouncementsTab courseId={courseId} />}
    </div>
  );
}

// ─── Announcements Tab Component ──────────────────────────────────────────────
function AnnouncementsTab({ courseId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/course-content/admin/announcements/${courseId}`)
      .then((r) => setAnnouncements(r.data))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [courseId]);

  const blank = { title: '', content: '' };

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    if (!editing.content.trim()) { toast.error('Content is required'); return; }
    setSaving(true);
    try {
      await api.post(`/course-content/admin/announcements/${courseId}`, editing);
      toast.success('Announcement posted');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (annId) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/course-content/admin/announcements/${courseId}/${annId}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Course Announcements</h2>
          <p className="text-sm text-slate-500">Post announcements or updates visible to enrolled students in this course.</p>
        </div>
        <button onClick={() => setEditing(blank)} className="btn-primary">
          <Plus size={15} /> Post Announcement
        </button>
      </div>

      {editing && (
        <div className="card p-6 mb-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">New Announcement</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                required
                className="input"
                value={editing.title}
                onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Class Schedule Change or Study Material Uploaded"
              />
            </div>
            <div>
              <label className="label">Content *</label>
              <textarea
                required
                className="input min-h-[120px]"
                value={editing.content}
                onChange={(e) => setEditing((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write the announcement details here…"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Posting…' : 'Post Announcement'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.length === 0 && !editing && (
            <div className="card p-10 text-center text-slate-500">
              No announcements posted for this course yet.
            </div>
          )}
          {[...announcements].reverse().map((ann) => (
            <div key={ann._id} className="card p-5 border border-slate-150 bg-white shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0 mt-0.5">
                    <Bell size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{ann.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(ann.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => del(ann._id)}
                  className="btn !py-1.5 !px-2.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed pl-0 sm:pl-12">
                {ann.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
