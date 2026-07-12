import { useState, useEffect } from 'react';
import api from '../../api/client.js';
import { Sparkles, Edit, Trash2, Plus, Calendar, Save, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPopups() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null or 'new' or Item

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    buttonText: 'View Offer',
    isActive: true,
  });

  const load = () => {
    setLoading(true);
    api.get('/popups')
      .then(({ data }) => {
        setList(data || []);
      })
      .catch(() => {
        toast.error('Failed to load popups');
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
      description: item.description || '',
      image: item.image || '',
      link: item.link || '',
      buttonText: item.buttonText || 'View Offer',
      isActive: item.isActive,
    });
  };

  const handleCreateNew = () => {
    setEditingItem('new');
    setForm({
      title: '',
      description: '',
      image: '',
      link: '',
      buttonText: 'View Offer',
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
      toast.success('Banner uploaded successfully');
    } catch (err) {
      toast.error('Upload failed. Enter a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingItem === 'new') {
        await api.post('/popups', form);
        toast.success('Promo popup created');
      } else {
        await api.put(`/popups/${editingItem._id}`, form);
        toast.success('Promo popup updated');
      }
      setEditingItem(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this popup?')) return;
    try {
      await api.delete(`/popups/${id}`);
      toast.success('Popup deleted');
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
          <h1 className="text-2xl font-bold text-slate-800">Promo Popup Manager</h1>
          <p className="text-slate-500 text-sm">Configure floating modal popups that welcome students on the home page.</p>
        </div>
        {!editingItem && (
          <button
            onClick={handleCreateNew}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold shadow"
          >
            <Plus size={16} /> New Popup
          </button>
        )}
      </div>

      {editingItem ? (
        <div className="card bg-white shadow-soft p-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h2 className="font-bold text-slate-800 text-lg">
              {editingItem === 'new' ? 'Configure New Popup' : 'Edit Popup'}
            </h2>
            <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Popup Title <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. 50% Off Organic Chemistry Crash Course"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description / Subtitle</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Short description highlighting details..."
                    className="input"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Button Text</label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={(e) => setForm((p) => ({ ...p, buttonText: e.target.value }))}
                      placeholder="e.g. View Offer"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Button Action Link</label>
                    <input
                      type="text"
                      value={form.link}
                      onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                      placeholder="e.g. /courses/organic-chem"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Banner Image File</label>
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
                    <div className="mt-3 h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative max-w-sm">
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
                    <span className="text-sm font-semibold text-slate-700">Set Active (will deactivate other popups)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={handleCancel} className="btn-outline px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button type="submit" className="btn-primary px-5 py-2 text-sm font-bold shadow">
                <Save size={16} /> Save Popup
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* List View */
        <div className="card bg-white shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">
            All Popups ({list.length})
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2 text-brand-500" size={24} />
              <span>Loading popups list...</span>
            </div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No popups created. Click "New Popup" to configure one.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {list.map((item) => (
                <div key={item._id} className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-slate-50/40 transition">
                  <div className="flex gap-4 items-start">
                    {item.image ? (
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-16 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        <Sparkles size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <Calendar size={12} />
                        <span>Created on {fmtDate(item.createdAt)}</span>
                        <span>•</span>
                        <span className={`font-bold uppercase text-[10px] ${item.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {item.isActive ? 'Active Overlay' : 'Inactive'}
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
