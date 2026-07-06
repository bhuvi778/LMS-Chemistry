import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import SecureYTPlayer from '../components/SecureYTPlayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function SecureVideoPlayer({ url, title }) {
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
        <Video size={48} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">No video available</p>
      </div>
    </div>
  );

  let playerContent = null;

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
    playerContent = (
      <video
        className="w-full h-full object-contain"
        controls
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        src={url}
        title={title}
      >
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black select-none">
      {playerContent}
      {renderWatermark()}
    </div>
  );
}
import {
  CheckCircle,
  XCircle,
  Minus,
  Clock,
  Star,
  Trophy,
  BarChart2,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Repeat,
  ClipboardList,
  Share2,
  Download,
  Award,
  Zap,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';

function resolveEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  let absUrl = rawUrl;
  if (rawUrl.startsWith('/')) {
    absUrl = window.location.origin + rawUrl;
  }
  const driveFile = absUrl.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
  const driveOpen = absUrl.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpen) return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;
  const docsMatch = absUrl.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/);
  if (docsMatch) return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview`;
  if (absUrl.toLowerCase().includes('.pdf')) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return rawUrl;
    }
    return `https://docs.google.com/viewer?url=${encodeURIComponent(absUrl)}&embedded=true`;
  }
  return rawUrl;
}

function PdfModal({ pdf, onClose }) {
  const embedUrl = resolveEmbedUrl(pdf.fileUrl);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 pr-4">{pdf.title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 grid place-items-center transition shrink-0">
            <X size={16} />
          </button>
        </div>
        <iframe className="w-full rounded-b-2xl" style={{ height: '80vh' }} src={embedUrl} title={pdf.title} allow="fullscreen" />
      </div>
    </div>,
    document.body
  );
}

function ScoreGauge({ percentage }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" className="rotate-[-90deg]">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-800">{percentage}%</span>
        <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Score</span>
      </div>
    </div>
  );
}

