import { useState, useEffect } from 'react';
import { Bookmark, Trash2, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

export default function SavedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchSaved = () => {
    api.get('/tests/saved-questions')
      .then(({ data }) => {
        setQuestions(Array.isArray(data) ? data : []);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const toggleExplanation = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRemove = async (questionId) => {
    try {
      await api.delete(`/tests/saved-questions/${questionId}`);
      toast.success('Question removed from Saved Questions');
      setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
    } catch (err) {
      toast.error(err.message || 'Failed to remove question');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-semibold">Loading saved questions...</span>
      </div>
    );
  }

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
            <div key={q.questionId} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              {/* Card Header */}
              <div className="flex flex-wrap gap-2 justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100/40">
                    Test: {q.testTitle || 'Practice Qs'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemove(q.questionId)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Remove from saved questions"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <div 
                  className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: `Q${idx + 1}. ${q.questionText || ''}` }} 
                />
                {q.image && (
                  <div className="mt-3 max-w-lg border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 p-1.5 shadow-sm">
                    <img src={q.image} alt="Question Graphic" className="max-h-60 object-contain rounded-xl" />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid sm:grid-cols-2 gap-2.5">
                {(q.options || []).map((option, oIdx) => {
                  const isCorrect = oIdx === q.correct;
                  const optText = typeof option === 'string' ? option : option.text || '';
                  return (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                        isCorrect
                          ? 'border-emerald-250 bg-emerald-50/40 text-emerald-800'
                          : 'border-slate-100 bg-slate-50/50 text-slate-600'
                      }`}
                    >
                      <span className="leading-snug flex items-start gap-1">
                        <strong className="mr-1.5">{String.fromCharCode(65 + oIdx)}.</strong>
                        <span dangerouslySetInnerHTML={{ __html: optText }} />
                      </span>
                      {isCorrect && <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation section toggle */}
              <div className="pt-2 border-t border-slate-55">
                <button
                  onClick={() => toggleExplanation(q.questionId)}
                  className="flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-900 font-bold"
                >
                  <span>{expanded[q.questionId] ? 'Hide' : 'Show'} Solution Explanation</span>
                  <ArrowRight size={13} className={`transform transition-transform ${expanded[q.questionId] ? 'rotate-90' : ''}`} />
                </button>

                {expanded[q.questionId] && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-850 mb-1">💡 Solution & Logic:</p>
                    <div dangerouslySetInnerHTML={{ __html: q.explanation || 'No explanation provided.' }} />
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
