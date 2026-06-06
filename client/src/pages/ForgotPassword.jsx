import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Atom, Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword, loading } = useAuth();
  const nav = useNavigate();
  
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    try {
      await forgotPassword(email);
      toast.success('Password reset OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      return toast.error('Please enter the 6-digit OTP code');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await resetPassword(email, code, newPassword);
      toast.success('Password reset successful! Welcome back.');
      nav('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Left decoration panel */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-brand text-white p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <Atom size={28} />
            <span className="font-display font-extrabold text-2xl">Ace2Examz</span>
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Security & Account Recovery
          </h2>
          <p className="mt-4 text-white/80">
            Follow the steps to securely recover your account password.
          </p>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 font-medium">
            <ArrowLeft size={16} /> Back to Login
          </Link>

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <h1 className="font-display text-3xl font-extrabold">Forgot password?</h1>
              <p className="text-slate-500 mt-1">Enter your registered email to receive an OTP.</p>

              <div className="mt-6">
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    className="input !pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button disabled={loading} className="btn-primary w-full mt-6 justify-center">
                {loading && <Loader2 className="animate-spin" size={16} />}
                Send Reset OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={28} className="text-brand-600" />
                <h1 className="font-display text-3xl font-extrabold">Reset Password</h1>
              </div>
              <p className="text-slate-500 mt-1">
                We sent a 6-digit OTP code to <b>{email}</b>.
              </p>

              <div className="mt-6">
                <label className="label">Verification OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  className="input text-center text-2xl tracking-[0.5em] font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                />
              </div>

              <div className="mt-4">
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    className="input !pl-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    className="input !pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <button disabled={loading} className="btn-primary w-full mt-6 justify-center">
                {loading && <Loader2 className="animate-spin" size={16} />}
                Reset Password
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full mt-3 text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Use a different email address
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
