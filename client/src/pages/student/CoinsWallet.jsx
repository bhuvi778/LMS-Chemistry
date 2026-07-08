import { useState, useEffect } from 'react';
import { Coins, ArrowUpRight, ArrowDownRight, Gift, Trophy, ShieldQuestion } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

export default function CoinsWallet() {
  const { user, setUser } = useAuth();
  const currentBalance = user?.coins || 0;
  const [redemptions, setRedemptions] = useState([]);
  const [plannerGoals, setPlannerGoals] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auth/coin-redemptions').then(res => res.data).catch(() => []),
      api.get('/ace-track/planner').then(res => res.data).catch(() => []),
      api.get('/tests/attempts/me').then(res => res.data).catch(() => [])
    ])
      .then(([redData, plannerData, attemptsData]) => {
        setRedemptions(redData || []);
        setPlannerGoals(plannerData || []);
        setTestAttempts(attemptsData || []);
      })
      .catch((err) => {
        console.error('Error fetching coin transaction data:', err);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, []);

  // Generate dynamic transaction history based on actual user events
  const history = [];

  // 1. Database coin redemptions (purchases / rewards)
  redemptions.forEach((red) => {
    history.push({
      type: 'spend',
      title: red.itemName || `Redeemed ${red.itemType}`,
      date: new Date(red.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: new Date(red.createdAt),
      amount: red.coinsSpent,
    });
  });

  // 2. Daily Attendance Rewards
  let attendanceCoins = 0;
  if (user?.activeDays && user.activeDays.length > 0) {
    user.activeDays.forEach((dayStr) => {
      const date = new Date(dayStr);
      if (!isNaN(date.getTime())) {
        attendanceCoins += 1;
        history.push({
          type: 'earn',
          title: 'Daily Attendance Reward',
          date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          rawDate: date,
          amount: 1,
        });
      }
    });
  }

  // 3. Completed Planner Goals
  let plannerCoins = 0;
  plannerGoals.forEach((goal) => {
    if (goal.isCompleted && goal.coinAwarded) {
      plannerCoins += 1;
      const completedDate = goal.completedAt ? new Date(goal.completedAt) : new Date(goal.updatedAt);
      history.push({
        type: 'earn',
        title: `Planner Goal Completed: ${goal.title}`,
        date: completedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        rawDate: completedDate,
        amount: 1,
      });
    }
  });

  // 4. Completed Daily Tests
  let testCoins = 0;
  const earliestAttempts = {};
  testAttempts.forEach((attempt) => {
    if (attempt.test?.isDailyTest) {
      const testId = attempt.test._id.toString();
      const attemptDate = new Date(attempt.submittedAt);
      if (!earliestAttempts[testId] || attemptDate < earliestAttempts[testId].date) {
        earliestAttempts[testId] = {
          attempt,
          date: attemptDate
        };
      }
    }
  });

  Object.values(earliestAttempts).forEach(({ attempt, date }) => {
    testCoins += 2;
    history.push({
      type: 'earn',
      title: `Daily Test Completed: ${attempt.test.title}`,
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: date,
      amount: 2,
    });
  });

  // 5. Admin Adjustment Difference
  const totalEarnedSoFar = attendanceCoins + plannerCoins + testCoins;
  const totalSpentSoFar = redemptions.reduce((acc, curr) => acc + curr.coinsSpent, 0);
  const expectedBalance = totalEarnedSoFar - totalSpentSoFar;

  if (currentBalance !== expectedBalance) {
    const diff = currentBalance - expectedBalance;
    history.push({
      type: diff >= 0 ? 'earn' : 'spend',
      title: 'Admin Adjustment / Custom Rewards',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: new Date(),
      amount: Math.abs(diff),
    });
  }

  // Sort history by date descending
  history.sort((a, b) => b.rawDate - a.rawDate);

  const inrEquivalent = currentBalance.toFixed(2);

  const rewards = [
    { title: '₹250 Discount Voucher', cost: 250, label: 'Discount Voucher' },
    { title: '₹500 Discount Voucher', cost: 500, label: 'Discount Voucher' },
    { title: '₹750 Discount Voucher', cost: 750, label: 'Discount Voucher' },
    { title: '₹1250 Discount Voucher', cost: 1250, label: 'Discount Voucher' }
  ];

  const handleRedeem = async (reward) => {
    if (currentBalance < 250) {
      toast.error('You need at least 250 Coins to redeem any reward.');
      return;
    }
    if (currentBalance < reward.cost) {
      toast.error('Insufficient Coins! Keep studying to earn more.');
      return;
    }
    try {
      const r = await api.post('/auth/redeem', { cost: reward.cost, title: reward.title });
      setUser(r.data); // Update Auth context immediately
      
      const redList = await api.get('/auth/coin-redemptions');
      setRedemptions(redList.data || []);
      
      toast.success(`Successfully redeemed: ${reward.title}! Check your email for your coupon code.`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to redeem reward. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Coins Wallet</h1>
          <p className="text-sm text-slate-500 mt-1">Earn reward coins by learning and spend them on premium resources.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Coins size={180} />
          </div>
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">Available Balance</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Coins size={36} className="text-yellow-250 animate-pulse" />
                <span className="text-5xl font-extrabold font-display leading-none">{currentBalance}</span>
                <span className="text-sm font-semibold opacity-85 self-end mb-1">Ace Coins</span>
              </div>
              <div className="h-6 w-px bg-white/25 mx-2 hidden sm:block"></div>
              <span className="text-xl font-bold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-2xl text-white flex items-center gap-1.5 shadow-sm">
                ≈ ₹{inrEquivalent} INR
              </span>
            </div>
            <p className="text-xs opacity-75 pt-1">Conversion rate: 1 Coin = ₹1 💰</p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">How to earn coins?</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
              <li>Sign Up Bonus: <b>+25 Coins</b> <span className="text-[10px] text-slate-400 font-normal">(One-time)</span></li>
              <li>First Course Purchase: <b>+75 Coins</b> <span className="text-[10px] text-slate-400 font-normal">(One-time)</span></li>
              <li>Daily Attendance: <b>+1 Coin</b> <span className="text-[10px] text-slate-400 font-normal">(Daily login)</span></li>
              <li>Weekly Attendance Milestone: <b>+20 Coins</b></li>
              <li>Monthly Attendance Milestone: <b>+60 Coins</b></li>
              <li>Refer & Earn (Per verified invite): <b>+50 Coins</b></li>
              <li>Profile Completion: <b>+10 Coins</b> <span className="text-[10px] text-slate-400 font-normal">(One-time)</span></li>
              <li>Daily Test completion: <b>+2 Coins</b></li>
              <li>Planner Goal completion: <b>+1 Coin</b></li>
            </ul>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3">
            Conversion Rate: 1 Coin = ₹1
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
        {/* Left Column: Transaction History */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-50 pb-3">
              Transaction History
            </h3>
            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {history.map((log, idx) => (
                <div key={idx} className="flex justify-between items-center gap-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.type === 'earn' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {log.type === 'earn' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-700 truncate text-xs sm:text-sm">{log.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{log.date}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm shrink-0 ${
                    log.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {log.type === 'earn' ? '+' : '-'}{log.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Spend Catalog & Refer & Earn */}
        <div className="space-y-6">
          {/* Refer & Earn Box */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-indigo-100 pb-3 flex items-center gap-2">
              <Trophy size={18} className="text-indigo-600" />
              <span>Refer &amp; Earn</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Invite friends to Ace2Examz! Share your unique referral code. You'll receive <b>50 Coins</b> (equivalent to ₹50) as soon as they sign up and verify their email.
            </p>
            <div className="bg-white rounded-2xl p-4 border border-indigo-100 space-y-2 shadow-sm">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Your Referral Code</p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono font-black text-indigo-700 uppercase select-all tracking-wider text-sm">
                  {user?.studentId ? `REF-${user.studentId}` : 'REF-INVITE5'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.studentId ? `REF-${user.studentId}` : 'REF-INVITE5');
                    toast.success('Referral code copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>

          {/* Spend / Rewards catalog */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-50 pb-3 flex items-center gap-2">
              <Gift size={18} className="text-yellow-600" />
              <span>Redeem Rewards</span>
            </h3>
            {currentBalance < 250 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold">
                ⚠️ You need a minimum balance of 250 Coins to start redeeming vouchers.
              </div>
            )}
            <div className="space-y-3">
              {rewards.map((reward, i) => {
                const isRedeemed = redemptions.some(r => r.itemName === reward.title);
                const canAfford = currentBalance >= reward.cost && currentBalance >= 250;
                return (
                  <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${
                    isRedeemed
                      ? 'border-emerald-100 bg-emerald-50/40'
                      : canAfford
                        ? 'border-amber-100 bg-gradient-to-r from-amber-50/50 to-yellow-50/30 hover:shadow-sm'
                        : 'border-slate-100 bg-slate-50/60'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Coins size={13} className={canAfford || isRedeemed ? 'text-amber-500' : 'text-slate-300'} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isRedeemed ? 'text-emerald-600' : canAfford ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {reward.cost} Coins
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{reward.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">≈ ₹{reward.cost} discount</p>
                    </div>
                    <div className="shrink-0">
                      {isRedeemed ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-xl border border-emerald-100">
                            ✓ Redeemed
                          </span>
                          <button
                            onClick={() => {
                              toast.success(`Your Voucher Coupon Code: ACE-INR-${reward.cost}-OFFER`, { duration: 6000 });
                            }}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] rounded-xl text-center shadow-sm transition"
                          >
                            View Code
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canAfford}
                          className={`px-4 py-2 font-bold text-xs rounded-xl transition shadow-sm ${
                            canAfford
                              ? 'bg-slate-900 hover:bg-amber-600 text-white cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                        >
                          Redeem
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
