import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Coins, Search, X, Loader2, Plus, Minus, TrendingUp, Users, PlusCircle, Eye
} from 'lucide-react';

const initialsOf = (name = '') =>
  name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export default function AdminStatsWallet() {
  const [data, setData] = useState({ totalCoins: 0, totalStudents: 0, students: [] });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Purchase details state
  const [activeTab, setActiveTab] = useState('balances');
  const [requests, setRequests] = useState([]);
  const [previewScreenshot, setPreviewScreenshot] = useState('');

  const loadRequests = async () => {
    try {
      const { data: reqs } = await api.get('/coin-purchase/admin');
      setRequests(reqs || []);
    } catch {
      toast.error('Failed to load coin purchase details');
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/gamification/wallet');
      setData(d);
      await loadRequests();
    } catch {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return data.students || [];
    const s = q.toLowerCase();
    return (data.students || []).filter(x =>
      x.name?.toLowerCase().includes(s) || x.email?.toLowerCase().includes(s) || x.studentId?.toLowerCase().includes(s)
    );
  }, [data.students, q]);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(r =>
        r.studentName?.toLowerCase().includes(s) ||
        r.studentEmail?.toLowerCase().includes(s) ||
        r.student?.name?.toLowerCase().includes(s) ||
        r.student?.email?.toLowerCase().includes(s) ||
        r.student?.studentId?.toLowerCase().includes(s) ||
        r.referenceNumber?.toLowerCase().includes(s) ||
        r.razorpayOrderId?.toLowerCase().includes(s) ||
        r.razorpayPaymentId?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [requests, q]);

  const handleAddCoins = async (sign) => {
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    setBusy(true);
    try {
      const finalAmount = sign === '-' ? -Math.abs(amount) : Math.abs(amount);
      await api.post(`/admin/students/${editing._id}/add-coins`, { amount: finalAmount, reason });
      toast.success(`${sign === '+' ? 'Added' : 'Deducted'} ${Math.abs(amount)} coins for ${editing.name}`);
      setEditing(null);
      setAmount(0);
      setReason('');
      load();
    } catch { toast.error('Failed to update coins'); }
    finally { setBusy(false); }
  };

  const inr = (coins) => coins.toFixed(2);
  const shortRef = (value) => value ? `${value.slice(0, 10)}…` : '';
  const statusClass = (status) => ({
    approved: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-100 bg-amber-50 text-amber-700',
    rejected: 'border-red-100 bg-red-50 text-red-700',
  }[status] || 'border-slate-100 bg-slate-50 text-slate-600');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
          <Coins className="text-yellow-500" /> Coin Wallet Management
        </h1>
        <p className="text-slate-500">View coin balances, add or deduct coins per student, and see overall circulation.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <div className="w-12 h-12 rounded-xl bg-white/10 text-yellow-400 grid place-items-center shrink-0">
            <Coins size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Coins Circulated</div>
            <div className="text-2xl font-black">{(data.totalCoins || 0).toLocaleString()}</div>
            <div className="text-xs text-slate-400">≈ ₹{inr(data.totalCoins || 0)}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Students</div>
            <div className="text-2xl font-extrabold text-slate-900">{data.totalStudents || 0}</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 grid place-items-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Avg Coins / Student</div>
            <div className="text-2xl font-extrabold text-slate-900">
              {data.totalStudents ? Math.round((data.totalCoins || 0) / data.totalStudents) : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 mb-6">
        <button
          onClick={() => { setActiveTab('balances'); setQ(''); }}
          className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition ${
            activeTab === 'balances'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          Student Balances
        </button>
        <button
          onClick={() => { setActiveTab('requests'); setQ(''); }}
          className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          Purchase Details
          <span className="bg-slate-100 text-slate-500 font-black text-[10px] px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </button>
      </div>

      {/* Student Table / Purchase Details Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'balances' ? "Search students..." : "Search purchases..."}
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
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-600" size={28} /></div>
        ) : activeTab === 'balances' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Coins</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">INR Value</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Active Days</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {idx < 3 && (
                          <span className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                        )}
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initialsOf(s.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                        <Coins size={14} /> {s.coins || 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-semibold text-xs">
                      ≈ ₹{inr(s.coins || 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 text-xs font-semibold">
                      {(s.activeDays || []).length} days
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => { setEditing(s); setAmount(0); setReason(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                        >
                          <PlusCircle size={13} /> Adjust
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Coins</th>
	                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
	                  <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Details</th>
	                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
	                  <th className="text-center py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Source</th>
	                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initialsOf(r.studentName || r.student?.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{r.studentName || r.student?.name}</div>
                          <div className="text-[10px] text-slate-400">{r.studentEmail || r.student?.email} (ID: {r.student?.studentId || 'N/A'})</div>
                          {r.notes && <div className="text-[10px] text-slate-500 mt-0.5"><span className="font-bold">Note:</span> {r.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                        <Coins size={14} /> +{r.coinsRequested || 0}
                      </span>
                      {r.bonusCoins > 0 && (
                        <div className="text-[10px] font-bold text-emerald-600">+{r.bonusCoins} bonus</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700 font-bold text-xs">
                      ₹{r.amountPaid?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-left">
                      <div className="space-y-1">
                        {r.razorpayOrderId && (
                          <div className="font-mono text-[10px] font-semibold text-slate-600">
                            Order: {shortRef(r.razorpayOrderId)}
                          </div>
                        )}
                        <div className="font-mono text-xs font-semibold text-slate-700">
                          Pay: {r.razorpayPaymentId || r.referenceNumber || 'Awaiting payment'}
                        </div>
                      </div>
	                      <div className="text-[10px] text-slate-400 font-medium">{new Date(r.createdAt).toLocaleString('en-IN')}</div>
	                    </td>
	                    <td className="py-3 px-3 text-center">
	                      <span className={`inline-flex items-center justify-center rounded-full border px-2 py-1 text-[10px] font-black capitalize ${statusClass(r.status)}`}>
	                        {r.status || 'pending'}
	                      </span>
	                    </td>
	                    <td className="py-3 px-3 text-center">
                      {r.paymentMethod === 'razorpay' ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">
                          Razorpay
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center justify-center rounded-full border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-600">
                            Manual
                          </span>
                          {r.screenshotUrl && (
                            <button
                              onClick={() => setPreviewScreenshot(r.screenshotUrl)}
                              className="flex items-center gap-1 text-xs font-bold text-indigo-655 hover:text-indigo-850 hover:underline cursor-pointer"
                            >
                              <Eye size={12} /> Proof
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="py-12 text-center text-slate-400">No purchases found.</div>
            )}
          </div>
        )}
      </div>

      {/* Adjust Coins Modal */}
      {editing && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-sm">
            <div className="modal-header border-b pb-3">
              <h3 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Coins size={18} className="text-yellow-500" /> Adjust Coins — {editing.name}
              </h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="modal-body py-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-3 text-center">
                <span className="text-xs text-slate-500">Current Balance</span>
                <div className="text-2xl font-black text-yellow-600">{editing.coins || 0} Coins</div>
                <div className="text-xs text-slate-400">≈ ₹{inr(editing.coins || 0)}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount</label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={e => setAmount(parseInt(e.target.value) || 0)}
                  className="input w-full"
                  placeholder="Enter coin amount"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. Contest reward"
                />
              </div>
            </div>
            <div className="modal-footer border-t pt-3 flex justify-between gap-2">
              <button onClick={() => setEditing(null)} className="btn-secondary text-sm" disabled={busy}>Cancel</button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddCoins('-')}
                  className="flex items-center gap-1 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold hover:bg-rose-100 transition"
                  disabled={busy}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />} Deduct
                </button>
                <button
                  onClick={() => handleAddCoins('+')}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition"
                  disabled={busy}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setPreviewScreenshot('')}>
          <div className="relative max-w-3xl max-h-[85vh] my-auto bg-white p-2 rounded-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewScreenshot('')} className="absolute -top-10 right-0 p-2 bg-slate-900/60 rounded-full text-white hover:bg-slate-950 transition">
              <X size={20} />
            </button>
            <img src={previewScreenshot} alt="Payment Receipt" className="max-h-[80vh] max-w-full rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
