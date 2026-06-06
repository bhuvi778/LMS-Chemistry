import { useState } from 'react';
import { Users, Copy, Share2, CheckCircle, Coins, Trophy, Gift, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ReferAndEarn() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.studentId ? `REF-${user.studentId}` : 'REF-INVITE5';
  const referralLink = `${window.location.origin}/register?ref=${user?.studentId || 'INVITE5'}`;
  const referralCount = user?.referralCount || 0;
  const coinsEarned = referralCount * 5;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const message = `🎓 Join me on Ace2Examz – the best Chemistry LMS!\n\nUse my referral code: ${referralCode}\nOr sign up directly: ${referralLink}\n\nYou'll get instant access to courses, tests & more!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Ace2Examz', text: message, url: referralLink });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const steps = [
    { icon: Share2, title: 'Share Your Code', desc: 'Share your unique referral code with friends' },
    { icon: Users, title: 'Friend Signs Up', desc: 'They register using your referral code' },
    { icon: Coins, title: 'Earn 5 Coins', desc: 'You receive 5 Ace Coins instantly (≈ 0.20 AED)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800">Refer & Earn</h1>
        <p className="text-sm text-slate-500 mt-1">Invite friends and earn 5 Ace Coins for every successful referral.</p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
          <Users size={200} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-2xl">Earn 5 Coins per Friend</h2>
              <p className="text-white/80 text-sm">Equivalent to 0.20 AED per referral</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-extrabold font-display">{referralCount}</div>
              <div className="text-xs text-white/80 font-semibold mt-1">Friends Referred</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-extrabold font-display">{coinsEarned}</div>
              <div className="text-xs text-white/80 font-semibold mt-1">Coins Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-display font-extrabold text-slate-800 text-base">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="font-mono font-black text-indigo-700 text-lg uppercase tracking-widest select-all">
              {referralCode}
            </span>
            <button
              onClick={copyCode}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-soft hover:-translate-y-0.5"
        >
          <Share2 size={18} />
          Share via WhatsApp / Other Apps
        </button>

        <p className="text-xs text-slate-400 text-center">
          Share your referral link: <span className="text-indigo-600 font-mono text-[10px] break-all">{referralLink}</span>
        </p>
      </div>

      {/* How it Works */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-display font-extrabold text-slate-800 text-base">How It Works</h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <step.icon size={18} />
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight size={16} className="text-slate-300 mt-2.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          📋 <b>Terms:</b> Referral coins are credited once your friend successfully creates and verifies their account. Conversion rate: 25 Coins = 1 AED. There is no limit on referrals.
        </p>
      </div>
    </div>
  );
}
