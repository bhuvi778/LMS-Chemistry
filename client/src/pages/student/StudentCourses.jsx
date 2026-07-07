import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BookOpen, Clock, Download, ArrowRight, Globe, X, Loader2, Pause, Play, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader.jsx';

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

export default function StudentCourses() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extensionModal, setExtensionModal] = useState(null);
  const [extendingBusy, setExtendingBusy] = useState(false);
  const [pauseModalEnrollment, setPauseModalEnrollment] = useState(null);
  const [pauseDuration, setPauseDuration] = useState(7);
  const [liveDisclaimerChecked, setLiveDisclaimerChecked] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);

  const handlePauseCourse = async () => {
    if (!pauseModalEnrollment) return;
    if (pauseModalEnrollment.course?.courseType === 'live' && !liveDisclaimerChecked) {
      toast.error('Please acknowledge the warning by checking the tick box.');
      return;
    }
    setPauseBusy(true);
    try {
      await api.post(`/enroll/pause/${pauseModalEnrollment._id}`, { durationDays: pauseDuration });
      toast.success('Course paused successfully!');
      setPauseModalEnrollment(null);
      setLiveDisclaimerChecked(false);
      const enrollRes = await api.get('/enroll/me');
      setEnrollments(enrollRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to pause course.');
    } finally {
      setPauseBusy(false);
    }
  };

  const handleResumeCourse = async (enrollmentId) => {
    setResumeBusy(true);
    try {
      await api.post(`/enroll/resume/${enrollmentId}`);
      toast.success('Course resumed successfully! Welcome back! 🎉');
      const enrollRes = await api.get('/enroll/me');
      setEnrollments(enrollRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to resume course.');
    } finally {
      setResumeBusy(false);
    }
  };

  const canUpgrade = (e) => {
    const course = e.course;
    if (!course || !course.plans) return false;
    const currentPlan = e.planType || 'batch';
    if (currentPlan === 'batch') {
      return !!(course.plans.pro?.enabled || course.plans.infinity?.enabled);
    }
    if (currentPlan === 'pro') {
      return !!course.plans.infinity?.enabled;
    }
    return false;
  };

  const handleExtendValidity = async (e) => {
    const course = e.course;
    if (!course) return;
    setExtendingBusy(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setExtendingBusy(false);
        return;
      }
      
      const { data: orderData } = await api.post('/payment/create-order', {
        courseId: course._id,
        isExtension: true,
      });
      
      if (orderData.free) {
        toast.success('Validity extended successfully! 🎉');
        setExtensionModal(null);
        // reload data
        const enrollRes = await api.get('/enroll/me');
        setEnrollments(enrollRes.data);
        return;
      }
      
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ace2Examz',
        description: `Validity Extension - ${orderData.itemName}`,
        image: orderData.itemThumbnail || '',
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' });
            setExtendingBusy(false);
          },
        },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: course._id,
            });
            toast.success('Validity extended successfully! 🎉');
            setExtensionModal(null);
            const enrollRes = await api.get('/enroll/me');
            setEnrollments(enrollRes.data);
          } catch (e) {
            toast.error(e.message || 'Payment verification failed. Please contact support.');
          } finally {
            setExtendingBusy(false);
          }
        },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setExtendingBusy(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate extension payment');
      setExtendingBusy(false);
    }
  };

  const getValidityText = (c) => {
    if (!c) return '';
    const v = c.validity;
    if (v?.type === 'lifetime') return 'Lifetime Access';
    if (v?.type === 'duration') return `${v.durationValue} ${v.durationUnit}`;
    if (v?.type === 'endDate' && v.endDate) {
      return `Until ${new Date(v.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (c.durationMonths) return `${c.durationMonths} months`;
    return 'Lifetime Access';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrollRes, coursesRes] = await Promise.all([
          api.get('/enroll/me'),
          api.get('/courses'),
        ]);
        setEnrollments(enrollRes.data);
        setAllCourses(coursesRes.data?.courses || coursesRes.data || []);
      } catch {
        // fallback
        try {
          const enrollRes = await api.get('/enroll/me');
          setEnrollments(enrollRes.data);
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enrolledCourseIds = new Set(enrollments.map(e => String(e.course?._id || e.course)));

  const downloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const resp = await api.get(`/payment/invoice/${paymentId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Invoice not available');
    }
  };

  const tabs = [
    { key: 'enrolled', label: 'My Enrolled Courses', count: enrollments.length },
    { key: 'all', label: 'All Courses', count: allCourses.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your enrolled courses or explore new ones.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 flex items-center justify-center min-h-[300px]">
          <LogoLoader size={60} text="Loading courses..." />
        </div>
      ) : activeTab === 'enrolled' ? (
        /* ── My Enrolled Courses ── */
        enrollments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <BookOpen size={28} />
            </div>
            <h3 className="font-bold text-slate-700 text-lg">No Enrolled Courses</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              You haven't enrolled in any courses yet. Browse all courses and sign up!
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-brand text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-soft hover:-translate-y-0.5 transition-all"
            >
              Browse All Courses <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((e) => (
              <div key={e._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={e.course?.thumbnail}
                      alt={e.course?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {e.course?.category || 'Chemistry'}
                    </span>
                    {e.isPaused && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Pause className="w-8 h-8 text-amber-400 mb-1 animate-pulse" />
                        <span className="px-3 py-1 bg-amber-600 border border-amber-500 text-white font-extrabold text-[10px] rounded-full shadow-lg uppercase tracking-widest">
                          Paused
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                      {e.course?.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {e.isPaused ? (
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <Clock size={12} /> Course Paused
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {e.validUntil ? `Expires: ${new Date(e.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : getValidityText(e.course)}
                        </span>
                      )}
                      <span>•</span>
                      <span>Paid ₹{e.pricePaid?.toLocaleString()}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
                        <span>Course Progress ({e.watchedHours || 0} hrs watched)</span>
                        <span>{e.progress || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-100">
                        <div
                          className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                          style={{ width: `${e.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0 space-y-2">
                  {e.isPaused ? (
                    <button
                      onClick={() => handleResumeCourse(e._id)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                    >
                      <Play size={12} /> Resume Course
                    </button>
                  ) : (
                    <Link
                      to={`/student/learn/${e.course?._id}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-brand hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                    >
                      Continue Learning
                    </Link>
                  )}
                  {e.course?.allowFreeze && !e.isPaused && (!e.pauseHistory || e.pauseHistory.length < 3) && (
                    <button
                      onClick={() => setPauseModalEnrollment(e)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-700 border border-amber-200 rounded-2xl hover:bg-amber-50/50 transition py-2 font-bold"
                    >
                      ⏸ Pause Course ({3 - (e.pauseHistory?.length || 0)} left)
                    </button>
                  )}
                  {e.isPaused && (
                    <div className="p-3 bg-amber-50/60 border border-amber-100/50 rounded-2xl text-[10px] text-amber-800 space-y-1 font-semibold">
                      <div className="flex justify-between">
                        <span>Paused on:</span>
                        <span>{new Date(e.lastPauseStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Resume Date:</span>
                        <span>{new Date(new Date(e.lastPauseStart).getTime() + 7*24*60*60*1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-amber-900 border-t border-amber-200/50 pt-1 mt-1 font-bold">
                        <span>Auto-resumes on:</span>
                        <span>{new Date(e.lastPausePlannedResume).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                  {canUpgrade(e) && (
                    <Link
                      to={`/courses/${e.course?.slug || e.course?._id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-brand-700 border border-brand-200 rounded-2xl hover:bg-brand-50/50 transition py-2 font-bold"
                    >
                      Upgrade Plan (Current: {e.planType === 'pro' ? 'Pro' : 'Batch'})
                    </Link>
                  )}
                  {e.course?.allowExtendValidity && (
                    <button
                      onClick={() => setExtensionModal(e)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-700 border border-emerald-200 rounded-2xl hover:bg-emerald-50 transition py-2 font-bold"
                    >
                      <Clock size={12} /> Extend Validity (₹{e.course.extendValidityPrice || 0})
                    </button>
                  )}
                  {e.paymentId && e.paymentId !== 'FREE' && !e.paymentId?.startsWith('FREE_') && (
                    <button
                      onClick={() => downloadInvoice(e.paymentId, e.invoiceNumber)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-brand-700 transition py-2 border border-slate-200 rounded-2xl hover:bg-slate-50"
                    >
                      <Download size={12} /> Download Invoice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── All Courses ── */
        allCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Globe size={40} className="mx-auto mb-4 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-lg">No courses available</h3>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(String(course._id));
              return (
                <div key={course._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {course.category || 'Chemistry'}
                      </span>
                      {isEnrolled && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                          Enrolled
                        </span>
                      )}
                      {!isEnrolled && course.isAdmissionClosed && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow-sm">
                          Closed
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {getValidityText(course)}
                        </span>
                        <span className="font-bold text-brand-700">₹{course.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    {isEnrolled ? (
                      <Link
                        to={`/student/learn/${course._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-brand hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                      >
                        Continue Learning
                      </Link>
                    ) : course.isAdmissionClosed ? (
                      <button
                        disabled
                        className="w-full inline-flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 font-extrabold py-2.5 rounded-2xl text-xs cursor-not-allowed"
                      >
                        🔒 Admission Closed
                      </button>
                    ) : (
                      <Link
                        to={`/courses/${course._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 border border-brand-200 text-brand-700 hover:bg-brand-50 font-bold py-2.5 rounded-2xl text-xs transition-all"
                      >
                        View Details <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {extensionModal && (() => {
        const extPrice = extensionModal.course?.extendValidityPrice || 0;
        const gwFee = Math.round(extPrice * 0.03 * 100) / 100;
        const totalAmount = extPrice > 0 ? Math.round((extPrice + gwFee) * 100) / 100 : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-extrabold text-slate-800">Extend Course Validity</h3>
                <button
                  onClick={() => setExtensionModal(null)}
                  className="p-1.5 rounded-full hover:bg-slate-105 text-slate-400 hover:text-slate-650 transition"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course</span>
                  <span className="text-sm font-bold text-slate-700">{extensionModal.course?.title}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100/50">
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">Extension Price</span>
                    <span className="text-base font-black text-brand-700">₹{extPrice || 0}</span>
                  </div>
                  <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100/50">
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">Duration</span>
                    <span className="text-base font-black text-violet-700 capitalize">
                      {extensionModal.course?.extendValidityDurationValue} {extensionModal.course?.extendValidityDurationUnit}
                    </span>
                  </div>
                </div>

                {extensionModal.validUntil && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex justify-between">
                    <span>Current Expiry:</span>
                    <span className="font-bold text-slate-700">
                      {new Date(extensionModal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}

                {extPrice > 0 && (
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 space-y-1.5 text-xs text-indigo-950 font-medium">
                    <div className="flex justify-between text-slate-650">
                      <span>Extension Price</span>
                      <span>₹{extPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Internet Handling Charges</span>
                      <span>₹{gwFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-indigo-700 border-t border-indigo-200 pt-1">
                      <span>Total Amount</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleExtendValidity(extensionModal)}
                disabled={extendingBusy}
                className="w-full flex items-center justify-center gap-2 bg-gradient-brand text-white font-bold py-3 rounded-2xl text-sm shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {extendingBusy ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Processing...
                  </>
                ) : extPrice > 0 ? (
                  <>Pay ₹{totalAmount.toFixed(2)} and Extend Now</>
                ) : (
                  <>Extend Validity Now</>
                )}
              </button>
            </div>
          </div>
        );
      })()}

      {pauseModalEnrollment && (() => {
        const isLive = pauseModalEnrollment.course?.courseType === 'live';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">Pause Course Validity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pause & freeze your learning duration</p>
                </div>
                <button
                  onClick={() => {
                    setPauseModalEnrollment(null);
                    setLiveDisclaimerChecked(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course</span>
                  <span className="text-sm font-bold text-slate-700">{pauseModalEnrollment.course?.title}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Pause Duration</label>
                  <select
                    value={pauseDuration}
                    onChange={(e) => setPauseDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {[7, 14, 21, 28].map((days) => (
                      <option key={days} value={days}>
                        {days} Days
                      </option>
                    ))}
                  </select>
                </div>

                {isLive ? (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2 text-rose-800 font-extrabold text-xs items-center uppercase tracking-wider">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      <span>Pause Live Course Disclaimer</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-rose-700 font-semibold list-disc list-inside leading-relaxed">
                      <li>Your course validity will be frozen.</li>
                      <li>You will lose access to all live classes conducted during the pause period.</li>
                      <li>Missed live classes will not be rescheduled.</li>
                      <li>If recordings are available as per your plan, you can watch them after resuming. Otherwise, missed content cannot be recovered.</li>
                    </ul>
                    <label className="flex items-start gap-2.5 pt-1.5 border-t border-rose-200/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={liveDisclaimerChecked}
                        onChange={(e) => setLiveDisclaimerChecked(e.target.checked)}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-rose-350"
                      />
                      <span className="text-[11px] text-rose-900 font-bold leading-tight select-none">
                        I understand that I will miss all live classes during the pause period.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 space-y-2 text-amber-900">
                    <div className="flex gap-2 text-amber-800 font-extrabold text-xs items-center uppercase tracking-wider">
                      <Clock size={16} className="text-amber-600 shrink-0" />
                      <span>Pause Course Details</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-700 font-semibold list-disc list-inside leading-relaxed">
                      <li>Your course validity will be frozen during this period.</li>
                      <li>You cannot access lessons, tests, or doubts while paused.</li>
                      <li>You can resume manually anytime after 7 days.</li>
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handlePauseCourse}
                disabled={pauseBusy}
                className="w-full flex items-center justify-center gap-2 bg-gradient-brand text-white font-bold py-3 rounded-2xl text-sm shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {pauseBusy ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Pausing Course...
                  </>
                ) : (
                  <>Confirm & Pause Course</>
                )}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
