import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Zap,
  Shield,
  Calendar,
  Tag,
  Check,
  Coins,
  Star,
  Award,
  Video,
  ListTodo,
  Laptop,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

const POWER_BATCH_COIN_MINIMUM = 30;

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

export default function PowerCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedPreviewDay, setSelectedPreviewDay] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  // Coupons
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [redeemCoins, setRedeemCoins] = useState(false);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [upsellItem, setUpsellItem] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        const fetchedCourse = courseRes.data;
        setCourse(fetchedCourse);
        setUpsellItem(null);
        setLiveClasses([]);

        if (fetchedCourse?.upsell?.enabled) {
          const targetType = fetchedCourse.upsell.targetType || 'course';
          if (targetType === 'test_series' && fetchedCourse.upsell.testSeriesId) {
            api.get(`/tests/series/${fetchedCourse.upsell.testSeriesId}`)
              .then((r) => setUpsellItem(r.data))
              .catch(() => {});
          } else if ((targetType === 'course' || targetType === 'power_course') && fetchedCourse.upsell.courseId) {
            api.get(`/courses/${fetchedCourse.upsell.courseId}`)
              .then((r) => setUpsellItem(r.data))
              .catch(() => {});
          }
        }

        if (user && fetchedCourse?.reviews?.length) {
          const userId = user._id || user.id;
          const existing = fetchedCourse.reviews.find((review) => {
            const reviewerId = typeof review.student === 'object' ? review.student?._id : review.student;
            return reviewerId?.toString() === userId?.toString();
          });
          setMyReview(existing || null);
        } else {
          setMyReview(null);
        }
        
        if (user) {
          try {
            const [enrollRes, liveRes] = await Promise.all([
              api.get('/enroll/me'),
              api.get(`/admin/live-classes/by-course/${courseId}`).catch(() => ({ data: [] })),
            ]);
            const enrollments = enrollRes.data || [];
            const isEnrolled = enrollments.some((e) => e.course?._id === courseId);
            setEnrolled(isEnrolled);
            setLiveClasses(liveRes.data || []);
          } catch (e) {
            setEnrolled(false);
          }
        } else {
          setEnrolled(false);
        }
      } catch (err) {
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [courseId, user]);

  useEffect(() => {
    if (!course) return undefined;

    const previousTitle = document.title;
    let metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute('content') || '';
    const createdMeta = !metaDescription;

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }

    document.title = course.seo?.metaTitle || `${course.title} | Power Batch | Ace2Examz`;
    metaDescription.setAttribute(
      'content',
      course.seo?.metaDescription || course.shortDescription || 'Focused Power Batch targets with day-wise classes, notes, assignments, and practice.'
    );

    return () => {
      document.title = previousTitle;
      if (createdMeta) {
        metaDescription.remove();
      } else {
        metaDescription.setAttribute('content', previousDescription);
      }
    };
  }, [course]);

  const handleApplyCoupon = async (rawCode = couponCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/payment/validate-coupon', {
        couponCode: code,
        courseId: course._id,
        planType: 'batch',
      });
      setAppliedCoupon({
        code: data.couponCode || code,
        discountAmount: data.discountAmount || 0,
        finalPrice: data.finalAmount,
      });
      setCouponCode(code);
      toast.success('Coupon applied successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const submitRating = async () => {
    if (!user) {
      toast.error('Please login to submit a rating');
      navigate('/login', { state: { from: `/power-batch/${course._id}` } });
      return;
    }
    if (!enrolled) {
      toast.error('You can rate this Power Batch after purchase.');
      return;
    }
    if (!ratingVal) {
      toast.error('Please select a star rating');
      return;
    }
    setRatingBusy(true);
    try {
      await api.post(`/courses/${course._id}/review`, {
        rating: ratingVal,
        comment: ratingComment.trim(),
      });
      toast.success('Thank you for your rating!');
      setMyReview({ rating: ratingVal, comment: ratingComment.trim(), studentName: user?.name });
      const { data } = await api.get(`/courses/${course._id}`);
      setCourse(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit rating');
    } finally {
      setRatingBusy(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to purchase this course');
      navigate('/login', { state: { from: `/power-batch/${course._id}` } });
      return;
    }
    setBusy(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay SDK');
        setBusy(false);
        return;
      }

      const { data: orderData } = await api.post('/payment/create-order', {
        courseId: course._id,
        couponCode: appliedCoupon?.code || '',
        planType: 'batch',
        redeemCoins: redeemCoins && canRedeemCoins
      });

      if (orderData.free) {
        toast.success('Enrolled successfully! 🎉');
        setEnrolled(true);
        navigate(`/student/power-batch/${course._id}/learn`);
        setBusy(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prepiify LMS',
        description: orderData.itemName,
        image: orderData.itemThumbnail || '',
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' });
            setBusy(false);
          }
        },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: course._id
            });
            toast.success('Payment successful! Welcome to the challenge 🎉');
            setEnrolled(true);
            navigate(`/student/power-batch/${course._id}/learn`);
          } catch (e) {
            toast.error(e.response?.data?.message || 'Payment verification failed');
          } finally {
            setBusy(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate checkout');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm mt-3 font-semibold">Loading course details...</p>
      </div>
    );
  }

  const basePrice = course.price || 0;
  const mrp = course.mrp || 0;
  const priceAfterCoupon = appliedCoupon ? appliedCoupon.finalPrice : basePrice;
  const coinBalance = user?.coins || 0;
  const canRedeemCoins = user && user.role !== 'admin' && coinBalance >= POWER_BATCH_COIN_MINIMUM;
  const coinDiscount = redeemCoins && canRedeemCoins
    ? Math.min(coinBalance, Math.floor(priceAfterCoupon))
    : 0;
  const displayPrice = Math.max(0, Math.round((priceAfterCoupon - coinDiscount) * 100) / 100);
  const gatewayFee = displayPrice > 0 ? Math.round(displayPrice * 0.03 * 100) / 100 : 0;
  const checkoutTotal = Math.round((displayPrice + gatewayFee) * 100) / 100;
  const discPercent = mrp && mrp > priceAfterCoupon ? Math.round(((mrp - priceAfterCoupon) / mrp) * 100) : 0;

  const duration = course.powerCourseDuration || 7;
  const recordedClassCount = (course.dailyPlan || []).filter(d => d.videoUrl).length;
  const liveClassCount = new Set([
    ...(course.dailyPlan || []).map(d => d.liveClassId).filter(Boolean).map(String),
    ...liveClasses.map(lc => lc._id).filter(Boolean).map(String),
  ]).size;
  const hasCalendarMode = !!course.startDate || !!course.endDate || (course.dailyPlan || []).some((day) => !!day.unlockDate);
  const categories = Array.from(new Set([...(course.categories || []), course.category].filter(Boolean)));
  const subCategories = Array.from(new Set((course.subCategories || []).filter(Boolean)));
  const formatDate = (value, withYear = true) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
    : '';
  const getScheduleWindow = () => {
    const dailyDates = (course.dailyPlan || [])
      .map((day) => day.unlockDate)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (dailyDates.length) {
      return { start: dailyDates[0], end: dailyDates[dailyDates.length - 1], source: 'daily' };
    }

    if (course.startDate || course.endDate) {
      return { start: course.startDate ? new Date(course.startDate) : null, end: course.endDate ? new Date(course.endDate) : null, source: 'course' };
    }

    return null;
  };
  const scheduleWindow = getScheduleWindow();
  const getDayDate = (dayNum) => {
    const planDay = (course.dailyPlan || []).find((p) => p.dayNumber === dayNum);
    if (planDay?.unlockDate) return formatDate(planDay.unlockDate, false);
    if (!course.startDate) return '';
    const date = new Date(course.startDate);
    date.setDate(date.getDate() + dayNum - 1);
    return formatDate(date, false);
  };
  const getPreviewDay = (dayNum) => (course.dailyPlan || []).find((p) => p.dayNumber === dayNum) || {
    dayNumber: dayNum,
    title: `Day ${dayNum} Target Plan`,
    durationText: '60 min',
    topicsCovered: []
  };
  const selectedPlanDay = getPreviewDay(selectedPreviewDay);

  // Render type badges
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'micro':
        return 'bg-cyan-500 text-white';
      case 'mini':
        return 'bg-indigo-600 text-white';
      case 'crash':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-brand-600 text-white';
    }
  };

  const getTypeLabel = (type) => {
    if (type === 'micro') return 'Micro Batch';
    if (type === 'mini') return 'Mini Batch';
    if (type === 'crash') return 'Crash Course';
    return 'Target batch';
  };

  const getUpsellPath = () => {
    if (!upsellItem) return '#';
    if (course.upsell?.targetType === 'test_series') return `/test-series/${upsellItem._id}`;
    if (course.upsell?.targetType === 'power_course') return `/power-batch/${upsellItem._id}`;
    return `/courses/${upsellItem._id}`;
  };

  const getUpsellCta = () => {
    if (course.upsell?.targetType === 'test_series') return 'View Test Series';
    if (course.upsell?.targetType === 'power_course') return 'View Power Batch';
    return 'View Course';
  };

  const upsellFallbacks = course.upsell?.targetType === 'test_series'
    ? ['Mock tests', 'Detailed solutions', 'Performance analytics']
    : course.upsell?.targetType === 'power_course'
      ? ['Day-wise targets', 'Focused revision', 'Calendar progress']
      : ['Structured lessons', 'Practice support', 'Exam-focused prep'];

  return (
    <div className="bg-[#f6f8fb] min-h-screen">
    <div className="container-x py-5 md:py-7 space-y-6 pb-16">
      
      {/* Back Link */}
      <Link to="/power-batch" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-700 transition">
        <ArrowLeft size={13} /> Back to Power Batch
      </Link>

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[340px] bg-slate-950 text-white">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#312e81_55%,#064e3b)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/15" />
            <div className="relative z-10 flex min-h-[340px] flex-col justify-end p-6 md:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getBadgeStyle(course.powerCourseType)}`}>
                  {getTypeLabel(course.powerCourseType)}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                  {duration} Days
                </span>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-200 backdrop-blur">
                  {hasCalendarMode ? 'Calendar mode' : 'Flexible mode'}
                </span>
                {categories.slice(0, 2).map((category) => (
                  <span key={category} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                    {category}
                  </span>
                ))}
                {subCategories.slice(0, 2).map((subCategory) => (
                  <span key={subCategory} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black text-cyan-100 backdrop-blur">
                    {subCategory}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 max-w-3xl font-display text-3xl md:text-5xl font-black tracking-tight leading-[1.02]">
                {course.title}
              </h1>
              <p className="mt-3 text-sm md:text-base font-bold text-emerald-200">
                Day-wise target plan from ₹{basePrice || 29}
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: course.shortDescription || course.description }}
                className="mt-3 max-w-2xl text-xs md:text-sm leading-relaxed text-slate-200/85 line-clamp-3"
              />
            </div>
          </div>

          <div className="p-5 md:p-7 bg-white text-slate-900 flex flex-col justify-between gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Clock size={17} className="text-slate-500" />
                <div className="mt-2 text-xl font-black text-slate-950">{duration}</div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target days</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Video size={17} className="text-slate-500" />
                <div className="mt-2 text-xl font-black text-slate-950">{recordedClassCount}</div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recorded classes</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <ListTodo size={17} className="text-slate-500" />
                <div className="mt-2 text-xl font-black text-slate-950">{liveClassCount}</div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live classes</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Star size={17} className="text-slate-500" />
                <div className="mt-2 text-xl font-black text-slate-950">{course.rating || 4.8}</div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating</p>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${hasCalendarMode ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                <Calendar size={15} className={hasCalendarMode ? 'text-emerald-700' : 'text-amber-700'} />
                {hasCalendarMode ? 'Batch calendar' : 'Flexible start'}
              </div>
              <div className="mt-2 text-sm font-black text-slate-950">
                {hasCalendarMode
                  ? `${scheduleWindow?.start ? formatDate(scheduleWindow.start) : 'Open'} - ${scheduleWindow?.end ? formatDate(scheduleWindow.end) : 'Complete'}`
                  : 'Start any day after purchase'}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {hasCalendarMode ? 'Daily targets are mapped from the Daily Plan dates.' : 'Targets unlock sequentially as you complete each day.'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Starting price</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-black">₹{displayPrice || 29}</span>
                {mrp && mrp > displayPrice ? <span className="text-sm line-through text-slate-400">₹{mrp}</span> : null}
                {discPercent > 0 ? <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-200">{discPercent}% off</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main content column (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sub tabs list navigation */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-6 whitespace-nowrap scrollbar-hide py-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'syllabus', label: 'Daily Calendar' },
              { id: 'faqs', label: 'FAQs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs font-bold border-b-2 transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-450 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Description body */}
              <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-800 text-sm">About This Power Batch</h3>
                <div
                  dangerouslySetInnerHTML={{ __html: course.description }}
                  className="text-slate-600 text-xs leading-relaxed space-y-2 whitespace-pre-line"
                />
              </div>

              {/* Highlights Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Concept Clarity', desc: 'Easy explanation of every topic step-by-step.', icon: Award },
                  { title: 'Daily Targets', desc: 'Structured day-by-day plan with date-wise unlock when configured.', icon: Zap },
                  { title: 'PYQ Focused', desc: 'Chapter-wise past years solved problems for better exam confidence.', icon: Clock },
                  { title: 'Live / Recorded Classes', desc: 'Recorded lectures and live classes mapped inside the daily plan.', icon: Video }
                ].map((hl, i) => (
                  <div key={i} className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <hl.icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{hl.title}</h4>
                      <p className="text-slate-450 text-[11px] font-semibold mt-0.5">{hl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Course Syllabus Accordions */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daily Targets Syllabus</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {hasCalendarMode ? 'Each day is mapped to a calendar date.' : `Check out what you will cover in this ${duration}-day flexible plan:`}
                </p>
              </div>

              <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-black text-slate-850 text-xs">Day Map</h4>
                      <p className="text-[10px] font-semibold text-slate-450">{duration} targets in compact view</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black text-brand-700 border border-brand-100">
                      Day {selectedPreviewDay}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                    {Array.from({ length: duration }, (_, idx) => {
                      const dayNum = idx + 1;
                      const day = getPreviewDay(dayNum);
                      const isActive = selectedPreviewDay === dayNum;
                      const hasContent = !!(day.videoUrl || day.liveClassId || day.notesUrl || day.quizId || day.assignmentUrl || day.topicsCovered?.length);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => setSelectedPreviewDay(dayNum)}
                          title={day.title}
                          className={`h-11 rounded-xl border text-center transition ${
                            isActive
                              ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                              : hasContent
                                ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 hover:bg-brand-50'
                                : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-xs font-black leading-none">{dayNum}</span>
                          {hasCalendarMode && getDayDate(dayNum) && (
                            <span className={`mt-1 block text-[8px] font-bold leading-none ${isActive ? 'text-white/75' : 'text-slate-400'}`}>
                              {getDayDate(dayNum)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-h-[220px]">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">
                        Day {selectedPreviewDay}{hasCalendarMode && getDayDate(selectedPreviewDay) ? ` · ${getDayDate(selectedPreviewDay)}` : ''}
                      </span>
                      <h4 className="mt-1 font-black text-slate-900 text-sm leading-snug">{selectedPlanDay.title}</h4>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500 border border-slate-100">
                      {selectedPlanDay.durationText || '60 min'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Recorded', active: !!selectedPlanDay.videoUrl },
                        { label: 'Live', active: !!selectedPlanDay.liveClassId },
                        { label: 'Notes', active: !!selectedPlanDay.notesUrl },
                        { label: 'Practice', active: !!selectedPlanDay.quizId },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl border px-2 py-2 text-center text-[10px] font-black ${
                            item.active ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'
                          }`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>

                    {selectedPlanDay.topicsCovered?.length > 0 ? (
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-2">Topics Covered</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {selectedPlanDay.topicsCovered.map((topic, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-semibold leading-snug">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                              <span>{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-[11px] font-semibold text-slate-450">
                        Live/recorded class, reference notes, and practice material will unlock on this day.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: FAQs */}
          {activeTab === 'faqs' && (
            <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {[
                  { q: 'How does the calendar timeline logic work?', a: 'If admin sets Daily Plan dates, each day unlocks on its configured date. Without dates, Power Batch works sequentially after purchase.' },
                  { q: 'Are notes PDFs downloadable?', a: 'Yes! All target notes summaries and daily assignment sheets are fully downloadable in PDF format once the specific day is unlocked.' },
                  { q: 'Can I use it without fixed dates?', a: 'Yes. If admin does not set calendar dates, the batch works in flexible day-wise mode exactly like the current flow.' }
                ].map((faq, i) => (
                  <div key={i} className="border-b pb-3.5 last:border-0 last:pb-0 space-y-1">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">❓ {faq.q}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed pl-4">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side checkout card (col-span-1) */}
        <div className="space-y-6">
          <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 lg:sticky lg:top-20">
            
            {/* Thumbnail */}
            {course.thumbnail ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner shrink-0">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-brand rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
                {duration} Days Target
              </div>
            )}

            {/* Price section */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Purchase Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">₹{displayPrice}</span>
                {mrp && mrp > displayPrice ? (
                  <span className="text-sm text-slate-400 font-bold line-through">₹{mrp}</span>
                ) : null}
                {discPercent > 0 && (
                  <span className="text-xs text-emerald-600 font-black bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                    {discPercent}% OFF
                  </span>
                )}
                {coinDiscount > 0 && (
                  <span className="text-xs text-amber-600 font-black bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                    {coinDiscount} coins used
                  </span>
                )}
              </div>
            </div>

            {/* Deliverables Checklist list */}
            <div className="space-y-2.5 text-xs text-slate-650 font-semibold border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Day-wise target access</div>
              <div className="flex items-center gap-2"><Laptop size={14} className="text-indigo-500" /> Watch on Mobile/Tablet/PC</div>
              <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Notes & assignments access</div>
              <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Live/recorded class access</div>
            </div>

            {/* Coupon Code section */}
            {user && !enrolled && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-brand-500" /> Apply Promo Code
                </label>
                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span className="flex items-center gap-1"><Check size={14} /> Applied: {appliedCoupon.code}</span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="input py-2 px-3 text-xs bg-slate-50 font-bold uppercase tracking-wider"
                      placeholder="e.g. LAUNCH33"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading}
                      className="btn-outline text-xs px-4 py-2 font-bold hover:bg-slate-50 shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {!appliedCoupon && (course.discountCoupons?.filter((c) => c.isActive && c.code) || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {course.discountCoupons.filter((c) => c.isActive && c.code).map((c, i) => (
                      <button
                        key={`${c.code}-${i}`}
                        type="button"
                        onClick={() => handleApplyCoupon(c.code)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-black text-emerald-700 hover:bg-emerald-100"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {user && user.role !== 'admin' && !enrolled && (
              <div className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${canRedeemCoins ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Coins className={canRedeemCoins ? 'text-amber-500' : 'text-slate-400'} size={16} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">Redeem Ace Coins</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      You have {coinBalance} coins · minimum {POWER_BATCH_COIN_MINIMUM} required
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={redeemCoins && canRedeemCoins}
                  disabled={!canRedeemCoins}
                  onChange={(e) => setRedeemCoins(e.target.checked && canRedeemCoins)}
                  className="w-4 h-4 text-amber-500 border-slate-350 rounded focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                />
              </div>
            )}

            {user && user.role !== 'admin' && !enrolled && basePrice > 0 && (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-slate-650">
                  <span>Power Batch price</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon discount ({appliedCoupon.code})</span>
                    <span>- ₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {coinDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coin discount</span>
                    <span>- ₹{coinDiscount.toFixed(2)}</span>
                  </div>
                )}
                {displayPrice > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Internet handling fee</span>
                    <span>₹{gatewayFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-indigo-700 border-t border-indigo-200 pt-1">
                  <span>Total</span>
                  <span>{displayPrice <= 0 ? '₹0.00 (Free!)' : `₹${checkoutTotal.toFixed(2)}`}</span>
                </div>
              </div>
            )}

            {/* CTA action button */}
            <div className="space-y-2 pt-2">
              {enrolled ? (
                <Link
                  to={`/student/power-batch/${course._id}/learn`}
                  className="w-full btn-primary justify-center py-3 text-xs font-black text-white text-center rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Zap size={14} /> Resume Target
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={busy}
                  className="w-full btn-primary justify-center py-3 text-xs font-black text-white rounded-xl shadow-md transition disabled:opacity-60 flex items-center gap-1.5"
                >
                  {busy ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Calendar size={14} />
                  )}
                  {displayPrice <= 0 ? 'Enroll Free' : `Pay ₹${checkoutTotal.toFixed(2)}`}
                </button>
              )}

              <p className="text-[9px] text-slate-400 text-center font-bold leading-normal">
                Secure payment · instant access after purchase
              </p>
            </div>

            {enrolled && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Rate Power Batch</h3>
                    <p className="text-[10px] font-semibold text-slate-400">Share feedback after purchase.</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                    <Star size={14} fill="currentColor" /> {course.rating || 4.8}
                  </div>
                </div>

                {myReview ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < myReview.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-800">
                      Your rating submitted{myReview.comment ? `: "${myReview.comment}"` : '.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                            <Star size={22} fill={starValue <= (ratingHover || ratingVal) ? 'currentColor' : 'none'} />
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Short feedback (optional)"
                      className="input py-2 px-3 text-xs bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={submitRating}
                      disabled={ratingBusy || !ratingVal}
                      className="w-full btn-outline justify-center text-xs font-bold py-2 disabled:opacity-50"
                    >
                      {ratingBusy ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {upsellItem && !enrolled && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            {upsellItem.thumbnail ? (
              <div className="h-32 md:h-28 md:w-44 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img src={upsellItem.thumbnail} alt={upsellItem.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-32 md:h-28 md:w-44 shrink-0 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                <BookOpen size={34} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                <Zap size={12} /> {course.upsell?.title || 'Recommended Next'}
              </div>
              <h2 className="mt-3 text-lg md:text-xl font-black text-slate-950 leading-snug">{upsellItem.title}</h2>
              {upsellItem.shortDescription && (
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500 line-clamp-2">{upsellItem.shortDescription}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {(upsellItem.highlights?.length ? upsellItem.highlights.slice(0, 3) : upsellFallbacks).map((item, idx) => (
                  <span key={`${item}-${idx}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                    <Check size={12} className="text-emerald-500" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 md:text-right space-y-3">
              <div>
                {upsellItem.isFree ? (
                  <div className="text-2xl font-black text-emerald-600">Free</div>
                ) : (
                  <>
                    {upsellItem.mrp > upsellItem.price && (
                      <div className="text-xs font-bold text-slate-400 line-through">₹{upsellItem.mrp?.toLocaleString()}</div>
                    )}
                    <div className="text-2xl font-black text-slate-950">₹{upsellItem.price?.toLocaleString()}</div>
                  </>
                )}
              </div>
              <Link to={getUpsellPath()} className="btn-primary w-full md:w-auto justify-center text-xs font-black">
                {getUpsellCta()} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
    </div>
  );
}
