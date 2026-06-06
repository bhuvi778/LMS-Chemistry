import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Edit,
  ClipboardList,
  Search,
  Clock,
  Star,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  BookOpen,
  ChevronRight,
  BarChart2,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
  basic: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function AdminTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); // all | free | paid

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tests/admin/tests');
      setTests(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Delete this test? This cannot be undone.')) return;
    try {
      await api.delete(`/tests/admin/tests/${id}`);
      toast.success('Test deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggle = async (test) => {
    try {
      await api.put(`/tests/admin/tests/${test._id}`, { isPublished: !test.isPublished });
      toast.success(test.isPublished ? 'Test unpublished' : 'Test published');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = tests.filter((t) => {
    const matchQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    const matchF =
      filter === 'all' ? true : filter === 'free' ? t.isFree : !t.isFree;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Bank</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create reusable tests — assign them to courses or test series
          </p>
        </div>
        <Link
          to="/admin/tests/new"
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} /> New Test
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tests', value: tests.length, color: 'text-brand-600' },
          { label: 'Free Tests', value: tests.filter((t) => t.isFree).length, color: 'text-emerald-600' },
          { label: 'Published', value: tests.filter((t) => t.isPublished).length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
            placeholder="Search tests…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {['all', 'free', 'paid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filter === f ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p>No tests found</p>
          <Link to="/admin/tests/new" className="mt-3 inline-block text-brand-600 hover:underline text-sm">
            Create your first test →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Difficulty</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Questions</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Duration</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Access</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{t.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    {{
                      test_series: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">Test Series</span>,
                      previous_paper: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Prev. Paper</span>,
                      quiz: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">Quiz</span>,
                      live_test: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Live Test</span>,
                      infinite_practice: <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Infinite Practice</span>,
                    }[t.testType] || <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${DIFFICULTY_COLORS[t.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                      {t.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.questions?.length || 0} Qs</td>
                  <td className="px-4 py-3 text-slate-600 flex items-center gap-1">
                    <Clock size={12} /> {t.durationMins} min
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${t.isFree ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {t.isFree ? <><Unlock size={12} /> Free</> : <><Lock size={12} /> Paid</>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${t.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {t.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${t.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {t.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        to={`/admin/tests/${t._id}/edit`}
                        className="p-2 rounded-lg hover:bg-brand-50 text-slate-500 hover:text-brand-600"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </Link>
                      <button
                        onClick={() => toggle(t)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        title={t.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {t.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => del(t._id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
