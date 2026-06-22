import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Search, Filter, X, Mail, Phone, Calendar, ShieldCheck,
  KeyRound, LogOut, Loader2, Users as UsersIcon, BookOpen,
  Lock, Copy, RefreshCw, Check, Eye, EyeOff, ExternalLink,
  UserPlus, PlusCircle, Trash2, GraduationCap, ListChecks, Coins,
} from 'lucide-react';
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

export default function AdminStudents() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => api.get('/admin/students').then((r) => setList(r.data));

  useEffect(() => {
    if (localStorage.getItem('token')) {
      load();
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set();
    list.forEach((s) => s.enrollments?.forEach((e) => e.course?.category && cats.add(e.course.category)));
    return ['ALL', ...Array.from(cats).sort()];
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (catFilter !== 'ALL') {
      result = result.filter((s) => s.enrollments?.some((e) => e.course?.category === catFilter));
    }
    if (q) {
      const s = q.toLowerCase();
      result = result.filter(
        (x) =>
          x.name?.toLowerCase().includes(s) ||
          x.email?.toLowerCase().includes(s) ||
          x.phone?.includes(q) ||
          x.studentId?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [list, q, catFilter]);

  useEffect(() => setPage(1), [q, catFilter]);
  const paged = usePaged(filtered, page, PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <UsersIcon className="text-brand-600" /> Students
          </h1>
          <p className="text-slate-500">
            {filtered.length} of {list.length} students{catFilter !== 'ALL' ? ` in ${catFilter}` : ''}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <UserPlus size={16} /> Add Student
          </button>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="input !pl-8 !py-2 text-sm min-w-[160px]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, ID, phone…"
              className="input pl-9 !py-2 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <UsersIcon size={36} className="mx-auto mb-3 opacity-40" />
          No students found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((s) => (
            <StudentCard key={s._id} s={s} onOpen={() => setOpenId(s._id)} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />

      {openId && (
        <StudentModal
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}

      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

function AddStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState('');
  const [showPw, setShowPw] = useState(true);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, password: pw }));
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    setBusy(true);
    try {
      const r = await api.post('/admin/students', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password.trim() || undefined,
      });
      setCreated(r.data);
      toast.success('Student created!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create student');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="sticky top-0 bg-white/95 backdrop-blur p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <UserPlus size={18} className="text-brand-600" /> Add Student Manually
          </h2>
          <button onClick={created ? onCreated : onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-5">
          {!created ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Full Name <span className="text-rose-500">*</span></label>
                <input value={form.name} onChange={set('name')} className="input w-full" placeholder="e.g. Arjun Sharma" required />
              </div>
              <div>
                <label className="label">Email <span className="text-rose-500">*</span></label>
                <input type="email" value={form.email} onChange={set('email')} className="input w-full" placeholder="student@email.com" required />
              </div>
              <div>
                <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={form.phone} onChange={set('phone')} className="input w-full" placeholder="+971 50 000 0000" />
              </div>
              <div>
                <label className="label flex items-center justify-between">
                  <span>Password <span className="text-slate-400 font-normal">(leave blank to auto-generate)</span></span>
                  <button type="button" onClick={generatePassword} className="text-[11px] text-brand-700 font-semibold flex items-center gap-1 hover:underline">
                    <RefreshCw size={10} /> Generate
                  </button>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    className="input flex-1 font-mono"
                    placeholder="Auto-generated if blank"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="btn-outline px-3" title={showPw ? 'Hide' : 'Show'}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2">
                A Student ID will be auto-generated. The password will be visible in the student card for sharing.
              </p>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Create Student
                </button>
                <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="text-emerald-600 font-bold text-lg mb-1">Student Created!</div>
                <div className="text-sm text-slate-700">Share these credentials with the student:</div>
              </div>
              <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-violet2-50 p-4 space-y-2">
                <CredRow label="Name" value={created.name} />
                <CredRow label="Student ID" value={created.studentId} mono onCopy={() => copy(created.studentId, 'sid')} copied={copied === 'sid'} />
                <CredRow label="Email" value={created.email} onCopy={() => copy(created.email, 'email')} copied={copied === 'email'} />
                <CredRow label="Password" value={created.plainPassword} mono onCopy={() => copy(created.plainPassword, 'pw')} copied={copied === 'pw'} />
              </div>
              <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                Save this password now — it won't be shown again after you close (but remains visible in the student card).
              </p>
              <button onClick={onCreated} className="btn-primary w-full">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CredRow({ label, value, mono, onCopy, copied }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-brand-100/60 last:border-0">
      <span className="text-slate-500 text-xs w-24 shrink-0">{label}</span>
      <span className={`flex-1 font-medium text-slate-900 truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
      {onCopy && (
        <button onClick={onCopy} className="ml-2 text-brand-600 hover:bg-brand-100 p-1 rounded" title="Copy">
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        </button>
      )}
    </div>
  );
}

function StudentCard({ s, onOpen }) {
  const enrollCount = s.enrollments?.length || 0;
  const has2FA = s.twoFactorEnabled;
  return (
    <button
      onClick={onOpen}
      className="card p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition group w-full"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorFor(s.name || s.email)} text-white grid place-items-center font-extrabold text-lg shrink-0 shadow-md`}>
          {initialsOf(s.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-slate-900 truncate">{s.name}</h3>
            {has2FA && <span title="2FA enabled" className="text-emerald-600"><ShieldCheck size={14} /></span>}
            {s.isActive === false && (
              <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Inactive
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">Joined {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Login credentials box (most prominent) */}
      <div className="rounded-xl bg-gradient-to-br from-brand-50 to-violet2-50 border border-brand-100 p-3 mb-3 space-y-1.5">
        <div className="text-[9px] uppercase font-bold tracking-wider text-brand-700 flex items-center gap-1">
          <KeyRound size={10} /> Login Credentials
        </div>
        <div className="text-xs">
          <span className="text-slate-500">Student ID:</span>{' '}
          <span className="font-mono font-bold text-brand-700">{s.studentId || '—'}</span>
        </div>
        <div className="text-xs flex items-start gap-1">
          <span className="text-slate-500 shrink-0">Email:</span>{' '}
          <span className="font-medium text-slate-900 truncate" title={s.email}>{s.email}</span>
        </div>
        <div className="text-xs flex items-start gap-1">
          <span className="text-slate-500 shrink-0">Password:</span>{' '}
          {s.plainPassword
            ? <span className="font-mono font-bold text-emerald-700">{s.plainPassword}</span>
            : <span className="text-slate-400 italic">•••••••• (click Manage to reset)</span>}
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-brand-100/60">
          <Lock size={9} />
          {s.passwordSetByAdmin
            ? <span>Password set by admin {s.passwordSetAt ? new Date(s.passwordSetAt).toLocaleDateString('en-IN') : ''}</span>
            : <span>Self-registered</span>}
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        {s.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" />{s.phone}</div>}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className={`chip text-[10px] ${enrollCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          <BookOpen size={10} className="inline" /> {enrollCount} course{enrollCount !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-brand-600 font-semibold opacity-0 group-hover:opacity-100 transition">Manage →</span>
      </div>
    </button>
  );
}

function StudentModal({ id, onClose, onChanged }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [lastSetPw, setLastSetPw] = useState(null);
  const [copied, setCopied] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [enrollBusy, setEnrollBusy] = useState('');
  const [selectedPlans, setSelectedPlans] = useState({});

  const updateField = (key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
  };

  const saveStreakCoins = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/students/${id}`, {
        streak: data.streak,
        longestStreak: data.longestStreak,
        coins: data.coins,
        isActive: data.isActive !== false,
        maxSessions: data.maxSessions || 1,
      });
      toast.success('Account settings updated!');
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update settings');
    } finally {
      setBusy(false);
    }
  };

  const enrolledIds = useMemo(
    () => new Set((data?.enrollments || []).map((e) => String(e.course?._id || e.course))),
    [data]
  );

  const filteredCourses = useMemo(() => {
    const s = courseSearch.toLowerCase();
    return allCourses.filter(
      (c) => (c.title?.toLowerCase().includes(s) || c.category?.toLowerCase().includes(s))
    );
  }, [allCourses, courseSearch]);

  const openEnroll = () => {
    if (!allCourses.length) {
      api.get('/courses').then((r) => setAllCourses(r.data?.courses || r.data || []));
    }
    setShowEnroll(true);
  };

  const enrollInCourse = async (courseId, planType = 'batch') => {
    setEnrollBusy(courseId);
    try {
      await api.post(`/admin/students/${id}/enroll`, { courseId, planType });
      toast.success('Course allotted!');
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setEnrollBusy('');
    }
  };

  const removeEnrollment = async (courseId) => {
    if (!confirm('Remove this course enrollment?')) return;
    setEnrollBusy(courseId);
    try {
      await api.delete(`/admin/students/${id}/enroll/${courseId}`);
      toast.success('Enrollment removed');
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setEnrollBusy('');
    }
  };

  const [showEnrollSeries, setShowEnrollSeries] = useState(false);
  const [allSeries, setAllSeries] = useState([]);
  const [seriesSearch, setSeriesSearch] = useState('');
  const [enrollSeriesBusy, setEnrollSeriesBusy] = useState('');

  const enrolledSeriesIds = useMemo(
    () => new Set((data?.testSeriesEnrollments || []).map((e) => String(e.testSeries?._id || e.testSeries))),
    [data]
  );

  const filteredSeries = useMemo(() => {
    const s = seriesSearch.toLowerCase();
    return allSeries.filter(
      (c) => !enrolledSeriesIds.has(String(c._id)) &&
        (c.title?.toLowerCase().includes(s) || c.examTags?.some(t => t.toLowerCase().includes(s)))
    );
  }, [allSeries, enrolledSeriesIds, seriesSearch]);

  const openEnrollSeries = () => {
    if (!allSeries.length) {
      api.get('/tests/admin/series').then((r) => setAllSeries(r.data || []));
    }
    setShowEnrollSeries(true);
  };

  const enrollInSeries = async (seriesId) => {
    setEnrollSeriesBusy(seriesId);
    try {
      await api.post(`/admin/students/${id}/enroll-test-series`, { seriesId });
      toast.success('Test Series allotted!');
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setEnrollSeriesBusy('');
    }
  };

  const removeSeriesEnrollment = async (seriesId) => {
    if (!confirm('Remove this test series enrollment?')) return;
    setEnrollSeriesBusy(seriesId);
    try {
      await api.delete(`/admin/students/${id}/enroll-test-series/${seriesId}`);
      toast.success('Enrollment removed');
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setEnrollSeriesBusy('');
    }
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setNewPw(pw);
  };

  const load = () =>
    api
      .get(`/admin/students/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => {
        toast.error(e.response?.data?.message || e.message || 'Could not load student');
        onClose();
      });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const resetPassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      await api.put(`/admin/students/${id}/reset-password`, { newPassword: newPw });
      toast.success('Password set · all sessions revoked');
      setLastSetPw(newPw);
      setShowReset(false);
      setNewPw('');
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const revokeSessions = async () => {
    if (!confirm('Force logout this student from all devices?')) return;
    setBusy(true);
    try {
      await api.delete(`/admin/students/${id}/sessions`);
      toast.success('All sessions revoked');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const loginAsStudent = async () => {
    if (!confirm(`Login as "${data?.name}"? This will open their student account in a new tab.`)) return;
    setBusy(true);
    try {
      const r = await api.post(`/admin/students/${id}/impersonate`);
      const { token, student } = r.data;
      // Pass token via sessionStorage (same origin), then open the impersonate landing page
      sessionStorage.setItem('impersonate_payload', JSON.stringify({ token, student }));
      window.open('/impersonate', '_blank');
      toast.success(`Opened student account for ${student.name}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to impersonate');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur p-5 border-b border-slate-100 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg">Student Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        {!data ? (
          <div className="p-16 text-center text-slate-400"><Loader2 className="animate-spin inline" /></div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${colorFor(data.name)} text-white grid place-items-center font-extrabold text-2xl shrink-0 shadow-lg`}>
                {initialsOf(data.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-2xl font-extrabold">{data.name}</h3>
                <div className="font-mono text-xs text-brand-700">{data.studentId}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.twoFactorEnabled && (
                    <span className="chip bg-emerald-50 text-emerald-700 text-[10px]"><ShieldCheck size={10} /> 2FA Enabled</span>
                  )}
                  {data.role === 'admin' && <span className="chip bg-violet2-100 text-violet2-700 text-[10px]">Admin</span>}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <InfoRow icon={Mail} label="Email" value={data.email} onCopy={() => copy(data.email, 'email')} copied={copied === 'email'} />
              <InfoRow icon={Phone} label="Phone" value={data.phone || '—'} onCopy={data.phone ? () => copy(data.phone, 'phone') : null} copied={copied === 'phone'} />
              <InfoRow icon={KeyRound} label="Student ID (Username)" value={data.studentId || '—'} mono onCopy={data.studentId ? () => copy(data.studentId, 'sid') : null} copied={copied === 'sid'} />
              <InfoRow icon={Calendar} label="Joined" value={new Date(data.createdAt).toLocaleString('en-IN')} />
            </div>

            {/* Login credentials box */}
            <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet2-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm flex items-center gap-2"><Lock size={14} className="text-brand-700" /> Login Credentials</h4>
                <span className="text-[10px] text-slate-500">Student logs in with email/student-ID + password</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Username (email)</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-slate-900 truncate flex-1" title={data.email}>{data.email}</span>
                    <button onClick={() => copy(data.email, 'm-email')} className="text-brand-600 hover:bg-brand-50 p-1 rounded" title="Copy">
                      {copied === 'm-email' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Password</div>
                  {(lastSetPw || data.plainPassword) ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`font-mono font-bold text-emerald-700 flex-1 ${showPw ? '' : 'blur-[3px] select-none'}`}>
                        {lastSetPw || data.plainPassword}
                      </span>
                      <button onClick={() => setShowPw((v) => !v)} className="text-slate-400 hover:text-brand-600 p-1 rounded" title={showPw ? 'Hide' : 'Show'}>
                        {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={() => copy(lastSetPw || data.plainPassword, 'pw')} className="text-brand-600 hover:bg-brand-50 p-1 rounded" title="Copy">
                        {copied === 'pw' ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  ) : (
                    <div className="text-amber-700 italic mt-0.5 text-[11px]">
                      Legacy account — use "Set New Password" below to assign a known password.
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Lock size={9} />
                {data.passwordSetAt && (
                  <span>
                    {data.passwordSetByAdmin ? 'Last set by admin' : 'Last changed by student'}: {new Date(data.passwordSetAt).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {!lastSetPw && !data.plainPassword && (
                <p className="text-[10px] text-amber-700 mt-1.5">
                  ⚠️ This student registered before password visibility was added. Use "Set New Password" to assign a known password.
                </p>
              )}
            </div>

            {/* Academic Details */}
            {(data.grade || data.stream || data.board || data.exams || data.language) && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold text-sm flex items-center gap-2 mb-3"><GraduationCap size={14} className="text-brand-600" /> Academic Details</h4>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {data.grade && <div><span className="text-slate-500">Class: </span><span className="font-semibold">{data.grade}</span></div>}
                  {data.stream && <div><span className="text-slate-500">Stream: </span><span className="font-semibold">{data.stream}</span></div>}
                  {data.board && <div><span className="text-slate-500">Board: </span><span className="font-semibold">{data.board}</span></div>}
                  {data.exams && <div><span className="text-slate-500">Target: </span><span className="font-semibold">{data.exams}</span></div>}
                  {data.language && <div><span className="text-slate-500">Language: </span><span className="font-semibold">{data.language}</span></div>}
                </div>
              </div>
            )}

            {/* Streak, Wallet & Account Control */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Coins size={14} className="text-amber-500 animate-pulse" /> Streak, Wallet & Account Control
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Streak</label>
                  <input
                    type="number"
                    value={data.streak || 0}
                    onChange={(e) => updateField('streak', parseInt(e.target.value) || 0)}
                    className="input w-full !py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Longest Streak</label>
                  <input
                    type="number"
                    value={data.longestStreak || 0}
                    onChange={(e) => updateField('longestStreak', parseInt(e.target.value) || 0)}
                    className="input w-full !py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ace Coins</label>
                  <input
                    type="number"
                    value={data.coins || 0}
                    onChange={(e) => updateField('coins', parseInt(e.target.value) || 0)}
                    className="input w-full !py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Sessions</label>
                  <input
                    type="number"
                    value={data.maxSessions || 1}
                    onChange={(e) => updateField('maxSessions', parseInt(e.target.value) || 1)}
                    className="input w-full !py-1 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="student-active-toggle"
                    checked={data.isActive !== false}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                    className="w-4 h-4 accent-brand-600 cursor-pointer"
                  />
                  <label htmlFor="student-active-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Account Active (toggled off will block login & force logout)
                  </label>
                </div>
                <button
                  disabled={busy}
                  onClick={saveStreakCoins}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  Save Account Settings
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm flex items-center gap-2"><BookOpen size={14} className="text-brand-600" /> Enrolled Courses ({data.enrollments?.length || 0})</h4>
                <button onClick={openEnroll} className="btn-primary text-xs flex items-center gap-1">
                  <PlusCircle size={13} /> Allot Course
                </button>
              </div>

              {/* Course picker */}
              {showEnroll && (
                <div className="mb-3 rounded-xl border-2 border-brand-200 bg-brand-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-700">Select a course to allot</span>
                    <button onClick={() => { setShowEnroll(false); setCourseSearch(''); }} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search courses…"
                      className="input w-full !pl-8 !py-1.5 text-xs"
                    />
                  </div>
                  {filteredCourses.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      {allCourses.length === 0 ? 'Loading…' : 'No courses found'}
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredCourses.map((c) => {
                        const isEnrolled = enrolledIds.has(String(c._id));
                        const enrollment = data?.enrollments?.find(e => String(e.course?._id || e.course) === String(c._id));
                        const currentPlan = selectedPlans[c._id] || enrollment?.planType || 'batch';
                        return (
                          <div key={c._id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-100">
                            {c.thumbnail && <img src={c.thumbnail} className="w-9 h-9 rounded object-cover shrink-0" alt="" />}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs truncate">{c.title}</div>
                              <div className="text-[10px] text-slate-500">
                                {c.category} {isEnrolled && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded ml-1">Enrolled</span>}
                              </div>
                            </div>
                            <select
                              value={currentPlan}
                              onChange={(e) => setSelectedPlans(prev => ({ ...prev, [c._id]: e.target.value }))}
                              className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                            >
                              <option value="batch">Ace Batch</option>
                              <option value="pro">Ace Pro</option>
                              <option value="infinity">Ace Infinity</option>
                            </select>
                            <button
                              disabled={enrollBusy === c._id}
                              onClick={() => enrollInCourse(c._id, currentPlan)}
                              className={`text-[11px] px-2.5 py-1 shrink-0 rounded font-bold transition ${
                                isEnrolled 
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : 'bg-brand-600 hover:bg-brand-700 text-white'
                              } disabled:opacity-50`}
                            >
                              {enrollBusy === c._id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : isEnrolled ? (
                                'Upgrade'
                              ) : (
                                'Allot'
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {data.enrollments?.length ? (
                <div className="space-y-2">
                  {data.enrollments.map((e) => (
                    <div key={e._id} className="rounded-xl border border-slate-100 p-3 flex items-center gap-3 bg-slate-50">
                      {e.course?.thumbnail && <img src={e.course.thumbnail} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{e.course?.title || '— deleted course —'}</div>
                        <div className="text-[11px] text-slate-500">
                          {e.course?.category} · Enrolled {new Date(e.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <select
                            value={e.planType || 'batch'}
                            onChange={async (event) => {
                              const newPlan = event.target.value;
                              if (confirm(`Change plan for "${e.course?.title || 'this course'}" to ${newPlan.toUpperCase()}?`)) {
                                setEnrollBusy(String(e.course?._id || e.course));
                                try {
                                  await api.put(`/admin/enrollments/${e._id}/extend`, {
                                    planType: newPlan,
                                    validUntil: e.validUntil || null
                                  });
                                  toast.success('Plan updated/upgraded successfully!');
                                  load();
                                } catch (err) {
                                  toast.error(err.response?.data?.message || 'Failed to update plan');
                                } finally {
                                  setEnrollBusy('');
                                }
                              }
                            }}
                            disabled={enrollBusy === String(e.course?._id || e.course)}
                            className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-white font-bold uppercase text-brand-700 focus:outline-none focus:border-brand-500 cursor-pointer"
                          >
                            <option value="batch">batch</option>
                            <option value="pro">pro</option>
                            <option value="infinity">infinity</option>
                          </select>
                          {e.paymentId?.startsWith('ADMIN_ALLOT_') && (
                            <span className="text-[10px] font-semibold text-brand-600">Admin allotted</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`chip text-[10px] ${e.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {e.paid ? 'Paid' : 'Unpaid'}
                        </span>
                        <button
                          disabled={enrollBusy === String(e.course?._id || e.course)}
                          onClick={() => removeEnrollment(String(e.course?._id || e.course))}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                          title="Remove enrollment"
                        >
                          {enrollBusy === String(e.course?._id || e.course)
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No enrollments yet.</div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm flex items-center gap-2"><ListChecks size={14} className="text-brand-600" /> Enrolled Test Series ({data.testSeriesEnrollments?.length || 0})</h4>
                <button onClick={openEnrollSeries} className="btn-primary text-xs flex items-center gap-1">
                  <PlusCircle size={13} /> Allot Test Series
                </button>
              </div>

              {/* Test Series picker */}
              {showEnrollSeries && (
                <div className="mb-3 rounded-xl border-2 border-brand-200 bg-brand-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-700">Select a test series to allot</span>
                    <button onClick={() => { setShowEnrollSeries(false); setSeriesSearch(''); }} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={seriesSearch}
                      onChange={(e) => setSeriesSearch(e.target.value)}
                      placeholder="Search test series…"
                      className="input w-full !pl-8 !py-1.5 text-xs"
                    />
                  </div>
                  {filteredSeries.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      {allSeries.length === 0 ? 'Loading…' : 'No unenrolled test series found'}
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredSeries.map((c) => (
                        <div key={c._id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-100">
                          {c.thumbnail && <img src={c.thumbnail} className="w-9 h-9 rounded object-cover shrink-0" alt="" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate">{c.title}</div>
                            <div className="text-[10px] text-slate-500">{c.examTags?.join(', ')}</div>
                          </div>
                          <button
                            disabled={enrollSeriesBusy === c._id}
                            onClick={() => enrollInSeries(c._id)}
                            className="btn-primary text-[11px] px-2 py-1 shrink-0 disabled:opacity-50"
                          >
                            {enrollSeriesBusy === c._id ? <Loader2 size={11} className="animate-spin" /> : 'Allot'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {data.testSeriesEnrollments?.length ? (
                <div className="space-y-2">
                  {data.testSeriesEnrollments.map((e) => (
                    <div key={e._id} className="rounded-xl border border-slate-100 p-3 flex items-center gap-3 bg-slate-50">
                      {e.testSeries?.thumbnail && <img src={e.testSeries.thumbnail} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{e.testSeries?.title || '— deleted test series —'}</div>
                        <div className="text-[11px] text-slate-500">
                          Enrolled {new Date(e.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        {e.paymentId?.startsWith('ADMIN_ALLOT_') && (
                          <span className="text-[10px] font-semibold text-brand-600">Admin allotted</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`chip text-[10px] ${e.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {e.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                        <button
                          disabled={enrollSeriesBusy === String(e.testSeries?._id || e.testSeries)}
                          onClick={() => removeSeriesEnrollment(String(e.testSeries?._id || e.testSeries))}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                          title="Remove enrollment"
                        >
                          {enrollSeriesBusy === String(e.testSeries?._id || e.testSeries)
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No test series enrollments yet.</div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-brand-600" /> Active Sessions ({data.sessions?.length || 0})</h4>
              {data.sessions?.length ? (
                <div className="space-y-1.5">
                  {data.sessions.map((sess) => (
                    <div key={sess._id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                      <div className="truncate mr-2">
                        <div className="font-medium truncate">{sess.deviceInfo?.slice(0, 80) || 'Unknown device'}</div>
                        <div className="text-slate-500 text-[10px]">IP: {sess.ip || '—'} · Last active {new Date(sess.lastActive || sess.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Log out this device?')) return;
                          try {
                            await api.delete(`/admin/students/${id}/sessions/${sess._id}`);
                            toast.success('Device logged out');
                            load();
                          } catch (e) {
                            toast.error(e.response?.data?.message || 'Failed');
                          }
                        }}
                        className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded font-semibold text-[10px] shrink-0 transition"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No active sessions.</div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-sm mb-3 text-rose-700">Security Actions</h4>
              {!showReset ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowReset(true)} className="btn-primary text-xs"><KeyRound size={14} /> Set New Password</button>
                  <button disabled={busy || !data.sessions?.length} onClick={revokeSessions} className="btn-outline text-xs disabled:opacity-40">
                    <LogOut size={14} /> Revoke All Sessions
                  </button>
                  <button disabled={busy} onClick={loginAsStudent} className="btn-outline text-xs border-violet2-300 text-violet2-700 hover:bg-violet2-50 disabled:opacity-40">
                    <ExternalLink size={14} /> Login as Student
                  </button>
                  <button
                    onClick={async () => {
                      const firstConfirm = confirm('WARNING: Are you absolutely sure you want to permanently delete this student? This action CANNOT be undone and will delete all their course progress, test scores, wallet balances, and logins.');
                      if (!firstConfirm) return;
                      const nameTyped = prompt(`Please type the student's name: "${data.name}" to confirm permanent deletion:`);
                      if (nameTyped !== data.name) {
                        toast.error('Name verification failed. Account was not deleted.');
                        return;
                      }
                      setBusy(true);
                      try {
                        await api.delete(`/admin/students/${id}`);
                        toast.success('Student account and data deleted successfully');
                        onClose();
                        onChanged?.();
                      } catch (e) {
                        toast.error(e.response?.data?.message || 'Deletion failed');
                        setBusy(false);
                      }
                    }}
                    className="btn-outline border-rose-300 text-rose-700 hover:bg-rose-50 text-xs ml-auto"
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3 space-y-2">
                  <label className="label flex items-center justify-between">
                    <span>New Password (min 6 chars)</span>
                    <button type="button" onClick={generatePassword} className="text-[11px] text-brand-700 font-semibold flex items-center gap-1 hover:underline">
                      <RefreshCw size={10} /> Generate
                    </button>
                  </label>
                  <div className="flex gap-1.5">
                    <input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input flex-1 font-mono" placeholder="Type or click Generate" />
                    {newPw && (
                      <button type="button" onClick={() => copy(newPw, 'np')} className="btn-outline px-3" title="Copy">
                        {copied === 'np' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-rose-700"><b>Important:</b> Note this password now — after closing this dialog, you won't see it again. Share it with the student over a secure channel.</p>
                  <div className="flex gap-2">
                    <button disabled={busy || !newPw} onClick={resetPassword} className="btn-primary text-xs">
                      {busy ? <Loader2 className="animate-spin" size={12} /> : <KeyRound size={12} />} Save & Activate
                    </button>
                    <button onClick={() => { setShowReset(false); setNewPw(''); }} className="btn-outline text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, onCopy, copied }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 bg-slate-50 relative group">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-semibold">
        <Icon size={11} /> {label}
      </div>
      <div className={`text-sm font-medium text-slate-900 mt-0.5 break-all pr-7 ${mono ? 'font-mono' : ''}`}>{value}</div>
      {onCopy && (
        <button onClick={onCopy} className="absolute top-2 right-2 text-slate-400 hover:text-brand-600 p-1" title="Copy">
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        </button>
      )}
    </div>
  );
}
