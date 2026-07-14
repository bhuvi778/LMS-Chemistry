import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { getRazorpayLogoUrl } from '../utils/razorpay.js';
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
  Coins,
  FileText,
  Repeat
} from 'lucide-react';


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

const TEST_SERIES_COIN_MINIMUM = 50;

export default function TestSeriesDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [series, setSeries] = useState(null);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openPdf, setOpenPdf] = useState(null);

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
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [myReview, setMyReview] = useState(null);

  // Custom tag filter for tests inside the series
  const [selectedCustomTag, setSelectedCustomTag] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/tests/series/${id}`);
        setSeries(data);
        if (user && data?.reviews?.length) {
          const userId = user._id || user.id;
          const existing = data.reviews.find((review) => {
            const reviewerId = typeof review.student === 'object' ? review.student?._id : review.student;
            return reviewerId?.toString() === userId?.toString();
          });
          setMyReview(existing || null);
        } else {
          setMyReview(null);
        }
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
      toast.success(`Coupon applied! You save ₹${data.discountAmount}`);
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

  const submitRating = async () => {
    if (!user) {
      toast('Please login to submit a review', { icon: '🔒' });
      nav('/login', { state: { from: `/test-series/${id}` } });
      return;
    }
    if (!(series?.isFree || enrolled || user?.role === 'admin')) {
      toast.error('You can rate this test series after enrollment.');
      return;
    }
    if (!ratingVal) {
      toast.error('Please select a star rating');
      return;
    }

    setRatingBusy(true);
    try {
      await api.post(`/tests/series/${id}/review`, {
        rating: ratingVal,
        comment: ratingComment.trim(),
      });
      toast.success('Thank you for your rating!');
      setMyReview({ rating: ratingVal, comment: ratingComment.trim(), studentName: user?.name });
      const { data } = await api.get(`/tests/series/${id}`);
      setSeries(data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not submit rating');
    } finally {
      setRatingBusy(false);
    }
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
        redeemCoins: redeemCoins && (user?.coins || 0) >= TEST_SERIES_COIN_MINIMUM,
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
        image: getRazorpayLogoUrl(),
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
  }, [user, series, couponApplied, id, nav, redeemCoins]);

  const tests = useMemo(() => {
    if (!series) return [];
    return (series.tests || []).sort((a, b) => a.order - b.order);
  }, [series]);

  const canAccess = series?.isFree || enrolled;
  const finalPrice = couponApplied ? couponApplied.finalAmount : (series?.price || 0);
  const canRedeemCoins = user && user.role !== 'admin' && (user.coins || 0) >= TEST_SERIES_COIN_MINIMUM;
  let displayPrice = finalPrice;
  let coinDiscount = 0;
  if (redeemCoins && canRedeemCoins) {
    const maxCoinsNeeded = Math.floor(finalPrice);
    const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
    coinDiscount = coinsToRedeem;
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
                  {series.isFree ? 'Free Series' : enrolled ? 'Enrolled' : `₹${series.price?.toLocaleString()}`}
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
                  <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-300" fill="currentColor" /> {series.rating || 4.8} Rating</span>
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
                ₹{displayPrice?.toLocaleString()}
              </span>
              {(couponApplied || coinDiscount > 0 || series.mrp > series.price) && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{(couponApplied ? series.price : series.mrp)?.toLocaleString()}
                </span>
              )}
              {couponApplied && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                  Save ₹{couponApplied.discountAmount?.toLocaleString()}
                </span>
              )}
              {coinDiscount > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                  Coins Saved ₹{coinDiscount?.toLocaleString()}
                </span>
              )}
              {!couponApplied && coinDiscount === 0 && series.mrp > series.price && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                  Save ₹{(series.mrp - series.price)?.toLocaleString()}
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
                              — {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
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
            {user && user.role !== 'admin' && (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="text-amber-500 animate-pulse" size={16} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Redeem Ace Coins</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      You have {user.coins || 0} coins · minimum {TEST_SERIES_COIN_MINIMUM} required
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={redeemCoins && canRedeemCoins}
                  disabled={!canRedeemCoins}
                  onChange={(e) => setRedeemCoins(e.target.checked && canRedeemCoins)}
                  className="w-4 h-4 text-amber-500 border-slate-350 rounded focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}

            {/* Payment Mode Selector */}
            {user && user.role !== 'admin' && series?.price > 0 && (() => {
              const initialAmt = (finalPrice !== null && finalPrice !== undefined) ? finalPrice : (series?.price || 0);
              let baseAmt = initialAmt;
              let coinDiscountVal = 0;
              if (redeemCoins && canRedeemCoins) {
                const maxCoinsNeeded = Math.floor(initialAmt);
                const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
                coinDiscountVal = coinsToRedeem;
                baseAmt = Math.max(0, initialAmt - coinDiscountVal);
              }
              const isFreeAfterDiscount = baseAmt <= 0;
              const rzpTotal = isFreeAfterDiscount ? 0 : Math.round(baseAmt * 100) / 100;
              return (
                <div className="space-y-3">
                  {/* Payment summary */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2.5 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600"><span>Series price</span><span>₹{(series?.price || 0).toFixed(2)}</span></div>
                    {couponApplied && couponApplied.discountAmount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Coupon discount ({couponApplied.couponCode})</span><span>- ₹{couponApplied.discountAmount.toFixed(2)}</span></div>}
                    {coinDiscountVal > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Coin discount</span><span>- ₹{coinDiscountVal.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-indigo-700 border-t border-indigo-200 pt-1"><span>Total</span><span>{isFreeAfterDiscount ? '₹0.00 (Free!)' : `₹${rzpTotal.toFixed(2)}`}</span></div>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={handleEnroll}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold text-base hover:opacity-90 disabled:opacity-60 transition"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : isFreeAfterDiscount ? <Zap size={16} /> : <CreditCard size={16} />}
                    {busy ? 'Processing…' : isFreeAfterDiscount ? 'Enroll Free 🎉' : `Pay ₹${rzpTotal.toFixed(2)}`}
                  </button>
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
                Pay ₹{series.price?.toLocaleString()}
              </button>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={16} className="text-brand-600 shrink-0" />
              Full access to all tests in this series
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Star size={18} className="text-amber-500" fill="currentColor" />
                Reviews & Rating
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {series.reviews?.length || 0} review{(series.reviews?.length || 0) === 1 ? '' : 's'} · Average {series.rating || 4.8}/5
              </p>
            </div>
            <div className="flex items-center gap-1 text-amber-500 text-sm font-black">
              <Star size={16} fill="currentColor" /> {series.rating || 4.8}
            </div>
          </div>

          {(canAccess || user?.role === 'admin') ? (
            myReview ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < myReview.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold text-emerald-800">
                  Your rating submitted{myReview.comment ? `: "${myReview.comment}"` : '.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starValue = i + 1;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRatingVal(starValue)}
                        onMouseEnter={() => setRatingHover(starValue)}
                        onMouseLeave={() => setRatingHover(0)}
                        className="text-amber-400 transition hover:scale-110"
                        aria-label={`Rate ${starValue} star`}
                      >
                        <Star size={24} fill={starValue <= (ratingHover || ratingVal) ? 'currentColor' : 'none'} />
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Short feedback (optional)"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                />
                <button
                  type="button"
                  onClick={submitRating}
                  disabled={ratingBusy || !ratingVal}
                  className="w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
                >
                  {ratingBusy ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs font-semibold text-slate-500">
              {user ? 'Enroll in this test series to submit your own rating.' : 'Login and enroll to submit your own rating.'}
            </div>
          )}

          {(series.reviews || []).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(series.reviews || []).slice(-4).reverse().map((review, idx) => (
                <div key={review._id || idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-slate-800 text-xs truncate">{review.studentName || review.student?.name || 'Student'}</div>
                    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs font-semibold text-slate-400">
              No reviews yet. Enrolled students can add the first rating.
            </p>
          )}
        </div>

        {/* Test Series Schedule Section */}
        {series.syllabusFileUrl && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-base">
              <FileText size={18} className="text-brand-600" />
              Test Series Schedule
            </h2>
            {canAccess || user?.role === 'admin' ? (
              <button
                onClick={() => setOpenPdf({ fileUrl: series.syllabusFileUrl, title: `${series.title} Schedule` })}
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2 hover:shadow transition"
              >
                <FileText size={14} /> View Schedule PDF
              </button>
            ) : (
              <button
                onClick={() => toast.error('Schedule PDF is locked. Please enroll in the test series to unlock it.')}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 transition cursor-not-allowed"
              >
                <FileText size={14} /> 🔒 View Schedule PDF (Locked)
              </button>
            )}
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
          {subKeys.length > 0 && (
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
            {displayTests.map(({ test, customTags, subType }, idx) => {
              if (!test) return null;
              const testAttempts = myAttempts.filter(
                (a) => a.test?._id === test._id || a.test === test._id
              );
              const attempt = testAttempts[0];
              const attemptsAllowed = test.attemptsAllowed ?? 0;
              const remainingAttempts = attemptsAllowed > 0 ? Math.max(0, attemptsAllowed - testAttempts.length) : null;
              const canReattempt = attemptsAllowed === 0 || remainingAttempts > 0;
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
                      {subType && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-750 capitalize">
                          {SUB_LABELS[subType] || subType}
                        </span>
                      )}
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
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">{attempt.percentage}%</div>
                          <div className="text-xs text-slate-400">
                            {attemptsAllowed > 0 ? `${remainingAttempts} left` : 'Attempted'}
                          </div>
                        </div>
                        <Link
                          to={`/test-result/${attempt._id}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Result
                        </Link>
                        {canReattempt && testCanAccess && (
                          <Link
                            to={`/take-test/${test._id}?seriesId=${series._id}`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                          >
                            <Repeat size={13} /> Re-attempt
                          </Link>
                        )}
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


      {/* PDF Viewer Modal */}
      {openPdf && <PdfModal pdf={openPdf} onClose={() => setOpenPdf(null)} />}
    </div>
  );
}

