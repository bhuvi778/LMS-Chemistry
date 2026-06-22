import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Atom, Mail, Lock, Loader2, ShieldCheck, X } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';

// Pages where it doesn't make sense to return after login.
const UNSAFE_REDIRECTS = ['/login', '/register', '/logout', ''];

function safeRedirect(from, role) {
  if (typeof from === 'string' && from && !UNSAFE_REDIRECTS.includes(from)) {
    if (from.startsWith('/admin') && role !== 'admin') return '/student/dashboard';
    return from;
  }
  return role === 'admin' ? '/admin' : '/student/dashboard';
}

export default function Login() {
  const {
    login, verifyOtp, cancelOtp, pending2FA, pendingVerification,
    verifyEmail, cancelVerification, loading, user,
    pendingOtpLogin, requestOtpLogin, verifyOtpLogin, cancelOtpLogin
  } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'

  useEffect(() => {
    if (user) {
      nav(safeRedirect(loc.state?.from, user.role), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (loginMethod === 'otp') {
      try {
        await requestOtpLogin(form.email);
        toast.success('Login OTP code sent to your email');
      } catch (err) {
        toast.error(err.message);
      }
    } else {
      try {
        const result = await login(form.email, form.password);
        if (result?.requiresVerification) {
          toast.success('Verification code sent to your email');
        } else if (result?.requires2FA) {
          toast.success('2FA OTP sent to your email');
        } else {
          toast.success(`Welcome back, ${result.name}!`);
          if ('Notification' in window) {
            Notification.requestPermission().catch(() => {});
          }
          nav(safeRedirect(loc.state?.from, result.role), { replace: true });
        }
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const submitOtpLogin = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    try {
      const u = await verifyOtpLogin(otp);
      toast.success(`Welcome back, ${u.name}!`);
      if ('Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
      nav(safeRedirect(loc.state?.from, u.role), { replace: true });
      setOtp('');
    } catch (err) {
      toast.error(err.message);
      setOtp('');
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    try {
      const u = await verifyOtp(otp);
      toast.success(`Welcome back, ${u.name}!`);
      if ('Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
      nav(safeRedirect(loc.state?.from, u.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
      setOtp('');
    }
  };

  const submitVerification = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit verification code');
    try {
      const u = await verifyEmail(otp);
      toast.success(`Welcome back, ${u.name}!`);
      if ('Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
      nav(safeRedirect(loc.state?.from, u.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
      setOtp('');
    }
  };

  // ── Email Verification Screen ──
  if (pendingVerification) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Ace2exam_white (1).png" alt="Ace2Examz Logo" className="h-10 w-auto object-contain" />
              <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
            </div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              Email Verification
            </h2>
            <p className="mt-4 text-white/80">
              An email verification code was sent to <b>{pendingVerification.email}</b>. Check your inbox.
            </p>
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={submitVerification} className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={28} className="text-brand-600" />
              <h1 className="font-display text-3xl font-extrabold">Verify Email</h1>
            </div>
            <p className="text-slate-500 mt-1">
              We sent a 6-digit verification code to <b>{pendingVerification.email}</b>
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
              <X size={14} /> Cancel — back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Login with OTP Verification Screen ──
  if (pendingOtpLogin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Ace2exam_white (1).png" alt="Ace2Examz Logo" className="h-10 w-auto object-contain" />
              <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
            </div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              Sign in with OTP
            </h2>
            <p className="mt-4 text-white/80">
              An OTP was sent to <b>{pendingOtpLogin.email}</b>. Check your inbox to verify and open your account.
            </p>
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={submitOtpLogin} className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={28} className="text-brand-600" />
              <h1 className="font-display text-3xl font-extrabold">Enter OTP</h1>
            </div>
            <p className="text-slate-500 mt-1">
              We sent a 6-digit login OTP code to <b>{pendingOtpLogin.email}</b>
            </p>

            <div className="mt-6">
              <label className="label">One-Time Password</label>
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
              Verify & Log In
            </button>
            <button
              type="button"
              onClick={() => { cancelOtpLogin(); setOtp(''); }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <X size={14} /> Cancel — back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── OTP Screen ──
  if (pending2FA) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Ace2exam_white (1).png" alt="Ace2Examz Logo" className="h-10 w-auto object-contain" />
              <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
            </div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              Two-Factor Authentication
            </h2>
            <p className="mt-4 text-white/80">
              An OTP was sent to <b>{pending2FA.email}</b>. Check your inbox.
            </p>
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={submitOtp} className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={28} className="text-brand-600" />
              <h1 className="font-display text-3xl font-extrabold">Enter OTP</h1>
            </div>
            <p className="text-slate-500 mt-1">
              We sent a 6-digit code to <b>{pending2FA.email}</b>
            </p>

            <div className="mt-6">
              <label className="label">One-Time Password</label>
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
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => { cancelOtp(); setOtp(''); }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <X size={14} /> Cancel — back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Regular Login Screen ──
  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <img src="/Ace2exam_white (1).png" alt="Ace2Examz Logo" className="h-10 w-auto object-contain" />
            <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Welcome back to India's #1 Chemistry Platform
          </h2>
          <p className="mt-4 text-white/80">
            Pick up where you left off and keep crushing your goals.
          </p>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md">
          <h1 className="font-display text-3xl font-extrabold">Sign in</h1>
          <p className="text-slate-500 mt-1">Enter your credentials to continue.</p>

          <div className="mt-6">
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                className="input !pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
          </div>
          {loginMethod === 'password' && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <label className="label !mb-0">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  className="input !pl-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {loginMethod === 'password' ? 'Sign in with OTP instead' : 'Sign in with password instead'}
            </button>
          </div>

          <button disabled={loading} className="btn-primary w-full mt-6 justify-center">
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loginMethod === 'otp' ? 'Send Login OTP' : 'Sign in'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <GoogleLoginButton onSuccess={(u) => nav(safeRedirect(loc.state?.from, u.role), { replace: true })} />

          <p className="text-sm text-slate-500 mt-5 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-700 font-semibold">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

