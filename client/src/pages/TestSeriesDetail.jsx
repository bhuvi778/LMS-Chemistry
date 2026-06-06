import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  Layers,
  Clock,
  ClipboardList,
  Lock,
  Unlock,
  ChevronRight,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Star,
  Zap,
  Tag,
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  Share2,
  Coins
} from 'lucide-react';
import BankTransferModal from '../components/BankTransferModal.jsx';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const DIFFICULTY_COLORS = {
  basic: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function TestSeriesDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [series, setSeries] = useState(null);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);

  // Tab state
  const [activeMain, setActiveMain] = useState(null);
  const [activeSub, setActiveSub] = useState(null);

  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [payMode, setPayMode] = useState('razorpay');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankTransferRequest, setBankTransferRequest] = useState(null);
  const [redeemCoins, setRedeemCoins] = useState(false);

  // Custom tag filter for tests inside the series
  const [selectedCustomTag, setSelectedCustomTag] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/tests/series/${id}`);
        setSeries(data);
        if (user) {
          const { data: attempts } = await api.get('/tests/attempts/me');
          setMyAttempts(attempts);
          if (!data.isFree) {
            const { data: enrollData } = await api.get(`/payment/check-series/${id}`);
            setEnrolled(enrollData.enrolled);
          } else {
            setEnrolled(true);
          }
          api.get('/bank-transfer/me').then((r) => {
            const matching = (r.data || []).find(
              (req) => req.itemType === 'test_series' && req.testSeries?._id === id
            );
            setBankTransferRequest(matching);
          }).catch(() => {});
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    try {
      const { data } = await api.post('/payment/validate-coupon', {
        testSeriesId: id,
        couponCode: couponInput.trim(),
      });
      setCouponApplied(data);
      toast.success(`Coupon applied! You save AED ${data.discountAmount}`);
    } catch (e) {
      toast.error(e.message || 'Invalid coupon code');
      setCouponApplied(null);
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponInput('');
  };

  const handleEnroll = useCallback(async () => {
    if (!user) {
      toast('Please login to enroll', { icon: '🔒' });
      nav('/login', { state: { from: `/test-series/${id}` } });
      return;
    }

    if (series?.isFree) {
      setEnrolled(true);
      return;
    }

    setBusy(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        setBusy(false);
        return;
      }

      const { data: orderData } = await api.post('/payment/create-order', {
        testSeriesId: id,
        couponCode: couponApplied?.couponCode || '',
        redeemCoins: redeemCoins,
      });

      if (orderData.free) {
        toast.success('Enrolled successfully! 🎉');
        setEnrolled(true);
        setBusy(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ace2Examz',
        description: orderData.itemName,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' });
            setBusy(false);
          },
        },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              testSeriesId: id,
            });
            toast.success('Payment successful! 🎉');
            setEnrolled(true);
          } catch (e) {
            toast.error(e.message || 'Payment verification failed. Please contact support.');
          } finally {
            setBusy(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      toast.error(e.message || 'Could not initiate payment. Please try again.');
      setBusy(false);
    }
  }, [user, series, couponApplied, id, nav]);

  const tests = useMemo(() => {
    if (!series) return [];
    return (series.tests || []).sort((a, b) => a.order - b.order);
  }, [series]);

  const canAccess = series?.isFree || enrolled;
  const finalPrice = couponApplied ? couponApplied.finalAmount : (series?.price || 0);
  let displayPrice = finalPrice;
  let coinDiscount = 0;
  if (redeemCoins && user) {
    const maxCoinsNeeded = Math.floor(finalPrice * 25);
    const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
    coinDiscount = coinsToRedeem / 25;
    displayPrice = Math.max(0, finalPrice - coinDiscount);
  }

  // -- Tab helpers --
  const MAIN_LABELS = { mock: 'Mock Tests', previous_year: 'Previous Papers' };
  const SUB_LABELS = { full_test: 'Full Tests', sectional: 'Sectional', chapter: 'Chapter', other: 'Other' };

  // Count per mainType
  const mainCounts = useMemo(() => {
    const m = {};
    tests.forEach(({ mainType }) => { const k = mainType || 'mock'; m[k] = (m[k] || 0) + 1; });
    return m;
  }, [tests]);

  const mainKeys = useMemo(() => Object.keys(mainCounts), [mainCounts]);

  // Auto-select first mainType
  const effectiveMain = activeMain && mainCounts[activeMain] ? activeMain : (mainKeys[0] || null);

  // Tests filtered by activeMain
  const mainFiltered = useMemo(
    () => tests.filter((t) => (t.mainType || 'mock') === effectiveMain),
    [tests, effectiveMain]
  );

  // Count per subType inside activeMain
  const subCounts = useMemo(() => {
    const s = {};
    mainFiltered.forEach(({ subType }) => { const k = subType || 'full_test'; s[k] = (s[k] || 0) + 1; });
    return s;
  }, [mainFiltered]);

  const subKeys = useMemo(() => Object.keys(subCounts), [subCounts]);
  const effectiveSub = activeSub && subCounts[activeSub] ? activeSub : (subKeys[0] || null);

  // Reset selectedCustomTag when effectiveMain or effectiveSub changes
  useEffect(() => {
    setSelectedCustomTag(null);
  }, [effectiveMain, effectiveSub]);

  // Extract all unique custom tags for the current active category & sub-category
  const availableTags = useMemo(() => {
    const tags = new Set();
    mainFiltered
      .filter((t) => !effectiveSub || (t.subType || 'full_test') === effectiveSub)
      .forEach((t) => {
        (t.customTags || []).forEach((tag) => {
          if (tag && tag.trim()) tags.add(tag.trim());
        });
      });
    return Array.from(tags);
  }, [mainFiltered, effectiveSub]);

  // Final filtered list including custom tag filter
  const displayTests = useMemo(() => {
    let list = mainFiltered.filter((t) => !effectiveSub || (t.subType || 'full_test') === effectiveSub);
    if (selectedCustomTag) {
      list = list.filter((t) => (t.customTags || []).includes(selectedCustomTag));
    }
    return list;
  }, [mainFiltered, effectiveSub, selectedCustomTag]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (!series) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container-x max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tests" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm text-slate-500">Back to Test Portal</span>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#050B1F] to-[#1a0733] text-white rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Layers size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${series.isFree ? 'bg-emerald-500/20 text-emerald-300' : enrolled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'}`}>
                  {series.isFree ? 'Free Series' : enrolled ? 'Enrolled' : `AED ${series.price?.toLocaleString()}`}
                </span>
                {series.seriesType === 'previous_paper' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                    Previous Year Paper
                  </span>
                )}
                {(series.categories || []).map((cat) => (
                  <span key={cat} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/70">
                    {cat}
                  </span>
                ))}
                {(series.examTags || []).map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-bold mb-2">{series.title}</h1>
              {series.description && <p className="text-white/70 text-sm">{series.description}</p>}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10 text-sm text-white/60">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5"><ClipboardList size={14} /> {tests.length} Tests</span>
                  {series.validity?.type === 'lifetime' && (
                    <span className="flex items-center gap-1.5"><Clock size={14} /> Lifetime Access</span>
                  )}
                  {series.validity?.type === 'duration' && (
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {series.validity.durationValue} {series.validity.durationUnit} access</span>
                  )}
                  {series.validity?.type === 'endDate' && series.validity.endDate && (
                    <span className="flex items-center gap-1.5"><Clock size={14} /> Valid till {new Date(series.validity.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success('Test Series link copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
                >
                  <Share2 size={13} /> Share Series
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enroll / Coupon section (only for paid non-enrolled series) */}
        {!series.isFree && !enrolled && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 space-y-4">
            <h2 className="font-bold text-slate-800">Get Full Access</h2>

            {/* Price display */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-slate-900">
                AED {displayPrice?.toLocaleString()}
              </span>
              {(couponApplied || coinDiscount > 0 || series.mrp > series.price) && (
                <span className="text-sm text-slate-400 line-through">
                  AED {(couponApplied ? series.price : series.mrp)?.toLocaleString()}
                </span>
              )}
              {couponApplied && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                  Save AED {couponApplied.discountAmount?.toLocaleString()}
                </span>
              )}
              {coinDiscount > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                  Coins Saved AED {coinDiscount?.toLocaleString()}
                </span>
              )}
              {!couponApplied && coinDiscount === 0 && series.mrp > series.price && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                  Save AED {(series.mrp - series.price)?.toLocaleString()}
                </span>
              )}
            </div>

            {/* Coupon input */}
            {user && (
              couponApplied ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold">
                  <Tag size={14} />
                  <span className="flex-1">{couponApplied.couponCode} applied</span>
                  <button onClick={removeCoupon} className="hover:text-red-500 transition">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponBusy || !couponInput.trim()}
                      className="text-sm font-bold px-3 py-2 rounded-xl border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:opacity-50 transition"
                    >
                      {couponBusy ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {/* Available coupons chips */}
                  {(series.discountCoupons?.filter((c) => c.isActive && c.code) || []).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Available Coupons:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {series.discountCoupons.filter((c) => c.isActive && c.code).map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCouponInput(c.code)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1.5"
                          >
                            <Tag size={11} />
                            {c.code}
                            <span className="text-amber-500 font-normal">
                              — {c.discountType === 'percent' ? `${c.discountValue}% off` : `AED ${c.discountValue} off`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            )}

            {/* Coin Redemption checkbox */}
            {user && user.role !== 'admin' && user.coins >= 250 && (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="text-amber-500 animate-pulse" size={16} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Redeem Ace Coins</p>
                    <p className="text-[10px] text-slate-500 font-semibold">You have {user.coins} coins (≈ {(user.coins / 25).toFixed(2)} AED)</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={redeemCoins}
                  onChange={(e) => setRedeemCoins(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-slate-350 rounded focus:ring-amber-500 cursor-pointer"
                />
              </div>
            )}

            {/* Payment Mode Selector */}
            {user && user.role !== 'admin' && series?.price > 0 && (() => {
              const initialAmt = finalPrice || series.price;
              let baseAmt = initialAmt;
              let coinDiscountVal = 0;
              if (redeemCoins && user.coins >= 250) {
                const maxCoinsNeeded = Math.floor(initialAmt * 25);
                const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
                coinDiscountVal = coinsToRedeem / 25;
                baseAmt = Math.max(0, initialAmt - coinDiscountVal);
              }
              const gwFee = baseAmt <= 7299 ? 45 : Math.round(baseAmt * 0.007 * 100) / 100;
              const rzpTotal = Math.round((baseAmt + gwFee) * 100) / 100;
              return (
                <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPayMode('razorpay')}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${payMode === 'razorpay' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                    >
                      <CreditCard size={15} />
                      Online (Razorpay)
                    </button>
                    <button
                      onClick={() => setPayMode('bank')}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${payMode === 'bank' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-emerald-300'}`}
                    >
                      <Building2 size={15} />
                      Bank Transfer
                    </button>
                  </div>

                  {/* Razorpay fee breakdown */}
                  {payMode === 'razorpay' && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2.5 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600"><span>Series price</span><span>AED {initialAmt.toFixed(2)}</span></div>
                      {coinDiscountVal > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Coin discount</span><span>- AED {coinDiscountVal.toFixed(2)}</span></div>}
                      <div className="flex justify-between text-slate-500"><span>Internet handling fee</span><span>AED {gwFee.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-indigo-700 border-t border-indigo-200 pt-1"><span>Total</span><span>AED {rzpTotal.toFixed(2)}</span></div>
                    </div>
                  )}

                  {/* Bank transfer info */}
                  {payMode === 'bank' && (() => {
                    const bankFee = baseAmt <= 7299 ? 45 : Math.round(baseAmt * 0.007 * 100) / 100;
                    const bankTotal = Math.round((baseAmt + bankFee) * 100) / 100;
                    return (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2.5 text-xs text-emerald-700 space-y-1">
                        <p className="font-semibold">Transfer to our bank account</p>
                        <div className="flex justify-between text-slate-600"><span>Series price</span><span>AED {initialAmt.toFixed(2)}</span></div>
                        {coinDiscountVal > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Coin discount</span><span>- AED {coinDiscountVal.toFixed(2)}</span></div>}
                        <div className="flex justify-between text-slate-500"><span>Internet Handling Charges</span><span>AED {bankFee.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-emerald-700 border-t border-emerald-200 pt-1"><span>Total to Transfer</span><span>AED {bankTotal.toFixed(2)}</span></div>
                        <p className="text-[10px] text-slate-400">Admin will verify and enroll you.</p>
                      </div>
                    );
                  })()}

                  {/* Action button */}
                  {payMode === 'razorpay' ? (
                    <button
                      onClick={handleEnroll}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold text-base hover:opacity-90 disabled:opacity-60 transition"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                      {busy ? 'Processing…' : `Pay AED ${rzpTotal.toFixed(2)}`}
                    </button>
                  ) : bankTransferRequest && bankTransferRequest.status === 'pending' ? (
                    <div className="space-y-2 w-full">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-xs text-amber-700 font-semibold">
                        Request Pending Verification
                      </div>
                      <button
                        onClick={() => setShowBankModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-base"
                      >
                        <Building2 size={16} />
                        {bankTransferRequest.screenshotUrl ? 'Update Payment Screenshot' : 'Upload Payment Screenshot'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBankModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base"
                    >
                      <Building2 size={16} />
                      Request Bank Transfer
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Admin / free enroll button */}
            {(user?.role === 'admin' || !series?.price) && (
              <button
                onClick={handleEnroll}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold text-base hover:opacity-90 disabled:opacity-60 transition"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {busy ? 'Processing…' : user?.role === 'admin' ? 'Enroll (Admin)' : 'Get Free Access'}
              </button>
            )}

            {/* Login prompt for unauthenticated */}
            {!user && series?.price > 0 && (
              <button
                onClick={handleEnroll}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold text-base hover:opacity-90 transition"
              >
                <Zap size={16} />
                Pay AED {series.price?.toLocaleString()}
              </button>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={16} className="text-brand-600 shrink-0" />
              Full access to all tests in this series
            </div>
          </div>
        )}

        {/* Tests List with 2-level tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Main type tabs */}
          {mainKeys.length > 0 && (
            <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-slate-100">
              {mainKeys.map((k) => (
                <button
                  key={k}
                  onClick={() => { setActiveMain(k); setActiveSub(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-semibold border-b-2 transition-all -mb-px ${
                    effectiveMain === k
                      ? 'border-brand-600 text-brand-700 bg-brand-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {MAIN_LABELS[k] || k}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${effectiveMain === k ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {mainCounts[k]}
                  </span>
                  {series.isFree && <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">FREE</span>}
                </button>
              ))}
            </div>
          )}

          {/* Sub type tabs */}
          {subKeys.length > 1 && (
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/50">
              {subKeys.map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveSub(k)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    effectiveSub === k
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {SUB_LABELS[k] || k} ({subCounts[k]})
                </button>
              ))}
            </div>
          )}

          {/* Custom tag filter chips */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/30 items-center">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Tag size={12} className="text-slate-400" /> Filter by tag:
              </span>
              <button
                onClick={() => setSelectedCustomTag(null)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                  !selectedCustomTag
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedCustomTag(selectedCustomTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                    selectedCustomTag === tag
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Test rows */}
          <div className="divide-y divide-slate-50">
            {displayTests.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No tests in this category</div>
            )}
            {displayTests.map(({ test, customTags }, idx) => {
              if (!test) return null;
              const attempt = myAttempts.find(
                (a) => a.test?._id === test._id || a.test === test._id
              );
              const testCanAccess = test.isFree || canAccess;
              const dc = DIFFICULTY_COLORS[test.difficulty] || DIFFICULTY_COLORS.intermediate;

              return (
                <div key={test._id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{test.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${dc}`}>
                        {test.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} /> {test.durationMins}m
                      </span>
                      <span className="text-xs text-slate-400">{test.totalMarks} marks</span>
                      {test.attemptsAllowed > 0 && (
                        <span className="text-xs text-slate-400">{test.attemptsAllowed} attempt{test.attemptsAllowed > 1 ? 's' : ''}</span>
                      )}
                      {(customTags || []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {attempt ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">{attempt.percentage}%</div>
                          <div className="text-xs text-slate-400">Attempted</div>
                        </div>
                        <Link
                          to={`/test-result/${attempt._id}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Result
                        </Link>
                      </div>
                    ) : testCanAccess ? (
                      <Link
                        to={`/take-test/${test._id}?seriesId=${series._id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
                      >
                        <Zap size={14} /> Start
                      </Link>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold hover:bg-brand-50 hover:text-brand-600 transition"
                      >
                        <Lock size={14} /> Enroll
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      {showBankModal && series && (
        <BankTransferModal
          isOpen={showBankModal}
          onClose={() => {
            setShowBankModal(false);
            if (user) {
              api.get('/bank-transfer/me').then((r) => {
                const matching = (r.data || []).find(
                  (req) => req.itemType === 'test_series' && req.testSeries?._id === id
                );
                setBankTransferRequest(matching);
              }).catch(() => {});
            }
          }}
          itemType="test_series"
          itemId={series._id}
          itemName={series.title}
          baseAmount={finalPrice || series.price}
          initialRequest={bankTransferRequest}
          redeemCoins={redeemCoins}
        />
      )}
    </div>
  );
}
