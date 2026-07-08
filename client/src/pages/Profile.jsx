import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Badge,
  Shield,
  Calendar,
  Lock,
  Save,
  Loader2,
  Image as ImageIcon,
  LogOut,
  Smartphone,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Monitor,
  RefreshCw,
  GraduationCap,
  CreditCard,
  AlertCircle,
  Check,
} from 'lucide-react';
import BankTransferModal from '../components/BankTransferModal.jsx';

export default function Profile() {
  const { user, updateProfile, logout, setUser } = useAuth();
  const location = useLocation();
  const isStudentPanel = location.pathname.startsWith('/student');
  const [tab, setTab] = useState('info'); // 'info' | 'academic' | 'password' | 'security'
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [academic, setAcademic] = useState({
    grade: user?.grade || '',
    stream: user?.stream || '',
    board: user?.board || '',
    exams: user?.exams || '',
    language: user?.language || '',
    city: user?.city || '',
    state: user?.state || '',
    category: user?.category || '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
      setAcademic({
        grade: user.grade || '',
        stream: user.stream || '',
        board: user.board || '',
        exams: user.exams || '',
        language: user.language || '',
        city: user.city || '',
        state: user.state || '',
        category: user.category || '',
      });
    }
  }, [user]);

  const [pw, setPw] = useState({ currentPassword: '', password: '', confirm: '' });

  // Security/2FA state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false); // waiting for OTP to enable 2FA
  const [otpCode, setOtpCode] = useState('');
  const [otpSaving, setOtpSaving] = useState(false);

  // Payments / Bank Transfers state
  const [bankTransfers, setBankTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [activeTransferModal, setActiveTransferModal] = useState(null);

  if (!user) return null;

  const initials = (user.name || user.email || '?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const saveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim(), avatar: form.avatar.trim() });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAcademic = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        grade: academic.grade.trim(),
        stream: academic.stream.trim(),
        board: academic.board.trim(),
        exams: academic.exams.trim(),
        language: academic.language.trim(),
        city: academic.city.trim(),
        state: academic.state.trim(),
        category: academic.category.trim(),
      });
      toast.success('Academic details updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.password.length < 6) return toast.error('New password must be 6+ chars');
    if (pw.password !== pw.confirm) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await updateProfile({ currentPassword: pw.currentPassword, password: pw.password });
      toast.success('Password changed');
      setPw({ currentPassword: '', password: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Security helpers ──
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const { data } = await api.get('/auth/sessions');
      setSessions(data);
    } catch { /* ignore */ }
    finally { setSessionsLoading(false); }
  }, []);

  const fetchTransfers = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const { data } = await api.get('/bank-transfer/me');
      setBankTransfers(data || []);
    } catch {
      toast.error('Failed to load bank transfer requests');
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'security') fetchSessions();
    if (tab === 'payments') fetchTransfers();
  }, [tab, fetchSessions, fetchTransfers]);

  const revokeSession = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      toast.success('Session revoked');
    } catch (err) { toast.error(err.message); }
  };

  const revokeAll = async () => {
    if (!confirm('Revoke all other sessions? You will stay logged in here.')) return;
    try {
      await api.delete('/auth/sessions');
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch (err) { toast.error(err.message); }
  };

  const handle2FAToggle = async () => {
    const enable = !user.twoFactorEnabled;
    setOtpSaving(true);
    try {
      const { data } = await api.put('/auth/2fa', { enable });
      if (data.requiresVerification) {
        setOtpStep(true);
        toast.success('OTP sent to your email');
      } else {
        setUser((prev) => ({ ...prev, twoFactorEnabled: false, twoFactorMethod: 'none' }));
        toast.success('2FA disabled');
      }
    } catch (err) { toast.error(err.message); }
    finally { setOtpSaving(false); }
  };

  const confirm2FA = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) return toast.error('Enter the 6-digit OTP');
    setOtpSaving(true);
    try {
      const { data } = await api.post('/auth/2fa/verify', { code: otpCode });
      setUser((prev) => ({ ...prev, twoFactorEnabled: true, twoFactorMethod: 'email' }));
      setOtpStep(false);
      setOtpCode('');
      toast.success(data.message || '2FA enabled');
    } catch (err) {
      toast.error(err.message);
      setOtpCode('');
    } finally { setOtpSaving(false); }
  };

  const TABS = [
    { k: 'info', l: 'Personal Info', i: User },
    { k: 'academic', l: 'Academic Details', i: GraduationCap },
    { k: 'password', l: 'Password', i: Lock },
    { k: 'security', l: 'Security', i: ShieldCheck },
    { k: 'payments', l: 'Billing & Payments', i: CreditCard },
  ];

  return (
    <div>
      {/* Header band */}
      {!isStudentPanel ? (
        <section className="relative overflow-hidden bg-gradient-brand text-white">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_30%,#fff_0%,transparent_40%),radial-gradient(circle_at_80%_70%,#fff_0%,transparent_40%)]" />
          <div className="relative container-x py-12 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="relative">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur grid place-items-center text-3xl font-extrabold border-4 border-white/30 shadow-xl">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider">
                <Shield size={12} /> {user.role === 'admin' ? 'Admin Account' : 'Student Account'}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1 truncate">{user.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-white/90 text-sm">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>
                {user.studentId && <span className="flex items-center gap-1.5"><Badge size={14} /> {user.studentId}</span>}
                {user.createdAt && <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {user.role === 'admin' ? (
                <Link to="/admin" className="btn bg-white/20 backdrop-blur hover:bg-white/30 text-white">
                  <Shield size={16} /> Admin Panel
                </Link>
              ) : (
                <Link to="/dashboard" className="btn bg-white/20 backdrop-blur hover:bg-white/30 text-white">
                  My Dashboard
                </Link>
              )}
              <button onClick={logout} className="btn bg-white text-brand-700 hover:bg-slate-100">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account information, academic details, and security.</p>
        </div>
      )}

      <section className={isStudentPanel ? "py-2" : "container-x py-10"}>
        <div className="grid lg:grid-cols-[220px,1fr] gap-8">
          {/* Tabs */}
          <aside className="flex lg:flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition text-left ${
                  tab === t.k ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <t.i size={16} /> {t.l}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div>
            {tab === 'info' && (
              <form onSubmit={saveInfo} className="card p-6 sm:p-8 max-w-2xl">
                <h2 className="font-display text-xl font-extrabold">Personal Information</h2>
                <p className="text-slate-500 text-sm mt-1">Keep your profile up to date.</p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input className="input !pl-9" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input className="input !pl-9 bg-slate-50" value={user.email} disabled />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed.</p>
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">+91</span>
                      <input
                        className="input !pl-14"
                        value={form.phone ? String(form.phone).replace(/^\+?91\s?/, '') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^\+?91\s?/, '');
                          setForm({ ...form, phone: val ? '+91' + val : '' });
                        }}
                        placeholder="98765 43210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Student ID</label>
                    <div className="relative">
                      <Badge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input className="input !pl-9 bg-slate-50 font-mono" value={user.studentId || '—'} disabled />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Avatar URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input className="input !pl-9" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://…" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Paste a link to your profile picture.</p>
                  </div>
                </div>
                <button disabled={saving} className="btn-primary mt-6">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </form>
            )}

            {tab === 'academic' && (
              <form onSubmit={saveAcademic} className="card p-6 sm:p-8 max-w-2xl">
                <h2 className="font-display text-xl font-extrabold">Academic Details</h2>
                <p className="text-slate-500 text-sm mt-1">Your educational background helps us personalise content for you.</p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="label">Class</label>
                    <select className="input" value={academic.grade} onChange={(e) => setAcademic({ ...academic, grade: e.target.value })}>
                      <option value="">Select Class</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                      <option value="Class 12+">Class 12+</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Stream</label>
                    <select className="input" value={academic.stream} onChange={(e) => setAcademic({ ...academic, stream: e.target.value })}>
                      <option value="">Select Stream</option>
                      <option value="Medical">Medical</option>
                      <option value="Non-Medical">Non-Medical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Board</label>
                    <select className="input" value={academic.board} onChange={(e) => setAcademic({ ...academic, board: e.target.value })}>
                      <option value="">Select Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="IB">IB</option>
                      <option value="ICSE">ICSE</option>
                      <option value="IGCSE">IGCSE</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Target</label>
                    <select className="input" value={academic.exams} onChange={(e) => setAcademic({ ...academic, exams: e.target.value })}>
                      <option value="">Select Target</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Preferred Language</label>
                    <select className="input" value={academic.language} onChange={(e) => setAcademic({ ...academic, language: e.target.value })}>
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      className="input"
                      value={academic.state}
                      onChange={(e) => setAcademic({ ...academic, state: e.target.value })}
                      placeholder="Enter State"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={academic.category} onChange={(e) => setAcademic({ ...academic, category: e.target.value })} required>
                      <option value="">Select Category</option>
                      <option value="General">General</option>
                      <option value="OBC-NCL">OBC-NCL</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="Gen-EWS">Gen-EWS</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      className="input"
                      value={academic.city}
                      onChange={(e) => setAcademic({ ...academic, city: e.target.value })}
                      placeholder="Enter City"
                      required
                    />
                  </div>
                </div>
                <button disabled={saving} className="btn-primary mt-6">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Academic Details
                </button>
              </form>
            )}

            {tab === 'password' && (
              <form onSubmit={savePassword} className="card p-6 sm:p-8 max-w-md">
                <h2 className="font-display text-xl font-extrabold">Change Password</h2>
                <p className="text-slate-500 text-sm mt-1">Use a strong password of at least 6 characters.</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <input type="password" className="input" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" className="input" required value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input type="password" className="input" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                  </div>
                </div>
                <button disabled={saving} className="btn-primary mt-6">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Update Password
                </button>
              </form>
            )}

            {tab === 'security' && (
              <div className="space-y-6 max-w-2xl">
                {/* 2FA Card */}
                <div className="card p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${user.twoFactorEnabled ? 'bg-green-100' : 'bg-slate-100'}`}>
                      {user.twoFactorEnabled
                        ? <ShieldCheck size={24} className="text-green-600" />
                        : <ShieldOff size={24} className="text-slate-500" />}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-extrabold">Two-Factor Authentication</h2>
                      <p className="text-slate-500 text-sm mt-1">
                        {user.twoFactorEnabled
                          ? 'Your account is protected with email OTP verification on every login.'
                          : 'Add an extra layer of security. An OTP is sent to your email at login.'}
                      </p>
                      <div className="mt-1">
                        <span className={`chip text-xs ${user.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.twoFactorEnabled ? '✓ Enabled — Email OTP' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!otpStep ? (
                    <button
                      onClick={handle2FAToggle}
                      disabled={otpSaving}
                      className={`mt-5 btn ${user.twoFactorEnabled ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'btn-primary'}`}
                    >
                      {otpSaving && <Loader2 size={14} className="animate-spin" />}
                      {user.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA via Email'}
                    </button>
                  ) : (
                    <form onSubmit={confirm2FA} className="mt-5">
                      <p className="text-sm text-slate-600 mb-3">
                        Enter the 6-digit OTP sent to <b>{user.email}</b>
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          className="input text-center text-xl tracking-[0.4em] font-bold w-44"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          autoFocus
                        />
                        <button disabled={otpSaving} className="btn-primary">
                          {otpSaving ? <Loader2 size={14} className="animate-spin" /> : 'Verify & Enable'}
                        </button>
                        <button type="button" onClick={() => { setOtpStep(false); setOtpCode(''); }} className="btn">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Active Sessions Card */}
                <div className="card p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display text-xl font-extrabold">Active Sessions</h2>
                      <p className="text-slate-500 text-sm mt-0.5">Devices currently logged into your account.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={fetchSessions} className="btn text-xs" title="Refresh">
                        <RefreshCw size={14} className={sessionsLoading ? 'animate-spin' : ''} />
                      </button>
                      {sessions.length > 1 && (
                        <button onClick={revokeAll} className="btn text-xs text-red-600 hover:bg-red-50 border-red-200">
                          Revoke All Others
                        </button>
                      )}
                    </div>
                  </div>
                  {sessionsLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 py-4">
                      <Loader2 size={16} className="animate-spin" /> Loading sessions…
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4">No active sessions found.</p>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((s, i) => (
                        <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                            {/Mobile|Android|iOS|iPhone/i.test(s.deviceInfo)
                              ? <Smartphone size={18} className="text-slate-500" />
                              : <Monitor size={18} className="text-slate-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-800 truncate">{s.deviceInfo}</span>
                              {i === 0 && <span className="chip bg-green-100 text-green-700 text-[10px] py-0.5">Current</span>}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              IP: {s.ip || '—'} · Last active: {new Date(s.lastActive).toLocaleString('en-IN')}
                            </div>
                          </div>
                          {i !== 0 && (
                            <button onClick={() => revokeSession(s._id)} className="btn text-xs text-red-600 hover:bg-red-50 border-red-200">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger Zone - Account Deletion */}
                <div className="card p-6 sm:p-8 border border-red-200 bg-red-50/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-red-100">
                      <Trash2 size={24} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-extrabold text-red-950">Danger Zone</h2>
                      <p className="text-red-700/80 text-sm mt-1">
                        Permanently delete your account. This action is irreversible. All of your course progress, test scores, coin balance, and login details will be permanently destroyed.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={async () => {
                        const firstConfirm = confirm('WARNING: Are you absolutely sure you want to permanently delete your account? This action cannot be undone and you will lose all access immediately.');
                        if (!firstConfirm) return;
                        
                        const secondConfirm = confirm('Are you completely sure? Your progress, credentials, and test attempts will be wiped from the server.');
                        if (!secondConfirm) return;
                        
                        const verification = prompt('Type "DELETE MY ACCOUNT" to confirm permanent deletion:');
                        if (verification !== 'DELETE MY ACCOUNT') {
                          toast.error('Confirmation text mismatch. Deletion cancelled.');
                          return;
                        }
                        
                        setSaving(true);
                        try {
                          await api.delete('/auth/delete-account');
                          toast.success('Your account has been deleted successfully');
                          logout();
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to delete account');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="btn bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'payments' && (
              <div className="space-y-6 max-w-3xl">
                <div className="card p-6 sm:p-8 bg-white border border-slate-100 shadow-soft">
                  <h2 className="font-display text-xl font-extrabold text-slate-800">Offline & Bank Payments</h2>
                  <p className="text-slate-500 text-sm mt-1">Track and manage your requested offline enrollments.</p>

                  {loadingTransfers ? (
                    <div className="flex items-center gap-2 text-slate-400 py-10 justify-center">
                      <Loader2 size={20} className="animate-spin text-brand-500" /> Loading transaction requests…
                    </div>
                  ) : bankTransfers.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl mt-6">
                      <CreditCard className="mx-auto mb-2 text-slate-300" size={32} />
                      <p className="text-sm font-semibold">No payment requests found</p>
                      <p className="text-xs text-slate-400 mt-1">Submit bank transfer requests during course checkout.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-6">
                      {bankTransfers.map((req) => {
                        const item = req.itemType === 'course' ? req.course : req.testSeries;
                        return (
                          <div key={req._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              {item?.thumbnail ? (
                                <img src={item.thumbnail} alt={item.title} className="w-16 h-10 object-cover rounded-lg border shrink-0" />
                              ) : (
                                <div className="w-16 h-10 bg-slate-200 rounded-lg shrink-0 flex items-center justify-center">
                                  <CreditCard size={18} className="text-slate-400" />
                                </div>
                              )}
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  {req.itemType === 'course' ? 'Course Enrollment' : 'Test Series Access'}
                                </span>
                                <h4 className="font-bold text-slate-800 text-sm leading-snug">{item?.title || 'Deleted Item'}</h4>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                  <span>Total: <b>₹{req.totalAmount}</b></span>
                                  <span>•</span>
                                  <span>Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                                </div>
                                {req.adminNote && (
                                  <div className="mt-2 text-xs bg-rose-50 border border-rose-100 text-rose-700 p-2 rounded-lg flex items-start gap-1.5">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <span><strong>Admin Note:</strong> {req.adminNote}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                              {req.status === 'confirmed' && (
                                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                  <Check size={12} /> Confirmed
                                </span>
                              )}
                              {req.status === 'rejected' && (
                                <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                                  Rejected
                                </span>
                              )}
                              {req.status === 'pending' && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold text-center">
                                    Pending Verification
                                  </span>
                                  <button
                                    onClick={() => setActiveTransferModal(req)}
                                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition text-center"
                                  >
                                    {req.screenshotUrl ? 'Update Screenshot' : 'Upload Screenshot'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {activeTransferModal && (
                  <BankTransferModal
                    isOpen={!!activeTransferModal}
                    onClose={() => {
                      setActiveTransferModal(null);
                      fetchTransfers();
                    }}
                    itemType={activeTransferModal.itemType}
                    itemId={activeTransferModal.itemType === 'course' ? activeTransferModal.course?._id : activeTransferModal.testSeries?._id}
                    itemName={activeTransferModal.itemType === 'course' ? activeTransferModal.course?.title : activeTransferModal.testSeries?.title}
                    baseAmount={activeTransferModal.baseAmount}
                    initialRequest={activeTransferModal}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

