import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BookOpen, Clock, Download, ArrowRight, Globe, Loader2, ClipboardList, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader.jsx';

export default function MyTestSeries() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [enrollments, setEnrollments] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrollRes, seriesRes] = await Promise.all([
          api.get('/enroll/test-series/me'),
          api.get('/tests/series'),
        ]);
        setEnrollments(enrollRes.data || []);
        setAllSeries(seriesRes.data || []);
      } catch {
        try {
          const enrollRes = await api.get('/enroll/test-series/me');
          setEnrollments(enrollRes.data || []);
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enrolledSeriesIds = new Set(enrollments.map(e => String(e.testSeries?._id || e.testSeries)));

  const downloadInvoice = async (paymentId) => {
    try {
      const resp = await api.get(`/payment/invoice/${paymentId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Invoice not available');
    }
  };

  const tabs = [
    { key: 'enrolled', label: 'My Test Series', count: enrollments.length },
    { key: 'all', label: 'All Series', count: allSeries.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Test Series</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your enrolled test series or explore new ones.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 flex items-center justify-center min-h-[300px]">
          <LogoLoader size={60} text="Loading test series..." />
        </div>
      ) : activeTab === 'enrolled' ? (
        /* ── My Enrolled Test Series ── */
        enrollments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Layers size={28} />
            </div>
            <h3 className="font-bold text-slate-700 text-lg">No Enrolled Test Series</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              You haven't enrolled in any test series yet. Browse all test series and sign up!
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-brand text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-soft hover:-translate-y-0.5 transition-all"
            >
              Browse All Test Series <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((e) => {
              const ts = e.testSeries || {};
              return (
                <div key={e._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white">
                      <Layers size={48} className="text-white/80" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {ts.categories?.[0] || 'Chemistry'}
                      </span>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                        {ts.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{ts.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-550 pt-1">
                        <span className="flex items-center gap-1">
                          <ClipboardList size={12} /> {ts.tests?.length || 0} Tests
                        </span>
                        {e.validUntil && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Expires: {new Date(e.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 pt-0 space-y-2">
                    <Link
                      to={`/test-series/${ts._id}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-brand hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                    >
                      Explore & Take Tests
                    </Link>
                    {e.paymentId && (
                      <button
                        onClick={() => downloadInvoice(e.paymentId)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-brand-700 transition py-2 border border-slate-200 rounded-2xl hover:bg-slate-50"
                      >
                        <Download size={12} /> Download Invoice
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── All Test Series ── */
        allSeries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Globe size={40} className="mx-auto mb-4 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-lg">No test series available</h3>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSeries.map((series) => {
              const isEnrolled = enrolledSeriesIds.has(String(series._id));
              return (
                <div key={series._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-brand-600 to-purple-650 flex items-center justify-center text-white">
                      <Layers size={48} className="text-white/80" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {series.categories?.[0] || 'Chemistry'}
                      </span>
                      {isEnrolled && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                          Enrolled
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                        {series.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{series.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <ClipboardList size={12} /> {series.tests?.length || 0} Tests
                        </span>
                        <span className="font-bold text-brand-700">₹{series.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    {isEnrolled ? (
                      <Link
                        to={`/test-series/${series._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-brand hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                      >
                        Explore & Take Tests
                      </Link>
                    ) : (
                      <Link
                        to={`/test-series/${series._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 border border-brand-200 text-brand-700 hover:bg-brand-50 font-bold py-2.5 rounded-2xl text-xs transition-all"
                      >
                        View Details & Enroll <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
