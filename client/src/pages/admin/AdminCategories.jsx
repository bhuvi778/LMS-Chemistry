import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Check, X, Tag, Layers } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState('');
  const [newSubs, setNewSubs] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newColor, setNewColor] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSubs, setEditSubs] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/categories')
      .then((r) => setCategories(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const COLOR_OPTIONS = [
    { v: '', l: 'Auto (based on position)' },
    { v: 'from-blue-500 to-indigo-600', l: 'Blue' },
    { v: 'from-green-500 to-emerald-600', l: 'Green' },
    { v: 'from-orange-500 to-amber-600', l: 'Orange' },
    { v: 'from-rose-500 to-pink-600', l: 'Rose / Pink' },
    { v: 'from-violet-500 to-purple-600', l: 'Violet' },
    { v: 'from-cyan-500 to-sky-600', l: 'Cyan' },
    { v: 'from-teal-500 to-emerald-600', l: 'Teal' },
    { v: 'from-fuchsia-500 to-purple-600', l: 'Fuchsia' },
    { v: 'from-yellow-500 to-orange-500', l: 'Yellow' },
    { v: 'from-sky-500 to-blue-600', l: 'Sky' },
    { v: 'from-red-500 to-rose-600', l: 'Red' },
    { v: 'from-lime-500 to-green-600', l: 'Lime' },
  ];

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    const subcategories = newSubs.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await api.post('/categories', { name: newCat.trim(), subcategories, icon: newIcon.trim(), color: newColor });
      toast.success('Category added');
      setNewCat('');
      setNewSubs('');
      setNewIcon('');
      setNewColor('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const startEdit = (cat) => {
    setEditId(cat._id);
    setEditName(cat.name);
    setEditSubs((cat.subcategories || []).join(', '));
    setEditIcon(cat.icon || '');
    setEditColor(cat.color || '');
  };

  const saveEdit = async (id) => {
    const subcategories = editSubs.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await api.put(`/categories/${id}`, { name: editName.trim(), subcategories, icon: editIcon.trim(), color: editColor });
      toast.success('Category updated');
      setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const deleteCategory = async (id, name) => {
    if (!confirm(`Delete category "${name}"? Courses using this category won't be affected.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Category Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage course categories and their sub-categories.</p>
        </div>
      </div>

      {/* Add form */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Tag size={16} /> Add New Category</h2>
        <form onSubmit={addCategory} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              required
              className="input flex-1"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Category name (e.g. CBSE, NEET, JEE)"
            />
            <input
              className="input flex-1"
              value={newSubs}
              onChange={(e) => setNewSubs(e.target.value)}
              placeholder="Sub-categories (comma-separated, e.g. Class 11, Class 12)"
            />
            <button type="submit" className="btn-primary shrink-0 flex items-center gap-2">
              <Plus size={16} /> Add Category
            </button>
          </div>
          <div className="flex gap-3">
            <div>
              <label className="label text-xs">Icon <span className="font-normal text-slate-400">(emoji)</span></label>
              <input
                className="input w-24 text-xl text-center"
                maxLength={4}
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="📘"
              />
            </div>
            <div className="flex-1">
              <label className="label text-xs">Color Theme <span className="font-normal text-slate-400">(shown on homepage cards)</span></label>
              <select className="input" value={newColor} onChange={(e) => setNewColor(e.target.value)}>
                {COLOR_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Sub-categories are optional. Icon and color appear on the homepage category cards.</p>
        </form>
      </div>

      {/* Category list */}
      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No categories yet. Add your first category above.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat._id} className="card p-5">
              {editId === cat._id ? (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <input
                      className="input flex-1 font-semibold"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                    />
                    <button type="button" onClick={() => saveEdit(cat._id)} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    className="input text-sm"
                    value={editSubs}
                    onChange={(e) => setEditSubs(e.target.value)}
                    placeholder="Sub-categories (comma-separated)"
                  />
                  <div className="flex gap-3">
                    <input
                      className="input w-24 text-xl text-center"
                      maxLength={4}
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      placeholder="📘"
                      title="Icon (emoji)"
                    />
                    <select className="input flex-1" value={editColor} onChange={(e) => setEditColor(e.target.value)}>
                      {COLOR_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {cat.icon && <span className="text-xl">{cat.icon}</span>}
                      <Layers size={16} className="text-brand-600 shrink-0" />
                      <span className="font-bold text-slate-900">{cat.name}</span>
                      {cat.color && (
                        <span className={`inline-block w-5 h-5 rounded-md bg-gradient-to-br ${cat.color} shrink-0`} title="Color theme" />
                      )}
                    </div>
                    {cat.subcategories?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                        {cat.subcategories.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {(!cat.subcategories?.length) && (
                      <p className="text-xs text-slate-400 ml-6 mt-1">No sub-categories</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-600 transition"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat._id, cat.name)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