function QuestionReview({ question, answer }) {
  const [open, setOpen] = useState(false);
  const optText = (opt) => (typeof opt === 'string' ? opt : opt?.text || '');

  const qType = question.type || 'mcq';
  
  const status =
    answer?.selected === -1 ||
    answer?.selected === null ||
    answer?.selected === undefined ||
    answer?.selected === '' ||
    (Array.isArray(answer?.selected) && answer?.selected.length === 0)
      ? 'unattempted'
      : answer?.isCorrect
      ? 'correct'
      : 'wrong';

  const statusStyle = {
    correct: { icon: <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />, border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
    wrong: { icon: <XCircle size={16} className="text-red-500 flex-shrink-0" />, border: 'border-red-200', bg: 'bg-red-50/50' },
    unattempted: { icon: <Minus size={16} className="text-slate-400 flex-shrink-0" />, border: 'border-slate-200', bg: 'bg-slate-50/50' },
  }[status];

  return (
    <div className={`rounded-xl border ${statusStyle.border} ${statusStyle.bg} overflow-hidden transition-all duration-200`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        {statusStyle.icon}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-700 font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: question.question }} />
          {(question.chapter || question.topic) && (
            <div className="flex flex-wrap gap-1.5 mt-2 select-none">
              {question.chapter && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📂 {question.chapter}
                </span>
              )}
              {question.topic && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-700 bg-violet-50/80 border border-violet-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🏷️ {question.topic}
                </span>
              )}
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5 bg-white px-2 py-0.5 rounded border border-slate-200">
          {answer?.marksAwarded > 0 ? `+${answer.marksAwarded}` : answer?.marksAwarded || 0} marks
        </span>
        {open ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-100/50 pt-3 bg-white">
          {qType === 'numerical' ? (
            <div className="p-3.5 rounded-xl border border-slate-100 space-y-2">
              <div className="text-sm font-semibold text-slate-700">
                Your Answer: <span className="font-extrabold text-brand-600">{answer?.selected === -1 || answer?.selected === '' ? 'Skipped' : answer?.selected}</span>
              </div>
              <div className="text-sm font-semibold text-emerald-700">
                Correct Answer: <span className="font-extrabold">{question.correctNumerical}</span>
              </div>
            </div>
          ) : (
            (question.options || []).map((opt, oi) => {
              const isCorrect = qType === 'msq'
                ? (question.correctOptions || []).includes(oi)
                : oi === question.correct;
              const isSelected = qType === 'msq'
                ? (Array.isArray(answer?.selected) ? answer?.selected : []).includes(oi)
                : oi === answer?.selected;

              return (
                <div
                  key={oi}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                      : isSelected
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}
                >
                  <span className={`w-5.5 h-5.5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isCorrect ? 'bg-emerald-600 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="flex-1 font-medium" dangerouslySetInnerHTML={{ __html: optText(opt) }} />
                  {isCorrect && <CheckCircle size={14} className="text-emerald-600" />}
                  {isSelected && !isCorrect && <XCircle size={14} className="text-red-500" />}
                </div>
              );
            })
          )}
          {question.explanation && (
            <div className="mt-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed shadow-sm">
              <strong className="font-bold text-blue-900 block mb-0.5">Explanation: </strong>
              <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
            </div>
          )}
          {question.videoSolutionUrl && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-inner">
              <strong className="text-xs font-bold text-slate-600 uppercase block mb-1">Question Video Solution:</strong>
              <SecureVideoPlayer url={question.videoSolutionUrl} title="Question Video Solution" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPdf, setOpenPdf] = useState(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('all');
  const [myAttempts, setMyAttempts] = useState([]);

  useEffect(() => {
    api.get(`/tests/attempts/${attemptId}`)
      .then(({ data }) => {
        setAttempt(data);
        // Also fetch all attempts for this test to check if retake is allowed
        return api.get('/tests/attempts/me');
      })
      .then(({ data }) => setMyAttempts(data || []))
      .catch((err) => toast.error(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold text-sm">Analyzing test results...</p>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const test = attempt.test;
  const mins = Math.floor(attempt.timeTakenSecs / 60);
  const secs = attempt.timeTakenSecs % 60;
  const passed = attempt.percentage >= (test?.passMarks > 0 ? Math.round((test.passMarks / test.totalMarks) * 100) : 40);

  // Result Analytics calculations
  const totalAttempted = attempt.correct + attempt.wrong;
  const accuracy = totalAttempted > 0 ? Math.round((attempt.correct / totalAttempted) * 100) : 0;
  const avgTimePerQuestion = test?.questions?.length > 0 
    ? Math.round(attempt.timeTakenSecs / test.questions.length) 
    : 0;

  // Chapter & Topic Analysis calculations
  const chapterAnalysis = {};
  let hasChaptersOrTopics = false;

  (test?.questions || []).forEach((q) => {
    const chapter = (q.chapter || '').trim();
    const topic = (q.topic || '').trim();
    
    if (chapter || topic) {
      hasChaptersOrTopics = true;
    }

    const chapKey = chapter || 'General / Uncategorized';
    const topKey = topic || 'General / Uncategorized';

    const ans = attempt.answers.find(
      (a) => a.questionId?.toString() === q._id?.toString()
    );
    const isCorrect = ans ? ans.isCorrect : false;
    const isAttempted = ans && ans.selected !== -1 && ans.selected !== null && ans.selected !== undefined && ans.selected !== '';

    if (!chapterAnalysis[chapKey]) {
      chapterAnalysis[chapKey] = {
        name: chapKey,
        total: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        topics: {}
      };
    }

    chapterAnalysis[chapKey].total++;
    if (isCorrect) {
      chapterAnalysis[chapKey].correct++;
    } else if (isAttempted) {
      chapterAnalysis[chapKey].wrong++;
    } else {
      chapterAnalysis[chapKey].unattempted++;
    }

    if (!chapterAnalysis[chapKey].topics[topKey]) {
      chapterAnalysis[chapKey].topics[topKey] = {
        name: topKey,
        total: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0
      };
    }

    chapterAnalysis[chapKey].topics[topKey].total++;
    if (isCorrect) {
      chapterAnalysis[chapKey].topics[topKey].correct++;
    } else if (isAttempted) {
      chapterAnalysis[chapKey].topics[topKey].wrong++;
    } else {
      chapterAnalysis[chapKey].topics[topKey].unattempted++;
    }
  });

  const chapterList = Object.values(chapterAnalysis).map((chap) => {
    const attempted = chap.correct + chap.wrong;
    const accuracy = attempted > 0 ? Math.round((chap.correct / attempted) * 100) : 0;
    const successRate = Math.round((chap.correct / chap.total) * 100);
    
    let status = 'neutral';
    if (successRate >= 70) {
      status = 'strong';
    } else if (successRate < 40) {
      status = 'weak';
    }

    const topics = Object.values(chap.topics).map((t) => {
      const tAttempted = t.correct + t.wrong;
      const tAccuracy = tAttempted > 0 ? Math.round((t.correct / tAttempted) * 100) : 0;
      const tSuccessRate = Math.round((t.correct / t.total) * 100);
      let tStatus = 'neutral';
      if (tSuccessRate >= 70) {
        tStatus = 'strong';
      } else if (tSuccessRate < 40) {
        tStatus = 'weak';
      }
      return { ...t, accuracy: tAccuracy, successRate: tSuccessRate, status: tStatus };
    });

    return {
      ...chap,
      attempted,
      accuracy,
      successRate,
      status,
      topics
    };
  });

  const strongChapters = chapterList.filter(c => c.status === 'strong');
  const weakChapters = chapterList.filter(c => c.status === 'weak');

  // Handle Scorecard Download via Print Layout
  const handlePrintScorecard = () => {
    window.print();
  };

  // Handle Sharing
  const handleShareResult = async () => {
    const shareData = {
      title: `${test?.title} Result - Ace2Examz`,
      text: `I scored ${attempt.scored}/${attempt.totalMarks} (${attempt.percentage}%) in the ${test?.title} exam! Check out my scorecard.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Scorecard shared successfully!');
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Report Card link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 relative">
      
      {/* Print Scorecard Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible;
          }
          #printable-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 30px;
          }
        }
      `}} />

      <div className="container-x max-w-3xl">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/tests" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-semibold transition">
            <ArrowLeft size={16} /> Back to Tests
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handlePrintScorecard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Download size={13} /> Download Report Card
            </button>
            <button
              onClick={handleShareResult}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition border border-brand-100 shadow-sm"
            >
              <Share2 size={13} /> Share Scorecard
            </button>
          </div>
        </div>

        {/* ─── Result Card (Main Score Breakdown) ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent pointer-events-none" />
          
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4 shadow-sm ${
              passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {passed ? <><Trophy size={15} /> Passed!</> : <><XCircle size={15} /> Not Passed</>}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{test?.title}</h1>
            <p className="text-slate-400 text-xs font-medium">
              Submitted on {new Date(attempt.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <ScoreGauge percentage={attempt.percentage} />

          <div className="grid grid-cols-4 gap-3 md:gap-4 mt-8">
            <div className="text-center bg-emerald-50/60 rounded-xl p-4 border border-emerald-100/50">
              <div className="text-2xl font-black text-emerald-700">{attempt.correct}</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Correct</div>
            </div>
            <div className="text-center bg-red-50/60 rounded-xl p-4 border border-red-100/50">
              <div className="text-2xl font-black text-red-600">{attempt.wrong}</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Wrong</div>
            </div>
            <div className="text-center bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl font-black text-slate-600">{attempt.unattempted}</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Skipped</div>
            </div>
            <div className="text-center bg-blue-50/60 rounded-xl p-4 border border-blue-100/50">
              <div className="text-2xl font-black text-blue-700">{attempt.scored}</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">Marks / {attempt.totalMarks}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-sm text-slate-500 border-t border-slate-100 pt-6 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              Time: {mins}m {secs}s
            </span>
            <span className="flex items-center gap-1.5">
              <ClipboardList size={14} className="text-slate-400" />
              {test?.questions?.length || 0} Questions
            </span>
            {test?.pdfUrl && (
              <button
                onClick={() => setOpenPdf({ fileUrl: test.pdfUrl, title: `${test.title} - Question Paper` })}
                className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold transition hover:underline"
              >
                <FileText size={14} /> View Question Paper
              </button>
            )}
            {test?.solutionPdfUrl && (
              <button
                onClick={() => setOpenPdf({ fileUrl: test.solutionPdfUrl, title: `${test.title} - Answer Solutions` })}
                className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold transition hover:underline"
              >
                <FileText size={14} /> View Answer Solutions
              </button>
            )}
          </div>
        </div>

        {/* ─── Test Video Solution Walkthrough ──────────────────────────────── */}
        {test?.videoSolutionUrl && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
              <Video size={18} className="text-brand-600" /> Test Video Solution Walkthrough
            </h2>
            <SecureVideoPlayer url={test.videoSolutionUrl} title="Test Video Solution" />
          </div>
        )}

        {/* ─── Result Analysis metrics ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-base">
            <TrendingUp size={18} className="text-brand-600" /> Performance Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                <Award size={20} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{accuracy}%</div>
                <div className="text-xs font-semibold text-slate-400">Accuracy Rate</div>
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{avgTimePerQuestion}s</div>
                <div className="text-xs font-semibold text-slate-400">Avg. Time / Question</div>
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{totalAttempted} / {test?.questions?.length || 0}</div>
                <div className="text-xs font-semibold text-slate-400">Attempts Fraction</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Syllabus Mastery & Strength Analysis ────────────────────────── */}
        {hasChaptersOrTopics && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-base">
              <ClipboardList size={18} className="text-brand-600" /> Syllabus Mastery & Strength Analysis
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Based on your test performance, we have categorized your mastery level for each chapter and topic.
            </p>

            {/* Analysis Tabs */}
            <div className="flex border-b border-slate-150 mb-5 gap-1 overflow-x-auto select-none">
              {[
                { id: 'all', label: 'All Chapters', count: chapterList.length },
                { id: 'strong', label: '🎯 Strong Areas', count: strongChapters.length },
                { id: 'weak', label: '⚠️ Weak Areas', count: weakChapters.length }
              ].map((t) => {
                const isActive = activeAnalysisTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveAnalysisTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 -mb-[2px] transition ${
                      isActive
                        ? 'border-brand-600 text-brand-700 bg-brand-50/30'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    {t.label}
                    <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                      isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chapter List */}
            <div className="space-y-4">
              {(activeAnalysisTab === 'all' ? chapterList : activeAnalysisTab === 'strong' ? strongChapters : weakChapters).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                  No chapters found in this category.
                </div>
              ) : (
                (activeAnalysisTab === 'all' ? chapterList : activeAnalysisTab === 'strong' ? strongChapters : weakChapters).map((chap, ci) => {
                  const statusColors = {
                    strong: { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500', label: 'Strongest' },
                    weak: { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-100', bar: 'bg-rose-500', label: 'Weakest (Needs Focus)' },
                    neutral: { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', bar: 'bg-amber-500', label: 'Neutral (Practice More)' }
                  }[chap.status];

                  return (
                    <div key={ci} className="border border-slate-100 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                            <span className="text-base sm:text-lg">📁</span> {chap.name}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                            Accuracy: <span className="font-bold text-slate-700">{chap.accuracy}%</span> ({chap.correct}/{chap.total} correct)
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusColors.bg} ${statusColors.text}`}>
                            {statusColors.label}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${statusColors.bar} transition-all duration-500`} style={{ width: `${chap.successRate}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <span>Syllabus Covered</span>
                          <span>{chap.successRate}% Score Rate</span>
                        </div>
                      </div>

                      {/* Topics breakdown */}
                      {chap.topics && chap.topics.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-50 space-y-2.5">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subtopics breakdown</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {chap.topics.map((t, ti) => {
                              const tColors = {
                                strong: { dot: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50/40' },
                                weak: { dot: 'bg-rose-500', text: 'text-rose-700 bg-rose-50/40' },
                                neutral: { dot: 'bg-amber-500', text: 'text-amber-700 bg-amber-50/40' }
                              }[t.status];

                              return (
                                <div key={ti} className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100/50 transition">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full ${tColors.dot} shrink-0`} />
                                    <span className="text-xs font-semibold text-slate-700 truncate">{t.name}</span>
                                  </div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tColors.text} shrink-0`}>
                                    {t.correct}/{t.total} Correct
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── Detailed Question Review ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-base">
            <BarChart2 size={18} className="text-brand-600" /> Detailed Question Review
          </h2>
          <div className="space-y-3">
            {(test?.questions || []).map((q, idx) => {
              const ans = attempt.answers.find(
                (a) => a.questionId?.toString() === q._id?.toString()
              );
              return (
                <div key={q._id || idx}>
                  <div className="text-xs font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Question {idx + 1}</div>
                  <QuestionReview question={q} answer={ans} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 justify-center">
          {(() => {
            // Only show Retake if admin has enabled reattempts for this test
            const attemptsAllowed = test?.attemptsAllowed ?? 0;
            const previousAttempts = myAttempts.filter(
              (a) => a.test?._id?.toString() === test?._id?.toString() || a.test === test?._id
            );
            // attemptsAllowed 0 = unlimited, show retake always
            // attemptsAllowed > 0 = limited, only show if remaining attempts exist
            const canRetake = attemptsAllowed === 0 || previousAttempts.length < attemptsAllowed;
            if (!canRetake) return null;
            return (
              <Link
                to={`/take-test/${test?._id}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <Repeat size={15} /> Retake Paper
                {attemptsAllowed > 0 && (
                  <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">
                    {attemptsAllowed - previousAttempts.length} left
                  </span>
                )}
              </Link>
            );
          })()}
          <Link
            to="/tests"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition shadow-md"
          >
            More Practice Tests →
          </Link>
        </div>
      </div>

      {/* ─── Printable Scorecard / Report Card ────────────────────────────── */}
      <div id="printable-report-card" className="hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ border: '8px double #1e293b', padding: '40px', borderRadius: '8px' }}>
          
          {/* Certificate Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 5px 0', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '1px' }}>
              Ace2Examz
            </h1>
            <p style={{ fontSize: '14px', margin: '0', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Official Examination Report Card
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid #cbd5e1', margin: '20px 0' }} />

          {/* Student & Test Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '14px' }}>
            <div>
              <p style={{ margin: '5px 0' }}><strong>Student Name:</strong> {attempt.user?.name || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Email Address:</strong> {attempt.user?.email || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Submission ID:</strong> {attempt._id}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '5px 0' }}><strong>Exam Title:</strong> {test?.title || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Subject Area:</strong> {test?.subject || 'Chemistry'}</p>
              <p style={{ margin: '5px 0' }}><strong>Date Submitted:</strong> {new Date(attempt.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Performance Summary Table */}
          <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '15px', textTransform: 'uppercase' }}>
            Result Summary
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px 10px', textAlign: 'left' }}>Parameter</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Total Questions</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{test?.questions?.length || 0}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', color: '#16a34a' }}>Correct Answers</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{attempt.correct}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', color: '#dc2626' }}>Wrong Answers</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{attempt.wrong}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Skipped Questions</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{attempt.unattempted}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Marks Scored</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{attempt.scored} / {attempt.totalMarks}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <td style={{ padding: '12px 10px' }}><strong>Final Percentage Score</strong></td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>{attempt.percentage}%</td>
              </tr>
            </tbody>
          </table>

          {/* Verification Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>Result Classification</p>
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                background: passed ? '#d1fae5' : '#fee2e2',
                color: passed ? '#065f46' : '#991b1b',
                border: passed ? '1px solid #10b981' : '1px solid #ef4444'
              }}>
                {passed ? 'Passed' : 'Failed'}
              </div>
            </div>

            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #475569', width: '100%', height: '40px' }} />
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569' }}>
                Controller of Examinations
              </p>
            </div>
          </div>

        </div>
      </div>

      {openPdf && <PdfModal pdf={openPdf} onClose={() => setOpenPdf(null)} />}
    </div>
  );
}
