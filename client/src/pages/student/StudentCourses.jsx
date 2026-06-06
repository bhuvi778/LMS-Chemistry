import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BookOpen, Clock, Download, Loader2, ArrowRight, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentCourses() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const getValidityText = (c) => {
    if (!c) return '';
    const v = c.validity;
    if (v?.type === 'lifetime') return 'Lifetime Access';
    if (v?.type === 'duration') return `${v.durationValue} ${v.durationUnit}`;
    if (v?.type === 'endDate' && v.endDate) {
      return `Until ${new Date(v.endDate).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (c.durationMonths) return `${c.durationMonths} months`;
    return 'Lifetime Access';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrollRes, coursesRes] = await Promise.all([
          api.get('/enroll/me'),
          api.get('/courses'),
        ]);
        setEnrollments(enrollRes.data);
        setAllCourses(coursesRes.data?.courses || coursesRes.data || []);
      } catch {
        // fallback
        try {
          const enrollRes = await api.get('/enroll/me');
          setEnrollments(enrollRes.data);
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enrolledCourseIds = new Set(enrollments.map(e => String(e.course?._id || e.course)));

  const downloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const resp = await api.get(`/payment/invoice/${paymentId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Invoice not available');
    }
  };

  const tabs = [
    { key: 'enrolled', label: 'My Enrolled Courses', count: enrollments.length },
    { key: 'all', label: 'All Courses', count: allCourses.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your enrolled courses or explore new ones.</p>
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
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
          <span className="font-semibold">Loading courses...</span>
        </div>
      ) : activeTab === 'enrolled' ? (
        /* ── My Enrolled Courses ── */
        enrollments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <BookOpen size={28} />
            </div>
            <h3 className="font-bold text-slate-700 text-lg">No Enrolled Courses</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              You haven't enrolled in any courses yet. Browse all courses and sign up!
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-brand text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-soft hover:-translate-y-0.5 transition-all"
            >
              Browse All Courses <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((e) => (
              <div key={e._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={e.course?.thumbnail}
                      alt={e.course?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {e.course?.category || 'Chemistry'}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                      {e.course?.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {getValidityText(e.course)}
                      </span>
                      <span>•</span>
                      <span>Paid AED {e.pricePaid?.toLocaleString()}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
                        <span>Course Progress</span>
                        <span>{e.progress || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-100">
                        <div
                          className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                          style={{ width: `${e.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0 space-y-2">
                  <Link
                    to={`/student/learn/${e.course?._id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-brand hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                  >
                    Continue Learning
                  </Link>
                  {e.paymentId && e.paymentId !== 'FREE' && !e.paymentId?.startsWith('FREE_') && (
                    <button
                      onClick={() => downloadInvoice(e.paymentId, e.invoiceNumber)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-brand-700 transition py-2 border border-slate-200 rounded-2xl hover:bg-slate-50"
                    >
                      <Download size={12} /> Download Invoice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── All Courses ── */
        allCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <Globe size={40} className="mx-auto mb-4 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-lg">No courses available</h3>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(String(course._id));
              return (
                <div key={course._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {course.category || 'Chemistry'}
                      </span>
                      {isEnrolled && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                          Enrolled
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {getValidityText(course)}
                        </span>
                        <span className="font-bold text-brand-700">AED {course.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    {isEnrolled ? (
                      <Link
                        to={`/student/learn/${course._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-brand hover:opacity-90 text-white font-bold py-2.5 rounded-2xl text-xs shadow-soft transition-all"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <Link
                        to={`/courses/${course._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 border border-brand-200 text-brand-700 hover:bg-brand-50 font-bold py-2.5 rounded-2xl text-xs transition-all"
                      >
                        View Details <ArrowRight size={13} />
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
