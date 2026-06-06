import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Flame, Award, Search, X, Loader2, Snowflake, RotateCcw, Users, TrendingUp, Edit2
} from 'lucide-react';

const initialsOf = (name = '') =>
  name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export default function AdminStatsStreak() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [newStreak, setNewStreak] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/gamification/streak');
      setStudents(data);
    } catch { toast.error('Failed to load streak data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return students;
    const s = q.toLowerCase();
    return students.filter(x =>
      x.name?.toLowerCase().includes(s) || x.email?.toLowerCase().includes(s) || x.studentId?.toLowerCase().includes(s)
    );
  }, [students, q]);

  const summary = useMemo(() => ({
    maxStreak: students.reduce((max, s) => Math.max(max, s.streak || 0), 0),
    activeStudents: students.filter(s => (s.streak || 0) > 0).length,
    frozenStudents: students.filter(s => s.streakFrozen).length,
  }), [students]);

  const handleResetStreak = async (student) => {
    setBusy(true);
    try {
      await api.post(`/admin/students/${student._id}/reset-streak`, { newStreak: newStreak });
      toast.success(`Streak reset for ${student.name}`);
      setEditing(null);
      load();
    } catch { toast.error('Failed to reset streak'); }
    finally { setBusy(false); }
  };

  const handleFreezeToggle = async (student) => {
    try {
      await api.post(`/admin/students/${student._id}/freeze-streak`, { frozen: !student.streakFrozen });
      toast.success(`Streak ${!student.streakFrozen ? 'frozen' : 'unfrozen'} for ${student.name}`);
      load();
    } catch { toast.error('Failed to update freeze status'); }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
          <Flame className="text-amber-500 animate-pulse" /> Streak Management
        </h1>
        <p className="text-slate-500">Monitor and control student daily streaks. Freeze, reset, or manually set streaks.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
          <div className="w-12 h-12 rounded-xl bg-white/15 grid place-items-center shrink-0">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-xs text-orange-100 uppercase font-bold tracking-wider">Highest Streak</div>
            <div className="text-2xl font-black">{summary.maxStreak} Days</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Streaks</div>
            <div className="text-2xl font-extrabold text-slate-900">{summary.activeStudents}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 grid place-items-center shrink-0">
            <Snowflake size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Frozen Streaks</div>
            <div className="text-2xl font-extrabold text-slate-900">{summary.frozenStudents}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="input w-full !pl-10 !py-2 text-sm"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-600" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Longest</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Active Today</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initialsOf(s.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-bold text-orange-600">
                        <Flame size={14} /> {s.streak || 0}d
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-bold text-brand-600">
                        <Award size={14} /> {s.longestStreak || 0}d
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {(s.activeDays || []).includes(todayStr) ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">✓ Yes</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">No</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {s.streakFrozen ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">🧊 Frozen</span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">🔥 Active</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleFreezeToggle(s)}
                          className={`p-1.5 rounded-lg text-xs transition ${s.streakFrozen ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                          title={s.streakFrozen ? 'Unfreeze streak' : 'Freeze streak'}
                        >
                          {s.streakFrozen ? <Flame size={14} /> : <Snowflake size={14} />}
                        </button>
                        <button
                          onClick={() => { setEditing(s); setNewStreak(s.streak || 0); }}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
                          title="Reset/Edit streak"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400">No students found.</div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-sm">
            <div className="modal-header border-b pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <RotateCcw size={18} className="text-brand-500" /> Reset Streak — {editing.name}
              </h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="modal-body py-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Set New Streak Value</label>
                <input
                  type="number"
                  min={0}
                  value={newStreak}
                  onChange={e => setNewStreak(parseInt(e.target.value) || 0)}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="modal-footer border-t pt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-secondary text-sm" disabled={busy}>Cancel</button>
              <button onClick={() => handleResetStreak(editing)} className="btn-primary text-sm flex items-center gap-1" disabled={busy}>
                {busy && <Loader2 size={14} className="animate-spin" />} Set Streak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
