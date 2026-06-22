import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, Loader2, AlertTriangle, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

const REASON_MAP = {
  wrong_answer: 'Incorrect Answer Key',
  wrong_question: 'Incorrect Question Text',
  typo: 'Typo / Formatting Issue',
  image_missing: 'Image Not Loading',
  other: 'Other Issue',
};

const STATUS_MAP = {
  pending: { label: 'UNDER REVIEW', bg: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  reviewed: { label: 'REVIEWED', bg: 'bg-blue-50 text-blue-700 border-blue-100', icon: AlertTriangle },
  fixed: { label: 'RESOLVED', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  dismissed: { label: 'CLOSED / NO ISSUE', bg: 'bg-slate-100 text-slate-650 border-slate-200', icon: AlertCircle },
};

export default function ReportedQuestions() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    api.get('/tests/reported-questions/me')
      .then(({ data }) => {
        setReports(Array.isArray(data) ? data : []);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-semibold">Loading reported questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Reported Questions</h1>
          <p className="text-sm text-slate-500 mt-1">Track issues or error corrections you reported in the practice tests.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <AlertCircle size={28} />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">No Reported Issues</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            You haven't reported any question issues. If you find errors or typos in questions, let us know!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((item) => {
            const statusConfig = STATUS_MAP[item.status] || STATUS_MAP.pending;
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={item._id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                {/* Header block */}
                <div className="flex justify-between items-start gap-3 border-b border-slate-50 pb-3 flex-wrap">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                      TEST: {item.testTitle || 'Practice Qs'}
                    </span>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Reported on {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-1 border ${statusConfig.bg}`}>
                    <StatusIcon size={11} />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                {/* Question summary info */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1.5">
                  <p className="text-[9.5px] uppercase font-bold text-slate-400">Question Text</p>
                  <div 
                    className="font-semibold text-slate-700 leading-relaxed italic" 
                    dangerouslySetInnerHTML={{ __html: item.questionText || '' }} 
                  />
                </div>

                {/* Student feedback reason */}
                <div className="text-xs space-y-1 text-slate-700">
                  <span className="font-bold text-slate-800">Your Feedback Reason:</span>
                  <div className="leading-relaxed bg-brand-50/20 p-3 rounded-2xl border border-brand-100/10 space-y-1">
                    <div className="font-bold text-brand-700">{REASON_MAP[item.reason] || item.reason}</div>
                    {item.description && <div className="text-slate-650 mt-1 italic">"{item.description}"</div>}
                  </div>
                </div>

                {/* Admin reply if present */}
                {item.adminNote && (
                  <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex gap-3 text-xs text-emerald-800 items-start">
                    <MessageSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-emerald-950">Official Response from Academics</h5>
                      <p className="mt-1 leading-relaxed text-emerald-700 font-semibold">{item.adminNote}</p>
                    </div>
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
