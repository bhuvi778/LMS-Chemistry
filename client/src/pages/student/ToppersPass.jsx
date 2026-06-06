import { useAuth } from '../../context/AuthContext.jsx';
import { Crown, CheckCircle2, ShieldAlert, Award, Compass, Zap, Flame } from 'lucide-react';

export default function ToppersPass() {
  const { user } = useAuth();
  
  // Custom mock configuration for demo
  const hasPass = true; 
  const expiryDate = '31 Dec 2026';
  const passSerial = 'TP-' + (user?.studentId || '88432') + '-X';

  const benefits = [
    {
      title: 'Full Mock Test Bank Access',
      desc: 'Unlock over 250+ full-syllabus Mock Exams & Previous Years Papers.',
      icon: Award
    },
    {
      title: '1-on-1 Priority Doubts Resolving',
      desc: 'Get your doubts answered in under 15 minutes by expert educators.',
      icon: Zap
    },
    {
      title: 'Rank Booster Cheat Sheets',
      desc: 'Exclusive access to formula booklets, summary maps, and memory trick sheets.',
      icon: Flame
    },
    {
      title: 'Monthly Live Masterclasses',
      desc: 'Free access keys to expert seminars and board-exam strategy rooms.',
      icon: Compass
    }
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800">Toppers' Pass</h1>
        <p className="text-sm text-slate-500 mt-1">Unlock your ultimate competitive edge for JEE & NEET.</p>
      </div>

      <div className="grid lg:grid-cols-[1.5fr,1fr] gap-8">
        {/* Left Side: Premium Card Display & Benefits */}
        <div className="space-y-8">
          {/* Glassmorphic Pass Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-brand-950 to-indigo-900 text-white p-8 shadow-xl border border-white/10">
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-brand-500/20 rounded-full blur-2xl" />
            <div className="absolute top-4 right-4 text-amber-400 opacity-25">
              <Crown size={120} />
            </div>

            <div className="relative flex flex-col justify-between h-56">
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Crown className="text-amber-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base tracking-wide">TOPPERS' PASS</h3>
                    <p className="text-[10px] text-white/60 tracking-wider">ACE2EXAMZ PREMIUM</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold rounded-full text-xs flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>ACTIVE</span>
                </div>
              </div>

              {/* Card Mid: User Info */}
              <div>
                <p className="text-xs text-white/50 tracking-wider font-semibold uppercase">PASS HOLDER</p>
                <h4 className="text-2xl font-bold font-display mt-0.5 tracking-wide uppercase">{user?.name || 'ADITYA'}</h4>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] text-white/40 tracking-wider uppercase">VALID THROUGH</p>
                  <p className="text-sm font-bold text-white/90">{expiryDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 tracking-wider uppercase">SERIAL KEY</p>
                  <p className="text-sm font-mono font-semibold text-amber-200">{passSerial}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-slate-800 text-lg">Exclusive Pass Benefits</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex gap-4 shadow-sm items-start">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <b.icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{b.title}</h4>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Usage Details & Activation Status */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-50 pb-3">Pass Account Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Verification Badge</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={16} /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Priority Level</span>
                <span className="text-brand-600 font-bold">Level 3 (Topper)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-semibold">Next Review Cycle</span>
                <span className="text-slate-700 font-semibold">June 2026</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-xs text-amber-800">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold">Pass Security Notice</h5>
                <p className="mt-1 leading-relaxed text-amber-700">
                  Sharing your Topper's Pass credentials or serial key is strictly prohibited and can result in instant membership revocation.
                </p>
              </div>
            </div>

            <button className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition">
              Download Digital Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
