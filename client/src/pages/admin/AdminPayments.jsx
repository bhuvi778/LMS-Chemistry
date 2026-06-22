import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client.js';
import { Search, CreditCard, CheckCircle2, Clock, XCircle, TrendingUp, Banknote } from 'lucide-react';
import Pagination, { usePaged } from '../../components/Pagination.jsx';

const PAGE_SIZE = 15;

const STATUS_STYLES = {
  paid:    'bg-emerald-100 text-emerald-700',
  created: 'bg-amber-100 text-amber-700',
  failed:  'bg-red-100 text-red-700',
};

const STATUS_ICONS = {
  paid:    CheckCircle2,
  created: Clock,
  failed:  XCircle,
};

const fmt = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function AdminPayments() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/payment/admin/all')
      .then((r) => setList(Array.isArray(r.data) ? r.data : (r.data?.payments ?? [])))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(list)) return [];
    let result = list;
    if (statusFilter !== 'ALL') result = result.filter((p) => p.status === statusFilter);
    if (typeFilter !== 'ALL') result = result.filter((p) => p.itemType === typeFilter);
    if (q) {
      const s = q.toLowerCase();
      result = result.filter(
        (p) =>
          p.student?.name?.toLowerCase().includes(s) ||
          p.student?.email?.toLowerCase().includes(s) ||
          p.student?.studentId?.toLowerCase().includes(s) ||
          p.razorpayOrderId?.toLowerCase().includes(s) ||
          p.razorpayPaymentId?.toLowerCase().includes(s) ||
          p.course?.title?.toLowerCase().includes(s) ||
          p.testSeries?.title?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [list, q, statusFilter, typeFilter]);

  useEffect(() => setPage(1), [q, statusFilter, typeFilter]);
  const paged = usePaged(filtered, page, PAGE_SIZE);

  const totalPaid = filtered
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amount || 0), 0);

  const paidCount = filtered.filter((p) => p.status === 'paid').length;
  const failedCount = filtered.filter((p) => p.status === 'failed').length;
  const pendingCount = filtered.filter((p) => p.status === 'created').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <CreditCard className="text-brand-600" /> Razorpay Payments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} of {list.length} transactions · Revenue{' '}
            <b className="text-emerald-700">₹{totalPaid.toLocaleString()}</b>
          </p>
        </div>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Revenue', value: `₹${totalPaid.toLocaleString()}`, icon: Banknote, color: 'from-emerald-500 to-teal-500' },
          { label: 'Successful', value: paidCount, icon: CheckCircle2, color: 'from-brand-500 to-violet-500' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'from-amber-500 to-orange-500' },
          { label: 'Failed', value: failedCount, icon: XCircle, color: 'from-red-500 to-rose-500' },
        ].map((k) => (
          <div key={k.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} text-white grid place-items-center shrink-0`}>
              <k.icon size={16} />
            </div>
            <div>
              <div className="text-xs text-slate-500">{k.label}</div>
              <div className="font-extrabold text-slate-900">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student, order ID, course…"
            className="input pl-9 !py-2 text-sm w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input !py-2 text-sm min-w-[130px]"
        >
          <option value="ALL">All Status</option>
          <option value="paid">Paid</option>
          <option value="created">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input !py-2 text-sm min-w-[140px]"
        >
          <option value="ALL">All Types</option>
          <option value="course">Course</option>
          <option value="test_series">Test Series</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Order / Payment ID</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map((p) => {
                const Icon = STATUS_ICONS[p.status] || Clock;
                const itemTitle = p.course?.title || p.testSeries?.title || '—';
                const itemBadge = p.itemType === 'course'
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-violet-50 text-violet-700';
                return (
                  <tr key={p._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 leading-tight">{p.student?.name || '—'}</div>
                      <div className="text-xs text-slate-400">{p.student?.email}</div>
                      {p.student?.studentId && (
                        <div className="text-xs text-brand-600 font-mono">{p.student.studentId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700 leading-tight line-clamp-1 max-w-[180px]">{itemTitle}</div>
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${itemBadge}`}>
                        {p.itemType === 'test_series' ? 'Test Series' : 'Course'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-600 truncate max-w-[160px]">{p.razorpayOrderId || '—'}</div>
                      {p.razorpayPaymentId && (
                        <div className="font-mono text-xs text-emerald-600 truncate max-w-[160px]">{p.razorpayPaymentId}</div>
                      )}
                      {p.couponCode && (
                        <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                          🏷 {p.couponCode} -₹{p.discountAmount}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      ₹{p.amount?.toLocaleString()}
                      {p.discountAmount > 0 && (
                        <div className="text-xs text-slate-400 font-normal line-through">₹{p.originalAmount?.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[p.status] || ''}`}>
                        <Icon size={11} /> {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {fmt(p.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100">
          <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
