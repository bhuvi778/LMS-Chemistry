import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Atom, Mail, Lock, User, Phone, Loader2, Users } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';

export default function Register() {
  const { register, pendingVerification, verifyEmail, cancelVerification, loading } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    referralCode: searchParams.get('ref') ? `REF-${searchParams.get('ref')}` : '',
  });
  const [otp, setOtp] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await register(form);
      if (res?.requiresVerification) {
        toast.success('Verification code sent to your email');
      } else {
        toast.success(`Welcome, ${res.name}! Your Student ID: ${res.studentId}`);
        if ('Notification' in window) {
          Notification.requestPermission().catch(() => {});
        }
        nav(res.role === 'admin' ? '/admin' : '/student/dashboard', { replace: true });
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit verification code');
    try {
      const u = await verifyEmail(otp);
      toast.success(`Welcome, ${u.name}! Your Student ID: ${u.studentId}`);
      if ('Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
      nav(u.role === 'admin' ? '/admin' : '/student/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setOtp('');
    }
  };

  // ── WhatsApp Verification Screen ──
  if (pendingVerification) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12 order-2">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Ace2exam_white (1).png" alt="Ace2Examz Logo" className="h-10 w-auto object-contain" />
              <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
            </div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              WhatsApp Verification
            </h2>
            <p className="mt-4 text-white/80">
              A verification code was sent to your WhatsApp number: <b>{pendingVerification.phone || pendingVerification.email}</b>. Please check your WhatsApp messages.
            </p>
          </div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={submitVerification} className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-display text-3xl font-extrabold">Verify WhatsApp</h1>
            </div>
            <p className="text-slate-500 mt-1">
              We sent a 6-digit verification code to WhatsApp: <b>{pendingVerification.phone || pendingVerification.email}</b>
            </p>

            <div className="mt-6">
              <label className="label">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                required
                className="input text-center text-2xl tracking-[0.5em] font-bold"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
              />
            </div>

            <button disabled={loading} className="btn-primary w-full mt-6 justify-center">
              {loading && <Loader2 className="animate-spin" size={16} />}
              Verify Code
            </button>
            <button
              type="button"
              onClick={() => { cancelVerification(); setOtp(''); }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel — back to register
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12 order-2">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <img src="/Ace2exam_white (1).png" alt="Ace2Examz Logo" className="h-10 w-auto object-contain" />
            <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Start your Chemistry journey today
          </h2>
          <p className="mt-4 text-white/80">
            Get a free student ID, access sample lectures, and unlock your full potential.
          </p>
          <ul className="mt-6 space-y-2 text-white/90">
            <li>✓ Free student dashboard</li>
            <li>✓ Instant access to sample lectures</li>
            <li>✓ Join 50,000+ happy students</li>
          </ul>
        </div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md">
          <h1 className="font-display text-3xl font-extrabold">Create account</h1>
          <p className="text-slate-500 mt-1">A Student ID will be issued automatically.</p>

          <div className="mt-6">
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                className="input !pl-10"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="email"
                className="input !pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">WhatsApp Number <span className="text-red-500 font-bold">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">+91</span>
              <input
                required
                className="input !pl-12"
                value={form.phone}
                onChange={(e) => {
                  // Strip leading +91 if user types it
                  const val = e.target.value.replace(/^\+?91\s?/, '');
                  setForm({ ...form, phone: '+91' + val });
                }}
                placeholder="98765 43210"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Required to verify your account and receive class communications via WhatsApp.</p>
          </div>
          <div className="mt-4">
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="password"
                className="input !pl-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Referral Code <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input !pl-10"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                placeholder="e.g. REF-CHEM123456"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Your friend earns 5 Ace Coins when you sign up with their code.</p>
          </div>
          <button disabled={loading} className="btn-primary w-full mt-6 justify-center">
            {loading && <Loader2 className="animate-spin" size={16} />}
            Create account
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <GoogleLoginButton
            referralCode={form.referralCode}
            onSuccess={(u) => nav(u.role === 'admin' ? '/admin' : '/student/dashboard', { replace: true })}
          />

          <p className="text-sm text-slate-500 mt-5 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
