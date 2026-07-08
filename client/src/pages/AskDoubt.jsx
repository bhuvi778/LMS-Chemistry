import { useEffect, useState } from 'react';
import { HelpCircle, Send, CheckCircle, Clock, ChevronDown, ChevronUp, Plus, BookOpen } from 'lucide-react';
import api from '../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  answered: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

export default function AskDoubt() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ course: '', subject: '', question: '' });
  const [submitting, setSubmitting] = useState(false);
  const [usage, setUsage] = useState({ planType: 'none', limit: 0, used: 0, remaining: 0 });

  const load = () => {
    api.get('/doubts/my').then((r) => setDoubts(r.data.doubts || [])).finally(() => setLoading(false));
    api.get('/doubts/usage')
      .then((res) => {
        setUsage(res.data || { planType: 'none', limit: 0, used: 0, remaining: 0 });
      })
      .catch((err) => {
        console.error('Failed to load doubt usage', err);
      });
  };

  useEffect(() => {
    load();
    api.get('/enroll/me').then((r) => setCourses(r.data.map((e) => e.course).filter(Boolean))).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.question.trim()) { toast.error('Please enter your question'); return; }
    setSubmitting(true);
    try {
      await api.post('/doubts', form);
      toast.success('Doubt submitted! We will answer soon.');
      setForm({ course: '', subject: '', question: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDoubt = async (id) => {
    if (!window.confirm('Are you sure you want to mark this doubt as resolved/closed?')) return;
    try {
      await api.put(`/doubts/${id}/close`);
      toast.success('Doubt marked as resolved/closed!');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to close doubt');
    }
  };

  const filtered = filter === 'all' ? doubts : doubts.filter((d) => d.status === filter);

  const quotaExceeded = usage.limit !== -1 && usage.remaining <= 0;

  return (
    <div>
      <section className="bg-gradient-soft py-14">
        <div className="container-x flex items-start justify-between flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
              <HelpCircle size={20} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold gradient-text">Ask a Doubt</h1>
              <p className="text-slate-500 text-sm">Get answers from our chemistry experts</p>
              {usage && usage.planType !== 'none' && (
                <div className="text-xs font-semibold mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    usage.planType === 'infinity' ? 'bg-amber-100 text-amber-800 bg-amber-50 border border-amber-200' :
                    usage.planType === 'pro' ? 'bg-violet-100 text-violet-800 border border-violet-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {usage.planType === 'infinity' ? 'Infinity' : usage.planType === 'pro' ? 'Pro' : 'Starter'} Plan
                  </span>
                  <span className="text-slate-300 font-bold">•</span>
                  <span className="text-slate-600">
                    {usage.limit === -1 ? (
                      <span className="text-emerald-600 font-bold">✓ Unlimited Daily Doubts</span>
                    ) : (
                      <span>Daily Doubts: <strong>{usage.used}</strong> / <strong>{usage.limit}</strong> used ({usage.remaining} left)</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (quotaExceeded) {
                toast.error(`Daily doubt limit reached! Your ${usage.planType === 'pro' ? 'Pro Plan' : 'Starter Plan'} only allows ${usage.limit} doubt(s) per day. Upgrade to a higher plan for more doubts!`);
                return;
              }
              setShowForm((v) => !v);
            }}
            disabled={quotaExceeded}
            className={`btn-primary flex items-center gap-2 ${
              quotaExceeded ? 'opacity-50 cursor-not-allowed bg-slate-400 border-slate-400 hover:bg-slate-400' : ''
            }`}
          >
            <Plus size={16} /> Ask New Doubt
          </button>
        </div>
      </section>

      <section className="section">
        <div className="container-x max-w-3xl">
          {/* New Doubt Form */}
          {showForm && (
            <div className="card p-6 mb-8 border-2 border-brand-200 bg-brand-50/30">
              <h2 className="font-bold text-lg mb-4 text-brand-900">Submit Your Doubt</h2>
              <form onSubmit={submit} className="space-y-4">
                {courses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Related Course (optional)</label>
                    <select
                      value={form.course}
                      onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    >
                      <option value="">General / No specific course</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Topic</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Organic Chemistry, Periodic Table..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Question <span className="text-rose-500">*</span></label>
                  <textarea
                    value={form.question}
                    onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                    rows={4}
                    placeholder="Describe your doubt in detail..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                    <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Doubt'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'open', 'answered', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition capitalize ${
                  filter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'All Doubts' : s}
                {s === 'open' && doubts.filter((d) => d.status === 'open').length > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                    {doubts.filter((d) => d.status === 'open').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-slate-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <HelpCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p>No doubts yet. Ask your first question!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((d) => (
                <div key={d._id} className={`card overflow-hidden transition ${d.status === 'answered' ? 'border-emerald-200' : ''}`}>
                  <div
                    className="p-4 cursor-pointer flex items-start justify-between gap-3"
                    onClick={() => setExpanded(expanded === d._id ? null : d._id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[d.status]}`}>
                          {d.status}
                        </span>
                        {d.course && (
                          <span className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <BookOpen size={10} /> {d.course.title}
                          </span>
                        )}
                        {d.subject && (
                          <span className="text-[11px] text-slate-500">{d.subject}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{d.question}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {d.status === 'answered' ? <CheckCircle size={18} className="text-emerald-500" /> : <Clock size={18} className="text-amber-400" />}
                    </div>
                    {expanded === d._id ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                  </div>

                  {expanded === d._id && (
                    <div className="border-t border-slate-100 p-4 space-y-3">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Your Question</p>
                        <p className="text-sm text-slate-800">{d.question}</p>
                      </div>
                      {d.answer ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                          <p className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                            <CheckCircle size={12} /> Expert Answer
                          </p>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">{d.answer}</p>
                          {d.answeredAt && (
                            <p className="text-[11px] text-slate-400 mt-2">
                              Answered on {new Date(d.answeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                          <Clock size={14} /> Your doubt is pending review. You'll get notified once answered.
                        </div>
                      )}
                      {d.status !== 'closed' && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleCloseDoubt(d._id)}
                            className="px-3 py-1.5 text-xs font-extrabold border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 rounded-xl transition cursor-pointer"
                          >
                            Mark as Resolved / Close
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
