import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client.js';
import {
  ArrowLeft,
  Clock,
  Zap,
  Shield,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus,
  Check,
  Star,
  Award,
  Video,
  ListTodo,
  FileText,
  Download,
  HelpCircle,
  Heart,
  Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

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
  const [expandedDays, setExpandedDays] = useState({ 1: true });
  const [activeTab, setActiveTab] = useState('overview');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 32, secs: 45 });

  // Coupons
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        clearInterval(timer);
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        setCourse(courseRes.data);
        
        if (user) {
          try {
            const enrollRes = await api.get('/enroll/me');
            const enrollments = enrollRes.data || [];
            const isEnrolled = enrollments.some((e) => e.course?._id === courseId);
            setEnrolled(isEnrolled);
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

  const toggleDay = (dayNum) => {
    setExpandedDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/payment/apply-coupon', {
        code: couponCode.trim().toUpperCase(),
        courseId: course._id
      });
      setAppliedCoupon({
        code: couponCode.trim().toUpperCase(),
        discountValue: data.discountValue,
        discountType: data.discountType,
        finalPrice: data.finalPrice
      });
      toast.success('Coupon applied successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to purchase this course');
      navigate('/login', { state: { from: `/power-courses/${course._id}` } });
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
        planType: 'batch'
      });

      if (orderData.free) {
        toast.success('Enrolled successfully! 🎉');
        setEnrolled(true);
        navigate(`/student/power-courses/${course._id}/learn`);
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
            navigate(`/student/power-courses/${course._id}/learn`);
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
  const displayPrice = appliedCoupon ? appliedCoupon.finalPrice : basePrice;
  const discPercent = mrp && mrp > displayPrice ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const duration = course.powerCourseDuration || 7;
  const lessonsCount = (course.dailyPlan || []).filter(d => d.videoUrl).length || (duration * 3);
  const quizCount = (course.dailyPlan || []).filter(d => d.quizId).length || duration;

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

  return (
    <div className="container-x py-6 space-y-6 pb-16">
      
      {/* Back Link */}
      <Link to="/power-courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-650 transition">
        <ArrowLeft size={13} /> Back to Challenges Catalog
      </Link>

      {/* ── TOP HERO HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row justify-between gap-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        {/* Hero Details */}
        <div className="relative flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${getBadgeStyle(course.powerCourseType)}`}>
              {course.powerCourseType ? `${course.powerCourseType} course` : 'Challenge'}
            </span>
            <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-2 py-0.5 border border-slate-700 rounded">
              ⏱️ {duration} Days Challenge
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-display tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-sm font-bold text-indigo-300">Complete Revision</p>
          </div>

          {/* Description HTML parsing to get rid of raw `<p>` tags */}
          <div
            dangerouslySetInnerHTML={{ __html: course.shortDescription || course.description }}
            className="text-slate-400 text-xs max-w-2xl leading-relaxed"
          />

          {/* Info stats row */}
          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-300 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5"><Clock size={14} className="text-brand-400" /> Duration: {duration} Days</div>
            <div className="flex items-center gap-1.5"><Star size={14} className="text-brand-400" /> Level: Class 12</div>
            <div className="flex items-center gap-1.5"><Video size={14} className="text-brand-400" /> Lessons: {lessonsCount}</div>
            <div className="flex items-center gap-1.5"><ListTodo size={14} className="text-brand-400" /> Quizzes: {quizCount}</div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold pt-1">
            <span className="bg-slate-800/50 border border-slate-700 px-2.5 py-0.5 rounded">Recorded + Notes</span>
            <span className="bg-slate-800/50 border border-slate-700 px-2.5 py-0.5 rounded">Hinglish</span>
            <span className="bg-slate-800/50 border border-slate-700 px-2.5 py-0.5 rounded">{course.instructor || 'N.K. Sir'}</span>
            <span className="bg-slate-800/50 border border-slate-700 px-2.5 py-0.5 rounded">Lifetime Access</span>
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
              { id: 'syllabus', label: 'Course Syllabus' },
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
              <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-850 text-sm">About This Power Course</h3>
                <div
                  dangerouslySetInnerHTML={{ __html: course.description }}
                  className="text-slate-600 text-xs leading-relaxed space-y-2 whitespace-pre-line"
                />
              </div>

              {/* Highlights Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Concept Clarity', desc: 'Easy explanation of every topic step-by-step.', icon: Award },
                  { title: 'Daily Targets', desc: 'Structured day-by-day checklist plan to keep you consistent.', icon: Zap },
                  { title: 'PYQ Focused', desc: 'Chapter-wise past years solved problems for better exam confidence.', icon: Clock },
                  { title: 'Regular Practice', desc: 'MCQ quizzes and assignments mapped for daily checkpoints.', icon: ListTodo }
                ].map((hl, i) => (
                  <div key={i} className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl flex gap-3">
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
                <p className="text-[11px] text-slate-500 mt-0.5">Check out what you will cover in this {duration}-day revision plan:</p>
              </div>

              <div className="space-y-3">
                {Array.from({ length: duration }, (_, idx) => {
                  const dayNum = idx + 1;
                  const planDay = (course.dailyPlan || []).find((p) => p.dayNumber === dayNum) || {
                    dayNumber: dayNum,
                    title: `Day ${dayNum} Revision Plan`,
                    durationText: '60 min',
                    topicsCovered: []
                  };
                  const isExpanded = !!expandedDays[dayNum];

                  return (
                    <div key={dayNum} className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        onClick={() => toggleDay(dayNum)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center font-bold text-xs shrink-0">
                            {dayNum}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs">{planDay.title}</h4>
                            <span className="text-[9px] text-slate-450 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 mt-0.5 inline-block">
                              ⏱️ {planDay.durationText || '60 min'}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-slate-450" /> : <ChevronDown size={14} className="text-slate-450" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100/60 bg-slate-50/50 space-y-3">
                          {planDay.topicsCovered?.length > 0 ? (
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Topics Covered</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                                {planDay.topicsCovered.map((topic, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-semibold leading-snug">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                                    <span>{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-450 italic">Structured lecture, reference notes, and mcq tasks will unlock on this day.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: FAQs */}
          {activeTab === 'faqs' && (
            <div className="card p-6 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {[
                  { q: 'How does the calendar timeline logic work?', a: 'Power Courses operate sequentially. Completing all tasks for Day 1 unlocks the targets and assets for Day 2, helping you build systematic study consistency.' },
                  { q: 'Are notes PDFs downloadable?', a: 'Yes! All revision notes summaries and daily assignment sheets are fully downloadable in PDF format once the specific day is unlocked.' },
                  { q: 'Is there doubt support included?', a: 'Absolutely. Every Power Course comes with integrated doubt support. You can raise doubt queries directly inside the day learn workbench discussion dashboard.' }
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
          <div className="card p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-5 lg:sticky lg:top-20">
            
            {/* Thumbnail */}
            {course.thumbnail ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner shrink-0">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-brand rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
                {duration} Days Revision
              </div>
            )}

            {/* Mock countdown timer */}
            <div className="bg-indigo-950 text-white rounded-xl p-3 text-center space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Offer Ends In</span>
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col">
                  <span className="bg-white/10 px-2 py-1 rounded font-mono font-black text-sm">{timeLeft.days.toString().padStart(2, '0')}</span>
                  <span className="text-[8px] text-slate-400 uppercase mt-0.5">Days</span>
                </div>
                <span className="font-mono text-sm">:</span>
                <div className="flex flex-col">
                  <span className="bg-white/10 px-2 py-1 rounded font-mono font-black text-sm">{timeLeft.hours.toString().padStart(2, '0')}</span>
                  <span className="text-[8px] text-slate-400 uppercase mt-0.5">Hours</span>
                </div>
                <span className="font-mono text-sm">:</span>
                <div className="flex flex-col">
                  <span className="bg-white/10 px-2 py-1 rounded font-mono font-black text-sm">{timeLeft.mins.toString().padStart(2, '0')}</span>
                  <span className="text-[8px] text-slate-400 uppercase mt-0.5">Mins</span>
                </div>
                <span className="font-mono text-sm">:</span>
                <div className="flex flex-col">
                  <span className="bg-white/10 px-2 py-1 rounded font-mono font-black text-sm">{timeLeft.secs.toString().padStart(2, '0')}</span>
                  <span className="text-[8px] text-slate-400 uppercase mt-0.5">Secs</span>
                </div>
              </div>
            </div>

            {/* Launch Banner Badge */}
            <div className="text-center bg-amber-50 text-amber-800 border border-amber-200/50 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-wider">
              ✨ Special Launch Offer ✨
            </div>

            {/* Price section */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Purchase Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">₹{displayPrice}</span>
                {mrp && mrp > displayPrice ? (
                  <span className="text-sm text-slate-400 font-bold line-through">₹{mrp}</span>
                ) : null}
                {discPercent > 0 && (
                  <span className="text-xs text-emerald-600 font-black bg-emerald-50 border border-emerald-150 rounded px-1.5 py-0.5">
                    {discPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Deliverables Checklist list */}
            <div className="space-y-2.5 text-xs text-slate-650 font-semibold border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Lifetime course validity</div>
              <div className="flex items-center gap-2"><Laptop size={14} className="text-indigo-500" /> Watch on Mobile/Tablet/PC</div>
              <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Download study notes & sheets</div>
              <div className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> High-yield quizzes & PYQs access</div>
            </div>

            {/* Coupon Code section */}
            {!enrolled && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-brand-500" /> Apply Promo Code
                </label>
                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-700">
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
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="btn-outline text-xs px-4 py-2 font-bold hover:bg-slate-50 shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CTA action button */}
            <div className="space-y-2 pt-2">
              {enrolled ? (
                <Link
                  to={`/student/power-courses/${course._id}/learn`}
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
                  Enroll in Challenge Now
                </button>
              )}

              <p className="text-[9px] text-slate-400 text-center font-bold leading-normal">
                🛡️ 7 Days Money Back Guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
