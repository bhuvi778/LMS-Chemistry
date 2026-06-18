import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  PlayCircle,
  FileText,
  ClipboardList,
  Info,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Award,
  Video,
  Calendar,
  ListChecks,
  ChevronRight,
  X,
  Send,
  Layers,
  Bell,
  BookOpen,
  Star,
  BookMarked,
} from 'lucide-react';
import SecureYTPlayer from '../components/SecureYTPlayer.jsx';
// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({ url, title }) {
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

  if (!url) return (
    <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
      <div className="text-center">
        <PlayCircle size={48} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">No video available</p>
      </div>
    </div>
  );

  let playerContent = null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) {
    playerContent = (
      <SecureYTPlayer url={url} title={title} />
    );
  } else if (url.includes('mediadelivery.net') || url.includes('bunny.net') || url.includes('bunny')) {
    playerContent = (
      <iframe
        className="w-full h-full"
        src={url}
        title={title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  } else {
    // Fallback direct video file
    playerContent = (
      <video className="w-full h-full" controls src={url} title={title}>
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black select-none">
      {playerContent}
      {renderWatermark()}
    </div>
  );
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────
function ClassesTab({ lessons }) {
  const [active, setActive] = useState(0);
  if (!lessons || lessons.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <PlayCircle size={40} className="mx-auto mb-3 opacity-30" />
        No video classes have been added yet. Check back soon!
      </div>
    );
  }
  const current = lessons[active];
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Player */}
      <div className="lg:col-span-2 space-y-4">
        <VideoPlayer url={current.videoUrl} title={current.title} />
        <div>
          <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
          {current.duration && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Clock size={14} /> {current.duration}
            </p>
          )}
          {current.notes && (
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{current.notes}</p>
          )}
        </div>
      </div>
      {/* Playlist */}
      <div className="space-y-2">
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-3">
          All Lessons ({lessons.length})
        </h3>
        {lessons.map((l, i) => (
          <button
            key={l._id || i}
            onClick={() => setActive(i)}
            className={`w-full text-left p-3 rounded-xl flex items-start gap-3 border transition ${
              i === active
                ? 'border-brand-400 bg-brand-50 text-brand-800'
                : 'border-slate-100 bg-white hover:border-brand-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-7 h-7 rounded-full grid place-items-center shrink-0 mt-0.5 text-xs font-bold ${
              i === active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold line-clamp-2">{l.title}</div>
              {l.duration && <div className="text-xs text-slate-400 mt-0.5">{l.duration}</div>}
            </div>
          </button>
        ))}
      </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
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
            <Loader2 size={32} className="animate-spin" />
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

// ─── PDF/Notes Tab ────────────────────────────────────────────────────────────
function PdfsTab({ pdfs, onViewPdf }) {
  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <FileText size={40} className="mx-auto mb-3 opacity-30" />
        No PDF/Notes have been uploaded yet. Check back soon!
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {pdfs.map((pdf) => (
        <div key={pdf._id} className="card p-5 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 grid place-items-center shrink-0">
            <FileText size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 line-clamp-2">{pdf.title}</div>
            {pdf.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{pdf.description}</p>
            )}
            {pdf.fileUrl ? (
              <button
                onClick={() => onViewPdf(pdf)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
              >
                <Download size={14} /> View PDF
              </button>
            ) : (
              <p className="mt-3 text-sm text-slate-400 italic">No file available</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tests Tab ────────────────────────────────────────────────────────────────
function TestsTab({ tests, courseId, myAttempts = [] }) {
  const getAttempt = (testId) => myAttempts.find((a) => a.test === testId || a.test?._id === testId);

  const DIFF_COLORS = {
    basic: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700',
  };

  if (!tests || tests.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
        No tests available yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {tests.map((t) => {
        const attempt = getAttempt(t._id);
        return (
          <div key={t._id} className="card p-5 hover:shadow-md transition flex flex-col justify-between">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 grid place-items-center shrink-0">
                <ClipboardList size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 mb-1">{t.title}</div>
                {t.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{t.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  {t.difficulty && (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[t.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                      {t.difficulty}
                    </span>
                  )}
                  {t.durationMins > 0 && (
                    <span className="text-slate-500">{t.durationMins} min</span>
                  )}
                  <span className="text-slate-500">• {t.questions?.length || 0} Qs</span>
                </div>
              </div>
            </div>
            {attempt ? (
              <div className="space-y-2">
                <div className={`text-sm font-semibold px-3 py-1.5 rounded-lg text-center ${
                  attempt.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' :
                  attempt.percentage >= 50 ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>
                  Last score: {attempt.percentage?.toFixed(1)}%
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/test-result/${attempt._id}`}
                    className="btn-outline flex-1 !py-2 text-xs text-center justify-center"
                  >
                    View Result
                  </Link>
                  <Link
                    to={`/take-test/${t._id}?courseId=${courseId}`}
                    className="btn-primary flex-1 !py-2 text-xs justify-center"
                  >
                    Retake
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                to={`/take-test/${t._id}?courseId=${courseId}`}
                className="btn-primary w-full justify-center !py-2 text-sm"
              >
                Start Test
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── E-Books Tab ─────────────────────────────────────────────────────────────
function EbooksTab({ courseId, onViewPdf }) {
  const [ebooks, setEbooks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ebooks')
      .then((r) => {
        const all = r.data?.ebooks || r.data || [];
        // Filter ebooks accessible to this student (hasAccess) 
        // and either no course restriction or linked to this course
        const filtered = all.filter((b) => b.hasAccess !== false);
        setEbooks(filtered);
      })
      .catch(() => setEbooks([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={28} /></div>;

  if (!ebooks || ebooks.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
        No E-Books available yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {ebooks.map((book) => (
        <div key={book._id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition">
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} className="w-full h-36 object-cover rounded-xl" />
          ) : (
            <div className="w-full h-36 rounded-xl bg-gradient-to-br from-brand-50 to-violet-100 flex items-center justify-center">
              <BookOpen size={40} className="text-brand-400 opacity-60" />
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 line-clamp-2">{book.title}</div>
            {book.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{book.description}</p>}
            {book.author && <p className="text-xs text-slate-400 mt-1">By {book.author}</p>}
          </div>
          {book.fileUrl ? (
            <button
              onClick={() => onViewPdf({ fileUrl: book.fileUrl, title: book.title })}
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 text-left"
            >
              <Download size={14} /> Download / Read
            </button>
          ) : (
            <p className="mt-auto text-sm text-slate-400 italic">File not available</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Reviews Tab (inside course) ─────────────────────────────────────────────
function ReviewsTab({ courseId, user }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [myReview, setMyReview] = useState(null);

  useEffect(() => {
    api.get(`/courses/${courseId}`)
      .then((r) => {
        setCourse(r.data);
        if (user && r.data.reviews?.length) {
          const existing = r.data.reviews.find(
            (rv) => rv.student?.toString() === user._id?.toString()
          );
          if (existing) setMyReview(existing);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, user]);

  const submitRating = async () => {
    if (!ratingVal) return;
    setRatingBusy(true);
    try {
      await api.post(`/courses/${courseId}/review`, {
        rating: ratingVal,
        comment: ratingComment.trim(),
      });
      setMyReview({ rating: ratingVal, comment: ratingComment.trim(), studentName: user?.name });
      const r = await api.get(`/courses/${courseId}`);
      setCourse(r.data);
    } catch (e) {
      toast.error(e.message || 'Could not submit review');
    } finally {
      setRatingBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={28} /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-6 flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="text-center sm:text-left shrink-0">
          <div className="text-4xl font-extrabold text-slate-900">{course?.rating || 4.8}</div>
          <div className="flex items-center justify-center sm:justify-start gap-0.5 text-amber-500 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(course?.rating || 4.8) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            Course Rating ({course?.reviews?.length || 0} reviews)
          </div>
        </div>
        {user ? (
          myReview ? (
            <div className="flex-1 w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center sm:text-left">
              <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Your Review Submitted
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-0.5 text-amber-500 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill={i < myReview.rating ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2 italic">"{myReview.comment || 'No comment'}"</p>
            </div>
          ) : (
            <div className="flex-1 w-full space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Share your experience</h3>
              <div className="flex items-center gap-1">
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
                      <Star size={20} fill={starValue <= (ratingHover || ratingVal) ? 'currentColor' : 'none'} />
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
                  {ratingBusy ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="text-xs text-slate-400 italic">Please login to rate this course.</div>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Student Reviews ({(course?.reviews || []).length})</h3>
        {(course?.reviews || []).length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-xs">No reviews yet. Be the first to share your feedback!</div>
        ) : (
          (course?.reviews || []).map((rev, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 text-xs">{rev.studentName || 'Student'}</div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={11} fill={idx < rev.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              {rev.comment && <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>}
              <div className="text-[10px] text-slate-400">
                {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Test Series Tab ──────────────────────────────────────────────────────────
function TestSeriesTab({ courseId, onViewPdf, onPlayVideo }) {
  const [series, setSeries] = useState([]);
  const [standaloneTests, setStandaloneTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // expanded series id

  useEffect(() => {
    api.get(`/tests/course/${courseId}`)
      .then((r) => {
        setSeries(r.data?.testSeries || []);
        setStandaloneTests(r.data?.standaloneTests || []);
      })
      .catch(() => {
        setSeries([]);
        setStandaloneTests([]);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={28} /></div>;
  }

  if (series.length === 0 && standaloneTests.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <ListChecks size={40} className="mx-auto mb-3 opacity-30" />
        No Test Series or Practice Tests assigned to this course yet.
      </div>
    );
  }

  const SUB_TYPE_LABELS = {
    full_test: 'Full Test',
    sectional: 'Sectional',
    chapter: 'Chapter',
    other: 'Other',
  };

  const SUB_TYPE_COLORS = {
    full_test: 'bg-violet-100 text-violet-700 border-violet-200',
    sectional: 'bg-sky-100 text-sky-700 border-sky-200',
    chapter: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    other: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const MAIN_TYPE_COLORS = {
    mock: 'bg-brand-100 text-brand-700',
    previous_year: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      {standaloneTests.length > 0 && (
        <div className="card border border-slate-100 shadow-soft p-5 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="text-brand-600" size={20} />
            <h3 className="font-extrabold text-slate-900 text-base">Practice Tests</h3>
          </div>
          <div className="space-y-3">
            {standaloneTests.map((t, idx) => {
              const testId = t._id;
              const testTitle = t.title || `Test ${idx + 1}`;
              return (
                <div key={testId || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/45 hover:bg-slate-50 hover:border-brand-200 transition">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold uppercase tracking-wider">
                          Practice Test
                        </span>
                        {t.difficulty && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            t.difficulty === 'advanced' ? 'bg-rose-100 text-rose-700' :
                            t.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {t.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 text-sm leading-snug">{testTitle}</div>
                      <div className="flex gap-3 text-[11px] text-slate-400 mt-1">
                        {t.durationMins > 0 && <span>⏱ {t.durationMins} min</span>}
                        {t.totalMarks > 0 && <span>• {t.totalMarks} marks</span>}
                      </div>
                    </div>
                    {testId && (
                      <Link
                        to={`/take-test/${testId}?courseId=${courseId}`}
                        className="btn-primary !py-2 !px-4 text-xs whitespace-nowrap shrink-0"
                      >
                        Start Test
                      </Link>
                    )}
                  </div>

                  {/* Test Files */}
                  {(t.pdfUrl || t.solutionPdfUrl || t.videoSolutionUrl) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      {t.pdfUrl && (
                        <button
                          onClick={() => onViewPdf({ fileUrl: t.pdfUrl, title: `${testTitle} Question Paper` })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 rounded-lg px-3 py-1.5 hover:bg-brand-100 transition"
                        >
                          <FileText size={12} /> Question Paper
                        </button>
                      )}
                      {t.solutionPdfUrl && (
                        <button
                          onClick={() => onViewPdf({ fileUrl: t.solutionPdfUrl, title: `${testTitle} Answer Key` })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition"
                        >
                          <FileText size={12} /> Answer Key
                        </button>
                      )}
                      {t.videoSolutionUrl && (
                        <button
                          onClick={() => onPlayVideo(t.videoSolutionUrl, `${testTitle} Video Solution`)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 bg-violet-50 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition"
                        >
                          <PlayCircle size={12} /> Video Solution
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {series.map((s) => {
        const isOpen = expanded === s._id;
        const testCount = s.tests?.length || 0;
        const subTypes = [...new Set((s.tests || []).map((t) => t.subType).filter(Boolean))];

        return (
          <div key={s._id} className="card overflow-hidden border border-slate-100 shadow-soft">
            {/* Series Header */}
            <button
              onClick={() => setExpanded(isOpen ? null : s._id)}
              className="w-full flex items-start justify-between gap-4 p-5 bg-slate-50/60 hover:bg-slate-50 transition text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">Test Series</span>
                  {s.examTags?.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{tag}</span>
                  ))}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{s.title}</h3>
                {s.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">{testCount} Tests</span>
                  {subTypes.map((st) => (
                    <span key={st} className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${SUB_TYPE_COLORS[st] || 'bg-slate-100 text-slate-600'}`}>
                      {SUB_TYPE_LABELS[st] || st}
                    </span>
                  ))}
                  {(s.categories?.length > 0) && (
                    <span className="text-[11px] text-slate-400">• {s.categories.join(', ')}</span>
                  )}
                  {(s.subCategories?.length > 0) && (
                    <span className="text-[11px] text-slate-400">| {s.subCategories.join(', ')}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className={`text-slate-400 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Expanded Content */}
            {isOpen && (
              <div className="p-5 space-y-6 border-t border-slate-100">
                {/* Syllabus Section */}
                {(s.syllabusText || s.syllabusFileUrl) && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                      <FileText size={15} className="text-amber-600" />
                      Test Syllabus
                    </h4>
                    {s.syllabusText && (
                      <p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed mb-3">{s.syllabusText}</p>
                    )}
                    {s.syllabusFileUrl && (
                      <button
                        onClick={() => onViewPdf({ fileUrl: s.syllabusFileUrl, title: `${s.title} Syllabus` })}
                        className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-900 bg-white border border-amber-200 rounded-lg px-3 py-1.5 hover:shadow transition"
                      >
                        <FileText size={13} /> View Syllabus PDF
                      </button>
                    )}
                  </div>
                )}

                {/* Tests grouped by sub-type */}
                {['full_test', 'sectional', 'chapter', 'other'].map((subType) => {
                  const group = (s.tests || []).filter((t) => t.subType === subType);
                  if (!group.length) return null;
                  return (
                    <div key={subType}>
                      <h5 className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 py-1 rounded-lg inline-block ${SUB_TYPE_COLORS[subType]}`}>
                        {SUB_TYPE_LABELS[subType]}
                      </h5>
                      <div className="space-y-3">
                        {group.map((testEntry, idx) => {
                          const t = testEntry.test || testEntry;
                          const testId = t._id || t;
                          const testTitle = t.title || `Test ${idx + 1}`;
                          return (
                            <div key={testId || idx} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-brand-200 transition">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${MAIN_TYPE_COLORS[testEntry.mainType] || 'bg-slate-100 text-slate-600'}`}>
                                      {testEntry.mainType === 'mock' ? 'Mock' : 'Prev. Year'}
                                    </span>
                                    {(testEntry.customTags || []).map((tag) => (
                                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">{tag}</span>
                                    ))}
                                  </div>
                                  <div className="font-bold text-slate-800 text-sm">{testTitle}</div>
                                  <div className="flex gap-3 text-[11px] text-slate-400 mt-0.5">
                                    {t.durationMins > 0 && <span>⏱ {t.durationMins} min</span>}
                                    {(t.questions?.length || 0) > 0 && <span>• {t.questions?.length} Qs</span>}
                                    {t.totalMarks > 0 && <span>• {t.totalMarks} marks</span>}
                                  </div>
                                </div>
                                {testId && (
                                  <Link
                                    to={`/take-test/${testId}?seriesId=${s._id}&courseId=${courseId}`}
                                    className="btn-primary !py-2 !px-4 text-xs whitespace-nowrap shrink-0"
                                  >
                                    Start Test
                                  </Link>
                                )}
                              </div>

                              {/* Test Files */}
                              {(t.pdfUrl || t.solutionPdfUrl || t.videoSolutionUrl) && (
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                                  {t.pdfUrl && (
                                    <button
                                      onClick={() => onViewPdf({ fileUrl: t.pdfUrl, title: `${testTitle} Question Paper` })}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 rounded-lg px-3 py-1.5 hover:bg-brand-100 transition"
                                    >
                                      <FileText size={12} /> Question Paper
                                    </button>
                                  )}
                                  {t.solutionPdfUrl && (
                                    <button
                                      onClick={() => onViewPdf({ fileUrl: t.solutionPdfUrl, title: `${testTitle} Answer Key` })}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition"
                                    >
                                      <FileText size={12} /> Answer Key
                                    </button>
                                  )}
                                  {t.videoSolutionUrl && (
                                    <button
                                      onClick={() => onPlayVideo(t.videoSolutionUrl, `${testTitle} Video Solution`)}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 bg-violet-50 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition"
                                    >
                                      <PlayCircle size={12} /> Video Solution
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Unclassified tests (no subType) */}
                {(s.tests || []).filter((t) => !t.subType).length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Tests</h5>
                    <div className="space-y-3">
                      {(s.tests || []).filter((t) => !t.subType).map((testEntry, idx) => {
                        const t = testEntry.test || testEntry;
                        const testId = t._id || t;
                        return (
                          <div key={testId || idx} className="p-4 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{t.title || `Test ${idx + 1}`}</div>
                              {t.durationMins > 0 && <div className="text-[11px] text-slate-400 mt-0.5">⏱ {t.durationMins} min</div>}
                            </div>
                            {testId && (
                              <Link to={`/take-test/${testId}?seriesId=${s._id}&courseId=${courseId}`} className="btn-primary !py-2 !px-3 text-xs whitespace-nowrap shrink-0">
                                Start Test
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────
function AboutTab({ course }) {
  return (
    <div className="max-w-3xl space-y-6">
      {course.description ? (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
      ) : (
        <p className="text-slate-700 leading-relaxed">{course.shortDescription}</p>
      )}

      {course.highlights?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 mb-3">Course Highlights</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {course.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle size={16} className="text-brand-600 mt-0.5 shrink-0" />
                {h}
              </div>
            ))}
          </div>
        </div>
      )}



      <div className="card p-5 grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500">Instructor</span>
          <div className="font-semibold text-slate-900 mt-0.5">{course.instructor || 'Faculty'}</div>
        </div>
        <div>
          <span className="text-slate-500">Language</span>
          <div className="font-semibold text-slate-900 mt-0.5">{course.language || 'Hindi + English'}</div>
        </div>
        <div>
          <span className="text-slate-500">Total Lessons</span>
          <div className="font-semibold text-slate-900 mt-0.5">{course.totalLessons || course.lessons?.length || 0}</div>
        </div>
        <div>
          <span className="text-slate-500">Category</span>
          <div className="font-semibold text-slate-900 mt-0.5">
            {(course.categories?.length ? course.categories : course.category ? [course.category] : []).join(', ') || '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Classes Tab ─────────────────────────────────────────────────────────
function LiveClassesTab({ liveClasses }) {
  const [activeSubTab, setActiveSubTab] = useState('today');

  if (!liveClasses || liveClasses.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <Video size={40} className="mx-auto mb-3 opacity-30" />
        No live classes scheduled for this course yet. Check back soon!
      </div>
    );
  }

  const now = new Date();
  const todayStr = now.toDateString();

  const todayClasses = [];
  const upcomingClasses = [];
  const pastClasses = [];

  liveClasses.forEach((lc) => {
    const scheduledDate = new Date(lc.scheduledAt);
    const isEnded = lc.status === 'ended';

    if (isEnded) {
      pastClasses.push(lc);
    } else if (scheduledDate.toDateString() === todayStr) {
      todayClasses.push(lc);
    } else if (scheduledDate > now) {
      upcomingClasses.push(lc);
    } else {
      pastClasses.push(lc);
    }
  });

  const activeClasses = activeSubTab === 'today'
    ? todayClasses
    : activeSubTab === 'upcoming'
    ? upcomingClasses
    : pastClasses;

  const subTabs = [
    { id: 'today', label: 'Today', count: todayClasses.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingClasses.length },
    { id: 'past', label: 'Past', count: pastClasses.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeSubTab === tab.id
              ? 'bg-slate-900 text-white shadow-soft'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeClasses.length === 0 ? (
        <div className="card p-10 text-center text-slate-500 border border-slate-100">
          <Video size={36} className="mx-auto mb-3 opacity-30 text-slate-400" />
          No {activeSubTab} live classes found.
        </div>
      ) : (
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 ${activeSubTab === 'past' ? 'opacity-75' : ''}`}>
          {activeClasses.map((lc) => {
            const isLive = lc.status === 'live';
            const isPast = lc.status === 'ended';
            return (
              <div key={lc._id} className="card overflow-hidden">
                <div className={`p-4 text-white ${isLive
                  ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                  : isPast
                  ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                  : 'bg-gradient-to-br from-brand-500 to-violet-600'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    {isLive ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
                        LIVE NOW
                      </span>
                    ) : isPast ? (
                      <span className="text-[10px] opacity-70 font-bold uppercase bg-white/10 px-2 py-0.5 rounded-full">Ended</span>
                    ) : (
                      <span className="text-[10px] opacity-70 font-bold uppercase bg-white/10 px-2 py-0.5 rounded-full">Upcoming</span>
                    )}
                    <span className="text-[9px] font-extrabold bg-white/25 text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                      {lc.platform === 'internal' ? 'In-App Room' : 
                       lc.platform === 'agora_call' ? 'Agora Call' : 
                       lc.platform === 'agora_stream' ? 'Agora Stream (Legacy)' : 
                       lc.platform === 'agora_interactive' ? 'Agora Interactive' : 
                       lc.platform === 'agora_broadcast' ? 'Agora Broadcast' : 
                       lc.platform === 'youtube' ? 'YouTube Live' : 
                       lc.platform || (lc.useInternalRoom ? 'In-App Room' : 'External')}
                    </span>
                  </div>
                  <h3 className="font-bold text-base leading-snug mt-1">{lc.title}</h3>
                  <p className="text-xs opacity-80 mt-0.5">By {lc.instructor}</p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="shrink-0 text-slate-400" />
                    {new Date(lc.scheduledAt).toLocaleString('en-AE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={14} className="shrink-0 text-slate-400" />
                    {lc.durationMins} minutes
                  </div>
                  {lc.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{lc.description}</p>
                  )}
                  {!isPast && (
                    <div className="pt-2">
                      {['internal', 'agora_call', 'agora_stream', 'youtube'].includes(lc.platform || (lc.useInternalRoom ? 'internal' : 'meet')) ? (
                        <Link
                          to={`/live/${lc._id}`}
                          className={`btn-primary w-full justify-center !py-2 text-sm ${isLive ? '!bg-rose-600 hover:!bg-rose-700' : ''}`}
                        >
                          <Video size={14} />
                          {isLive ? 'Join Now' : 'Open Room'}
                        </Link>
                      ) : (lc.meetLink || lc.meetingUrl) ? (
                        <a
                          href={lc.meetLink || lc.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary w-full justify-center !py-2 text-sm"
                        >
                          <ExternalLink size={14} /> Join Class
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Video Modal ─────────────────────────────────────────────────────────────
function VideoModal({ url, title, onClose }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 text-white">
          <h3 className="font-bold text-sm line-clamp-1 pr-4">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 grid place-items-center transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-2 bg-black">
          <VideoPlayer url={url} title={title} />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Subjects Tab ─────────────────────────────────────────────────────────────
function SubjectsTab({ subjects, myAttempts, courseId, onPlayVideo, onViewPdf }) {
  const [activeSubjectId, setActiveSubjectId] = useState(subjects[0]?._id || null);
  const [expandedChapters, setExpandedChapters] = useState({});

  useEffect(() => {
    if (subjects.length > 0 && !activeSubjectId) {
      setActiveSubjectId(subjects[0]._id);
    }
  }, [subjects, activeSubjectId]);

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const getAttempt = (testId) => {
    return myAttempts.find((a) => a.test === testId || a.test?._id === testId);
  };

  if (!subjects || subjects.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <ListChecks size={40} className="mx-auto mb-3 opacity-30" />
        No subjects have been added to this course yet.
      </div>
    );
  }

  const activeSubject = subjects.find((s) => s._id === activeSubjectId) || subjects[0];

  return (
    <div className="grid lg:grid-cols-[250px,1fr] gap-6">
      {/* Subject Selector Left Panel */}
      <div className="space-y-1">
        <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider px-3 mb-2">Subjects</h3>
        {subjects.map((sub) => {
          const isActive = sub._id === activeSubjectId;
          return (
            <button
              key={sub._id}
              onClick={() => {
                setActiveSubjectId(sub._id);
                setExpandedChapters({});
              }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {sub.name}
            </button>
          );
        })}
      </div>

      {/* Chapters & Content Right Panel */}
      <div className="space-y-4">
        {!activeSubject?.chapters?.length ? (
          <div className="card p-8 text-center text-slate-400 italic">
            No chapters added for this subject yet.
          </div>
        ) : (
          activeSubject.chapters.map((ch, chIdx) => {
            const isExpanded = expandedChapters[ch._id] || false;
            
            // Count total items
            const videoCount = ch.videoClasses?.length || 0;
            const classNotesCount = ch.classNotes?.length || 0;
            const studyMaterialCount = ch.studyMaterials?.length || 0;
            const testsCount = ch.tests?.length || 0;
            const dppsCount = (ch.dpps?.length || 0) + (ch.dppPdfs?.length || 0) + (ch.dppVideos?.length || 0);
            const pyqsCount = ch.pyqs?.length || 0;
            const totalItems = videoCount + classNotesCount + studyMaterialCount + testsCount + dppsCount + pyqsCount;

            return (
              <div key={ch._id} className="card overflow-hidden border border-slate-100 shadow-soft">
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(ch._id)}
                  className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition text-left"
                >
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">
                      Chapter {chIdx + 1}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug mt-0.5">
                      {ch.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                      {videoCount > 0 && <span>🎥 {videoCount} Lectures</span>}
                      {classNotesCount > 0 && <span>📓 {classNotesCount} Notes</span>}
                      {studyMaterialCount > 0 && <span>📚 {studyMaterialCount} Study Material</span>}
                      {testsCount > 0 && <span>📝 {testsCount} Tests</span>}
                      {dppsCount > 0 && <span>📄 {dppsCount} DPPs</span>}
                      {pyqsCount > 0 && <span>❓ {pyqsCount} PYQs</span>}
                      {totalItems === 0 && <span>No content items yet</span>}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Chapter Content Accordion */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-6">
                    {/* 🎥 Video Lectures */}
                    {ch.videoClasses?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <PlayCircle size={14} className="text-brand-600" /> Video Lectures
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {ch.videoClasses.map((item, idx) => (
                            <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-brand-200 transition flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                                <PlayCircle size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                {item.duration && <div className="text-xs text-slate-400 mt-0.5">🕒 {item.duration}</div>}
                                {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                                <button
                                  onClick={() => onPlayVideo(item.videoUrl, item.title)}
                                  className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
                                >
                                  Watch Lecture →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 📓 Class Notes */}
                    {ch.classNotes?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <FileText size={14} className="text-emerald-600" /> Class Notes
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {ch.classNotes.map((item, idx) => (
                            <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 transition flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <FileText size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
                                <button
                                  onClick={() => onViewPdf(item)}
                                  className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                                >
                                  View Notes →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 📚 Study Material */}
                    {ch.studyMaterials?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <FileText size={14} className="text-sky-600" /> Study Material
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {ch.studyMaterials.map((item, idx) => (
                            <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-sky-200 transition flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                <FileText size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
                                <button
                                  onClick={() => onViewPdf(item)}
                                  className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
                                >
                                  View Material →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 📝 Chapter MCQ Tests */}
                    {ch.tests?.length > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <ClipboardList size={14} className="text-violet-600" /> Mock Test
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {ch.tests.map((item, idx) => {
                            const attempt = getAttempt(item.testId);
                            return (
                              <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-violet-200 transition flex flex-col justify-between">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <ClipboardList size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                                      <span>⏱️ {item.durationMins} min</span>
                                      <span>•</span>
                                      <span>❓ {item.questionCount} Qs</span>
                                    </div>
                                    {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                                  </div>
                                </div>
                                {attempt ? (
                                  <div className="space-y-2">
                                    <div className={`text-xs font-bold py-1.5 px-3 rounded-lg text-center ${
                                      attempt.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                      attempt.percentage >= 50 ? 'bg-amber-50 text-amber-700' :
                                      'bg-rose-50 text-rose-700'
                                    }`}>
                                      Score: {attempt.percentage?.toFixed(1)}% ({attempt.scored}/{attempt.totalMarks} marks)
                                    </div>
                                    <div className="flex gap-2">
                                      <Link
                                        to={`/test-result/${attempt._id}`}
                                        className="btn-outline flex-1 !py-1.5 text-[11px] text-center justify-center font-bold"
                                      >
                                        Result
                                      </Link>
                                      <Link
                                        to={`/take-test/${item.testId}?courseId=${courseId}`}
                                        className="btn-primary flex-1 !py-1.5 text-[11px] justify-center font-bold"
                                      >
                                        Retake
                                      </Link>
                                    </div>
                                  </div>
                                ) : (
                                  <Link
                                    to={`/take-test/${item.testId}?courseId=${courseId}`}
                                    className="btn-primary w-full justify-center !py-1.5 text-[11px] font-bold text-center block"
                                  >
                                    Start Test
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 📄 Daily Practice Problems (DPPs) */}
                    {dppsCount > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <ClipboardList size={14} className="text-indigo-600" /> Daily Practice Problems (DPP)
                        </h5>
                        <div className="space-y-3">
                          {/* DPP Online Tests */}
                          {ch.dpps?.length > 0 && (
                            <div className="grid sm:grid-cols-2 gap-3">
                              {ch.dpps.map((item, idx) => {
                                const attempt = getAttempt(item.testId);
                                return (
                                  <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition flex flex-col justify-between">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                        <ClipboardList size={18} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                                          <span>⏱️ {item.durationMins} min</span>
                                          <span>•</span>
                                          <span>❓ {item.questionCount} Qs</span>
                                        </div>
                                        {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                                      </div>
                                    </div>
                                    {attempt ? (
                                      <div className="space-y-2">
                                        <div className={`text-xs font-bold py-1.5 px-3 rounded-lg text-center ${
                                          attempt.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                          attempt.percentage >= 50 ? 'bg-amber-50 text-amber-700' :
                                          'bg-rose-50 text-rose-700'
                                        }`}>
                                          Score: {attempt.percentage?.toFixed(1)}% ({attempt.scored}/{attempt.totalMarks} marks)
                                        </div>
                                        <div className="flex gap-2">
                                          <Link
                                            to={`/test-result/${attempt._id}`}
                                            className="btn-outline flex-1 !py-1.5 text-[11px] text-center justify-center font-bold"
                                          >
                                            Result
                                          </Link>
                                          <Link
                                            to={`/take-test/${item.testId}?courseId=${courseId}`}
                                            className="btn-primary flex-1 !py-1.5 text-[11px] justify-center font-bold"
                                          >
                                            Retake
                                          </Link>
                                        </div>
                                      </div>
                                    ) : (
                                      <Link
                                        to={`/take-test/${item.testId}?courseId=${courseId}`}
                                        className="btn-primary w-full justify-center !py-1.5 text-[11px] font-bold text-center block"
                                      >
                                        Start DPP Test
                                      </Link>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* DPP PDFs & Solutions */}
                          {((ch.dppPdfs?.length || 0) + (ch.dppVideos?.length || 0)) > 0 && (
                            <div className="grid sm:grid-cols-2 gap-3">
                              {ch.dppPdfs?.map((item, idx) => (
                                <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <FileText size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                    {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
                                    <button
                                      onClick={() => onViewPdf(item)}
                                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
                                    >
                                      View DPP PDF →
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {ch.dppVideos?.map((item, idx) => (
                                <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <PlayCircle size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                    {item.duration && <div className="text-xs text-slate-400 mt-0.5">🕒 {item.duration}</div>}
                                    {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                                    <button
                                      onClick={() => onPlayVideo(item.videoUrl, item.title)}
                                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
                                    >
                                      Watch Solution →
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 📚 Previous Year Questions (PYQs) */}
                    {pyqsCount > 0 && (
                      <div className="mt-4">
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <BookOpen size={14} className="text-amber-600" /> Previous Year Questions (PYQ)
                        </h5>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {ch.pyqs?.map((item, idx) => {
                            const attempt = getAttempt(item.testId);
                            return (
                              <div key={item._id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-amber-200 transition flex flex-col justify-between">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <BookOpen size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate">{item.title}</div>
                                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                                      <span>⏱️ {item.durationMins} min</span>
                                      <span>•</span>
                                      <span>❓ {item.questionCount} Qs</span>
                                    </div>
                                    {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                                  </div>
                                </div>
                                {attempt ? (
                                  <div className="space-y-2">
                                    <div className={`text-xs font-bold py-1.5 px-3 rounded-lg text-center ${
                                      attempt.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                      attempt.percentage >= 50 ? 'bg-amber-50 text-amber-700' :
                                      'bg-rose-50 text-rose-700'
                                    }`}>
                                      Score: {attempt.percentage?.toFixed(1)}% ({attempt.scored}/{attempt.totalMarks} marks)
                                    </div>
                                    <div className="flex gap-2">
                                      <Link
                                        to={`/test-result/${attempt._id}`}
                                        className="btn-outline flex-1 !py-1.5 text-[11px] text-center justify-center font-bold"
                                      >
                                        Result
                                      </Link>
                                      <Link
                                        to={`/take-test/${item.testId}?courseId=${courseId}`}
                                        className="btn-primary flex-1 !py-1.5 text-[11px] justify-center font-bold"
                                      >
                                        Retake
                                      </Link>
                                    </div>
                                  </div>
                                ) : (
                                  <Link
                                    to={`/take-test/${item.testId}?courseId=${courseId}`}
                                    className="btn-primary w-full justify-center !py-1.5 text-[11px] font-bold text-center block"
                                  >
                                    Start PYQ Test
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab({ announcements, readAnnouncements = [], onToggleRead }) {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <Bell size={40} className="mx-auto mb-3 opacity-30" />
        No announcements have been posted for this course yet.
      </div>
    );
  }

  const sorted = [...announcements].reverse();

  return (
    <div className="space-y-4 max-w-3xl">
      {sorted.map((ann, idx) => {
        const isRead = readAnnouncements.includes(ann._id);
        return (
          <div
            key={ann._id || idx}
            className={`card p-5 border shadow-soft bg-white animate-fade-in transition-all duration-300 relative ${
              isRead ? 'border-slate-100 opacity-90' : 'border-slate-200 border-l-4 border-l-brand-600 ring-1 ring-brand-100/50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isRead ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'
                }`}>
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug">{ann.title}</h4>
                    {!isRead && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-extrabold uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(ann.createdAt).toLocaleString('en-AE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              
              <label className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none px-2.5 py-1.5 rounded-lg border transition shrink-0 ${
                isRead 
                  ? 'text-slate-400 bg-slate-50 border-slate-150 hover:bg-slate-100/80 hover:text-slate-500' 
                  : 'text-brand-700 bg-brand-50/50 border-brand-100 hover:bg-brand-50 hover:border-brand-200 shadow-sm'
              }`}>
                <input
                  type="checkbox"
                  checked={isRead}
                  onChange={(e) => onToggleRead(ann._id, e.target.checked)}
                  className="w-3.5 h-3.5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
                <span>{isRead ? 'Read' : 'Mark as read'}</span>
              </label>
            </div>
            <div className={`text-sm mt-3 whitespace-pre-line leading-relaxed pl-0 sm:pl-13 ${
              isRead ? 'text-slate-500 font-medium' : 'text-slate-700 font-semibold'
            }`}>
              {ann.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LearnCourse() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('announcements');
  const [subjects, setSubjects] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [openPdf, setOpenPdf] = useState(null);

  const handleToggleRead = async (announcementId, isRead) => {
    try {
      const response = await api.post(`/course-content/learn/${courseId}/announcements/${announcementId}/read`, { read: isRead });
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          enrollment: {
            ...prev.enrollment,
            readAnnouncements: response.data.readAnnouncements,
          }
        };
      });
      toast.success(isRead ? 'Marked as read' : 'Marked as unread');
    } catch (err) {
      toast.error('Failed to update read status');
    }
  };

  useEffect(() => {
    if (!user) {
      nav('/login', { state: { from: `/student/learn/${courseId}` } });
      return;
    }
    setLoading(true);

    // Core content load
    api.get(`/course-content/learn/${courseId}`)
      .then((r) => {
        setData(r.data);
      })
      .catch((e) => {
        if (e.response?.status === 403) {
          toast.error('You are not enrolled in this course.');
          nav('/student/dashboard');
        } else {
          toast.error('Failed to load course content.');
          nav('/student/dashboard');
        }
      })
      .finally(() => setLoading(false));

    // Subjects load
    api.get(`/subjects/${courseId}`)
      .then((r) => setSubjects(r.data.subjects || []))
      .catch((e) => console.error('Failed to load subjects', e));

    // Attempts load
    api.get('/tests/attempts/me')
      .then((r) => setMyAttempts(r.data || []))
      .catch((e) => console.error('Failed to load attempts', e));
  }, [courseId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (!data) return null;

  const { course, pdfs, tests, liveClasses = [], enrollment } = data;
  const lessons = course.lessons || [];
  const planType = enrollment?.planType || 'batch';

  const tabs = [
    { k: 'announcements', l: `Announcements${course.announcements?.length ? ` (${course.announcements.length})` : ''}`, icon: Bell },
    { k: 'subjects', l: 'All Classes', icon: Layers },
    ...(course.courseType === 'live' || liveClasses.length > 0 ? [
      { k: 'live', l: `${planType === 'batch' ? '🔒 ' : ''}Live Classes${liveClasses.length ? ` (${liveClasses.length})` : ''}`, icon: Video }
    ] : []),
    { k: 'timetable', l: 'Time Table', icon: Calendar },
    { k: 'syllabus', l: 'Syllabus', icon: BookMarked },
    { k: 'test-series', l: 'Test Series', icon: ListChecks },
    { k: 'ebooks', l: 'E-Books', icon: BookOpen },
    { k: 'about', l: 'About', icon: Info },
    { k: 'reviews', l: 'Reviews & Ratings', icon: Star },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-soft border-b border-slate-200 py-6">
        <div className="container-x">
          <Link to="/student/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 mb-3">
            <ChevronLeft size={16} /> My Dashboard
          </Link>
          <div className="flex items-start gap-4">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-20 h-14 object-cover rounded-xl shrink-0 hidden sm:block"
              />
            )}
             <div className="flex-grow">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {course.title}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{course.shortDescription}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  planType === 'infinity' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  planType === 'pro' ? 'bg-violet-100 text-violet-800 border border-violet-200' :
                  'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  Plan: Ace {planType}
                </span>
                {planType !== 'infinity' && (
                  <Link
                    to={`/courses/${course.slug || course._id}`}
                    className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5 ml-1"
                  >
                    Upgrade Prep Plan →
                  </Link>
                )}
              </div>
            </div>
            {course.telegramJoinLink && (
              <a
                href={course.telegramJoinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all duration-200 shrink-0 self-center"
              >
                <Send size={14} /> Join Telegram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="container-x">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-[2px] transition ${
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
        </div>
      </div>

      {/* Tab Content */}
      <div className="container-x py-8">
        {course.telegramJoinLink && (
          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
              <div className="w-12 h-12 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                <Send size={22} className="relative left-[-1px]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">Batch Discussion Group</h4>
                <p className="text-xs text-slate-500 mt-0.5">Join our official Telegram community to ask doubts and clear concepts.</p>
              </div>
            </div>
            <a
              href={course.telegramJoinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition whitespace-nowrap"
            >
              Join Group Now
            </a>
          </div>
        )}
        {tab === 'subjects' && (
          <SubjectsTab
            subjects={subjects}
            myAttempts={myAttempts}
            courseId={courseId}
            onPlayVideo={(url, title) => setActiveVideo({ url, title })}
            onViewPdf={(pdf) => setOpenPdf(pdf)}
          />
        )}
        {tab === 'live' && (
          planType === 'batch' ? (
            <div className="max-w-md mx-auto text-center py-16 px-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
              <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4 border border-violet-100 shadow-inner">
                <Video size={28} className="animate-pulse" />
              </div>
              <h3 className="font-display text-lg font-extrabold text-slate-800">Live Classes Locked</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Live interactive classes are exclusive benefits of our <strong>Ace Pro</strong> and <strong>Ace Infinity</strong> cohorts. Upgrade your subscription to unlock schedule-based classes with live Q&A.
              </p>
              <Link
                to={`/courses/${course.slug || course._id}`}
                className="btn-primary inline-flex justify-center mt-6 text-xs font-bold px-5 py-2.5"
              >
                Upgrade Prep Plan
              </Link>
            </div>
          ) : (
            <LiveClassesTab liveClasses={liveClasses} />
          )
        )}
        {tab === 'test-series' && (
          <TestSeriesTab
            courseId={courseId}
            onViewPdf={(pdf) => setOpenPdf(pdf)}
            onPlayVideo={(url, title) => setActiveVideo({ url, title })}
          />
        )}
        {tab === 'ebooks' && <EbooksTab courseId={courseId} onViewPdf={(pdf) => setOpenPdf(pdf)} />}
        {tab === 'timetable' && (
          <div className="max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
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
                    <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{slot.subject}</div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {slot.timeFrom} – {slot.timeTo}
                        </div>
                        <div className="text-xs text-brand-600 font-bold mt-1.5 uppercase tracking-wider">{slot.days}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {tab === 'syllabus' && (
          <div className="max-w-3xl bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Course Syllabus</h2>
            {course.syllabus?.length > 0 ? (
              <div className="space-y-4">
                {course.syllabus.map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex gap-4 hover:shadow-md transition-shadow">
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
                        <div className="mt-3">
                          <button
                            onClick={() => setOpenPdf({ fileUrl: item.pdfUrl, title: item.title || 'Syllabus PDF' })}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-650 hover:text-brand-800 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                          >
                            <span>📄 View Syllabus PDF</span>
                          </button>
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
        {tab === 'about' && <AboutTab course={course} />}
        {tab === 'announcements' && (
          <AnnouncementsTab
            announcements={course.announcements}
            readAnnouncements={enrollment?.readAnnouncements || []}
            onToggleRead={handleToggleRead}
          />
        )}
        {tab === 'reviews' && <ReviewsTab courseId={courseId} user={user} />}
      </div>

      {openPdf && <PdfModal pdf={openPdf} onClose={() => setOpenPdf(null)} />}
      {activeVideo && <VideoModal url={activeVideo.url} title={activeVideo.title} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
