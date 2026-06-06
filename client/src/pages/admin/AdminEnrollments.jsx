import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client.js';
import { Search, Mail, Phone, Calendar, BookOpen, CreditCard, CheckCircle2, Clock, LayoutGrid, List, ExternalLink } from 'lucide-react';
import Pagination, { usePaged } from '../../components/Pagination.jsx';

const PAGE_SIZE = 12;

const initialsOf = (name = '') =>
  name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

const colorFor = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const palette = [
    'from-brand-500 to-violet2-500',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
  ];
  return palette[h % palette.length];
};

const fmt = (d) => new Date(d).toLocaleString('en-AE', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function AdminEnrollments() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [view, setView] = useState('grid'); // 'grid' | 'table'
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/enrollments').then((r) => setList(r.data));
  }, []);

  const filtered = useMemo(() => {
    let result = list;
    if (statusFilter !== 'ALL') result = result.filter((e) => e.paymentStatus === statusFilter);
    if (q) {
      const s = q.toLowerCase();
      result = result.filter(
        (e) =>
          e.student?.name?.toLowerCase().includes(s) ||
          e.student?.email?.toLowerCase().includes(s) ||
          e.student?.phone?.includes(q) ||
          e.student?.studentId?.toLowerCase().includes(s) ||
          e.course?.title?.toLowerCase().includes(s) ||
          e.paymentId?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [list, q, statusFilter]);

  useEffect(() => setPage(1), [q, statusFilter, view]);
  const paged = usePaged(filtered, page, PAGE_SIZE);

  const totalRevenue = filtered.reduce((s, e) => s + (e.pricePaid || 0), 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <BookOpen className="text-brand-600" /> Enrollments
          </h1>
          <p className="text-slate-500">
            {filtered.length} of {list.length} enrollments · Total{' '}
            <b className="text-emerald-700">AED {totalRevenue.toLocaleString()}</b>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input !py-2 text-sm min-w-[120px]"
          >
            <option value="ALL">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <div className="relative md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student, course, payment ID…"
              className="input pl-9 !py-2 text-sm"
            />
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              title="Card view"
              className={`p-2 ${view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('table')}
              title="Table view"
              className={`p-2 ${view === 'table' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
          No enrollments found.
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((e) => (
            <EnrollCard key={e._id} e={e} />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Course</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr key={e._id} className="border-t border-slate-100">
                  <td className="p-4">
                    <div className="font-semibold">{e.student?.name}</div>
                    <div className="text-xs text-slate-500">{e.student?.email}</div>
                    <div className="text-xs text-brand-700 font-mono">{e.student?.studentId}</div>
                  </td>
                  <td className="p-4">{e.student?.phone || '—'}</td>
                  <td className="p-4">
                    <div className="font-medium">{e.course?.title}</div>
                    <span className="chip bg-brand-50 text-brand-700 text-[10px]">{e.course?.category}</span>
                  </td>
                  <td className="p-4 font-semibold">AED {e.pricePaid?.toLocaleString()}</td>
                  <td className="p-4 font-mono text-xs">{e.paymentId || '—'}</td>
                  <td className="p-4">
                    <StatusChip status={e.paymentStatus} />
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{fmt(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    paid: { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Paid' },
    pending: { cls: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
    failed: { cls: 'bg-rose-100 text-rose-700', icon: Clock, label: 'Failed' },
  };
  const m = map[status] || map.paid;
  const Icon = m.icon;
  return (
    <span className={`chip text-[10px] ${m.cls}`}>
      <Icon size={10} className="inline" /> {m.label}
    </span>
  );
}

function EnrollCard({ e }) {
  const s = e.student || {};
  const c = e.course || {};
  return (
    <div className="card p-0 overflow-hidden flex flex-col hover:shadow-lg transition">
      {c.thumbnail ? (
        <div className="relative h-24 overflow-hidden">
          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <div className="text-white font-bold text-sm leading-tight line-clamp-1 drop-shadow">{c.title}</div>
            {c.category && <span className="chip bg-white/90 text-brand-700 text-[10px] mt-1">{c.category}</span>}
          </div>
          <div className="absolute top-2 right-2"><StatusChip status={e.paymentStatus} /></div>
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-brand-500 to-violet2-500 p-3 flex items-end">
          <div className="text-white font-bold text-sm leading-tight line-clamp-2">{c.title || 'Course'}</div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Student row */}
        <div className="flex items-center gap-3">
          {s.avatar ? (
            <img src={s.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${colorFor(s.name || s.email)} text-white grid place-items-center font-extrabold text-sm shrink-0 shadow-sm`}>
              {initialsOf(s.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-900 truncate text-sm">{s.name || '— deleted user —'}</div>
            <div className="font-mono text-[10px] text-brand-700 truncate">{s.studentId}</div>
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <Mail size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{s.email || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone size={11} className="text-slate-400" />
            {s.phone ? (
              <a href={`tel:${s.phone}`} className="hover:text-brand-700 truncate">{s.phone}</a>
            ) : (
              <span className="text-slate-400 italic">No phone</span>
            )}
          </div>
        </div>

        {/* Payment box */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
                <CreditCard size={10} /> Paid
              </div>
              <div className="text-base font-extrabold gradient-text">
                AED {e.pricePaid?.toLocaleString() || 0}
              </div>
            </div>
            <StatusChip status={e.paymentStatus} />
          </div>
          {e.paymentId && (
            <div className="text-[10px] font-mono text-slate-500 mt-1 truncate" title={e.paymentId}>
              ID: {e.paymentId}
            </div>
          )}
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Calendar size={10} /> {fmt(e.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
