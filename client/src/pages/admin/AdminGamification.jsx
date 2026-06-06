import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  X,
  Flame,
  Coins,
  Award,
  Loader2,
  Users,
  TrendingUp,
  Sliders,
  Check,
  Edit2,
  Trophy
} from 'lucide-react';
import Pagination, { usePaged } from '../../components/Pagination.jsx';

const PAGE_SIZE = 12;

const initialsOf = (name = '') =>
  name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const colorFor = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = [
    'from-amber-500 to-orange-600',
    'from-yellow-400 to-amber-500',
    'from-orange-500 to-rose-500',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
  ];
  return palette[h % palette.length];
};

export default function AdminGamification() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [streakVal, setStreakVal] = useState(0);
  const [longestStreakVal, setLongestStreakVal] = useState(0);
  const [coinsVal, setCoinsVal] = useState(0);

  const load = () => api.get('/admin/students').then((r) => setList(r.data));

  useEffect(() => {
    if (localStorage.getItem('token')) {
      load();
    }
  }, []);

  const stats = useMemo(() => {
    let totalCoins = 0;
    let maxStreak = 0;
    let totalActiveStudents = 0;

    list.forEach((s) => {
      totalCoins += s.coins || 0;
      if ((s.streak || 0) > maxStreak) maxStreak = s.streak;
      if (s.streak > 0) totalActiveStudents++;
    });

    return { totalCoins, maxStreak, totalActiveStudents };
  }, [list]);

  const filtered = useMemo(() => {
    if (!q) return list;
    const s = q.toLowerCase();
    return list.filter(
      (x) =>
        x.name?.toLowerCase().includes(s) ||
        x.email?.toLowerCase().includes(s) ||
        x.studentId?.toLowerCase().includes(s)
    );
  }, [list, q]);

  useEffect(() => setPage(1), [q]);
  const paged = usePaged(filtered, page, PAGE_SIZE);

  const startEdit = (student) => {
    setEditingStudent(student);
    setStreakVal(student.streak || 0);
    setLongestStreakVal(student.longestStreak || 0);
    setCoinsVal(student.coins || 0);
  };

  const cancelEdit = () => {
    setEditingStudent(null);
  };

  const handleSave = async () => {
    if (!editingStudent) return;
    setBusy(true);
    try {
      await api.put(`/admin/students/${editingStudent._id}`, {
        streak: streakVal,
        longestStreak: longestStreakVal,
        coins: coinsVal,
      });
      toast.success('Student gamification metrics updated!');
      setEditingStudent(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update metrics');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
          <Trophy className="text-amber-500 animate-pulse" /> Gamification & Rewards
        </h1>
        <p className="text-slate-500">
          Monitor and adjust daily streaks, longest streaks, and wallet coins balance for students.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <div className="w-12 h-12 rounded-xl bg-white/10 text-yellow-400 grid place-items-center shrink-0">
            <Coins size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Coins Circulated</div>
            <div className="text-2xl font-black mt-0.5">{stats.totalCoins.toLocaleString()}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
          <div className="w-12 h-12 rounded-xl bg-white/10 text-orange-200 grid place-items-center shrink-0">
            <Flame size={24} className="animate-bounce" />
          </div>
          <div>
            <div className="text-xs text-orange-100 uppercase font-bold tracking-wider">Highest Active Streak</div>
            <div className="text-2xl font-black mt-0.5">{stats.maxStreak} Days</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-brand-600 grid place-items-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Students with Active Streak</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalActiveStudents}</div>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input w-full !pl-10 !py-2 text-sm"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Student list grid */}
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No students found matching your criteria.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map((student) => (
              <div key={student._id} className="card p-4 flex flex-col justify-between hover:shadow-md transition relative group border-slate-100 hover:border-brand-200">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorFor(student.name)} text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-sm`}>
                    {initialsOf(student.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm truncate" title={student.name}>{student.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{student.studentId}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{student.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50">
                  <div className="bg-orange-50/50 rounded-xl p-2 text-center border border-orange-100/50">
                    <div className="flex items-center justify-center gap-1 text-orange-600 font-bold text-xs">
                      <Flame size={12} className="shrink-0" />
                      <span>{student.streak || 0}d</span>
                    </div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Streak</span>
                  </div>

                  <div className="bg-yellow-50/50 rounded-xl p-2 text-center border border-yellow-100/50">
                    <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold text-xs">
                      <Coins size={12} className="shrink-0" />
                      <span>{student.coins || 0}</span>
                    </div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Coins</span>
                  </div>
                </div>

                <button
                  onClick={() => startEdit(student)}
                  className="mt-3.5 w-full btn-secondary !py-1.5 text-xs flex items-center justify-center gap-1 hover:bg-slate-150"
                >
                  <Sliders size={12} />
                  <span>Configure Stats</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="pt-2 border-t border-slate-50 flex justify-center">
            <Pagination current={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Manage Metrics Modal */}
      {editingStudent && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-md">
            <div className="modal-header border-b pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Sliders size={18} className="text-brand-500" />
                <span>Configure Gamification Stats</span>
              </h3>
              <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorFor(editingStudent.name)} text-white font-extrabold flex items-center justify-center text-sm`}>
                  {initialsOf(editingStudent.name)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{editingStudent.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{editingStudent.studentId}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Current Login Streak (Days)
                  </label>
                  <div className="relative">
                    <Flame size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                    <input
                      type="number"
                      value={streakVal}
                      onChange={(e) => setStreakVal(parseInt(e.target.value) || 0)}
                      className="input w-full !pl-10 !py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Longest All-Time Streak (Days)
                  </label>
                  <div className="relative">
                    <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
                    <input
                      type="number"
                      value={longestStreakVal}
                      onChange={(e) => setLongestStreakVal(parseInt(e.target.value) || 0)}
                      className="input w-full !pl-10 !py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Available Coins Balance
                  </label>
                  <div className="relative">
                    <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" />
                    <input
                      type="number"
                      value={coinsVal}
                      onChange={(e) => setCoinsVal(parseInt(e.target.value) || 0)}
                      className="input w-full !pl-10 !py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-t pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary text-sm"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary text-sm flex items-center gap-1"
                disabled={busy}
              >
                {busy && <Loader2 size={14} className="animate-spin mr-1" />}
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
