import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Users, Gift, TrendingUp, Loader2, ArrowRight, Coins } from 'lucide-react';

const initialsOf = (name = '') =>
  name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export default function AdminStatsRefer() {
  const [data, setData] = useState({ referrers: [], referred: [], totalReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('referrers');

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/gamification/referrals');
      setData(d);
    } catch { toast.error('Failed to load referral data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const tabs = [
    { key: 'referrers', label: 'Top Referrers', count: data.referrers.length },
    { key: 'referred', label: 'Referred Students', count: data.referred.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
          <Users className="text-indigo-500" /> Refer & Earn Management
        </h1>
        <p className="text-slate-500">Track all referrals, top referrers, and coin credits given out through the program.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-0">
          <div className="w-12 h-12 rounded-xl bg-white/15 grid place-items-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Total Referrals</div>
            <div className="text-2xl font-black">{data.totalReferrals}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 grid place-items-center shrink-0">
            <Coins size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Coins Distributed</div>
            <div className="text-2xl font-extrabold text-slate-900">{data.totalReferrals * 5}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Referrers</div>
            <div className="text-2xl font-extrabold text-slate-900">{data.referrers.length}</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-600" size={28} /></div>
        ) : tab === 'referrers' ? (
          /* Top Referrers */
          data.referrers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Gift size={40} className="mx-auto mb-3 text-slate-300" />
              <p>No referrals yet. Students haven't used referral codes during signup.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Referral Code</th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Friends Referred</th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Coins Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.referrers.map((r, idx) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3 text-center font-bold text-slate-400 text-sm">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {initialsOf(r.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{r.name}</div>
                            <div className="text-[10px] text-slate-400">{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          REF-{r.studentId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{r.referralCount}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                          <Coins size={13} /> {r.referralCount * 5}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Referred Students */
          data.referred.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ArrowRight size={40} className="mx-auto mb-3 text-slate-300" />
              <p>No students were referred yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Referred By (Student ID)</th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.referred.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {initialsOf(r.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{r.name}</div>
                            <div className="text-[10px] text-slate-400">{r.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          REF-{r.referredBy}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
