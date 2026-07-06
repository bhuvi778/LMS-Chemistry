import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Clock, Calendar, Check, X, Layers } from 'lucide-react';

export default function AdminExamCounter() {
  const [countdowns, setCountdowns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    examName: '',
    examDate: '',
    description: '',
    category: '',
    color: 'cyan',
    icon: 'fa-graduation-cap',
    isActive: true
  });

  const COLOR_OPTIONS = [
    { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-300' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-300' },
    { value: 'red', label: 'Red', bg: 'bg-red-500', ring: 'ring-red-300' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', ring: 'ring-green-300' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', ring: 'ring-purple-300' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-300' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', ring: 'ring-pink-300' }
  ];

  const ICON_OPTIONS = [
    { value: 'fa-graduation-cap', label: 'Graduation Cap' },
    { value: 'fa-book', label: 'Book' },
    { value: 'fa-pencil-alt', label: 'Pencil' },
    { value: 'fa-flask', label: 'Flask' },
    { value: 'fa-atom', label: 'Atom' },
    { value: 'fa-trophy', label: 'Trophy' },
    { value: 'fa-certificate', label: 'Certificate' },
    { value: 'fa-calendar-check', label: 'Calendar' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, countsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/exam-countdown')
      ]);
      setCategories(catsRes.data);
      setCountdowns(countsRes.data);
      if (catsRes.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: catsRes.data[0].name }));
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.examName.trim()) {
      return toast.error('Exam Name is required');
    }
    if (!formData.examDate) {
      return toast.error('Exam Date is required');
    }
    if (!formData.category) {
      return toast.error('Category is required');
    }

    // Client-side validations: Max 3 active countdowns
    if (formData.isActive) {
      const activeCount = countdowns.filter(
        c => c.category === formData.category && c.isActive && c._id !== currentId
      ).length;
      if (activeCount >= 3) {
        return toast.error(`A category can have a maximum of 3 active counters. '${formData.category}' already has 3 active counters.`);
      }
    } else {
      // Min 1 active validation: if they are saving it as INACTIVE, check if there are no other active countdowns for this category.
      const categoryCountdowns = countdowns.filter(c => c.category === formData.category && c._id !== currentId);
      if (categoryCountdowns.length > 0) {
        const activeCount = categoryCountdowns.filter(c => c.isActive).length;
        if (activeCount === 0) {
          return toast.error(`At least 1 active counter is required for category '${formData.category}'.`);
        }
      }
    }

    try {
      if (isEditing) {
        await api.put(`/exam-countdown/${currentId}`, formData);
        toast.success('Countdown updated successfully!');
      } else {
        await api.post('/exam-countdown', formData);
        toast.success('Countdown added successfully!');
      }
      setFormData({
        examName: '',
        examDate: '',
        description: '',
        category: categories[0]?.name || formData.category,
        color: 'cyan',
        icon: 'fa-graduation-cap',
        isActive: true
      });
      setIsEditing(false);
      setCurrentId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save countdown');
    }
  };

  const handleEdit = (c) => {
    setIsEditing(true);
    setCurrentId(c._id);
    setFormData({
      examName: c.examName,
      examDate: new Date(c.examDate).toISOString().split('T')[0],
      description: c.description || '',
      category: c.category,
      color: c.color,
      icon: c.icon,
      isActive: c.isActive
    });
  };

  const handleDelete = async (id, category) => {
    const categoryCountdowns = countdowns.filter(c => c.category === category);
    const activeCount = categoryCountdowns.filter(c => c.isActive).length;
    const targetIsActive = countdowns.find(c => c._id === id)?.isActive;

    if (targetIsActive && activeCount === 1 && categoryCountdowns.length > 1) {
      return toast.error(`Cannot delete the last active counter for category '${category}'. Please activate another counter first.`);
    }

    if (!window.confirm('Are you sure you want to delete this countdown?')) return;
    try {
      await api.delete(`/exam-countdown/${id}`);
      toast.success('Countdown deleted successfully!');
      loadData();
    } catch (err) {
      toast.error('Failed to delete countdown');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Heading */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-brand-500" /> Exam Counter
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage countdowns for upcoming exams per category (Min 1, Max 3 active counters per category)</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
          {isEditing ? 'Edit Exam Countdown' : 'Add New Exam Countdown'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Exam Name *</label>
              <input
                type="text"
                value={formData.examName}
                onChange={e => setFormData({ ...formData, examName: e.target.value })}
                placeholder="e.g., JEE Main 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Exam Date *</label>
              <input
                type="date"
                value={formData.examDate}
                onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., For MBBS/BDS/BAMS"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Color Theme</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: opt.value })}
                    className={`w-10 h-10 rounded-xl ${opt.bg} transition-all duration-200 ${
                      formData.color === opt.value
                        ? `ring-4 ring-offset-4 ring-offset-slate-900 ${opt.ring}`
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-6">
            <label className="flex items-center gap-3 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded text-brand-500 bg-slate-950 border-slate-800 focus:ring-brand-500"
              />
              <span className="text-sm font-medium">Active (Show on student panel)</span>
            </label>

            <div className="flex gap-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentId(null);
                    setFormData({
                      examName: '',
                      examDate: '',
                      description: '',
                      category: categories[0]?.name || '',
                      color: 'cyan',
                      icon: 'fa-graduation-cap',
                      isActive: true
                    });
                  }}
                  className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 shadow-lg hover:shadow-brand-500/20 transition flex items-center gap-2"
              >
                {isEditing ? 'Update Countdown' : 'Add Countdown'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="text-brand-500" /> Exam Countdowns List
        </h2>
        {countdowns.length === 0 ? (
          <p className="text-slate-400">No countdowns configured yet. Create one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countdowns.map(c => {
              const colorClasses = {
                cyan: 'bg-cyan-50 border-cyan-150 text-cyan-600 hover:border-cyan-300',
                blue: 'bg-blue-50 border-blue-150 text-blue-600 hover:border-blue-300',
                red: 'bg-red-50 border-red-150 text-red-600 hover:border-red-300',
                green: 'bg-green-50 border-green-150 text-green-600 hover:border-green-300',
                purple: 'bg-purple-50 border-purple-150 text-purple-600 hover:border-purple-300',
                orange: 'bg-orange-50 border-orange-150 text-orange-600 hover:border-orange-300',
                pink: 'bg-pink-50 border-pink-150 text-pink-600 hover:border-pink-300'
              };
              const theme = colorClasses[c.color] || colorClasses.cyan;
              return (
                <div
                  key={c._id}
                  className={`flex items-start justify-between p-5 border rounded-2xl transition shadow-sm ${theme}`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mt-1">
                      <i className={`fas ${c.icon} text-xl`}></i>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 truncate">{c.examName}</h3>
                      <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(c.examDate)}
                      </p>
                      {c.description && (
                        <p className="text-xs text-slate-500 mt-2 truncate max-w-sm">{c.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100 flex items-center gap-1">
                          <Layers size={10} /> {c.category}
                        </span>
                        {c.isActive ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200 text-slate-600 hover:text-brand-500"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id, c.category)}
                      className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200 text-slate-600 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
