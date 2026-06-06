import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, ToggleLeft, ToggleRight, Upload, Loader2, X } from 'lucide-react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

const EMPTY = { title: '', description: '', subject: '', grade: '', coverImage: '', fileUrl: '', fileSize: '', isFree: false, isActive: true, order: 0, courses: [] };

export default function AdminEbooks() {
  const [ebooks, setEbooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);

  const load = () => {
    Promise.all([
      api.get('/ebooks/admin/all'),
      api.get('/courses'),
    ]).then(([er, cr]) => {
      setEbooks(er.data);
      setCourses(cr.data?.courses || cr.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openModal = (eb = null) => {
    setEditing(eb);
    setForm(eb ? { ...EMPTY, ...eb, courses: eb.courses?.map((c) => (typeof c === 'object' ? c._id : c)) || [] } : EMPTY);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (editing) {
        await api.put(`/ebooks/${editing._id}`, payload);
      } else {
        await api.post('/ebooks', payload);
      }
      toast.success(editing ? 'Ebook updated' : 'Ebook created');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this ebook?')) return;
    await api.delete(`/ebooks/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggle = async (eb) => {
    await api.put(`/ebooks/${eb._id}`, { isActive: !eb.isActive });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen size={22} /> E-Books</h1>
          <p className="text-slate-500 text-sm">Manage study materials and PDFs</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Ebook
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-100" />)}
        </div>
      ) : ebooks.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>No ebooks yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ebooks.map((eb) => (
            <div key={eb._id} className={`card p-4 flex gap-3 ${!eb.isActive ? 'opacity-60' : ''}`}>
              <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-brand-500 to-indigo-600 shrink-0 flex items-center justify-center overflow-hidden">
                {eb.coverImage ? <img src={eb.coverImage} alt="" className="w-full h-full object-cover" /> : <BookOpen size={20} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-1">{eb.title}</h3>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {eb.subject && <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-full">{eb.subject}</span>}
                  {eb.grade && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{eb.grade}</span>}
                  {eb.isFree && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">FREE</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{eb.downloads || 0} downloads</div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => openModal(eb)} className="text-brand-600 hover:text-brand-800 transition p-1 rounded">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggle(eb)} className="text-slate-500 hover:text-slate-700 transition p-1 rounded">
                    {eb.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => del(eb._id)} className="text-rose-500 hover:text-rose-700 transition p-1 rounded ml-auto">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Ebook' : 'Add New Ebook'}</h2>
              <form onSubmit={save} className="space-y-3">
                <div>
                  <label className="label">Title *</label>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Subject</label>
                    <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className="input" placeholder="e.g. Organic" />
                  </div>
                  <div>
                    <label className="label">Grade / Level</label>
                    <input value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} className="input" placeholder="e.g. JEE, Class 11" />
                  </div>
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="label">Book File (PDF) <span className="text-slate-400 font-normal text-xs">— max 100 MB</span></label>
                  <div className="flex items-center gap-2">
                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition flex-1 justify-center ${pdfUploading ? 'opacity-50 pointer-events-none border-slate-200 text-slate-400' : 'border-brand-300 text-brand-700 hover:bg-brand-50'}`}>
                      {pdfUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {pdfUploading ? 'Uploading…' : form.fileUrl ? 'Replace PDF' : 'Upload PDF'}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        disabled={pdfUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setPdfUploading(true);
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const { data } = await api.post('/upload/pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            const sizeKB = file.size / 1024;
                            const sizeLabel = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
                            setForm((p) => ({ ...p, fileUrl: data.url, fileSize: sizeLabel }));
                            toast.success('PDF uploaded');
                          } catch {
                            toast.error('Upload failed');
                          } finally {
                            setPdfUploading(false);
                          }
                        }}
                      />
                    </label>
                    {form.fileUrl && (
                      <button type="button" onClick={() => setForm((p) => ({ ...p, fileUrl: '', fileSize: '' }))} className="text-rose-500 hover:text-rose-700 p-2 rounded-lg border border-rose-100 hover:bg-rose-50 transition">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {form.fileUrl && (
                    <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                      ✓ PDF ready {form.fileSize && `· ${form.fileSize}`}
                    </p>
                  )}
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="label">Cover Image</label>
                  <div className="flex items-center gap-3">
                    {form.coverImage && (
                      <img src={form.coverImage} alt="cover" className="w-14 h-16 object-cover rounded-lg border border-slate-200 shrink-0" />
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition flex-1 justify-center ${imgUploading ? 'opacity-50 pointer-events-none border-slate-200 text-slate-400' : 'border-violet-300 text-violet-700 hover:bg-violet-50'}`}>
                        {imgUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                        {imgUploading ? 'Uploading…' : form.coverImage ? 'Replace Image' : 'Upload Cover'}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={imgUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setImgUploading(true);
                            try {
                              const fd = new FormData();
                              fd.append('file', file);
                              const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                              setForm((p) => ({ ...p, coverImage: data.url }));
                              toast.success('Cover uploaded');
                            } catch {
                              toast.error('Upload failed');
                            } finally {
                              setImgUploading(false);
                            }
                          }}
                        />
                      </label>
                      {form.coverImage && (
                        <button type="button" onClick={() => setForm((p) => ({ ...p, coverImage: '' }))} className="text-rose-500 hover:text-rose-700 p-2 rounded-lg border border-rose-100 hover:bg-rose-50 transition">
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">File Size</label>
                    <input value={form.fileSize} onChange={(e) => setForm((p) => ({ ...p, fileSize: e.target.value }))} className="input" placeholder="e.g. 2.3 MB" />
                  </div>
                  <div>
                    <label className="label">Order</label>
                    <input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} className="input" />
                  </div>
                </div>
                {courses.length > 0 && (
                  <div>
                    <label className="label">Restrict to Courses (optional)</label>
                    <select
                      multiple
                      value={form.courses}
                      onChange={(e) => setForm((p) => ({ ...p, courses: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                      className="input h-24"
                    >
                      {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple. Leave empty for all enrolled students.</p>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isFree} onChange={(e) => setForm((p) => ({ ...p, isFree: e.target.checked }))} className="rounded" />
                    Free for all
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
