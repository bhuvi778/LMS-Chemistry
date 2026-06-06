import { useState } from 'react';
import { Bookmark, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SavedQuestions() {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      subject: 'Physical Chemistry',
      topic: 'Chemical Kinetics',
      difficulty: 'Intermediate',
      question: 'For a first-order reaction, the time required for 99.9% completion of the reaction is how many times that of its half-life (t1/2)?',
      options: ['Approximately 5 times', 'Approximately 10 times', 'Approximately 15 times', 'Approximately 20 times'],
      correctAnswer: 1, // index 1: Approximately 10 times
      explanation: 'For first order reaction, t = (2.303/k) * log(100/(100-99.9)) = (2.303/k) * log(1000) = (2.303/k) * 3 = 6.909/k. Half life t1/2 = 0.693/k. Hence, t(99.9%) / t1/2 = 6.909 / 0.693 ≈ 10.'
    },
    {
      id: 2,
      subject: 'Organic Chemistry',
      topic: 'Hydrocarbons',
      difficulty: 'Basic',
      question: 'Identify the product formed when calcium carbide reacts with water:',
      options: ['Methane', 'Ethane', 'Acetylene', 'Ethylene'],
      correctAnswer: 2, // Acetylene
      explanation: 'Calcium carbide reacts with water to produce acetylene gas and calcium hydroxide: CaC2 + 2H2O -> C2H2 + Ca(OH)2.'
    },
    {
      id: 3,
      subject: 'Inorganic Chemistry',
      topic: 'Coordination Compounds',
      difficulty: 'Advanced',
      question: 'The spin-only magnetic moment of [CoF6]3- is approximately:',
      options: ['0 BM', '1.73 BM', '2.83 BM', '4.90 BM'],
      correctAnswer: 3, // 4.90 BM
      explanation: 'Co3+ has d6 configuration. F- is a weak field ligand, so high-spin complex is formed. It has 4 unpaired electrons. Spin-only magnetic moment μ = sqrt(n(n+2)) = sqrt(4(6)) = sqrt(24) ≈ 4.90 BM.'
    }
  ]);

  const [expanded, setExpanded] = useState({});

  const toggleExplanation = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRemove = (id, title) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.success(`Removed question from Saved Questions`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Saved Questions</h1>
          <p className="text-sm text-slate-500 mt-1">Review, study, and test yourself on questions you've bookmarked.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 text-brand-700 font-bold rounded-2xl text-xs border border-brand-100/35">
          <Bookmark size={14} />
          <span>{questions.length} Saved Questions</span>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Bookmark size={28} />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">No Saved Questions</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Bookmark questions during practice tests and practice quizzes to save them for revision.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              {/* Card Header */}
              <div className="flex flex-wrap gap-2 justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                    q.subject === 'Organic Chemistry' ? 'bg-amber-50 text-amber-700' :
                    q.subject === 'Inorganic Chemistry' ? 'bg-rose-50 text-rose-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {q.subject}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">•</span>
                  <span className="text-xs text-slate-500 font-semibold">{q.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                    q.difficulty === 'Easy' || q.difficulty === 'Basic' ? 'bg-emerald-50 text-emerald-700' :
                    q.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700' :
                    'bg-rose-50 text-rose-700'
                  }`}>
                    {q.difficulty}
                  </span>
                  <button
                    onClick={() => handleRemove(q.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Remove from saved questions"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <p className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed">
                  Q{idx + 1}. {q.question}
                </p>
              </div>

              {/* Options */}
              <div className="grid sm:grid-cols-2 gap-2.5">
                {q.options.map((option, oIdx) => {
                  const isCorrect = oIdx === q.correctAnswer;
                  return (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                          : 'border-slate-100 bg-slate-50/50 text-slate-600'
                      }`}
                    >
                      <span className="leading-snug">
                        <strong className="mr-1.5">{String.fromCharCode(65 + oIdx)}.</strong>
                        {option}
                      </span>
                      {isCorrect && <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation section toggle */}
              <div className="pt-2 border-t border-slate-50">
                <button
                  onClick={() => toggleExplanation(q.id)}
                  className="flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-900 font-bold"
                >
                  <span>{expanded[q.id] ? 'Hide' : 'Show'} Solution Explanation</span>
                  <ArrowRight size={13} className={`transform transition-transform ${expanded[q.id] ? 'rotate-90' : ''}`} />
                </button>

                {expanded[q.id] && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-850 mb-1">💡 Solution & Logic:</p>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
