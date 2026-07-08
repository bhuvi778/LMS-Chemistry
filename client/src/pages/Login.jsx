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
    verifyEmail, cancelVerification, loading, user, bootstrapping,
    pendingOtpLogin, requestOtpLogin, verifyOtpLogin, cancelOtpLogin
  } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [channel, setChannel] = useState('whatsapp'); // 'sms' or 'whatsapp'
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (pendingOtpLogin) {
      setTimer(30);
    }
  }, [pendingOtpLogin]);

  useEffect(() => {
    let interval;
    if (pendingOtpLogin && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pendingOtpLogin, timer]);

  useEffect(() => {
    // Once bootstrapping is done, if the user is not authenticated, clear any stale token/user.
    // This prevents background widgets (like SupportChatWidget) from using a stale token and throwing session expired errors.
    if (!bootstrapping && !user) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [bootstrapping, user]);

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
        await requestOtpLogin(form.email, channel);
        if (/^\+?\d+$/.test(form.email.trim())) {
          toast.success('Login OTP sent via WhatsApp');
        } else {
          toast.success('Login OTP code sent to your email');
        }
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
    if (emailOtp.length !== 6 || whatsappOtp.length !== 6) {
      return toast.error('Please enter the 6-digit verification codes for both Email and WhatsApp');
    }
    try {
      const u = await verifyEmail(emailOtp, whatsappOtp);
      toast.success(`Welcome back, ${u.name}!`);
      if ('Notification' in window) {
        Notification.requestPermission().catch(() => {});
      }
      nav(safeRedirect(loc.state?.from, u.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
      setEmailOtp('');
      setWhatsappOtp('');
    }
  };

  // ── Account Verification Screen ──
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
              Verification Required
            </h2>
            <p className="mt-4 text-white/80">
              For security, we require verification of both your Email address and WhatsApp number to access your account.
            </p>
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={submitVerification} className="w-full max-w-md space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={28} className="text-brand-600" />
                <h1 className="font-display text-3xl font-extrabold">Verify Account</h1>
              </div>
              <p className="text-slate-500 mt-1">
                Both email and WhatsApp verification are mandatory.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">1. Email Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  className="input text-center text-xl tracking-[0.5em] font-bold"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">We sent a code to: <b>{pendingVerification.email}</b></p>
              </div>

              <div>
                <label className="label">2. WhatsApp Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  className="input text-center text-xl tracking-[0.5em] font-bold"
                  value={whatsappOtp}
                  onChange={(e) => setWhatsappOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
                <p className="text-[10px] text-slate-400 mt-1">We sent a code to WhatsApp: <b>{pendingVerification.phone}</b></p>
              </div>
            </div>

            <div>
              <button disabled={loading} className="btn-primary w-full justify-center">
                {loading && <Loader2 className="animate-spin" size={16} />}
                Verify & Login
              </button>
              <button
                type="button"
                onClick={() => { cancelVerification(); setEmailOtp(''); setWhatsappOtp(''); }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <X size={14} /> Cancel — back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Login with OTP Verification Screen ──
  if (pendingOtpLogin) {
    const targetVal = pendingOtpLogin.method === 'phone' ? pendingOtpLogin.phone : pendingOtpLogin.email;
    const destName = pendingOtpLogin.method === 'phone' ? 'phone' : 'email inbox';
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
              An OTP was sent to <b>{targetVal}</b>. Check your {destName} to verify and open your account.
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
              We sent a 6-digit login OTP code to <b>{targetVal}</b>
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

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive the OTP?"}
              </span>
              <button
                type="button"
                disabled={timer > 0 || loading}
                onClick={async () => {
                  try {
                    await requestOtpLogin(targetVal, pendingOtpLogin.method === 'phone' ? 'whatsapp' : 'email');
                    setTimer(30);
                    toast.success('OTP resent successfully');
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
                className={`font-semibold text-brand-600 ${timer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-brand-700 hover:underline'}`}
              >
                Resend OTP
              </button>
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

          {loc.search.includes('reason=session_expired') && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg text-red-600 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-red-800">Session Expired</p>
                <p className="text-[11px] text-red-600 leading-relaxed">
                  You were logged out because your session expired or you logged in from another device.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                  className="mt-1.5 text-[10px] font-bold text-red-700 hover:underline block"
                >
                  Log In on This Device
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="label">{loginMethod === 'otp' ? 'Email or Phone Number' : 'Email'}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={loginMethod === 'otp' ? 'text' : 'email'}
                required
                className="input !pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={loginMethod === 'otp' ? 'you@example.com or +919876543210' : 'you@example.com'}
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

