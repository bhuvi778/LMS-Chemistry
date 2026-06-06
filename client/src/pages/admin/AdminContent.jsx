import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, X, Save, Upload, Loader2 } from 'lucide-react';

const FIELD_MAP = {
  banner: ['title', 'subtitle', 'description', 'image', 'link', 'order'],
  highlight: ['title', 'description', 'image'],
  topper: ['title', 'exam', 'rank', 'year', 'image', 'description'],
  review: ['author', 'title', 'description', 'rating', 'image'],
  video: ['title', 'description', 'videoUrl', 'image'],
};

const TITLE_MAP = {
  banner: 'Banners (Hero Slider)',
  highlight: 'Highlights',
  topper: 'Toppers / Results',
  review: 'Student Reviews',
  video: 'Related Videos',
};

export default function AdminContent() {
  const { type } = useParams();
  const fields = FIELD_MAP[type] || [];
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [imgUploading, setImgUploading] = useState(false);
  const imgRef = useRef(null);

  const load = () => api.get(`/content/admin/${type}`).then((r) => setList(r.data));
  useEffect(() => {
    load();
    setEditing(null);
  }, [type]);

  const handleImgUpload = async (file) => {
    if (!file) return;
    setImgUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      // Try pdf upload endpoint for images too, or use a dedicated image upload
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing((prev) => ({ ...prev, image: data.url }));
      toast.success('Image uploaded');
    } catch {
      // Fallback: read as base64
      const reader = new FileReader();
      reader.onload = () => setEditing((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
      toast('Image stored as base64 (no upload endpoint)', { icon: 'ℹ️' });
    } finally {
      setImgUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing._id) await api.put(`/content/item/${editing._id}`, editing);
      else await api.post(`/content/${type}`, editing);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/content/item/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{TITLE_MAP[type] || type}</h1>
          <p className="text-slate-500">Manage {type} content for the landing page.</p>
        </div>
        <button onClick={() => setEditing({ isActive: true })} className="btn-primary">
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((it) => (
          <div key={it._id} className="card p-4">
            {it.image && (
              <img src={it.image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            <div className="font-bold">{it.title || it.author}</div>
            {it.subtitle && <div className="text-xs text-slate-500">{it.subtitle}</div>}
            {it.exam && (
              <div className="text-xs text-brand-700 mt-1">
                {it.exam} {it.rank && `• ${it.rank}`} {it.year && `• ${it.year}`}
              </div>
            )}
            <p className="text-sm text-slate-600 mt-2 line-clamp-3">{it.description}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditing(it)}
                className="btn-outline !py-1.5 !px-3 text-xs"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => del(it._id)}
                className="btn !py-1.5 !px-3 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500">No items yet.</div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={save}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold">{editing._id ? 'Edit' : 'New'} {type}</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {fields.map((f) => (
                <div key={f}>
                  <label className="label capitalize">{f}</label>
                  {f === 'description' ? (
                    <textarea
                      className="input min-h-[90px]"
                      value={editing[f] || ''}
                      onChange={(e) => setEditing({ ...editing, [f]: e.target.value })}
                    />
                  ) : f === 'rating' || f === 'order' ? (
                    <input
                      type="number"
                      className="input"
                      value={editing[f] || 0}
                      onChange={(e) => setEditing({ ...editing, [f]: Number(e.target.value) })}
                    />
                  ) : f === 'image' ? (
                    <div className="space-y-2">
                      {editing.image && (
                        <img
                          src={editing.image}
                          alt="preview"
                          className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex gap-2">
                        <input
                          className="input flex-1 text-sm"
                          placeholder="Paste image URL…"
                          value={editing.image?.startsWith?.('data:') ? '' : (editing.image || '')}
                          onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => imgRef.current?.click()}
                          disabled={imgUploading}
                          className="btn-outline shrink-0 flex items-center gap-1.5 text-sm"
                        >
                          {imgUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          Upload
                        </button>
                        <input
                          ref={imgRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleImgUpload(e.target.files?.[0])}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">Upload an image or paste a URL.</p>
                    </div>
                  ) : (
                    <input
                      className="input"
                      value={editing[f] || ''}
                      onChange={(e) => setEditing({ ...editing, [f]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.isActive !== false}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                <span className="text-sm font-semibold">Active</span>
              </label>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-2 justify-end sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button className="btn-primary">
                <Save size={16} /> Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