// ─── Resolve PDF embed URL ────────────────────────────────────────────────────
function resolveEmbedUrl(rawUrl) {
  if (!rawUrl) return null;

  // Make it absolute if it starts with /
  let absUrl = rawUrl;
  if (rawUrl.startsWith('/')) {
    absUrl = window.location.origin + rawUrl;
  }

  // Google Drive: /file/d/<ID>/view  →  /file/d/<ID>/preview
  const driveFile = absUrl.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (driveFile) {
    return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
  }

  // Google Drive open?id=<ID>
  const driveOpen = absUrl.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpen) {
    return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;
  }

  // Google Docs/Sheets/Slides  →  embed
  const docsMatch = absUrl.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/);
  if (docsMatch) {
    return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview`;
  }

  // Use Google Docs viewer to embed PDF inline in iframe
  if (absUrl.toLowerCase().includes('.pdf')) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return rawUrl;
    }
    return `https://docs.google.com/viewer?url=${encodeURIComponent(absUrl)}&embedded=true`;
  }

  return rawUrl;
}

// ─── PDF Modal ────────────────────────────────────────────────────────────────
function PdfModal({ pdf, onClose }) {
  const embedUrl = resolveEmbedUrl(pdf.fileUrl);

  // For local uploads, verify the file exists via HEAD request
  // For external URLs (Google Drive etc.) skip the check — they always respond
  const isLocal = embedUrl && (embedUrl.startsWith('/') || embedUrl.startsWith(window.location.origin));

  const [status, setStatus] = useState(isLocal ? 'checking' : 'ok');

  useEffect(() => {
    if (!isLocal) return;
    if (!embedUrl) { setStatus('error'); return; }
    let cancelled = false;
    fetch(embedUrl, { method: 'HEAD' })
      .then((res) => { if (!cancelled) setStatus(res.ok ? 'ok' : 'error'); })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [embedUrl, isLocal]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 pr-4">{pdf.title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {status === 'checking' && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-brand-600" />
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-base font-semibold text-slate-600">File not found</p>
            <p className="text-sm mt-1">This PDF is not available right now.</p>
          </div>
        )}

        {status === 'ok' && (
          <iframe
            className="w-full rounded-b-2xl"
            style={{ height: '80vh' }}
            src={embedUrl}
            title={pdf.title}
            allow="fullscreen"
          />
        )}
      </div>
    </div>,
    document.body
  );
}
