import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import { Rss, Edit, Trash2, Plus, Calendar, Save, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFeed() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null means not editing/creating

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    image: '',
    link: '',
    isActive: true,
  });

  const load = () => {
    setLoading(true);
    api.get('/feed/admin')
      .then(({ data }) => {
        setList(data || []);
      })
      .catch(() => {
        toast.error('Failed to load feed announcements');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      image: item.image || '',
      link: item.link || '',
      isActive: item.isActive,
    });
  };

  const handleCreateNew = () => {
    setEditingItem('new');
    setForm({
      title: '',
      content: '',
      image: '',
      link: '',
      isActive: true,
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image: data.url }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Upload failed. Try entering a URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      if (editingItem === 'new') {
        await api.post('/feed', form);
        toast.success('Announcement published');
      } else {
        await api.put(`/feed/${editingItem._id}`, form);
        toast.success('Announcement updated');
      }
      setEditingItem(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/feed/${id}`);
      toast.success('Post deleted successfully');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const fmtDate = (ts) => {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">News Feed Manager</h1>
          <p className="text-slate-500 text-sm">Create and publish announcements, notifications, or tutorials to students.</p>
        </div>
        {!editingItem && (
          <button
            onClick={handleCreateNew}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold shadow"
          >
            <Plus size={16} /> New Post
          </button>
        )}
      </div>

      {editingItem ? (
        <div className="card bg-white shadow-soft p-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h2 className="font-bold text-slate-800 text-lg">
              {editingItem === 'new' ? 'Create New Announcement' : 'Edit Announcement'}
            </h2>
            <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="sm:col-span-2 space-y-4">
                <div>
                  <label className="label">Title <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Enter short, punchy announcement title"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Target Link / URL <span className="text-slate-400 font-normal">(Optional, button will redirect here)</span></label>
                  <input
                    type="text"
                    value={form.link}
                    onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                    placeholder="e.g. /courses/neet-organic-chem or https://google.com"
                    className="input"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Banner Image <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <div className="flex items-center gap-3">
                    <label className={`btn-outline cursor-pointer shrink-0 flex items-center gap-1 text-xs ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      Upload File
                      <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <input
                      type="text"
                      value={form.image}
                      onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="Or paste URL"
                      className="input flex-1 text-xs"
                    />
                  </div>
                  {form.image && (
                    <div className="mt-2 h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 relative max-w-[200px]">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Publish Immediately</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Post Content <span className="text-red-500">*</span></label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <SunEditor
                  setContents={form.content || ''}
                  onChange={(c) => setForm((p) => ({ ...p, content: c }))}
                  setOptions={{
                    height: 280,
                    buttonList: [
                      ['undo', 'redo'],
                      ['font', 'fontSize', 'formatBlock'],
                      ['bold', 'underline', 'italic', 'strike'],
                      ['fontColor', 'hiliteColor'],
                      ['align', 'list', 'lineHeight'],
                      ['table', 'link', 'image'],
                      ['removeFormat', 'fullScreen'],
                    ],
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={handleCancel} className="btn-outline px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button type="submit" className="btn-primary px-5 py-2 text-sm font-bold shadow">
                <Save size={16} /> Save Post
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* List View */
        <div className="card bg-white shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">
            All Feed Items ({list.length})
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2 text-brand-500" size={24} />
              <span>Loading feed updates...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No feed posts created. Click "New Post" to add one.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {list.map((item) => (
                <div key={item._id} className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-slate-50/40 transition">
                  <div className="flex gap-4 items-start">
                    {item.image ? (
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-16 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
                        <Rss size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Calendar size={12} />
                        <span>Published on {fmtDate(item.createdAt)}</span>
                        <span>•</span>
                        <span className={`font-bold uppercase text-[10px] ${item.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {item.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600"
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
