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
  Bookmark,
  Coins,
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
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  const positiveMarks = test.questions?.[0]?.marks || 4;
  const negativeMarks = test.questions?.[0]?.negativeMarks ?? -1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header bar */}
      <header className="bg-[#0f172a] text-white py-3.5 px-6 flex justify-between items-center shadow-md select-none shrink-0">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-emerald-400 animate-pulse" size={20} />
          <span className="font-extrabold text-sm uppercase tracking-wider">{test.title} — General Instructions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-700 select-none">
            Medium: English
          </div>
        </div>
      </header>

      {/* Main body wrapper */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col gap-4 min-h-0">
        <div className="text-center font-black text-slate-850 text-lg md:text-xl tracking-tight my-2">
          Please read the instructions carefully
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 scrollbar-thin">
          {/* Dynamic notices (Attempt Cost & Limits) */}
          <div className="grid md:grid-cols-2 gap-4 select-none">
            {user?.role !== 'admin' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 leading-relaxed shadow-sm">
                <div className="font-extrabold mb-1 flex items-center gap-1.5 text-amber-800">
                  <Coins size={14} className="text-amber-600 animate-bounce" /> Attempt Cost: 1 Ace Coin
                </div>
                <div className="text-amber-800 font-semibold">
                  Starting this test will deduct <span className="font-black text-amber-950">1 Ace Coin</span> from your wallet. You currently have <span className="font-black text-indigo-900">{user?.coins || 0} Ace Coins</span>.
                </div>
              </div>
            )}
            
            {test.maxQuestionsToAttempt > 0 && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed shadow-sm">
                <div className="font-extrabold mb-1 flex items-center gap-1.5 text-blue-800">
                  <ClipboardList size={14} className="text-blue-600 animate-bounce" /> Optional Questions Attempt Limit
                </div>
                <div className="text-blue-850 font-semibold">
                  You are allowed to attempt a maximum of <span className="font-black text-blue-950">{test.maxQuestionsToAttempt}</span> questions out of {test.questions?.length || 0}. Remaining questions will become locked.
                </div>
              </div>
            )}
          </div>

          {/* General instructions text block */}
          <div className="space-y-4 text-slate-700 text-xs md:text-sm">
            <h3 className="font-black text-slate-900 underline text-sm uppercase">General Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-3 font-medium">
              <li>
                Total duration of this test (<strong>{test.title}</strong>) is <strong>{test.durationMins} minutes</strong>.
              </li>
              <li>
                The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.
              </li>
              <li>
                The Questions Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <div className="mt-3 pl-2 space-y-3.5 border-l-2 border-slate-100">
                  {/* Symbol 1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 font-bold text-[10px] flex items-center justify-center bg-[#f0f4f8] text-slate-600 border border-slate-300 rounded-md shrink-0 select-none">01</div>
                    <span>You have not visited the question yet.</span>
                  </div>

                  {/* Symbol 2 */}
                  <div className="flex items-center gap-3">
                    <div style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)' }} className="w-8 h-8 font-bold text-[10px] flex items-center justify-center bg-[#ea580c] text-white shrink-0 select-none">02</div>
                    <span>You have not answered the question.</span>
                  </div>

                  {/* Symbol 3 */}
                  <div className="flex items-center gap-3">
                    <div style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 80% 100%, 0% 100%)' }} className="w-8 h-8 font-bold text-[10px] flex items-center justify-center bg-[#16a34a] text-white shrink-0 select-none">03</div>
                    <span>You have answered the question.</span>
                  </div>

                  {/* Symbol 4 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 font-bold text-[10px] flex items-center justify-center bg-[#6b21a8] text-white rounded-full shrink-0 select-none">04</div>
                    <span>You have NOT answered the question, but have marked the question for review.</span>
                  </div>

                  {/* Symbol 5 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 font-bold text-[10px] flex items-center justify-center bg-[#6b21a8] text-white rounded-full relative shrink-0 select-none">
                      05
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#16a34a] border border-white rounded-full flex items-center justify-center shadow">
                        <svg viewBox="0 0 24 24" className="w-2 h-2 text-white fill-current">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </span>
                    </div>
                    <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                  </div>
                </div>
              </li>
              <li>
                You can click on the "&gt;" arrow which appears to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "&lt;" which appears on the right side of question window.
              </li>
              <li>
                You can use the Question Palette panel or click the Back/Next navigation buttons to move between questions.
              </li>
            </ol>

            <div className="h-px bg-slate-150 my-4" />

            <h3 className="font-black text-slate-900 underline text-sm uppercase">Navigating to a Question:</h3>
            <ol start="6" className="list-decimal pl-5 space-y-3 font-medium">
              <li>
                To answer a question, do the following:
                <ul className="list-disc pl-5 mt-1.5 space-y-1.5">
                  <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                  <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                  <li>Click on <strong>Mark & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                </ul>
              </li>
            </ol>

            <div className="h-px bg-slate-155 my-4" />

            <h3 className="font-black text-slate-900 underline text-sm uppercase">Answering a Question:</h3>
            <ol start="7" className="list-decimal pl-5 space-y-3 font-medium">
              <li>
                Procedure for answering a multiple choice type question:
                <ul className="list-disc pl-5 mt-1.5 space-y-1.5">
                  <li>To select your answer, click on the button of one of the options.</li>
                  <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear</strong> button.</li>
                  <li>To change your chosen answer, click on the button of another option.</li>
                  <li>To save your answer, you MUST click on the <strong>Save & Next</strong> button.</li>
                  <li>To mark the question for review, click on the <strong>Mark & Next</strong> button.</li>
                </ul>
              </li>
              <li>
                To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.
              </li>
            </ol>

            <div className="h-px bg-slate-155 my-4" />

            <h3 className="font-black text-slate-900 underline text-sm uppercase">Navigating through sections:</h3>
            <ol start="9" className="list-decimal pl-5 space-y-3 font-medium">
              <li>
                Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by clicking on the section name. The section you are currently viewing is highlighted.
              </li>
              <li>
                After clicking the <strong>Save & Next</strong> button on the last question for a section, you will automatically be taken to the first question of the next section.
              </li>
              <li>
                You can shuffle between sections and questions during the examination as per your convenience only during the time stipulated.
              </li>
              <li>
                Candidate can view the corresponding section summary as part of the legend that appears in every section above the question palette.
              </li>
            </ol>

            <div className="h-px bg-slate-155 my-4" />

            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2">Marking Scheme (Specific for this Paper)</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-semibold">
              <div className="flex items-center gap-2.5 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={12} className="text-emerald-600" />
                </span>
                Correct answer: <span className="font-black text-emerald-700">+{positiveMarks} marks</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X size={12} className="text-red-600" />
                </span>
                Wrong answer: <span className="font-black text-red-700">{negativeMarks} marks</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Circle size={12} className="text-slate-400" />
                </span>
                Unattempted: <span className="font-black text-slate-500">0 marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area (Agreements, Warning & Proceed Button) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4 mt-2 shrink-0">
          <label className="flex items-start gap-3 cursor-pointer text-[11px] text-slate-650 hover:text-slate-850 select-none border-t border-slate-100 pt-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 border-slate-350 focus:ring-emerald-500 cursor-pointer mt-0.5"
            />
            <span className="leading-relaxed font-semibold">
              I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
            </span>
          </label>

          <div className="flex justify-center pt-3 border-t border-slate-100">
            <button
              onClick={onStart}
              disabled={!checked}
              className={`px-12 py-3 rounded-xl font-black text-xs tracking-wider transition-all shadow-md uppercase cursor-pointer ${
                checked
                  ? 'bg-[#22c55e] hover:bg-[#15803d] text-white hover:shadow-lg scale-105 active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Proceed
            </button>
          </div>
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
  const { user, setUser } = useAuth();
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

  const [savedQuestionIds, setSavedQuestionIds] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('wrong_answer');
  const [reportDescription, setReportDescription] = useState('');
  const [reportingState, setReportingState] = useState(false);

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

  const getSectionAttemptedCount = useCallback((secName) => {
    const qList = test?.questions || [];
    return Object.entries(answers).filter(([qId, val]) => {
      const qObj = qList.find((quest) => quest._id === qId);
      return qObj?.section === secName && isQuestionAttempted(val, qObj?.type);
    }).length;
  }, [answers, test]);

  useEffect(() => {
    api.get('/tests/saved-questions')
      .then(({ data }) => {
        const ids = new Set((data || []).map(q => q.questionId));
        setSavedQuestionIds(ids);
      })
      .catch(() => {});

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

  const handleStart = async () => {
    if (user?.role !== 'admin') {
      if ((user?.coins || 0) < 1) {
        toast.error('Insufficient Ace Coins! Attempting this test costs 1 Ace Coin. Go to your Coins Wallet or complete daily planner goals to earn more.');
        return;
      }
      if (!window.confirm('Attempting this test will deduct 1 Ace Coin from your wallet. Do you want to spend 1 coin and start?')) {
        return;
      }
      
      try {
        setLoading(true);
        const { data } = await api.post(`/tests/tests/${testId}/spend-coin`);
        if (setUser && data.coins !== undefined) {
          setUser(prev => prev ? { ...prev, coins: data.coins } : null);
        }
        toast.success('1 Ace Coin spent to attempt test 🪙');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to deduct coin. Please try again.');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    
    setStarted(true);
    setStartTime(Date.now());
  };

  const handleSelectOption = (qId, optIdx) => {
    const qObj = (test?.questions || []).find((quest) => quest._id === qId);
    const qType = qObj?.type || 'mcq';
    const sectionName = qObj?.section || '';
    const sectionObj = (test?.sections || []).find(s => s.name === sectionName);
    const secLimit = sectionObj?.attemptAllowed || 0;

    if (qType === 'msq') {
      const currentVal = Array.isArray(tempAnswers[qId]) ? tempAnswers[qId] : [];
      let newVal;
      if (currentVal.includes(optIdx)) {
        newVal = currentVal.filter((idx) => idx !== optIdx);
      } else {
        const isCurrentlyAttempted = isQuestionAttempted(answers[qId], qType);
        if (!isCurrentlyAttempted) {
          if (secLimit > 0 && getSectionAttemptedCount(sectionName) >= secLimit) {
            toast.error(`You have already attempted the maximum allowed ${secLimit} questions in section "${sectionName}". Please clear another answer in this section first.`);
            return;
          }
          if (getAttemptedCount() >= (test?.maxQuestionsToAttempt || Infinity)) {
            toast.error(`You have already attempted the maximum allowed ${test.maxQuestionsToAttempt} questions. Please clear another answer first.`);
            return;
          }
        }
        newVal = [...currentVal, optIdx].sort();
      }
      setTempAnswers((t) => ({ ...t, [qId]: newVal }));
    } else {
      const isCurrentlyAttempted = isQuestionAttempted(answers[qId], qType);
      if (!isCurrentlyAttempted) {
        if (secLimit > 0 && getSectionAttemptedCount(sectionName) >= secLimit) {
          toast.error(`You have already attempted the maximum allowed ${secLimit} questions in section "${sectionName}". Please clear another answer in this section first.`);
          return;
        }
        if (getAttemptedCount() >= (test?.maxQuestionsToAttempt || Infinity)) {
          toast.error(`You have already attempted the maximum allowed ${test.maxQuestionsToAttempt} questions. Please clear another answer first.`);
          return;
        }
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

  const handleToggleSave = async () => {
    const qObj = questions[current];
    const isSaved = savedQuestionIds.has(qObj._id);
    
    try {
      if (isSaved) {
        await api.delete(`/tests/saved-questions/${qObj._id}`);
        setSavedQuestionIds(prev => {
          const next = new Set(prev);
          next.delete(qObj._id);
          return next;
        });
        toast.success('Question removed from Saved Questions');
      } else {
        await api.post('/tests/saved-questions', {
          questionId: qObj._id,
          testId,
          questionText: qObj.question,
          options: qObj.options,
          correct: qObj.correct,
          explanation: qObj.explanation,
          image: qObj.image,
          testTitle: test.title
        });
        setSavedQuestionIds(prev => {
          const next = new Set(prev);
          next.add(qObj._id);
          return next;
        });
        toast.success('Question saved successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update saved question');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const qObj = questions[current];
    setReportingState(true);
    try {
      await api.post('/tests/reported-questions', {
        questionId: qObj._id,
        testId,
        questionText: qObj.question,
        testTitle: test.title,
        reason: reportReason,
        description: reportDescription,
      });
      toast.success('Issue reported successfully. Thank you for your feedback!');
      setShowReportModal(false);
      setReportReason('wrong_answer');
      setReportDescription('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit report');
    } finally {
      setReportingState(false);
    }
  };

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
            {/* Sections Header Tabs */}
            {test.sections && test.sections.length > 0 && (
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
                {test.sections.map((sec) => {
                  const isCurrentSection = q?.section === sec.name;
                  const secQuestions = questions.filter((quest) => quest.section === sec.name);
                  if (secQuestions.length === 0) return null; // skip if no questions assigned
                  
                  // Calculate how many are attempted in this section
                  const attemptedInSection = secQuestions.filter(
                    (quest) => isQuestionAttempted(answers[quest._id], quest.type)
                  ).length;

                  return (
                    <button
                      key={sec.name}
                      onClick={() => {
                        const firstQIdx = questions.findIndex(quest => quest.section === sec.name);
                        if (firstQIdx !== -1) {
                          handleNavigateTo(firstQIdx);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shadow-sm border ${
                        isCurrentSection
                          ? 'bg-brand-600 text-white border-brand-700 shadow-md scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sec.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        isCurrentSection ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {attemptedInSection} {sec.attemptAllowed > 0 ? `/ ${sec.attemptAllowed}` : ''}
                      </span>
                    </button>
                  );
                })}
                {/* Also handle no-section questions if they exist */}
                {questions.some(quest => !quest.section) && (
                  <button
                    onClick={() => {
                      const firstQIdx = questions.findIndex(quest => !quest.section);
                      if (firstQIdx !== -1) {
                        handleNavigateTo(firstQIdx);
                      }
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shadow-sm border ${
                      !q?.section
                        ? 'bg-brand-600 text-white border-brand-700 shadow-md scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>General</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      !q?.section ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {questions.filter(quest => !quest.section && isQuestionAttempted(answers[quest._id], quest.type)).length}
                    </span>
                  </button>
                )}
              </div>
            )}

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
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    savedQuestionIds.has(q?._id)
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
                  }`}
                  title={savedQuestionIds.has(q?._id) ? 'Remove Bookmark' : 'Save Question'}
                >
                  <Bookmark size={13} className={savedQuestionIds.has(q?._id) ? 'fill-current' : ''} />
                  <span className="hidden sm:inline">{savedQuestionIds.has(q?._id) ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white hover:bg-rose-50 text-slate-500 border-slate-200 hover:text-rose-650 hover:border-rose-200"
                  title="Report an error or issue in this question"
                >
                  <Flag size={13} />
                  <span className="hidden sm:inline">Report</span>
                </button>

                <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-brand-55 text-brand-800 border border-brand-100">
                  +{q?.marks || 4} / {q?.negativeMarks ?? -1}
                </span>
              </div>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
              <div 
                className="text-[15px] text-slate-800 font-semibold leading-relaxed"
                dangerouslySetInnerHTML={{ __html: q?.question || '' }}
              />

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
                      const sectionName = q.section || '';
                      const sectionObj = (test?.sections || []).find(s => s.name === sectionName);
                      const secLimit = sectionObj?.attemptAllowed || 0;
                      if (val !== '' && !isCurrentlyAttempted) {
                        if (secLimit > 0 && getSectionAttemptedCount(sectionName) >= secLimit) {
                          toast.error(`You have already attempted the maximum allowed ${secLimit} questions in section "${sectionName}". Please clear another answer in this section first.`);
                          return;
                        }
                        if (getAttemptedCount() >= (test?.maxQuestionsToAttempt || Infinity)) {
                          toast.error(`You have already attempted the maximum allowed ${test.maxQuestionsToAttempt} questions. Please clear another answer first.`);
                          return;
                        }
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
          <div className="flex-1 flex flex-col px-4 pb-4 pt-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Question Palette</p>
            {test.sections && test.sections.length > 0 ? (
              <div className="space-y-4">
                {test.sections.map((sec) => {
                  const secQuestions = questions.filter(quest => quest.section === sec.name);
                  if (secQuestions.length === 0) return null;
                  return (
                    <div key={sec.name} className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b pb-0.5">{sec.name}</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {secQuestions.map((qItem) => {
                          const idx = questions.findIndex(quest => quest._id === qItem._id);
                          return (
                            <PaletteItem
                              key={qItem._id}
                              number={idx + 1}
                              state={states[qItem._id]}
                              isActive={current === idx}
                              onClick={() => handleNavigateTo(idx)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Questions with no section */}
                {questions.some(quest => !quest.section) && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b pb-0.5">General</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {questions.filter(quest => !quest.section).map((qItem) => {
                        const idx = questions.findIndex(quest => quest._id === qItem._id);
                        return (
                          <PaletteItem
                            key={qItem._id}
                            number={idx + 1}
                            state={states[qItem._id]}
                            isActive={current === idx}
                            onClick={() => handleNavigateTo(idx)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5 p-1">
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
            )}
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

      {/* ─── Report Question Modal ────────────────────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Flag className="text-rose-500" size={18} /> Report Question Issue
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 leading-relaxed font-semibold">
                Notice an issue? Select the problem category below, and our academic team will review it.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-550 block mb-1">REASON / ISSUE TYPE</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border-2 border-slate-200 focus:border-brand-500 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none bg-white transition-all shadow-sm"
                >
                  <option value="wrong_answer">Incorrect Answer Key</option>
                  <option value="wrong_question">Incorrect Question Text</option>
                  <option value="typo">Typo / Formatting Issue</option>
                  <option value="image_missing">Image Not Loading</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-550 block mb-1">DESCRIPTION / EXPLANATION</label>
                <textarea
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full border-2 border-slate-200 focus:border-brand-500 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none bg-white transition-all shadow-sm resize-none"
                  placeholder="Provide details about the issue (e.g. option C is correct instead of A, missing info)..."
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportingState}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {reportingState ? <Loader2 size={13} className="animate-spin" /> : <Flag size={13} />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
