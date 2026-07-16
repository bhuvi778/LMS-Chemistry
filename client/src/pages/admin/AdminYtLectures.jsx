import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink, FileText, Flame, Loader2, Plus, Save, Search, Upload, X, Youtube } from 'lucide-react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

const blankLecture = {
  courseId: '',
  title: '',
  youtubeUrl: '',
  duration: '',
  description: '',
  notesTitle: 'Class Notes PDF',
  notesPdfUrl: '',
  order: 0,
  isActive: true,
};

export default function AdminYtLectures() {
  const [courses, setCourses] = useState([]);
  const [powerBatches, setPowerBatches] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    return Promise.all([
      api.get('/courses?includeUnpublished=true'),
      api.get('/courses?includeUnpublished=true&isPowerCourse=true'),
    ])
      .then(([courseRes, powerRes]) => {
        setCourses((courseRes.data || []).filter((course) => !course.isPowerCourse));
        setPowerBatches(powerRes.data || []);
      })
      .catch(() => {
        toast.error('Failed to load courses');
        setCourses([]);
        setPowerBatches([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const selectableCourses = useMemo(() => {
    const normal = courses.map((course) => ({ ...course, kind: 'course' }));
    const power = powerBatches.map((course) => ({ ...course, kind: 'power' }));
    return [...normal, ...power];
  }, [courses, powerBatches]);

  const allItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    return selectableCourses.filter((course) => {
      if (!term) return true;
      return `${course.title || ''} ${course.instructor || ''} ${course.category || ''}`.toLowerCase().includes(term);
    });
  }, [selectableCourses, q]);

  const totalLectures = allItems.reduce(
    (sum, course) => sum + (course.ytLectures || []).filter((lecture) => lecture.isActive !== false).length,
    0
  );

  const getManageLink = (course) => (
    course.kind === 'power'
      ? `/admin/power-batch/${course._id}/content?tab=yt-lectures`
      : `/admin/courses/${course._id}/content?tab=yt-lectures`
  );

  const startAdd = (course = null) => {
    setEditing({
      ...blankLecture,
      courseId: course?._id || '',
      order: course?.ytLectures?.length || 0,
    });
  };

  const handleNotesUpload = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/upload/pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded * 100) / p.total);
          toast.loading(`Uploading... ${pct}%`, { id: 'yt-notes-upload' });
        },
      });
      toast.success('Notes uploaded', { id: 'yt-notes-upload' });
      setEditing((prev) => ({ ...prev, notesPdfUrl: data.url }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: 'yt-notes-upload' });
    } finally {
      setUploading(false);
    }
  };

  const saveLecture = async (e) => {
    e.preventDefault();
    if (!editing.courseId) {
      toast.error('Select a course or power batch');
      return;
    }
    if (!editing.title.trim()) {
      toast.error('Lecture title is required');
      return;
    }
    if (!editing.youtubeUrl.trim()) {
      toast.error('YouTube link is required');
      return;
    }

    setSaving(true);
    try {
      const { courseId, ...payload } = editing;
      await api.post(`/course-content/admin/yt-lectures/${courseId}`, payload);
      toast.success('YT lecture added');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add lecture');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <Youtube className="text-red-500" size={30} /> YT Lectures
          </h1>
          <p className="text-slate-500 mt-1">Manage direct YouTube lecture links and class notes PDFs for courses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-bold">
            {totalLectures} active lectures
          </div>
          <button onClick={() => startAdd()} className="btn-primary">
            <Plus size={15} /> Add YT Lecture
          </button>
        </div>
      </div>

      {editing && (
        <div className="card p-5 sm:p-6 mb-5 border-2 border-red-100">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Youtube size={18} className="text-red-500" /> Add YT Lecture
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select a course, paste direct YouTube link, and attach class notes PDF.</p>
            </div>
            <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={saveLecture} className="space-y-4">
            <div>
              <label className="label">Course / Power Batch *</label>
              <select
                required
                className="input bg-white"
                value={editing.courseId}
                onChange={(e) => {
                  const selected = selectableCourses.find((course) => course._id === e.target.value);
                  setEditing((prev) => ({
                    ...prev,
                    courseId: e.target.value,
                    order: selected?.ytLectures?.length || 0,
                  }));
                }}
              >
                <option value="">Select course...</option>
                {selectableCourses.map((course) => (
                  <option key={`${course.kind}-${course._id}`} value={course._id}>
                    {course.kind === 'power' ? 'Power Batch' : 'Course'} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Lecture Title *</label>
                <input
                  required
                  className="input"
                  value={editing.title}
                  onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Chemical Bonding Lecture 01"
                />
              </div>
              <div>
                <label className="label">Duration</label>
                <input
                  className="input"
                  value={editing.duration}
                  onChange={(e) => setEditing((prev) => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g. 45 min"
                />
              </div>
            </div>

            <div>
              <label className="label">YouTube Lecture Link *</label>
              <input
                required
                className="input"
                value={editing.youtubeUrl}
                onChange={(e) => setEditing((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="label">Class Notes PDF Link</label>
                <input
                  className="input"
                  value={editing.notesPdfUrl}
                  onChange={(e) => setEditing((prev) => ({ ...prev, notesPdfUrl: e.target.value }))}
                  placeholder="Paste PDF URL or upload"
                />
              </div>
              <label className="btn-outline justify-center cursor-pointer">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload PDF'}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleNotesUpload(e.target.files?.[0])}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Notes Button Title</label>
                <input
                  className="input"
                  value={editing.notesTitle}
                  onChange={(e) => setEditing((prev) => ({ ...prev, notesTitle: e.target.value }))}
                  placeholder="Class Notes PDF"
                />
              </div>
              <div>
                <label className="label">Display Order</label>
                <input
                  type="number"
                  className="input"
                  value={editing.order}
                  onChange={(e) => setEditing((prev) => ({ ...prev, order: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px]"
                value={editing.description}
                onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional class details..."
              />
            </div>

            {editing.notesPdfUrl && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <FileText size={13} />
                <span className="truncate flex-1">{editing.notesPdfUrl}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ytActive"
                checked={editing.isActive}
                onChange={(e) => setEditing((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 accent-brand-600"
              />
              <label htmlFor="ytActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Active and visible to students
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving || uploading} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Lecture'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-4 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses or power batches..."
            className="input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading YT lectures...</div>
      ) : allItems.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No courses found.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {allItems.map((course) => {
            const activeCount = (course.ytLectures || []).filter((lecture) => lecture.isActive !== false).length;
            const totalCount = (course.ytLectures || []).length;
            const isPower = course.kind === 'power';
            return (
              <div key={`${course.kind}-${course._id}`} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl grid place-items-center shrink-0 ${
                    isPower ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'
                  }`}>
                    {isPower ? <Flame size={20} /> : <BookOpen size={20} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isPower ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {isPower ? 'Power Batch' : 'Course'}
                      </span>
                      {!course.isPublished && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 uppercase">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{course.instructor || 'Ace2Examz Faculty'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-[10px] font-black uppercase text-slate-400">Active</div>
                    <div className="text-xl font-extrabold text-slate-900">{activeCount}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-[10px] font-black uppercase text-slate-400">Total</div>
                    <div className="text-xl font-extrabold text-slate-900">{totalCount}</div>
                  </div>
                </div>

                <Link
                  to={getManageLink(course)}
                  className="btn-primary justify-center text-xs mt-auto"
                >
                  <Youtube size={14} /> Manage YT Lectures
                </Link>

                <button
                  onClick={() => startAdd(course)}
                  className="btn-outline justify-center text-xs"
                >
                  <Plus size={13} /> Add Lecture
                </button>

                <Link
                  to={isPower ? `/admin/power-batch/${course._id}/content` : `/admin/courses/${course._id}/content`}
                  className="btn-outline justify-center text-xs"
                >
                  <ExternalLink size={13} /> Open Content
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
