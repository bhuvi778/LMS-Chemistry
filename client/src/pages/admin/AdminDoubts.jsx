import { useEffect, useState } from 'react';
import { HelpCircle, CheckCircle, Clock, Send, AlertCircle, Filter } from 'lucide-react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  answered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function AdminDoubts() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ open: 0, answered: 0 });

  const load = () => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    Promise.all([
      api.get(`/doubts/admin${params}`),
      api.get('/doubts/admin/stats'),
    ]).then(([dr, sr]) => {
      setDoubts(dr.data.doubts || []);
      setStats(sr.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const submitAnswer = async () => {
    if (!answer.trim()) { toast.error('Answer cannot be empty'); return; }
    setSubmitting(true);
    try {
      await api.put(`/doubts/admin/${selected._id}/answer`, { answer });
      toast.success('Answer submitted! Student will be notified.');
      setSelected(null);
      setAnswer('');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (id, status) => {
    await api.put(`/doubts/admin/${id}/status`, { status });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><HelpCircle size={22} /> Manage Doubts</h1>
          <p className="text-slate-500 text-sm">Answer student questions</p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-bold text-amber-600">{stats.open}</div>
            <div className="text-xs text-slate-500">Open</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="text-xl font-bold text-emerald-600">{stats.answered}</div>
            <div className="text-xs text-slate-500">Answered</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['open', 'answered', 'closed', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition capitalize ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Doubts list */}
        <div className="space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-slate-100" />)
          ) : doubts.length === 0 ? (
            <div className="card p-10 text-center text-slate-400">
              <HelpCircle size={40} className="mx-auto mb-2 opacity-30" />
              <p>No {filter !== 'all' ? filter : ''} doubts</p>
            </div>
          ) : (
            doubts.map((d) => (
              <div
                key={d._id}
                onClick={() => { setSelected(d); setAnswer(''); }}
                className={`card p-4 cursor-pointer transition hover:shadow-md ${selected?._id === d._id ? 'ring-2 ring-brand-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[d.status]}`}>
                        {d.status}
                      </span>
                      {d.course && <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{d.course.title}</span>}
                      {d.subject && <span className="text-[10px] text-slate-500">{d.subject}</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">{d.question}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[9px] font-bold grid place-items-center uppercase">
                        {d.student?.name?.[0]}
                      </div>
                      <span className="text-[11px] text-slate-500">{d.student?.name} · {d.student?.studentId}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {d.status === 'answered' ? <CheckCircle size={16} className="text-emerald-500" /> : <Clock size={16} className="text-amber-400" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Answer panel */}
        <div className="lg:sticky lg:top-6">
          {selected ? (
            <div className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-slate-800">Reply to Doubt</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Student: {selected.student?.name}</p>
                {selected.subject && <p className="text-xs text-brand-600 mb-1">Topic: {selected.subject}</p>}
                <p className="text-sm text-slate-800">{selected.question}</p>
              </div>

              {selected.answer && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">Previous Answer:</p>
                  <p className="text-sm text-slate-700">{selected.answer}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {selected.answer ? 'Update Answer' : 'Write Answer'}
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  placeholder="Provide a detailed, helpful answer..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitAnswer}
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Send size={14} /> {submitting ? 'Sending...' : 'Send Answer'}
                </button>
                {selected.status !== 'closed' && (
                  <button
                    onClick={() => changeStatus(selected._id, 'closed')}
                    className="btn-outline text-sm px-3"
                    title="Close without answering"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center text-slate-400">
              <AlertCircle size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a doubt to answer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
