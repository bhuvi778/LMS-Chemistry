import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertTriangle,
  Loader2,
  Flag,
  X,
  ClipboardList,
  User,
} from 'lucide-react';

// ─── Timer ────────────────────────────────────────────────────────────────────
function Timer({ totalSecs, onExpire }) {
  const [left, setLeft] = useState(totalSecs);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (left <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [left]);

  const hrs = Math.floor(left / 3600);
  const mins = Math.floor((left % 3600) / 60);
  const secs = left % 60;

  const timeStr = hrs > 0
    ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const pct = (left / totalSecs) * 100;
  const urgent = pct < 10;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border transition-colors ${
      urgent ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'
    }`}>
      <Clock size={15} />
      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mr-1">Time Left:</span>
      <span className="text-base font-extrabold">{timeStr}</span>
    </div>
  );
}

// ─── Instructions Modal ───────────────────────────────────────────────────────
function InstructionsModal({ test, onStart }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100">
        {/* Top accent */}
        <div className="h-2 bg-gradient-to-r from-brand-500 to-violet2-500" />
        <div className="p-8">
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
              <ClipboardList size={28} className="text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{test.title}</h1>
            <p className="text-slate-500 mt-1 text-sm">{test.description || 'NTA pattern test series'}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Questions', value: test.questions?.length || 0, color: 'text-brand-700', bg: 'bg-brand-50 border-brand-100' },
              { label: 'Minutes', value: test.durationMins, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Total Marks', value: test.totalMarks, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
            ].map((stat) => (
              <div key={stat.label} className={`text-center rounded-xl p-4 border ${stat.bg}`}>
                <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {test.maxQuestionsToAttempt > 0 && (
            <div className="bg-blue-55 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-900 leading-relaxed shadow-sm">
              <div className="font-bold mb-1.5 flex items-center gap-1.5 text-blue-800">
                <ClipboardList size={14} className="text-blue-600 animate-bounce" /> Optional Questions Attempt Limit
              </div>
              <div className="text-blue-800 font-medium">
                You are only allowed to attempt a maximum of <span className="font-extrabold text-blue-900">{test.maxQuestionsToAttempt}</span> questions out of the {test.questions?.length || 0} questions in this test. Once you attempt {test.maxQuestionsToAttempt} questions, any other questions will become inactive until you clear an existing response.
              </div>
            </div>
          )}

          {test.instructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-900 leading-relaxed">
              <div className="font-bold mb-1.5 flex items-center gap-1.5 text-amber-800">
                <AlertTriangle size={14} /> Instructions
              </div>
              <div className="text-amber-800">{test.instructions}</div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Marking Scheme</p>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={13} className="text-emerald-600" />
              </span>
              Correct answer: <span className="font-bold text-emerald-700">+{test.questions?.[0]?.marks || 4} marks</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X size={13} className="text-red-600" />
              </span>
              Wrong answer: <span className="font-bold text-red-600">{test.questions?.[0]?.negativeMarks ?? -1} marks</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Circle size={13} className="text-slate-400" />
              </span>
              Unattempted: <span className="font-bold text-slate-500">0 marks</span>
            </div>
          </div>

          <button
            onClick={onStart}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-violet2-500 text-white rounded-xl font-bold text-base hover:opacity-90 transition shadow-md hover:shadow-lg"
          >
            Start Test →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Palette Item ──────────────────────────────────────────────────────
function PaletteItem({ number, state, isActive, onClick }) {
  let stateClass = '';
  let clipStyle = {};

  if (state === 'not_visited') {
    stateClass = 'bg-[#f0f4f8] text-slate-600 border border-slate-300 rounded-md';
  } else if (state === 'not_answered') {
    stateClass = 'bg-[#ea580c] text-white';
    clipStyle = { clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' };
  } else if (state === 'answered') {
    stateClass = 'bg-[#16a34a] text-white';
    clipStyle = { clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 80% 100%, 0% 100%)' };
  } else if (state === 'marked_for_review') {
    stateClass = 'bg-[#6b21a8] text-white rounded-full';
  } else if (state === 'answered_marked_for_review') {
    stateClass = 'bg-[#6b21a8] text-white rounded-full relative';
  }

  return (
    <button
      onClick={onClick}
      style={clipStyle}
      className={`w-9 h-9 font-bold text-xs flex items-center justify-center transition-all ${stateClass} ${
        isActive ? 'ring-2 ring-blue-500 ring-offset-1 scale-105 shadow-md z-10' : 'hover:opacity-90'
      }`}
    >
      {String(number).padStart(2, '0')}
      {state === 'answered_marked_for_review' && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#16a34a] border border-white rounded-full flex items-center justify-center shadow">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </span>
      )}
    </button>
  );
}

const isQuestionAttempted = (selected, type) => {
  if (type === 'msq') {
    return Array.isArray(selected) && selected.length > 0;
  }
  if (type === 'numerical') {
    return selected !== '' && selected !== undefined && selected !== null;
  }
  return selected !== -1 && selected !== undefined && selected !== null;
};

export default function TakeTest() {
  const { testId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const [states, setStates] = useState({});
  const [answers, setAnswers] = useState({}); 
  const [tempAnswers, setTempAnswers] = useState({}); 

  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSummaryScreen, setShowSummaryScreen] = useState(false);

  const answersRef = useRef(answers);
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  const getAttemptedCount = useCallback(() => {
    const qList = test?.questions || [];
    return Object.entries(answers).filter(([qId, val]) => {
      const qObj = qList.find((quest) => quest._id === qId);
      return isQuestionAttempted(val, qObj?.type);
    }).length;
  }, [answers, test]);

  useEffect(() => {
    api.get(`/tests/tests/${testId}`)
      .then(({ data }) => {
        setTest(data);
        const initAnswers = {};
        const initStates = {};
        (data.questions || []).forEach((q, idx) => {
          if (q.type === 'msq') {
            initAnswers[q._id] = [];
          } else if (q.type === 'numerical') {
            initAnswers[q._id] = '';
          } else {
            initAnswers[q._id] = -1;
          }
          initStates[q._id] = idx === 0 ? 'not_answered' : 'not_visited';
        });
        setAnswers(initAnswers);
        setTempAnswers(initAnswers);
        setStates(initStates);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
        nav('/tests');
      })
      .finally(() => setLoading(false));
  }, [testId, nav]);

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
  };

  const handleSelectOption = (qId, optIdx) => {
    const qObj = (test?.questions || []).find((quest) => quest._id === qId);
    const qType = qObj?.type || 'mcq';

    if (qType === 'msq') {
      const currentVal = Array.isArray(tempAnswers[qId]) ? tempAnswers[qId] : [];
      let newVal;
      if (currentVal.includes(optIdx)) {
        newVal = currentVal.filter((idx) => idx !== optIdx);
      } else {
        const isCurrentlyAttempted = isQuestionAttempted(answers[qId], qType);
        if (!isCurrentlyAttempted && getAttemptedCount() >= (test?.maxQuestionsToAttempt || Infinity)) {
          toast.error(`You have already attempted the maximum allowed ${test.maxQuestionsToAttempt} questions. Please clear another answer first.`);
          return;
        }
        newVal = [...currentVal, optIdx].sort();
      }
      setTempAnswers((t) => ({ ...t, [qId]: newVal }));
    } else {
      const isCurrentlyAttempted = isQuestionAttempted(answers[qId], qType);
      if (!isCurrentlyAttempted && getAttemptedCount() >= (test?.maxQuestionsToAttempt || Infinity)) {
        toast.error(`You have already attempted the maximum allowed ${test.maxQuestionsToAttempt} questions. Please clear another answer first.`);
        return;
      }
      setTempAnswers((t) => ({ ...t, [qId]: optIdx }));
    }
  };

  const handleNavigateTo = (targetIdx) => {
    const questions = test?.questions || [];
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const currentQId = questions[current]._id;
    setTempAnswers((t) => ({ ...t, [currentQId]: answers[currentQId] }));

    if (states[currentQId] === 'not_visited') {
      setStates((s) => ({ ...s, [currentQId]: 'not_answered' }));
    }

    const targetQId = questions[targetIdx]._id;
    if (states[targetQId] === 'not_visited') {
      setStates((s) => ({ ...s, [targetQId]: 'not_answered' }));
    }

    setCurrent(targetIdx);
  };

  const handleSaveNext = () => {
    const questions = test?.questions || [];
    const currentQId = questions[current]._id;
    const selected = tempAnswers[currentQId];

    const isUnattempted =
      selected === -1 ||
      selected === null ||
      selected === undefined ||
      selected === '' ||
      (Array.isArray(selected) && selected.length === 0);

    if (isUnattempted) {
      toast.error('Please select or enter an option to save.', { id: 'save-alert' });
      return;
    }

    setAnswers((a) => ({ ...a, [currentQId]: selected }));
    setStates((s) => ({ ...s, [currentQId]: 'answered' }));

    if (current < questions.length - 1) {
      handleNavigateTo(current + 1);
    } else {
      toast.success('Response saved. This is the last question of the paper.', { id: 'last-alert' });
    }
  };

  const handleSaveMarkForReview = () => {
    const questions = test?.questions || [];
    const currentQId = questions[current]._id;
    const selected = tempAnswers[currentQId];

    const isUnattempted =
      selected === -1 ||
      selected === null ||
      selected === undefined ||
      selected === '' ||
      (Array.isArray(selected) && selected.length === 0);

    if (isUnattempted) {
      toast.error('Please select or enter an option to save & mark for review.', { id: 'save-alert' });
      return;
    }

    setAnswers((a) => ({ ...a, [currentQId]: selected }));
    setStates((s) => ({ ...s, [currentQId]: 'answered_marked_for_review' }));

    if (current < questions.length - 1) {
      handleNavigateTo(current + 1);
    } else {
      toast.success('Response saved & marked for review.', { id: 'last-alert' });
    }
  };

  const handleMarkForReviewNext = () => {
    const questions = test?.questions || [];
    const currentQId = questions[current]._id;
    const qObj = questions[current];

    let defaultVal = -1;
    if (qObj.type === 'msq') defaultVal = [];
    else if (qObj.type === 'numerical') defaultVal = '';

    setAnswers((a) => ({ ...a, [currentQId]: defaultVal }));
    setTempAnswers((t) => ({ ...t, [currentQId]: defaultVal }));
    setStates((s) => ({ ...s, [currentQId]: 'marked_for_review' }));

    if (current < questions.length - 1) {
      handleNavigateTo(current + 1);
    } else {
      toast.success('Marked for review.', { id: 'last-alert' });
    }
  };

  const handleClear = () => {
    const questions = test?.questions || [];
    const currentQId = questions[current]._id;
    const qObj = questions[current];

    let defaultVal = -1;
    if (qObj.type === 'msq') defaultVal = [];
    else if (qObj.type === 'numerical') defaultVal = '';

    setAnswers((a) => ({ ...a, [currentQId]: defaultVal }));
    setTempAnswers((t) => ({ ...t, [currentQId]: defaultVal }));
    setStates((s) => ({ ...s, [currentQId]: 'not_answered' }));
    toast.success('Selection cleared!', { id: 'clear-alert' });
  };

  // Submission handler
  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const timeTakenSecs = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const answerPayload = Object.entries(answersRef.current).map(([questionId, selected]) => ({
      questionId,
      selected,
    }));

    try {
      const { data } = await api.post('/tests/attempts', {
        testId,
        answers: answerPayload,
        timeTakenSecs,
      });
      toast.success('Test submitted successfully!');
      nav(`/test-result/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      setSubmitting(false);
    }
  }, [testId, nav, submitting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold text-sm">Loading test paper...</p>
        </div>
      </div>
    );
  }

  if (!test) return null;

  if (!started) {
    return <InstructionsModal test={test} onStart={handleStart} />;
  }

  const questions = test.questions || [];
  const q = questions[current];

  // Palette counts computation
  const stateList = Object.values(states);
  const countNotVisited = stateList.filter(s => s === 'not_visited').length;
  const countNotAnswered = stateList.filter(s => s === 'not_answered').length;
  const countAnswered = stateList.filter(s => s === 'answered').length;
  const countMarkedForReview = stateList.filter(s => s === 'marked_for_review').length;
  const countAnsweredMarkedReview = stateList.filter(s => s === 'answered_marked_for_review').length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col select-none">
      {/* ─── Header Bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/tests" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition flex-shrink-0">
              <ChevronLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate">{test.title}</h1>
              <p className="text-xs text-slate-400 hidden md:block">Subject: <span className="text-slate-600 font-medium">{test.subject || 'Chemistry'}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Timer totalSecs={test.durationMins * 60} onExpire={submit} />
            <button
              onClick={() => {
                const currentQId = questions[current]._id;
                if (states[currentQId] === 'not_visited') {
                  setStates((s) => ({ ...s, [currentQId]: 'not_answered' }));
                }
                setShowSummaryScreen(true);
              }}
              className="px-3 md:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs md:text-sm font-bold transition shadow-sm whitespace-nowrap"
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Interface ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* Left Side: Question Canvas */}
        <main className="flex-1 flex flex-col p-3 md:p-5 min-w-0">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Question Heading */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                  {current + 1}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
                  of {questions.length} Questions
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                +{q?.marks || 4} / {q?.negativeMarks ?? -1}
              </span>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
              <div className="text-[15px] text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">
                {q?.question}
              </div>

              {q?.image && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-w-xl bg-slate-50 p-2 shadow-inner">
                  <img src={q.image} alt="Question Graphic" className="max-h-64 object-contain rounded-lg" />
                </div>
              )}

              {/* Options */}
              {(q?.type || 'mcq') === 'numerical' ? (
                <div className="max-w-md space-y-2">
                  <label className="text-sm font-semibold text-slate-500 block">YOUR NUMERICAL ANSWER</label>
                  <input
                    type="number"
                    step="any"
                    value={tempAnswers[q._id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isCurrentlyAttempted = isQuestionAttempted(answers[q._id], 'numerical');
                      if (val !== '' && !isCurrentlyAttempted && getAttemptedCount() >= (test?.maxQuestionsToAttempt || Infinity)) {
                        toast.error(`You have already attempted the maximum allowed ${test.maxQuestionsToAttempt} questions. Please clear another answer first.`);
                        return;
                      }
                      setTempAnswers((t) => ({ ...t, [q._id]: val }));
                    }}
                    className="w-full border-2 border-slate-200 focus:border-brand-500 rounded-xl px-4 py-3 text-base font-medium focus:outline-none bg-white transition-all shadow-sm"
                    placeholder="Enter numerical response..."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-w-3xl">
                  {(q?.options || []).map((opt, oi) => {
                    const isMsq = q.type === 'msq';
                    const isTempSelected = isMsq
                      ? (Array.isArray(tempAnswers[q._id]) ? tempAnswers[q._id] : []).includes(oi)
                      : tempAnswers[q._id] === oi;
                    const optText = typeof opt === 'string' ? opt : opt.text;
                    return (
                      <button
                        key={oi}
                        onClick={() => handleSelectOption(q._id, oi)}
                        className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                          isTempSelected
                            ? 'border-brand-500 bg-brand-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          isTempSelected
                            ? 'border-brand-500 bg-brand-600 text-white'
                            : 'border-slate-300 text-slate-500 bg-white'
                        } ${isMsq ? 'rounded' : 'rounded-full'}`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-sm text-slate-700 font-medium leading-relaxed pt-0.5" dangerouslySetInnerHTML={{ __html: optText }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Question Actions Toolbar */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap gap-2 items-center">
              <button
                onClick={handleSaveNext}
                className="flex-1 sm:flex-none px-3 md:px-5 py-2.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold uppercase rounded-lg transition shadow-sm whitespace-nowrap"
              >
                Save & Next
              </button>
              <button
                onClick={handleClear}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold uppercase rounded-lg transition shadow-sm"
              >
                Clear
              </button>
              <button
                onClick={handleSaveMarkForReview}
                className="flex-1 sm:flex-none px-3 md:px-5 py-2.5 bg-[#f57c00] hover:bg-[#e65100] text-white text-xs font-bold uppercase rounded-lg transition shadow-sm whitespace-nowrap"
              >
                Save & Mark
              </button>
              <button
                onClick={handleMarkForReviewNext}
                className="flex-1 sm:flex-none px-3 md:px-5 py-2.5 bg-[#1976d2] hover:bg-[#0d47a1] text-white text-xs font-bold uppercase rounded-lg transition shadow-sm whitespace-nowrap"
              >
                Mark & Next
              </button>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex gap-2">
              <button
                onClick={() => handleNavigateTo(current - 1)}
                disabled={current === 0}
                className="flex items-center gap-1 px-3 md:px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs md:text-sm font-bold text-slate-700 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronLeft size={15} /> Back
              </button>
              <button
                onClick={() => handleNavigateTo(current + 1)}
                disabled={current === questions.length - 1}
                className="flex items-center gap-1 px-3 md:px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs md:text-sm font-bold text-slate-700 disabled:opacity-40 transition shadow-sm"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
            <button
              onClick={() => setShowSummaryScreen(true)}
              className="px-4 md:px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs md:text-sm font-bold transition shadow-sm"
            >
              Submit Test
            </button>
          </div>
        </main>

        {/* Right Side: Palette Panel */}
        <aside className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col sticky top-14 h-auto lg:h-[calc(100vh-3.5rem)] overflow-y-auto">
          {/* Candidate Widget */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-brand-500 overflow-hidden flex items-center justify-center flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="text-slate-400" size={18} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Candidate</p>
              <h4 className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Student'}</h4>
            </div>
          </div>

          {test.maxQuestionsToAttempt > 0 && (
            <div className="px-4 py-2.5 border-b border-slate-100 bg-blue-50/50">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase mb-1">
                <span>Attempt Progress</span>
                <span className="text-brand-650 font-extrabold">{getAttemptedCount()} / {test.maxQuestionsToAttempt}</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((getAttemptedCount() / test.maxQuestionsToAttempt) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary Count Row */}
          <div className="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100 text-center">
            <div className="py-2.5 px-1">
              <div className="text-sm font-extrabold text-[#16a34a]">{countAnswered}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase leading-tight mt-0.5">Ans</div>
            </div>
            <div className="py-2.5 px-1">
              <div className="text-sm font-extrabold text-[#ea580c]">{countNotAnswered}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase leading-tight mt-0.5">Not Ans</div>
            </div>
            <div className="py-2.5 px-1">
              <div className="text-sm font-extrabold text-[#6b21a8]">{countMarkedForReview}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase leading-tight mt-0.5">Review</div>
            </div>
            <div className="py-2.5 px-1">
              <div className="text-sm font-extrabold text-[#6b21a8]">{countAnsweredMarkedReview}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase leading-tight mt-0.5">Ans+Rev</div>
            </div>
            <div className="py-2.5 px-1">
              <div className="text-sm font-extrabold text-slate-500">{countNotVisited}</div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase leading-tight mt-0.5">Not Vis</div>
            </div>
          </div>

          {/* Palette Legends */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 flex-shrink-0 bg-[#16a34a] flex items-center justify-center text-white text-[9px] font-bold" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 80% 100%, 0% 100%)' }} />
                <span className="text-[11px] text-slate-600 font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 flex-shrink-0 bg-[#ea580c] flex items-center justify-center text-white text-[9px] font-bold" style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' }} />
                <span className="text-[11px] text-slate-600 font-medium">Not Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 flex-shrink-0 bg-[#6b21a8] rounded-full flex items-center justify-center text-white text-[9px] font-bold" />
                <span className="text-[11px] text-slate-600 font-medium">For Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 flex-shrink-0 bg-[#6b21a8] rounded-full flex items-center justify-center text-white text-[9px] font-bold relative">
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#16a34a] border border-white rounded-full" />
                </span>
                <span className="text-[11px] text-slate-600 font-medium leading-tight">Ans+Review</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="w-6 h-6 flex-shrink-0 bg-[#f0f4f8] border border-slate-300 rounded flex items-center justify-center text-slate-600 text-[9px] font-bold" />
                <span className="text-[11px] text-slate-600 font-medium">Not Visited</span>
              </div>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="flex-1 flex flex-col px-4 pb-4 pt-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Question Palette</p>
            <div className="grid grid-cols-5 gap-1.5 overflow-y-auto p-1">
              {questions.map((qItem, idx) => (
                <PaletteItem
                  key={qItem._id}
                  number={idx + 1}
                  state={states[qItem._id]}
                  isActive={current === idx}
                  onClick={() => handleNavigateTo(idx)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Confirm Exam Summary Screen ───────────────────────────────────────── */}
      {showSummaryScreen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden">
            {/* Modal Title */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-brand-600" size={18} /> Exam Summary
              </h2>
              <button
                onClick={() => setShowSummaryScreen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total', value: questions.length, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
                  { label: 'Answered', value: countAnswered, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  { label: 'Not Answered', value: countNotAnswered, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
                  { label: 'For Review', value: countMarkedForReview, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
                  { label: 'Ans + Review', value: countAnsweredMarkedReview, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
                  { label: 'Not Visited', value: countNotVisited, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                    <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center mb-5">
                <p className="text-sm text-amber-900 font-bold mb-0.5">Ready to submit for final marking?</p>
                <p className="text-xs text-amber-700">No changes will be allowed after submission.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSummaryScreen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 transition"
                >
                  Continue Test
                </button>
                <button
                  onClick={() => {
                    setShowSummaryScreen(false);
                    submit();
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  Submit Final
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
