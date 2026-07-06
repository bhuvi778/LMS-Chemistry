import { useState, useEffect } from 'react';
import { ClipboardList, Trash2, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

export default function RevisionQueue() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [revealed, setRevealed] = useState({});

  const fetchRevisionQueue = () => {
    api.get('/tests/revision-queue')
      .then(({ data }) => {
        setQuestions(Array.isArray(data) ? data : []);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRevisionQueue();
  }, []);

  const toggleExplanation = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleReveal = (id) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRemove = async (questionId) => {
    try {
      await api.delete(`/tests/revision-queue/${questionId}`);
      toast.success('Question removed from Revision Queue');
      setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
    } catch (err) {
      toast.error(err.message || 'Failed to remove question');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-semibold">Loading revision queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Revision Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Re-practice and master the concepts behind questions you've saved for revision.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-700 font-bold rounded-2xl text-xs border border-amber-100/35">
          <ClipboardList size={14} />
          <span>{questions.length} Questions to Revise</span>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <ClipboardList size={28} />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">No Questions in Revision Queue</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Flag questions during test results or from the Mistakes Notebook to save them here for self-testing.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const isRevealed = !!revealed[q.questionId];
            return (
              <div key={q.questionId} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                {/* Card Header */}
                <div className="flex flex-wrap gap-2 justify-between items-center border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold rounded-full uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100/40">
                      Test: {q.testTitle || 'Practice Qs'}
                    </span>
                    {q.type && (
                      <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold rounded-full uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">
                        Type: {q.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReveal(q.questionId)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        isRevealed
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100'
                      }`}
                      title={isRevealed ? 'Hide answer' : 'Reveal correct answer'}
                    >
                      {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                    </button>
                    <button
                      onClick={() => handleRemove(q.questionId)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Remove from revision queue"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
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

                {/* Options List */}
                {q.type === 'mcq' && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correct;
                      let styleClass = 'border-slate-100 bg-slate-50/30 text-slate-700';

                      if (isRevealed && isCorrect) {
                        styleClass = 'border-emerald-200 bg-emerald-50/30 text-emerald-800 font-bold';
                      }

                      return (
                        <div key={oIdx} className={`border rounded-2xl p-3 flex items-start gap-3 text-xs sm:text-sm ${styleClass}`}>
                          <div className="mt-0.5">
                            {isRevealed && isCorrect ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                            )}
                          </div>
                          <span className="flex-1">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'msq' && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {q.options.map((opt, oIdx) => {
                      const correctSet = new Set(q.correctOptions || [q.correct]);
                      const isCorrect = correctSet.has(oIdx);
                      let styleClass = 'border-slate-100 bg-slate-50/30 text-slate-700';

                      if (isRevealed && isCorrect) {
                        styleClass = 'border-emerald-200 bg-emerald-50/30 text-emerald-800 font-bold';
                      }

                      return (
                        <div key={oIdx} className={`border rounded-2xl p-3 flex items-start gap-3 text-xs sm:text-sm ${styleClass}`}>
                          <div className="mt-0.5">
                            {isRevealed && isCorrect ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                            )}
                          </div>
                          <span className="flex-1">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'numerical' && isRevealed && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Correct Value:</span>
                      <span className="font-extrabold text-emerald-600">{q.correctNumerical}</span>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {isRevealed && q.explanation && (
                  <div className="pt-3 border-t border-slate-55 flex flex-col">
                    <button
                      onClick={() => toggleExplanation(q.questionId)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start"
                    >
                      <span>{expanded[q.questionId] ? 'Hide Explanation' : 'View Explanation'}</span>
                      <ArrowRight size={12} className={`transform transition-transform ${expanded[q.questionId] ? 'rotate-90' : ''}`} />
                    </button>
                    {expanded[q.questionId] && (
                      <div className="mt-3 p-4 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs sm:text-sm text-slate-600 leading-relaxed w-full">
                        <strong className="text-slate-800 block mb-1">Explanation:</strong>
                        <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
