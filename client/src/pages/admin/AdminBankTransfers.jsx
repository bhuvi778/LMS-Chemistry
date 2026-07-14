import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import { Check, X, Eye, RefreshCw, Search, Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminBankTransfers() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null); // { req, type: 'confirm'|'reject' }
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bank-transfer');
      setRequests(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAction = (req, type) => {
    setActionModal({ req, type });
    setAdminNote('');
  };

  const submitAction = async () => {
    if (!actionModal) return;
    const { req, type } = actionModal;
    setProcessing(true);
    try {
      if (type === 'confirm') {
        await api.post(`/bank-transfer/${req._id}/confirm`, { adminNote });
        toast.success('Payment confirmed — student enrolled!');
      } else {
        await api.post(`/bank-transfer/${req._id}/reject`, { adminNote });
        toast.success('Request rejected');
      }
      setActionModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.studentName || '').toLowerCase().includes(q) ||
        (r.studentPhone || '').toLowerCase().includes(q) ||
        (r.referenceNumber || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Bank Transfer Requests</h1>
          <p className="text-sm text-slate-500">Review and confirm student payment requests</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
            placeholder="Search student / reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {['all', 'pending', 'confirmed', 'rejected'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition capitalize ${filter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}`}>
            {s === 'all' ? `All (${requests.length})` : `${s} (${requests.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-right px-4 py-3">Amount (INR)</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Screenshot</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{r.studentName || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{r.studentPhone || r.student?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.itemType === 'course' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                        {r.itemType === 'course' ? 'Course' : 'Test Series'}
                      </span>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {r.course?.title || r.testSeries?.title || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-slate-700">{r.totalAmount?.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Base: {r.baseAmount}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600">{r.referenceNumber || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[r.status] || 'bg-slate-100 text-slate-500'}`}>
                        {r.status}
                      </span>
                      {r.adminNote && <div className="text-[10px] text-slate-400 mt-0.5 max-w-[120px] truncate" title={r.adminNote}>Note: {r.adminNote}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {r.screenshotUrl ? (
                        <button onClick={() => setPreviewImg(r.screenshotUrl)}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                          <Eye size={12} /> View
                        </button>
                      ) : <span className="text-xs text-slate-300">No file</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => openAction(r, 'confirm')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                            <Check size={11} /> Confirm
                          </button>
                          <button onClick={() => openAction(r, 'reject')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200">
                            <X size={11} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {r.status === 'confirmed' ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={12} /> Done</span>
                            : <span className="flex items-center gap-1 text-red-500"><XCircle size={12} /> Rejected</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow"><X size={16} /></button>
            <img src={previewImg} alt="Payment screenshot" className="w-full rounded-xl shadow-lg" />
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              {actionModal.type === 'confirm'
                ? <CheckCircle size={22} className="text-emerald-600" />
                : <XCircle size={22} className="text-red-500" />}
              <h2 className="text-lg font-bold text-slate-800">
                {actionModal.type === 'confirm' ? 'Confirm Payment' : 'Reject Request'}
              </h2>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
              <div><span className="text-slate-500">Student:</span> <span className="font-semibold">{actionModal.req.studentName}</span></div>
              <div><span className="text-slate-500">Item:</span> <span className="font-semibold">{actionModal.req.course?.title || actionModal.req.testSeries?.title || '—'}</span></div>
              <div><span className="text-slate-500">Total:</span> <span className="font-bold text-slate-800">₹{actionModal.req.totalAmount?.toFixed(2)}</span></div>
              <div><span className="text-slate-500">Reference:</span> <span className="font-mono">{actionModal.req.referenceNumber}</span></div>
            </div>
            {actionModal.type === 'confirm' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 font-medium">
                ✅ Confirming will automatically enroll the student in the selected item.
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">ADMIN NOTE (optional)</label>
              <textarea
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
                rows={2}
                placeholder="Internal note for this action…"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={submitAction} disabled={processing}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${actionModal.type === 'confirm' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {processing && <RefreshCw size={14} className="animate-spin" />}
                {actionModal.type === 'confirm' ? 'Confirm Payment' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
