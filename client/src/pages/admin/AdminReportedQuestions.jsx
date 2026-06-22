import { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle2, Clock, MessageSquare, Loader2, 
  AlertTriangle, Filter, Save, X, Search, ChevronRight, User, BookOpen 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

const REASON_MAP = {
  wrong_answer: 'Incorrect Answer Key',
  wrong_question: 'Incorrect Question Text',
  typo: 'Typo / Formatting Issue',
  image_missing: 'Image Not Loading',
  other: 'Other Issue',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', bg: 'bg-amber-50 text-amber-700 border-amber-250', icon: Clock },
  reviewed: { label: 'Reviewed', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertTriangle },
  fixed: { label: 'Fixed / Resolved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-250', icon: CheckCircle2 },
  dismissed: { label: 'Closed / Dismissed', bg: 'bg-slate-100 text-slate-650 border-slate-200', icon: AlertCircle },
};

export default function AdminReportedQuestions() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Form state for resolution
  const [statusInput, setStatusInput] = useState('reviewed');
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = () => {
    setLoading(true);
    api.get('/tests/admin/reported-questions')
      .then(({ data }) => {
        setReports(Array.isArray(data) ? data : []);
      })
      .catch((err) => toast.error(err.message || 'Failed to fetch reports'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openReport = (report) => {
    setSelectedReport(report);
    setStatusInput(report.status || 'reviewed');
    setNoteInput(report.adminNote || '');
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/tests/admin/reported-questions/${selectedReport._id}`, {
        status: statusInput,
        adminNote: noteInput,
      });
      toast.success('Report status updated successfully!');
      
      // Update local state
      setReports((prev) => prev.map((r) => r._id === selectedReport._id ? { ...r, status: data.status, adminNote: data.adminNote } : r));
      setSelectedReport(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filteredReports = reports.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const textToSearch = `${r.questionText} ${r.testTitle} ${r.user?.name} ${r.description}`.toLowerCase();
    const matchesSearch = textToSearch.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countByStatus = (status) => reports.filter(r => r.status === status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-450">
        <Loader2 size={36} className="animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-semibold">Loading student reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">Reported Questions Console</h1>
        <p className="text-slate-500 mt-1">Review, address, and reply to question errors reported by students during tests.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', count: reports.length, bg: 'bg-white border-slate-100', text: 'text-slate-800' },
          { label: 'Pending Review', count: countByStatus('pending'), bg: 'bg-amber-50/40 border-amber-100', text: 'text-amber-700' },
          { label: 'Resolved / Fixed', count: countByStatus('fixed'), bg: 'bg-emerald-50/40 border-emerald-100', text: 'text-emerald-700' },
          { label: 'Closed / Dismissed', count: countByStatus('dismissed'), bg: 'bg-slate-50 border-slate-200', text: 'text-slate-500' },
        ].map((card, i) => (
          <div key={i} className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between ${card.bg}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</span>
            <span className={`text-3xl font-black mt-2 leading-none ${card.text}`}>{card.count}</span>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { value: 'all', label: 'All Reports' },
            { value: 'pending', label: 'Pending' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'fixed', label: 'Fixed / Resolved' },
            { value: 'dismissed', label: 'Dismissed' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                filterStatus === btn.value
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-650 border-slate-200 hover:border-brand-300'
              }`}
            >
              {btn.label} {filterStatus === btn.value ? `(${filteredReports.length})` : `(${reports.filter(r => btn.value === 'all' || r.status === btn.value).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            className="input pl-10 py-2 text-sm"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Reports list */}
        <div className="lg:col-span-2 space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
              <AlertCircle size={36} className="text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">No Reports Found</h3>
              <p className="text-slate-400 text-xs mt-1">Try changing your filters or searching for something else.</p>
            </div>
          ) : (
            filteredReports.map((r) => {
              const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              
              return (
                <div
                  key={r._id}
                  onClick={() => openReport(r)}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.005] ${
                    selectedReport?._id === r._id ? 'border-brand-500 ring-2 ring-brand-50' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 flex-wrap border-b border-slate-50 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{r.user?.name || 'Unknown Student'}</span>
                      <span className="text-xs text-slate-350">•</span>
                      <span className="text-xs text-slate-400 font-mono">{r.user?.studentId}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-1 border ${statusCfg.bg}`}>
                      <StatusIcon size={10} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Test / Exam</span>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug flex items-center gap-1">
                        <BookOpen size={14} className="text-slate-400" /> {r.testTitle || 'Practice Test'}
                      </h4>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Question Text snippet</span>
                      <div 
                        className="text-xs text-slate-700 font-semibold line-clamp-2 mt-0.5 leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: r.questionText || '' }} 
                      />
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-2.5 py-1 rounded-lg">
                        ⚠ {REASON_MAP[r.reason] || r.reason}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Resolution panel */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 sticky top-24">
          <h3 className="font-bold text-slate-800 border-b pb-2 text-base">Resolution Console</h3>
          
          {!selectedReport ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              <AlertCircle size={28} className="mx-auto mb-2 text-slate-300" />
              Select a report card from the list to review, update its status, and send replies.
            </div>
          ) : (
            <form onSubmit={handleResolve} className="space-y-4">
              {/* Report summary info */}
              <div className="space-y-2.5 text-xs text-slate-650 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[9px] block text-slate-400 tracking-wider">Reporter details</span>
                  <div className="font-bold text-slate-800">{selectedReport.user?.name} ({selectedReport.user?.email})</div>
                </div>
                <div>
                  <span className="font-bold text-slate-850 uppercase text-[9px] block text-slate-400 tracking-wider">Report Description</span>
                  <div className="italic text-slate-700">"{selectedReport.description || 'No description provided.'}"</div>
                </div>
              </div>

              {/* Status input */}
              <div>
                <label className="label text-xs">REPORT STATUS</label>
                <select
                  className="input py-2 text-xs"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                >
                  <option value="pending">Pending Review</option>
                  <option value="reviewed">Reviewed (In Progress)</option>
                  <option value="fixed">Fixed / Resolved</option>
                  <option value="dismissed">Closed / Dismissed</option>
                </select>
              </div>

              {/* Reply Note */}
              <div>
                <label className="label text-xs">ADMIN RESPONSE NOTE (Shown to student)</label>
                <textarea
                  rows={4}
                  className="input text-xs"
                  placeholder="Type official reply or resolution details..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 justify-center text-xs py-2"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Resolution
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="btn-outline text-xs py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
