import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Edit,
  Layers,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ClipboardList,
} from 'lucide-react';

export default function AdminTestSeries() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tests/admin/series');
      setSeries(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Delete this test series?')) return;
    await api.delete(`/tests/admin/series/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggle = async (s) => {
    await api.put(`/tests/admin/series/${s._id}`, { isPublished: !s.isPublished });
    toast.success(s.isPublished ? 'Unpublished' : 'Published');
    load();
  };

  const filtered = series.filter(
    (s) => !q || s.title.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Series</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bundle multiple tests into a series — assign series to courses
          </p>
        </div>
        <Link
          to="/admin/test-series/new"
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} /> New Series
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
            placeholder="Search series…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Layers size={40} className="mx-auto mb-3 opacity-30" />
          <p>No test series yet</p>
          <Link to="/admin/test-series/new" className="mt-3 inline-block text-brand-600 hover:underline text-sm">
            Create your first series →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                <Layers size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{s.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      to={`/admin/test-series/${s._id}/edit`}
                      className="p-2 rounded-lg hover:bg-brand-50 text-slate-500 hover:text-brand-600"
                    >
                      <Edit size={15} />
                    </Link>
                    <button
                      onClick={() => toggle(s)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      {s.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={() => del(s._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <ClipboardList size={12} /> {s.tests?.length || 0} tests
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${s.isFree ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {s.isFree ? <><Unlock size={11} /> Free</> : <><Lock size={11} /> Paid</>}
                  </span>
                  {s.seriesType === 'previous_paper' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      Prev. Paper
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {s.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {(s.examTags || []).slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
