import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import SecureYTPlayer from '../components/SecureYTPlayer.jsx';
import {
  Check,
  Clock,
  BookOpen,
  PlayCircle,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Video,
  Calendar,
  ExternalLink,
  FileText,
  Lock,
  ClipboardList,
  Layers,
  BookMarked,
  Download,
  Zap,
  Award,
  Star,
  BarChart2,
  Tag,
  X,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Building2,
  CreditCard,
  GraduationCap,
  Share2,
  Coins
} from 'lucide-react';


// ─── Load Razorpay checkout script ───────────────────────────────────────────
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

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
      >
        <span className="font-semibold text-slate-900 pr-4 text-sm">{q}</span>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
          {a}
        </div>
      )}
    </div>
  );
}

function validityLabel(validity, durationMonths) {
  if (validity?.type === 'lifetime') return 'Lifetime access';
  if (validity?.type === 'duration') return `${validity.durationValue} ${validity.durationUnit}`;
  if (validity?.type === 'endDate' && validity.endDate) {
    return `Access until ${new Date(validity.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (durationMonths) return `${durationMonths} months`;
  return 'Lifetime access';
}

const CONTENT_TYPES = [
  { key: 'videoClasses',   label: 'Video Classes',   icon: PlayCircle,   color: 'text-brand-600',   bg: 'bg-brand-50'   },
  { key: 'classNotes',     label: 'Class Notes',     icon: FileText,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'tests',          label: 'Tests',           icon: ClipboardList,color: 'text-amber-600',   bg: 'bg-amber-50'   },
  { key: 'dpps',           label: 'DPPs',            icon: BarChart2,    color: 'text-violet-600',  bg: 'bg-violet-50'  },
  { key: 'pyqs',           label: 'PYQs',            icon: BookOpen,     color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  { key: 'dppPdfs',        label: 'DPP PDFs',        icon: Download,     color: 'text-rose-600',    bg: 'bg-rose-50'    },
  { key: 'dppVideos',      label: 'DPP Videos',      icon: Video,        color: 'text-sky-600',     bg: 'bg-sky-50'     },
  { key: 'studyMaterials', label: 'Study Materials', icon: BookMarked,   color: 'text-orange-600',  bg: 'bg-orange-50'  },
  { key: 'assignmentsPdfs',   label: 'Assignments (PDF)',        icon: Download,     color: 'text-rose-600',    bg: 'bg-rose-50'    },
  { key: 'assignmentsVideos', label: 'Assignment Solutions',     icon: Video,        color: 'text-sky-600',     bg: 'bg-sky-50'     },
];

// ─── Simple video embed (YouTube / Bunny / mp4) ───────────────────────────────
function VideoEmbed({ url, title }) {
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    return (
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black select-none">
        <SecureYTPlayer url={url} title={title} />
      </div>
    );
  }
  if (url.includes('mediadelivery.net') || url.includes('bunny.net') || url.includes('bunny')) {
    return (
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full"
          src={url}
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="aspect-video w-full">
      <video className="w-full h-full" controls src={url}>
        Your browser does not support video playback.
      </video>
    </div>
  );
}

// ─── Media popup modal ────────────────────────────────────────────────────────
function MediaModal({ item, onClose }) {
  const { url, title, mediaType } = item;
  const { user } = useAuth();

  const watermarkText = user 
    ? `${user.name} | ${user.email} | ${user.phone || ''}` 
    : 'Guest User | Ace2Examz Preview';

  const renderWatermark = () => (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-around items-center overflow-hidden opacity-[0.12]">
      <div className="w-full flex justify-around rotate-[-15deg] whitespace-nowrap text-white font-medium text-xs sm:text-sm">
        <span>{watermarkText}</span>
        <span className="hidden sm:inline">{watermarkText}</span>
      </div>
      <div className="w-full flex justify-around rotate-[-15deg] whitespace-nowrap text-white font-medium text-xs sm:text-sm">
        <span className="hidden sm:inline">{watermarkText}</span>
        <span>{watermarkText}</span>
      </div>
      <div className="w-full flex justify-around rotate-[-15deg] whitespace-nowrap text-white font-medium text-xs sm:text-sm">
        <span>{watermarkText}</span>
        <span className="hidden sm:inline">{watermarkText}</span>
      </div>
    </div>
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  let content;
  if (mediaType === 'video') {
    const ytMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) {
      content = (
        <div className="relative aspect-video w-full bg-black select-none">
          <SecureYTPlayer url={url} title={title} />
          {renderWatermark()}
        </div>
      );
    } else if (url.includes('mediadelivery.net') || url.includes('bunny.net') || url.includes('bunny')) {
      content = (
        <div className="relative aspect-video w-full bg-black select-none">
          <iframe
            className="w-full h-full"
            src={url}
            title={title}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          {renderWatermark()}
        </div>
      );
    } else {
      content = (
        <div className="relative aspect-video w-full bg-black select-none">
          <video className="w-full h-full" controls autoPlay src={url}>
            Your browser does not support video playback.
          </video>
          {renderWatermark()}
        </div>
      );
    }
  } else {
    // PDF / document
    content = (
      <iframe
        className="w-full rounded-b-2xl"
        style={{ height: '80vh' }}
        src={url}
        title={title}
        allow="fullscreen"
      />
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 pr-4">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        {content}
      </div>
    </div>,
    document.body
  );
}

function ContentItemRow({ item, type, isEnrolled }) {
  const [modal, setModal] = useState(null);
  const cfg = CONTENT_TYPES.find((c) => c.key === type);
  const Icon = cfg?.icon || FileText;
  const isLocked = !isEnrolled && item.isLocked;

  const handleClick = () => {
    if (isLocked) return;
    if (item.videoUrl) {
      setModal({ url: item.videoUrl, title: item.title, mediaType: 'video' });
    } else if (item.fileUrl) {
      setModal({ url: item.fileUrl, title: item.title, mediaType: 'document' });
    }
  };

  return (
    <>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
          isLocked
            ? 'border-slate-100 bg-slate-50 opacity-70 cursor-not-allowed'
            : 'border-slate-100 bg-white hover:border-brand-200 hover:shadow-sm cursor-pointer'
        }`}
        onClick={handleClick}
      >
        <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${cfg?.bg} ${cfg?.color}`}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold line-clamp-1 ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
            {item.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
            {item.duration && <span className="flex items-center gap-1"><Clock size={10} />{item.duration}</span>}
            {item.questionCount > 0 && <span>{item.questionCount} questions</span>}
            {item.durationMins > 0 && !item.duration && <span>{item.durationMins} min</span>}
            {item.isFree && !isEnrolled && (
              <span className="text-emerald-600 font-semibold">Free Preview</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {isLocked ? (
            <Lock size={14} className="text-slate-300" />
          ) : (item.videoUrl || item.fileUrl) ? (
            <ChevronRight size={14} className={cfg?.color} />
          ) : null}
        </div>
      </div>
      {modal && <MediaModal item={modal} onClose={() => setModal(null)} />}
    </>
  );
}

function ChapterCard({ chapter, isEnrolled, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  const totalItems = CONTENT_TYPES.reduce((sum, ct) => sum + (chapter[ct.key]?.length || 0), 0);
  const lockedItems = isEnrolled ? 0 : CONTENT_TYPES.reduce((sum, ct) => {
    return sum + (chapter[ct.key] || []).filter((it) => it.isLocked).length;
  }, 0);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white grid place-items-center font-bold text-sm shrink-0">
          {(chapter.order ?? 0) + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 text-base leading-snug">{chapter.title}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
            {totalItems > 0 && <span>{totalItems} items</span>}
            {lockedItems > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Lock size={10} /> {lockedItems} locked
              </span>
            )}
            {CONTENT_TYPES.filter((ct) => (chapter[ct.key]?.length || 0) > 0).map((ct) => (
              <span key={ct.key} className={`flex items-center gap-1 ${ct.color}`}>
                <ct.icon size={10} /> {chapter[ct.key].length} {ct.label}
              </span>
            ))}
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
          {CONTENT_TYPES.map((ct) => {
            const items = chapter[ct.key] || [];
            if (items.length === 0) return null;
            return (
              <div key={ct.key}>
                <div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider ${ct.color}`}>
                  <ct.icon size={13} />
                  {ct.label}
                  <span className="ml-auto font-normal normal-case text-slate-400">{items.length} items</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <ContentItemRow key={item._id} item={item} type={ct.key} isEnrolled={isEnrolled} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubjectSection({ subject, isEnrolled, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  const totalChapters = subject.chapters?.length || 0;
  const totalItems = (subject.chapters || []).reduce((sum, ch) =>
    sum + CONTENT_TYPES.reduce((s, ct) => s + (ch[ct.key]?.length || 0), 0), 0
  );

  return (
    <div className="rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white to-brand-50/30 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-white/60 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white grid place-items-center shrink-0">
          <Layers size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-slate-900 text-lg leading-snug">{subject.name}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><BookOpen size={11} /> {totalChapters} chapters</span>
            <span className="flex items-center gap-1"><Zap size={11} /> {totalItems} resources</span>
          </div>
        </div>
        <ChevronDown size={20} className={`text-brand-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3 border-t border-brand-100">
          {totalChapters === 0 && (
            <div className="text-center text-slate-400 py-8">No chapters added yet.</div>
          )}
          {(subject.chapters || [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((ch, i) => (
              <ChapterCard
                key={ch._id}
                chapter={{ ...ch, order: i }}
                isEnrolled={isEnrolled}
                defaultOpen={false}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function SubjectsTab({ courseId, enrolled, onEnroll }) {
  const [subjects, setSubjects] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/subjects/${courseId}`)
      .then((r) => {
        setSubjects(r.data.subjects || []);
        setIsEnrolled(r.data.isEnrolled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, enrolled]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-brand-500" size={28} />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-semibold">Subjects will be added soon.</p>
        <p className="text-sm mt-1">Enroll now to get notified when content is available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isEnrolled && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 p-5 flex flex-col sm:flex-row items-center gap-4 text-white">
          <div className="flex-1">
            <p className="font-bold text-base">Unlock All Content</p>
            <p className="text-sm opacity-80 mt-0.5">
              Enroll now to access all video classes, notes, DPPs, tests and more.
              First few items are shown as free preview.
            </p>
          </div>
          <button
            onClick={onEnroll}
            className="shrink-0 bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-brand-50 transition text-sm"
          >
            Enroll Now
          </button>
        </div>
      )}

      {subjects
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((subject, i) => (
          <SubjectSection
            key={subject._id}
            subject={subject}
            isEnrolled={isEnrolled}
            defaultOpen={false}
          />
        ))}
    </div>
  );
}

const formatTimeToAMPM = (timeStr) => {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [upsellCourse, setUpsellCourse] = useState(null);
  const [payMode, setPayMode] = useState('razorpay'); // 'razorpay' | 'bank'
  const [showBankModal, setShowBankModal] = useState(false);
  const [openPdf, setOpenPdf] = useState(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null); // { couponCode, discountAmount, finalAmount }
  const [couponBusy, setCouponBusy] = useState(false);
  const [redeemCoins, setRedeemCoins] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('batch');
  const planOrder = { batch: 1, pro: 2, infinity: 3 };
  const isSelectedDowngradeOrSame = enrolled && enrollment && planOrder[selectedPlan] <= planOrder[enrollment.planType];
  const isUpgradePurchase = enrolled && enrollment && planOrder[selectedPlan] > planOrder[enrollment.planType];

  const getPlanPriceAndMrp = () => {
    if (!course) return { price: 0, mrp: 0 };
    let price = 0;
    let mrp = 0;
    if (course.plans && course.plans[selectedPlan] && course.plans[selectedPlan].price > 0) {
      price = course.plans[selectedPlan].price;
      mrp = course.plans[selectedPlan].mrp || course.plans[selectedPlan].price;
    } else {
      // Fallback if plans object is not yet loaded/configured or price is missing/0
      price = course.price || 0;
      mrp = course.mrp || price;
      if (selectedPlan === 'pro') {
        price = Math.round(price * 1.25);
        mrp = Math.round(mrp * 1.25);
      } else if (selectedPlan === 'infinity') {
        price = Math.round(price * 1.5);
        mrp = Math.round(mrp * 1.5);
      }
    }
    if (enrolled && enrollment) {
      let oldPrice = enrollment.pricePaid || 0;
      if (oldPrice === 0 && course) {
        const oldPlan = enrollment.planType || 'batch';
        if (course.plans && course.plans[oldPlan] && course.plans[oldPlan].price > 0) {
          oldPrice = course.plans[oldPlan].price;
        } else {
          if (oldPlan === 'batch') oldPrice = course.price || 0;
          else if (oldPlan === 'pro') oldPrice = Math.round((course.price || 0) * 1.25);
          else if (oldPlan === 'infinity') oldPrice = Math.round((course.price || 0) * 1.5);
        }
      }
      let credit = 0;
      if (enrollment.validUntil) {
        const startDate = enrollment.createdAt ? new Date(enrollment.createdAt) : new Date();
        const totalMs = new Date(enrollment.validUntil) - startDate;
        const remainingMs = new Date(enrollment.validUntil) - new Date();
        if (totalMs > 0 && remainingMs > 0) {
          credit = oldPrice * (remainingMs / totalMs);
        }
      } else {
        credit = oldPrice;
      }
      credit = Math.round(credit * 100) / 100;
      price = Math.max(0, Math.round((price - credit) * 100) / 100);
      mrp = Math.max(0, Math.round((mrp - credit) * 100) / 100);
    }
    return { price, mrp };
  };

  // Rating state
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [bankTransferRequest, setBankTransferRequest] = useState(null);

  useEffect(() => {
    api.get(`/courses/${id}`).then((r) => {
      const fetched = r.data;
      setCourse(fetched);
      const courseId = fetched._id;
      if (fetched.upsell?.enabled) {
        const targetType = fetched.upsell.targetType || 'course';
        if (targetType === 'test_series' && fetched.upsell.testSeriesId) {
          api.get(`/tests/series/${fetched.upsell.testSeriesId}`)
            .then((u) => setUpsellCourse(u.data))
            .catch(() => {});
        } else if ((targetType === 'course' || targetType === 'power_course') && fetched.upsell.courseId) {
          api.get(`/courses/${fetched.upsell.courseId}`)
            .then((u) => setUpsellCourse(u.data))
            .catch(() => {});
        }
      }
      if (user) {
        api.get(`/enroll/check/${courseId}`).then((r) => {
          setEnrolled(r.data.enrolled);
          setEnrollment(r.data.enrollment);
          if (r.data.enrolled && r.data.enrollment) {
            const curPlan = r.data.enrollment.planType || 'batch';
            if (curPlan === 'batch') setSelectedPlan('pro');
            else if (curPlan === 'pro') setSelectedPlan('infinity');
            else setSelectedPlan('infinity');
          }
        }).catch(() => {});

        api.get('/bank-transfer/me').then((r) => {
          const matching = (r.data || []).find(
            (req) => req.itemType === 'course' && req.course?._id === courseId && req.status === 'pending'
          );
          setBankTransferRequest(matching);
        }).catch(() => {});
      }
      if (user && fetched.reviews?.length) {
        const existing = fetched.reviews.find(
          (r) => r.student?.toString() === user._id?.toString()
        );
        if (existing) setMyReview(existing);
      }
    });
  }, [id, user]);

  // ─── Apply coupon ─────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    try {
      const { data } = await api.post('/payment/validate-coupon', {
        courseId: course._id,
        couponCode: couponInput.trim(),
        planType: selectedPlan,
      });
      setCouponApplied(data);
      toast.success(`Coupon applied! You save ₹${data.discountAmount}`);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Invalid coupon code');
      setCouponApplied(null);
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponInput('');
  };

  // ─── Submit rating ────────────────────────────────────────────────────────
  const submitRating = async () => {
    if (!user) {
      toast('Please login to submit a review', { icon: '🔒' });
      nav('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    if (!ratingVal) { toast.error('Please select a star rating'); return; }
    setRatingBusy(true);
    try {
      await api.post(`/courses/${course._id}/review`, {
        rating: ratingVal,
        comment: ratingComment.trim(),
      });
      toast.success('Thank you for your review!');
      setMyReview({ rating: ratingVal, comment: ratingComment.trim(), studentName: user?.name });
      // Fetch updated course data to refresh the reviews and rating
      api.get(`/courses/${course._id}`).then((r) => {
        setCourse(r.data);
      }).catch(() => {});
    } catch (e) {
      toast.error(e.message || 'Could not submit review');
    } finally {
      setRatingBusy(false);
    }
  };

  // ─── Main enroll / pay handler ────────────────────────────────────────────
  const enroll = useCallback(async () => {
    if (!user) {
      toast('Please login to enroll', { icon: '🔒' });
      nav('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    // Admin bypasses payment — direct enroll
    if (user.role === 'admin') {
      setBusy(true);
      try {
        await api.post(`/enroll/${course._id}`);
        toast.success('Enrolled successfully!');
        setEnrolled(true);
        nav('/dashboard');
      } catch (e) {
        toast.error(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    // ─── Student: Razorpay payment flow ──────────────────────────────────
    setBusy(true);
    try {
      // Step 1: Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setBusy(false);
        return;
      }

      // Step 2: Create order on backend
      const { data: orderData } = await api.post('/payment/create-order', {
        courseId: course._id,
        couponCode: couponApplied?.couponCode || '',
        redeemCoins: redeemCoins,
        planType: selectedPlan,
      });

      // Free course / coupon made it free
      if (orderData.free) {
        toast.success('Enrolled successfully! 🎉');
        setEnrolled(true);
        nav('/dashboard');
        setBusy(false);
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ace2Examz',
        description: orderData.itemName,
        image: orderData.itemThumbnail || '',
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
          // Step 4: Verify payment on backend
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              courseId: course._id,
            });
            toast.success('Payment successful! Welcome to the course 🎉');
            setEnrolled(true);
            nav('/dashboard');
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
  }, [user, course, couponApplied, id, nav, redeemCoins, selectedPlan]);

  if (!course) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const displayCategories = course.categories?.length
    ? course.categories
    : course.category
    ? [course.category]
    : [];

  const discount =
    course.mrp && course.mrp > course.price
      ? Math.round(((course.mrp - course.price) / course.mrp) * 100)
      : 0;

  const tabs = [
    { k: 'overview',   l: 'Overview',     icon: BookOpen      },
    { k: 'subjects',   l: 'All Classes',  icon: Layers        },
    ...(course.demoVideoUrl || course.orientationVideoUrl ? [{ k: 'demo', l: 'Demo', icon: PlayCircle }] : []),
    { k: 'syllabus',   l: 'Syllabus',     icon: BookMarked    },
    { k: 'timetable',  l: 'Time Table',   icon: Calendar      },
    { k: 'highlights', l: 'Highlights',   icon: Award         },
    { k: 'instructor', l: 'Instructor',   icon: GraduationCap },
    ...(course.faqs?.length ? [{ k: 'faqs', l: 'FAQs', icon: ChevronDown }] : []),
    { k: 'reviews', l: 'Reviews & Ratings', icon: Star },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-soft py-14">
        <div className="container-x grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <Link to="/courses" className="text-sm text-brand-700 font-semibold">
              ← All Courses
            </Link>
            <div className="flex flex-wrap gap-1 mt-4 mb-3">
              {displayCategories.map((cat) => (
                <span key={cat} className="chip bg-white border border-brand-100 text-brand-700">
                  {cat} • Chemistry
                </span>
              ))}
              {(course.subCategories || []).map((sub) => (
                <span key={sub} className="chip bg-violet-50 border border-violet-200 text-violet-700">
                  {sub}
                </span>
              ))}
              {course.courseType === 'live' ? (
                <span className="chip bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Batch
                </span>
              ) : (
                <span className="chip bg-slate-100 text-slate-600 border border-slate-200">
                  🎬 Recorded Batch
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
              {course.title}
            </h1>
            <p className="text-slate-600 mt-3">{course.shortDescription}</p>

            {course.isCombo && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm flex items-start gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <div className="font-bold text-amber-900 text-sm">Combo Course Package</div>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    {course.comboDescription || "This special package combines multiple premium batches & study resources into one single enrollment."}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-5 mt-5 text-sm text-slate-700">
              <span className="flex items-center gap-1.5">
                <Clock size={16} /> {validityLabel(course.validity, course.durationMonths)}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen size={16} /> {course.totalLessons || 0} lessons
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                <Star size={16} fill="currentColor" /> {course.rating || 4.8}
              </span>
              {(course.startDate || course.endDate) && (
                <span className="flex items-center gap-1.5 text-brand-700 font-semibold">
                  <Calendar size={16} />
                  {course.startDate && new Date(course.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {course.startDate && course.endDate && ' → '}
                  {course.endDate && new Date(course.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <div className="mt-4 text-sm text-slate-500">
              By <b className="text-slate-700">{course.instructor}</b> • Language: {course.language}
            </div>

            {/* About Educator – inline preview */}
            <div className="mt-5 flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-sm">
              {course.educator?.photo ? (
                <img
                  src={course.educator.photo}
                  alt={course.instructor}
                  className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-brand-100"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-50 grid place-items-center shrink-0">
                  <GraduationCap size={22} className="text-brand-600" />
                </div>
              )}
              <div>
                <div className="font-bold text-slate-800 text-sm leading-snug">{course.instructor}</div>
                <div className="text-xs text-brand-600 font-medium mt-0.5">Chemistry Educator</div>
                {course.educator?.bio && (
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{course.educator.bio}</div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { icon: Video,        label: 'Video Classes'  },
                { icon: FileText,     label: 'Class Notes'    },
                { icon: ClipboardList,label: 'Tests & DPPs'   },
                { icon: BookMarked,   label: 'Study Material' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                  <Icon size={13} className="text-brand-600" /> {label}
                </span>
              ))}
            </div>

            {/* Choose Prep Plan Selector (Moved to Left Column) */}
            <div className="mt-8 bg-white border border-slate-250 rounded-3xl p-6 shadow-sm max-w-xl">
              <label className="text-sm font-black uppercase tracking-wider text-slate-700 block mb-3">
                {enrolled ? 'Upgrade Prep Plan' : 'Choose Your Prep Plan'}
              </label>
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/60">
                {[
                  { k: 'batch', l: course.plans?.batch?.name || 'Starter Plan' },
                  { k: 'pro', l: course.plans?.pro?.name || 'Pro Plan' },
                  { k: 'infinity', l: course.plans?.infinity?.name || 'Infinity Plan' }
                ].map((p) => {
                  const planConfig = course.plans?.[p.k];
                  const isEnabled = planConfig ? planConfig.enabled : true;
                  
                  let planPrice = course.price;
                  if (planConfig && planConfig.price) {
                    planPrice = planConfig.price;
                  } else {
                    if (p.k === 'pro') planPrice = Math.round(course.price * 1.25);
                    else if (p.k === 'infinity') planPrice = Math.round(course.price * 1.5);
                  }

                  const planOrder = { batch: 1, pro: 2, infinity: 3 };
                  const isDowngradeOrSame = enrollment && planOrder[p.k] <= planOrder[enrollment.planType];
                  const isSelected = selectedPlan === p.k;
                  
                  let displayPrice = planPrice;
                  if (enrollment && !isDowngradeOrSame) {
                    let oldPrice = enrollment.pricePaid || 0;
                    if (oldPrice === 0 && course) {
                      const oldPlan = enrollment.planType || 'batch';
                      if (course.plans && course.plans[oldPlan] && course.plans[oldPlan].price > 0) {
                        oldPrice = course.plans[oldPlan].price;
                      } else {
                        if (oldPlan === 'batch') oldPrice = course.price || 0;
                        else if (oldPlan === 'pro') oldPrice = Math.round((course.price || 0) * 1.25);
                        else if (oldPlan === 'infinity') oldPrice = Math.round((course.price || 0) * 1.5);
                      }
                    }
                    let credit = 0;
                    if (enrollment.validUntil) {
                      const startDate = enrollment.createdAt ? new Date(enrollment.createdAt) : new Date();
                      const totalMs = new Date(enrollment.validUntil) - startDate;
                      const remainingMs = new Date(enrollment.validUntil) - new Date();
                      if (totalMs > 0 && remainingMs > 0) {
                        credit = oldPrice * (remainingMs / totalMs);
                      }
                    } else {
                      credit = oldPrice;
                    }
                    credit = Math.round(credit * 100) / 100;
                    displayPrice = Math.max(0, Math.round((planPrice - credit) * 100) / 100);
                  }

                  return (
                    <button
                      key={p.k}
                      type="button"
                      disabled={!isEnabled || isDowngradeOrSame}
                      onClick={() => {
                        setSelectedPlan(p.k);
                        setCouponApplied(null);
                        setCouponInput('');
                      }}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all text-center ${
                        isSelected
                          ? 'bg-white text-brand-700 shadow-md border border-brand-100 scale-[1.02] font-extrabold'
                          : isEnabled && !isDowngradeOrSame
                            ? 'text-slate-600 hover:bg-white/60 text-xs font-semibold'
                            : 'opacity-40 cursor-not-allowed text-xs'
                      }`}
                    >
                      <span className="text-xs sm:text-sm leading-none whitespace-nowrap">{p.l}</span>
                      <span className="text-xs mt-1 text-slate-500 font-bold">
                        {isDowngradeOrSame ? 'Owned' : enrollment ? `Upgrade: ₹${displayPrice}` : `₹${displayPrice}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Features list for the selected plan */}
              {(() => {
                const PLAN_FEATURES = {
                  batch: [
                    { text: '📚 Complete Chemistry Syllabus', included: true },
                    { text: '📝 Digital Notes & PYQs', included: true },
                    { text: '🧪 Online Practice Test', included: true },
                    { text: '💬 1 Doubt Query Per Day', included: true },
                    { text: '🎥 Interactive Live Classes', included: false },
                    { text: '🎯 Ace Track', included: false },
                    { text: '🚀 Upcoming Course & Test Series', included: false },
                    { text: '👑 1-on-1 Personal Session', included: false },
                    { text: '🤖 Ask Prepiify AI Access', included: false },
                  ],
                  pro: [
                    { text: '📚 Complete Chemistry Syllabus', included: true },
                    { text: '📝 Digital Notes & PYQs', included: true },
                    { text: '🧪 Online Practice Test', included: true },
                    { text: '💬 3 Doubt Queries Per Day', included: true },
                    { text: '🎥 Interactive Live Classes', included: true },
                    { text: '🎯 Ace Track', included: true },
                    { text: '🚀 Upcoming Course & Test Series', included: false },
                    { text: '👑 1-on-1 Personal Session', included: false },
                    { text: '🤖 Ask Prepiify AI Access', included: true },
                  ],
                  infinity: [
                    { text: '📚 Complete Chemistry Syllabus', included: true },
                    { text: '📝 Digital Notes & PYQs', included: true },
                    { text: '🧪 Online Practice Test', included: true },
                    { text: '💬 Unlimited Doubt Queries', included: true },
                    { text: '🎥 Interactive Live Classes', included: true },
                    { text: '🎯 Ace Track', included: true },
                    { text: '🚀 Upcoming Course & Test Series', included: true },
                    { text: '👑 1-on-1 Personal Session', included: true },
                    { text: '🤖 Ask Prepiify AI Access', included: true },
                  ]
                };

                return (
                  <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner animate-fade-in">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      {selectedPlan === 'batch' ? `${course.plans?.batch?.name || 'Starter Plan'} Features` : selectedPlan === 'pro' ? `${course.plans?.pro?.name || 'Pro Plan'} Features` : `${course.plans?.infinity?.name || 'Infinity Plan'} Features`}
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      {PLAN_FEATURES[selectedPlan].map((feat, fi) => (
                        <li key={fi} className="flex items-start gap-2.5 text-xs">
                          {feat.included ? (
                            <CheckCircle className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="text-slate-350 w-4 h-4 shrink-0 mt-0.5" />
                          )}
                          <span className={feat.included ? "font-bold text-slate-700" : "text-slate-400 line-through decoration-slate-200"}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Price card */}
          <div>
            <div className="card p-0 overflow-hidden sticky top-20 shadow-xl border-2 border-brand-100">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
                {discount > 0 && (
                  <div className="absolute top-3 right-3 chip bg-gradient-brand text-white font-bold">
                    {discount}% OFF
                  </div>
                )}
              </div>
              <div className="p-5">
                {enrolled && enrollment && (
                  <div className="mb-4 p-3 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Plan</span>
                      <div className="text-xs font-extrabold text-brand-800">
                        {enrollment.planType === 'batch' ? (course.plans?.batch?.name || 'Starter Plan') : enrollment.planType === 'pro' ? (course.plans?.pro?.name || 'Pro Plan') : (course.plans?.infinity?.name || 'Infinity Plan')}
                      </div>
                    </div>
                    {enrollment.planType !== 'infinity' && (
                      <span className="chip bg-brand-600 text-white font-bold text-[9px] py-0.5 px-1.5 rounded-full">Upgrade Available</span>
                    )}
                  </div>
                )}

                {!isSelectedDowngradeOrSame && (() => {
                  const planInfo = getPlanPriceAndMrp();
                  const currentPlanPrice = planInfo.price;
                  const currentPlanMrp = planInfo.mrp;

                  const initialBaseAmt = couponApplied ? couponApplied.finalAmount : currentPlanPrice;
                  let displayPrice = initialBaseAmt;
                  let coinDiscount = 0;
                  if (redeemCoins && user) {
                    const maxCoinsNeeded = Math.floor(initialBaseAmt);
                    const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
                    coinDiscount = coinsToRedeem;
                    displayPrice = Math.max(0, initialBaseAmt - coinDiscount);
                  }
                  
                  const actualDiscount = currentPlanMrp && currentPlanMrp > currentPlanPrice
                    ? Math.round(((currentPlanMrp - currentPlanPrice) / currentPlanMrp) * 100)
                    : 0;

                  return (
                    <div>
                      <div className="flex items-baseline gap-3 flex-wrap w-full">
                        <div className="text-3xl font-extrabold gradient-text">
                          ₹{displayPrice?.toLocaleString()}
                        </div>
                        {(couponApplied || coinDiscount > 0 || (currentPlanMrp > currentPlanPrice)) && (
                          <div className="text-sm text-slate-400 line-through">
                            ₹{(couponApplied ? currentPlanPrice : currentPlanMrp)?.toLocaleString()}
                          </div>
                        )}
                        {couponApplied && (
                          <div className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                            Save ₹{couponApplied.discountAmount?.toLocaleString()}
                          </div>
                        )}
                        {coinDiscount > 0 && (
                          <div className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                            Coins Saved ₹{coinDiscount?.toLocaleString()}
                          </div>
                        )}
                        {!couponApplied && coinDiscount === 0 && actualDiscount > 0 && (
                          <div className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                            Save ₹{(currentPlanMrp - currentPlanPrice)?.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Scarcity seat limit notice for Ace Infinity */}
                      {selectedPlan === 'infinity' && !enrolled && (() => {
                        const seatsLimit = course.plans?.infinity?.seatsLimit || 15;
                        const seatsReserved = course.plans?.infinity?.seatsReserved || 0;
                        const enrolledInfinityCount = course.enrolledInfinityCount || 0;
                        const remainingSeats = Math.max(0, seatsLimit - seatsReserved - enrolledInfinityCount);
                        
                        if (remainingSeats <= 3 && remainingSeats > 0) {
                          return (
                            <div className="mt-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-center animate-pulse flex items-center justify-center gap-1.5 shadow-sm">
                              🔥 Urgency: Only {remainingSeats} seat{remainingSeats > 1 ? 's' : ''} left in this cohort!
                            </div>
                          );
                        } else if (remainingSeats <= 0) {
                          return (
                            <div className="mt-3 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                              🔒 Sold Out: All Infinity Plan slots filled!
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-3 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                              🎓 Hurry: Only {remainingSeats} seats left for 1:1 session support!
                            </div>
                          );
                        }
                      })()}
                    </div>
                  );
                })()}

                {isSelectedDowngradeOrSame ? (
                  <Link to={`/student/learn/${course._id}`} className="btn-primary w-full mt-4 justify-center">
                    ▶ Continue Learning
                  </Link>
                ) : (
                  <>
                    {/* Watch Demo button */}
                    {!enrolled && (course.demoVideoUrl || course.orientationVideoUrl) && (
                      <button
                        onClick={() => { setTab('demo'); document.getElementById('course-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-brand-200 text-brand-700 font-semibold text-sm hover:bg-brand-50 transition"
                      >
                        <PlayCircle size={16} /> Watch Demo
                      </button>
                    )}
                    {/* Coupon code input — only for students */}
                    {user && user.role !== 'admin' && (
                      <div className="mt-4">
                        {couponApplied ? (
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
                            {(course.discountCoupons?.filter((c) => c.isActive && c.code) || []).length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-slate-500 font-medium">Available Coupons:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {course.discountCoupons.filter((c) => c.isActive && c.code).map((c, i) => (
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
                        )}
                      </div>
                    )}
                    {user && user.role !== 'admin' && isUpgradePurchase && !couponApplied && (
                      <div className="mt-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700">
                        Coupon can be used on this upgrade only if you have not used any coupon for this course before.
                      </div>
                    )}

                    {/* Coin Redemption checkbox */}
                    {user && user.role !== 'admin' && user.coins >= 250 && (
                      <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="text-amber-500 animate-pulse" size={16} />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Redeem Ace Coins</p>
                            <p className="text-[10px] text-slate-500 font-semibold">You have {user.coins} coins (≈ {user.coins} INR)</p>
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

                    {/* Payment Mode Selector — only for paid courses + students */}
                    {user && user.role !== 'admin' && course.price > 0 && (() => {
                      if (course.isAdmissionClosed) {
                        return (
                          <div className="mt-4">
                            <button
                              disabled
                              className="w-full py-3 bg-red-50 border border-red-200 text-red-650 rounded-xl font-bold text-base cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              🔒 Admission Closed
                            </button>
                            <p className="text-center text-[11px] text-red-500 font-semibold mt-1.5">This batch admission has been closed by admin.</p>
                          </div>
                        );
                      }
                      const planInfo = getPlanPriceAndMrp();
                      const currentPlanPrice = planInfo.price;
                      const initialAmt = couponApplied ? couponApplied.finalAmount : currentPlanPrice;
                      let baseAmt = initialAmt;
                      let coinDiscount = 0;
                      if (redeemCoins && user.coins >= 250) {
                        const maxCoinsNeeded = Math.floor(initialAmt);
                        const coinsToRedeem = Math.min(user.coins || 0, maxCoinsNeeded);
                        coinDiscount = coinsToRedeem;
                        baseAmt = Math.max(0, initialAmt - coinDiscount);
                      }
                      const rzpTotal = baseAmt;

                      const seatsLimit = course.plans?.infinity?.seatsLimit || 15;
                      const seatsReserved = course.plans?.infinity?.seatsReserved || 0;
                      const enrolledInfinityCount = course.enrolledInfinityCount || 0;
                      const remainingSeats = Math.max(0, seatsLimit - seatsReserved - enrolledInfinityCount);
                      const isSoldOut = selectedPlan === 'infinity' && remainingSeats <= 0;

                      return (
                        <div className="mt-4 space-y-3">
                          {/* Razorpay fee breakdown */}
                          {!isSoldOut && (
                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2.5 space-y-1 text-xs">
                              <div className="flex justify-between text-slate-650"><span>Course price</span><span>₹{currentPlanPrice.toFixed(2)}</span></div>
                              {couponApplied && couponApplied.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                  <span>Coupon discount ({couponApplied.couponCode})</span>
                                  <span>- ₹{couponApplied.discountAmount.toFixed(2)}</span>
                                </div>
                              )}
                              {coinDiscount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Coin discount</span><span>- ₹{coinDiscount.toFixed(2)}</span></div>}

                              <div className="flex justify-between font-bold text-indigo-700 border-t border-indigo-200 pt-1"><span>Total</span><span>₹{rzpTotal.toFixed(2)}</span></div>
                            </div>
                          )}

                          {/* Action button */}
                          {isSoldOut ? (
                            <button
                              disabled
                              className="w-full py-3 bg-slate-300 text-slate-650 rounded-xl font-semibold text-base cursor-not-allowed"
                            >
                              Sold Out
                            </button>
                          ) : (
                            <button
                              onClick={enroll}
                              disabled={busy}
                              className="btn-primary w-full justify-center disabled:opacity-60 text-base py-3 gap-2"
                            >
                              {busy ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
                              {busy ? 'Processing…' : `Pay ₹${rzpTotal.toFixed(2)}`}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Admin or free enroll button */}
                    {(user?.role === 'admin' || course.price === 0) && (
                      <button
                        onClick={enroll}
                        disabled={busy || (course.price === 0 && course.isAdmissionClosed && user?.role !== 'admin')}
                        className="btn-primary w-full mt-3 justify-center disabled:opacity-60 text-base py-3 gap-2"
                      >
                        {busy ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                        {busy ? 'Processing…' : course.price === 0 ? (course.isAdmissionClosed && user?.role !== 'admin' ? 'Admission Closed' : 'Enroll Free') : 'Enroll (Admin)'}
                      </button>
                    )}

                    {/* Login prompt for unauthenticated */}
                    {!user && course.price > 0 && (() => {
                      if (course.isAdmissionClosed) {
                        return (
                          <button
                            disabled
                            className="w-full py-3 bg-red-50 border border-red-200 text-red-650 rounded-xl font-bold text-base cursor-not-allowed mt-3 flex items-center justify-center gap-2"
                          >
                            🔒 Admission Closed
                          </button>
                        );
                      }
                      const planInfo = getPlanPriceAndMrp();
                      return (
                        <button
                          onClick={enroll}
                          className="btn-primary w-full mt-3 justify-center text-base py-3 gap-2"
                        >
                          <Zap size={16} />
                          Pay ₹ {planInfo.price?.toLocaleString()}
                        </button>
                      );
                    })()}
                    {enrolled && (
                      <Link to={`/student/learn/${course._id}`} className="text-center block text-xs font-bold text-brand-650 hover:underline mt-3">
                        ← Skip &amp; Continue Learning
                      </Link>
                    )}
                  </>
                )}

                {/* Share Course Option */}
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success('Course link copied to clipboard!');
                  }}
                  className="w-full mt-3.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs transition"
                >
                  <Share2 size={14} /> Share Course
                </button>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-brand-600" /> {validityLabel(course.validity, course.durationMonths)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-brand-600" /> Video classes
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-brand-600" /> Digital class notes
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-brand-600" /> Tests, DPPs &amp; Study material
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-brand-600" /> Doubt support 24×7
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs section */}
      <section className="section" id="course-tabs">
        <div className="container-x">
          <div className="flex gap-1 border-b border-slate-200 mb-8 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-[2px] transition ${
                  tab === t.k
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <t.icon size={15} />
                {t.l}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="max-w-3xl">
              <div className="prose max-w-none mb-8">
                {course.description ? (
                  <div dangerouslySetInnerHTML={{ __html: course.description }} />
                ) : (
                  <p className="text-slate-700 text-base leading-relaxed">{course.shortDescription}</p>
                )}
              </div>

              {course.isCombo && ((course.comboCourses && course.comboCourses.length > 0) || (course.comboTestSeries && course.comboTestSeries.length > 0)) && (
                <div className="mb-10 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
                  <h3 className="font-display text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                    <span>🎁</span> Included Batches, Courses & Test Series
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 font-semibold">
                    This combo package grants you complete access to all of the following premium content:
                  </p>

                  {course.comboCourses && course.comboCourses.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold text-slate-700 text-sm mb-3">🎓 Included Batches & Courses ({course.comboCourses.length})</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {course.comboCourses.map((cc) => (
                          <Link
                            key={cc._id}
                            to={cc.isPowerCourse ? `/power-batch/${cc._id}` : `/courses/${cc.slug || cc._id}`}
                            className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-all group"
                          >
                            <img
                              src={cc.thumbnail}
                              alt={cc.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                                {cc.title}
                              </h4>
                              {cc.isPowerCourse && (
                                <span className="mt-2 inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                  Power Batch
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-brand-600 hover:underline inline-flex items-center gap-0.5 mt-2">
                                {cc.isPowerCourse ? 'View Power Batch' : 'View Course Details'} →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.comboTestSeries && course.comboTestSeries.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm mb-3">📝 Included Test Series ({course.comboTestSeries.length})</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {course.comboTestSeries.map((ts) => (
                          <Link
                            key={ts._id}
                            to={`/test-series/${ts.slug || ts._id}`}
                            className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 hover:shadow-md transition-all group"
                          >
                            <img
                              src={ts.thumbnail}
                              alt={ts.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                                {ts.title}
                              </h4>
                              <span className="text-[10px] font-bold text-brand-600 hover:underline inline-flex items-center gap-0.5 mt-2">
                                View Test Series Details →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Infinity Plan Bundled Content */}
              {selectedPlan === 'infinity' && course.plans?.infinity && ((course.plans.infinity.courses && course.plans.infinity.courses.length > 0) || (course.plans.infinity.powerCourses && course.plans.infinity.powerCourses.length > 0) || (course.plans.infinity.testSeries && course.plans.infinity.testSeries.length > 0)) && (
                <div className="mb-10 bg-amber-50/50 border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in">
                  <h3 className="font-display text-lg font-extrabold text-amber-950 flex items-center gap-2 mb-2">
                    <span>🎁</span> Included with Ace Infinity Plan
                  </h3>
                  <p className="text-xs text-amber-800/80 mb-6 font-bold">
                    Upgrading to the Ace Infinity Plan grants you complimentary, full access to the following premium courses, power batches, and test series:
                  </p>

                  {course.plans.infinity.courses && course.plans.infinity.courses.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold text-amber-900 text-sm mb-3">🎓 Included Batches & Courses ({course.plans.infinity.courses.length})</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {course.plans.infinity.courses.map((cc) => (
                          <Link
                            key={cc._id}
                            to={`/courses/${cc.slug || cc._id}`}
                            className="bg-white rounded-2xl border border-amber-200/60 p-4 flex gap-4 hover:shadow-md transition-all group"
                          >
                            {cc.thumbnail ? (
                              <img
                                src={cc.thumbnail}
                                alt={cc.title}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                                Course
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <h4 className="font-bold text-slate-805 text-sm leading-snug group-hover:text-brand-650 transition-colors line-clamp-2">
                                {cc.title}
                              </h4>
                              <span className="text-[10px] font-bold text-brand-650 hover:underline inline-flex items-center gap-0.5 mt-2">
                                View Course Details →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.plans.infinity.powerCourses && course.plans.infinity.powerCourses.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold text-amber-900 text-sm mb-3">⚡ Included Power Batch ({course.plans.infinity.powerCourses.length})</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {course.plans.infinity.powerCourses.map((pc) => (
                          <Link
                            key={pc._id}
                            to={`/power-batch/${pc._id}`}
                            className="bg-white rounded-2xl border border-amber-200/60 p-4 flex gap-4 hover:shadow-md transition-all group"
                          >
                            {pc.thumbnail ? (
                              <img
                                src={pc.thumbnail}
                                alt={pc.title}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                                Power
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-slate-850 text-sm leading-snug group-hover:text-brand-650 transition-colors line-clamp-2">
                                  {pc.title}
                                </h4>
                                <p className="text-[10px] text-amber-800/70 font-bold mt-1">
                                  {pc.startDate || pc.endDate ? 'Calendar mode' : `${pc.powerCourseDuration || 7} day-wise batch`}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-brand-650 hover:underline inline-flex items-center gap-0.5 mt-2">
                                View Power Batch →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.plans.infinity.testSeries && course.plans.infinity.testSeries.length > 0 && (
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm mb-3">📝 Included Test Series ({course.plans.infinity.testSeries.length})</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {course.plans.infinity.testSeries.map((ts) => (
                          <Link
                            key={ts._id}
                            to={`/test-series/${ts.slug || ts._id}`}
                            className="bg-white rounded-2xl border border-amber-200/60 p-4 flex gap-4 hover:shadow-md transition-all group"
                          >
                            {ts.thumbnail ? (
                              <img
                                src={ts.thumbnail}
                                alt={ts.title}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                                Test
                              </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <h4 className="font-bold text-slate-850 text-sm leading-snug group-hover:text-brand-650 transition-colors line-clamp-2">
                                {ts.title}
                              </h4>
                              <span className="text-[10px] font-bold text-brand-650 hover:underline inline-flex items-center gap-0.5 mt-2">
                                View Test Series Details →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {[
                  { icon: Video,       label: 'Video Classes', value: 'Full HD',                                        color: 'text-brand-600',   bg: 'bg-brand-50'   },
                  { icon: FileText,    label: 'Class Notes',   value: 'Digital',                                        color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: ClipboardList,label:'Tests & DPPs',  value: 'Chapter-wise',                                   color: 'text-amber-600',   bg: 'bg-amber-50'   },
                  { icon: ShieldCheck, label: 'Access',        value: validityLabel(course.validity, course.durationMonths), color: 'text-violet-600',  bg: 'bg-violet-50'  },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="card p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${bg} ${color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="font-bold text-slate-800 text-sm">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {course.batchInformation && (
                <div className="mt-6 p-5 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-100 shrink-0">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">Batch Information Booklet</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Download or view the detailed batch details, syllabus, and schedule.</p>
                    </div>
                  </div>
                  <a
                    href={course.batchInformation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-2 text-xs py-2.5 px-5 shadow-lg shadow-brand-100 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    <Download size={14} /> View Batch Info PDF
                  </a>
                </div>
              )}

              {/* Plans Comparison Table */}
              <div className="mt-10 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-base">Plan Comparison & Features Matrix</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Explore features and find the best plan for you.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30">
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Features</th>
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider text-center bg-brand-50/20">{course.plans?.batch?.name || 'Starter Plan'}</th>
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider text-center bg-violet-50/20">{course.plans?.pro?.name || 'Pro Plan'}</th>
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider text-center bg-amber-50/20">{course.plans?.infinity?.name || 'Infinity Plan'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Recorded Classes & Notes</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Mock Test & DPPs</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Doubt Support</td>
                        <td className="p-3 text-center text-slate-500 text-xs font-medium">1 / Day</td>
                        <td className="p-3 text-center text-slate-500 text-xs font-medium">3 / Day</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Unlimited</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Ask Prepiify AI</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Live Interactive Classes</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">1:1 Personal Session</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Syllabus Tracker</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Daily Study Planner</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-xs font-semibold text-slate-800">Study Library (E-Books, Notes & Magazines)</td>
                        <td className="p-3 text-center text-rose-500 font-bold">✗</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'subjects' && (
            <SubjectsTab courseId={course._id} enrolled={enrolled} onEnroll={enroll} />
          )}

          {tab === 'demo' && (
            <div className="max-w-3xl space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white grid place-items-center">
                    <PlayCircle size={16} />
                  </div>
                  <h2 className="font-bold text-slate-900">Demo & Orientation Videos</h2>
                  <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Free Preview</span>
                </div>
                <p className="text-sm text-slate-500 mb-5">Watch these videos to get a feel of the course content and teaching style before enrolling.</p>

                {course.orientationVideoUrl && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                      <h3 className="font-bold text-slate-800 text-sm">🎓 Orientation Video</h3>
                      <span className="text-xs text-slate-400">Course Introduction</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                      <VideoEmbed url={course.orientationVideoUrl} title="Orientation Video" />
                    </div>
                  </div>
                )}

                {course.demoVideoUrl && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-violet-500" />
                      <h3 className="font-bold text-slate-800 text-sm">▶️ Demo Video</h3>
                      <span className="text-xs text-slate-400">Sample Lecture</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                      <VideoEmbed url={course.demoVideoUrl} title="Demo Video" />
                    </div>
                  </div>
                )}

                {!course.demoVideoUrl && !course.orientationVideoUrl && (
                  <div className="text-center py-10 text-slate-400">
                    <PlayCircle size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Demo videos coming soon!</p>
                  </div>
                )}
              </div>

              {!enrolled && (
                <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 p-5 flex flex-col sm:flex-row items-center gap-4 text-white">
                  <div className="flex-1">
                    <p className="font-bold text-base">Ready to join the full course?</p>
                    <p className="text-sm opacity-80 mt-0.5">Get access to all video classes, notes, DPPs, tests and live sessions.</p>
                  </div>
                  <button onClick={enroll} className="shrink-0 bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl hover:bg-brand-50 transition text-sm">
                    Enroll Now →
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'syllabus' && (
            <div className="max-w-3xl">
              {course.syllabus?.length > 0 ? (
                <div className="space-y-4">
                  {course.syllabus.map((item, i) => (
                    <div key={i} className="card p-5 flex gap-4 hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0 font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-base leading-snug">
                          {typeof item === 'string' ? item : item.title}
                        </div>
                        {typeof item !== 'string' && item.description && (
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        )}
                        {typeof item !== 'string' && item.pdfUrl && (
                          <div className="mt-2.5">
                            {enrolled || user?.role === 'admin' ? (
                              <button
                                onClick={() => setOpenPdf({ fileUrl: item.pdfUrl, title: item.title || 'Syllabus PDF' })}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-2.5 py-1.5 rounded-lg transition"
                              >
                                <span>📄 View Syllabus PDF</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => toast.error('Syllabus PDF is locked. Please enroll in the course to unlock it.')}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-not-allowed"
                              >
                                <span>🔒 View Syllabus PDF (Locked)</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <BookMarked size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Syllabus will be updated soon.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'highlights' && (
            <div>
              {course.highlights?.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {course.highlights.map((h, i) => (
                    <div key={i} className="card p-5 flex gap-3 hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                        <Check size={16} />
                      </div>
                      <div className="font-semibold text-slate-800">{h}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-12">No highlights added yet.</div>
              )}
            </div>
          )}

          {tab === 'instructor' && (
            <div className="max-w-2xl">
              <div className="card p-6">
                <div className="flex items-start gap-5">
                  {course.educator?.photo ? (
                    <img
                      src={course.educator.photo}
                      alt={course.instructor}
                      className="w-24 h-24 rounded-2xl object-cover shrink-0 border-2 border-brand-100 shadow-md"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-brand-50 grid place-items-center shrink-0">
                      <GraduationCap size={40} className="text-brand-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-extrabold text-slate-900">{course.instructor}</div>
                    <div className="text-sm text-brand-600 font-semibold mt-0.5">Chemistry Educator</div>
                    {course.educator?.bio ? (
                      <p className="text-sm text-slate-600 mt-3 leading-relaxed">{course.educator.bio}</p>
                    ) : (
                      <p className="text-sm text-slate-400 mt-3 italic">Bio coming soon…</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <BookOpen size={14} />
                        <b>{course.totalLessons || 0}</b> Lessons
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'faqs' && (
            <div className="space-y-3 max-w-2xl">
              {(course.faqs || []).map((f, i) => (
                <FaqItem key={i} q={f.question} a={f.answer} />
              ))}
            </div>
          )}

          {tab === 'timetable' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Class Time Table</h2>
              {(course.timetable || []).length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Time table will be updated soon.</p>
                  <p className="text-sm mt-1 opacity-70">Check back later for the class schedule.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(course.timetable || [])
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((slot, i) => (
                      <div key={i} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                          <Clock size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{slot.subject}</div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {formatTimeToAMPM(slot.timeFrom)} – {formatTimeToAMPM(slot.timeTo)}
                          </div>
                          <div className="text-xs text-brand-600 font-semibold mt-1">{slot.days}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
           {tab === 'reviews' && (
             <div className="max-w-2xl space-y-6">
               <div className="card p-6 flex flex-col sm:flex-row gap-6 items-center justify-between">
                 <div className="text-center sm:text-left shrink-0">
                   <div className="text-4xl font-extrabold text-slate-900">{course.rating || 4.8}</div>
                   <div className="flex items-center justify-center sm:justify-start gap-0.5 text-amber-500 mt-1">
                     {Array.from({ length: 5 }).map((_, i) => (
                       <Star
                         key={i}
                         size={16}
                         fill={i < Math.round(course.rating || 4.8) ? "currentColor" : "none"}
                       />
                     ))}
                   </div>
                   <div className="text-xs text-slate-500 mt-2 font-medium">
                     Course Rating ({course.reviews?.length || 0} reviews)
                   </div>
                 </div>

                 {/* Leave Review Form / Submitted Review */}
                 {user ? (
                   myReview ? (
                     <div className="flex-1 w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center sm:text-left">
                       <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Your Review Submitted
                       </div>
                       <div className="flex items-center justify-center sm:justify-start gap-0.5 text-amber-500 mt-1">
                         {Array.from({ length: 5 }).map((_, i) => (
                           <Star
                             key={i}
                             size={13}
                             fill={i < myReview.rating ? "currentColor" : "none"}
                           />
                         ))}
                       </div>
                       <p className="text-xs text-slate-600 mt-2 italic">"{myReview.comment || "No comment"}"</p>
                     </div>
                   ) : (
                     <div className="flex-1 w-full space-y-3">
                       <h3 className="text-sm font-bold text-slate-800">Share your experience</h3>
                       <div className="flex items-center gap-1 justify-center sm:justify-start">
                         {Array.from({ length: 5 }).map((_, i) => {
                           const starValue = i + 1;
                           return (
                             <button
                               key={i}
                               type="button"
                               onClick={() => setRatingVal(starValue)}
                               onMouseEnter={() => setRatingHover(starValue)}
                               onMouseLeave={() => setRatingHover(0)}
                               className="text-amber-400 hover:scale-110 transition-transform"
                             >
                               <Star
                                 size={20}
                                 fill={starValue <= (ratingHover || ratingVal) ? "currentColor" : "none"}
                               />
                             </button>
                           );
                         })}
                       </div>
                       <div className="flex gap-2">
                         <input
                           type="text"
                           value={ratingComment}
                           onChange={(e) => setRatingComment(e.target.value)}
                           placeholder="Write a brief comment (optional)..."
                           className="input text-xs flex-1"
                         />
                         <button
                           onClick={submitRating}
                           disabled={ratingBusy || !ratingVal}
                           className="btn-primary !py-2 !px-4 text-xs shrink-0"
                         >
                           {ratingBusy ? "Submitting..." : "Submit"}
                         </button>
                       </div>
                     </div>
                   )
                 ) : (
                   <div className="text-xs text-slate-400 italic">
                     Please <Link to="/login" className="text-brand-600 font-bold underline">login</Link> to rate this course.
                   </div>
                 )}
               </div>

               {/* Reviews List */}
               <div className="space-y-3">
                 <h3 className="font-bold text-slate-800 text-sm">Student Reviews ({(course.reviews || []).length})</h3>
                 {(course.reviews || []).length === 0 ? (
                   <div className="card p-8 text-center text-slate-400 text-xs">
                     No reviews yet. Be the first to share your feedback!
                   </div>
                 ) : (
                   (course.reviews || []).map((rev, i) => (
                     <div key={i} className="card p-4 space-y-2">
                       <div className="flex items-center justify-between">
                         <div className="font-bold text-slate-800 text-xs">{rev.studentName || 'Student'}</div>
                         <div className="flex items-center gap-0.5 text-amber-500">
                           {Array.from({ length: 5 }).map((_, idx) => (
                             <Star
                               key={idx}
                               size={11}
                               fill={idx < rev.rating ? "currentColor" : "none"}
                             />
                           ))}
                         </div>
                       </div>
                       {rev.comment && (
                         <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                       )}
                       <div className="text-[10px] text-slate-400">
                         {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </div>
           )}
        </div>
      </section>

      {/* Upsell widget */}
      {upsellCourse && !enrolled && (
        <section className="py-12 bg-gradient-to-br from-[#0a0f2e] via-[#14103a] to-[#0d1235] border-t border-white/5 relative overflow-hidden">
          {/* background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
          </div>

          <div className="container-x max-w-4xl relative z-10">
            {/* Section header */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold uppercase tracking-widest border border-amber-400/20 mb-3">
                <Zap size={12} className="text-amber-400" />
                {course.upsell?.title || 'Level Up Your Preparation'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                You're on the right track —<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">don't stop here!</span>
              </h2>
              <p className="text-white/50 text-sm mt-2 max-w-md mx-auto">
                Students who enrolled in this course also found this highly useful for their exam journey.
              </p>
            </div>

            {/* Course card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-violet-500 to-amber-400" />

              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Thumbnail */}
                {upsellCourse.thumbnail ? (
                  <div className="shrink-0 w-full sm:w-40 h-28 rounded-xl overflow-hidden ring-2 ring-white/10">
                    <img
                      src={upsellCourse.thumbnail}
                      alt={upsellCourse.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-40 h-28 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center ring-2 ring-white/10">
                    <BookOpen size={36} className="text-white/70" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {(upsellCourse.examTags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-semibold border border-amber-400/20">
                        {tag}
                      </span>
                    ))}
                    {upsellCourse.isFree && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 text-xs font-semibold border border-emerald-400/20">Free</span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                    {upsellCourse.title}
                  </h3>

                  {upsellCourse.shortDescription && (
                    <p className="text-white/50 text-sm mt-1.5 line-clamp-2">{upsellCourse.shortDescription}</p>
                  )}

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {upsellCourse.highlights?.slice(0, 3).map((h, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                        <CheckCircle size={12} className="text-emerald-400 shrink-0" /> {h}
                      </span>
                    ))}
                    {!upsellCourse.highlights?.length && (
                      course.upsell?.targetType === 'test_series' ? (
                        <>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> High-Quality Mock Tests</span>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Detailed Explanations</span>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Performance Analytics</span>
                        </>
                      ) : course.upsell?.targetType === 'power_course' ? (
                        <>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Day-wise Targets</span>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Focused Revision</span>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Calendar Progress</span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Full HD Videos</span>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Chapter-wise Tests</span>
                          <span className="flex items-center gap-1.5 text-xs text-white/60"><CheckCircle size={12} className="text-emerald-400" /> Lifetime Access</span>
                        </>
                      )
                    )}
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="shrink-0 flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                  {upsellCourse.isFree ? (
                    <span className="text-2xl font-extrabold text-emerald-400">Free</span>
                  ) : (
                    <div className="text-center sm:text-right">
                      {upsellCourse.mrp > upsellCourse.price && (
                        <div className="text-xs text-white/40 line-through mb-0.5">
                          ₹ {upsellCourse.mrp?.toLocaleString()}
                        </div>
                      )}
                      <div className="text-2xl sm:text-3xl font-extrabold text-white">
                        ₹ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">{upsellCourse.price?.toLocaleString()}</span>
                      </div>
                      {upsellCourse.mrp > upsellCourse.price && (
                        <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                          Save ₹{(upsellCourse.mrp - upsellCourse.price).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    to={course.upsell?.targetType === 'test_series' ? `/test-series/${upsellCourse._id}` : course.upsell?.targetType === 'power_course' ? `/power-batch/${upsellCourse._id}` : `/courses/${upsellCourse._id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-brand-900/40 whitespace-nowrap"
                  >
                    {course.upsell?.targetType === 'test_series' ? 'View Test Series' : course.upsell?.targetType === 'power_course' ? 'View Power Batch' : 'View Course'} <ArrowRight size={15} />
                  </Link>

                  <p className="text-xs text-white/30 text-center">Trusted by 1000+ students</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}


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
