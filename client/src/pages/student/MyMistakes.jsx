import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Minus, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

export default function MyMistakes() {
  const [mistakes, setMistakes] = useState([]);
  const [revisionIds, setRevisionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchData = async () => {
    try {
      const [mRes, rRes] = await Promise.all([
        api.get('/tests/my-mistakes'),
        api.get('/tests/revision-queue')
      ]);
      setMistakes(mRes.data || []);
      setRevisionIds(new Set((rRes.data || []).map(item => item.questionId)));
    } catch (err) {
      toast.error(err.message || 'Failed to fetch mistakes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExplanation = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleRevision = async (q) => {
    const isSaved = revisionIds.has(q.questionId);
    try {
      if (isSaved) {
        await api.delete(`/tests/revision-queue/${q.questionId}`);
        setRevisionIds(prev => {
          const next = new Set(prev);
          next.delete(q.questionId);
          return next;
        });
        toast.success('Removed from Revision Queue');
      } else {
        await api.post('/tests/revision-queue', {
          questionId: q.questionId,
          testId: q.testId,
          questionText: q.questionText,
          options: q.options,
          correct: q.correct,
          correctOptions: q.correctOptions,
          correctNumerical: q.correctNumerical,
          type: q.type,
          explanation: q.explanation,
          image: q.image,
          testTitle: q.testTitle
        });
        setRevisionIds(prev => {
          const next = new Set(prev);
          next.add(q.questionId);
          return next;
        });
        toast.success('Added to Revision Queue');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update Revision Queue');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-semibold">Loading your mistakes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">My Mistakes (Wrong Questions)</h1>
          <p className="text-sm text-slate-500 mt-1">Review questions you got wrong during practice tests to learn from your mistakes.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-700 font-bold rounded-2xl text-xs border border-red-100/35">
          <AlertCircle size={14} />
          <span>{mistakes.length} Mistakes Identified</span>
        </div>
      </div>

      {mistakes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">No Mistakes Yet!</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Great job! You haven't made any mistakes in your attempted tests yet. Keep up the good work!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {mistakes.map((q, idx) => {
            const isSaved = revisionIds.has(q.questionId);
            return (
              <div key={q.questionId} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                {/* Card Header */}
                <div className="flex flex-wrap gap-2 justify-between items-center border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold rounded-full uppercase tracking-wider bg-red-50 text-red-700 border border-red-100/40">
                      Test: {q.testTitle || 'Practice Qs'}
                    </span>
                    {q.type && (
                      <span className="px-2.5 py-0.5 text-[9.5px] font-extrabold rounded-full uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">
                        Type: {q.type}
                      </span>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => handleToggleRevision(q)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isSaved
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSaved ? <Minus size={12} /> : <Plus size={12} />}
                      {isSaved ? 'In Revision Queue' : 'Add to Revision Queue'}
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
                      const isSelected = oIdx === Number(q.selected);
                      let styleClass = 'border-slate-100 bg-slate-50/30 text-slate-700';

                      if (isCorrect) {
                        styleClass = 'border-emerald-200 bg-emerald-50/30 text-emerald-800 font-bold';
                      } else if (isSelected) {
                        styleClass = 'border-rose-200 bg-rose-50/30 text-rose-800 font-bold';
                      }

                      return (
                        <div key={oIdx} className={`border rounded-2xl p-3 flex items-start gap-3 text-xs sm:text-sm ${styleClass}`}>
                          <div className="mt-0.5">
                            {isCorrect ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : isSelected ? (
                              <XCircle size={16} className="text-rose-500" />
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
                      const selectedSet = new Set(Array.isArray(q.selected) ? q.selected : [q.selected]);
                      const isCorrect = correctSet.has(oIdx);
                      const isSelected = selectedSet.has(oIdx);
                      let styleClass = 'border-slate-100 bg-slate-50/30 text-slate-700';

                      if (isCorrect) {
                        styleClass = 'border-emerald-200 bg-emerald-50/30 text-emerald-800 font-bold';
                      } else if (isSelected) {
                        styleClass = 'border-rose-200 bg-rose-50/30 text-rose-800 font-bold';
                      }

                      return (
                        <div key={oIdx} className={`border rounded-2xl p-3 flex items-start gap-3 text-xs sm:text-sm ${styleClass}`}>
                          <div className="mt-0.5">
                            {isCorrect ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : isSelected ? (
                              <XCircle size={16} className="text-rose-500" />
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

                {q.type === 'numerical' && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Your Answer:</span>
                      <span className="font-extrabold text-rose-600">{q.selected}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Correct Value:</span>
                      <span className="font-extrabold text-emerald-600">{q.correctNumerical}</span>
                    </div>
                  </div>
                )}

                {/* Explanation toggler */}
                {q.explanation && (
                  <div className="pt-3 border-t border-slate-50">
                    <button
                      onClick={() => toggleExplanation(q.questionId)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <span>{expanded[q.questionId] ? 'Hide Explanation' : 'View Explanation'}</span>
                      <ArrowRight size={12} className={`transform transition-transform ${expanded[q.questionId] ? 'rotate-90' : ''}`} />
                    </button>
                    {expanded[q.questionId] && (
                      <div className="mt-3 p-4 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
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
