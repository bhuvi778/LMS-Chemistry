import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader.jsx';
import { 
  Users, 
  Calendar, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Star,
  FileText,
  AlertCircle,
  MessageCircle
} from 'lucide-react';

const DEFAULT_MENTORSHIP_SETTINGS = {
  enabled: true,
  availableDates: [],
  availableSlots: [],
  mentorshipMonthlyLimit: 2,
  doubtMonthlyLimit: 4,
  doubtWeeklyLimit: 1,
};

export default function Session() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Plan gating states
  const [enrollments, setEnrollments] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    checkAccessAndFetchBookings();
  }, []);

  // Request Form States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [sessionType, setSessionType] = useState('mentorship');
  const [mentorshipSettings, setSessionSettings] = useState(DEFAULT_MENTORSHIP_SETTINGS);

  const loadSessionSettings = async (enrollsList) => {
    try {
      const activeEnrolls = enrollsList || enrollments;
      const infinityEnroll = activeEnrolls.find(e => e.paymentStatus === 'paid' && e.planType === 'infinity');
      const params = {};
      if (infinityEnroll) {
        const courseDoc = infinityEnroll.course;
        if (courseDoc) {
          params.courseId = courseDoc._id || courseDoc;
          params.category = courseDoc.category || (courseDoc.categories && courseDoc.categories[0]) || '';
        }
      }
      const res = await api.get('/ace-track/mentorship/settings', { params });
      setSessionSettings({ ...DEFAULT_MENTORSHIP_SETTINGS, ...res.data });
      
      if (res.data.availableSlots && res.data.availableSlots.length > 0) {
        setPreferredTimeSlot(res.data.availableSlots[0]);
      } else {
        setPreferredTimeSlot('10:00 AM - 11:00 AM');
      }
      
      if (res.data.availableDates && res.data.availableDates.length > 0) {
        setPreferredDate(res.data.availableDates[0]);
      } else {
        setPreferredDate('');
      }
    } catch (err) {
      console.error('Failed to load 1:1 mentorship settings:', err);
    }
  };

  // Rating States
  const [ratingBookingId, setRatingBookingId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const checkAccessAndFetchBookings = async () => {
    try {
      setLoadingAccess(true);
      const res = await api.get('/enroll/me');
      const enrolls = res.data || [];
      setEnrollments(enrolls);

      const eligible = enrolls.some(e => e.paymentStatus === 'paid' && e.planType === 'infinity');
      setHasAccess(eligible);

      if (eligible) {
        setLoading(true);
        const bookingRes = await api.get('/ace-track/mentorship');
        setBookings(bookingRes.data);
        await loadSessionSettings(enrolls);
      }
    } catch (error) {
      toast.error('Failed to load 1:1 mentorship data');
      console.error(error);
    } finally {
      setLoadingAccess(false);
      setLoading(false);
    }
  };

  const fetchBookings = checkAccessAndFetchBookings;

  const handleRequestSession = async (e) => {
    e.preventDefault();
    if (!subject || !description || !preferredDate || !preferredTimeSlot) {
      toast.error('Please fill all fields');
      return;
    }
    if (selectedLimitReached) {
      toast.error('Booking limit reached for the selected session type');
      return;
    }

    try {
      const infinityEnroll = enrollments.find(e => e.paymentStatus === 'paid' && e.planType === 'infinity');
      const courseId = infinityEnroll && infinityEnroll.course ? (infinityEnroll.course._id || infinityEnroll.course) : undefined;
      const category = infinityEnroll && infinityEnroll.course ? (infinityEnroll.course.category || (infinityEnroll.course.categories && infinityEnroll.course.categories[0])) : undefined;

      await api.post('/ace-track/mentorship', {
        sessionType,
        subject,
        description,
        preferredDate,
        preferredTimeSlot,
        courseId,
        category
      });

      toast.success(`${sessionType === 'doubt' ? '1:1 Doubt' : '1:1 Mentorship'} request submitted!`);
      setShowRequestModal(false);
      setSubject('');
      setDescription('');
      setPreferredDate('');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/ace-track/mentorship/${ratingBookingId}/feedback`, {
        rating: ratingValue,
        studentFeedback: feedbackText
      });

      toast.success('Thank you for your feedback! ⭐');
      setRatingBookingId(null);
      setFeedbackText('');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${configs[status] || 'bg-slate-100'}`}>
        {status}
      </span>
    );
  };

  const getRangeCounts = (type, dateValue = new Date()) => {
    const base = new Date(dateValue || new Date());
    const monthStart = new Date(base);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const weekStart = new Date(base);
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const active = bookings.filter((booking) => booking.sessionType === type && booking.status !== 'Cancelled');
    return {
      month: active.filter((booking) => {
        const date = new Date(booking.preferredDate);
        return date >= monthStart && date < monthEnd;
      }).length,
      week: active.filter((booking) => {
        const date = new Date(booking.preferredDate);
        return date >= weekStart && date < weekEnd;
      }).length,
    };
  };

  const selectedCounts = getRangeCounts(sessionType, preferredDate || new Date());
  const selectedMonthlyLimit = sessionType === 'doubt'
    ? mentorshipSettings.doubtMonthlyLimit
    : mentorshipSettings.mentorshipMonthlyLimit;
  const selectedWeeklyLimit = sessionType === 'doubt' ? mentorshipSettings.doubtWeeklyLimit : null;
  const monthlyLimitReached = selectedMonthlyLimit > 0 && selectedCounts.month >= selectedMonthlyLimit;
  const weeklyLimitReached = selectedWeeklyLimit > 0 && selectedCounts.week >= selectedWeeklyLimit;
  const selectedLimitReached = monthlyLimitReached || weeklyLimitReached;

  if (loadingAccess) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 flex items-center justify-center min-h-[400px]">
        <LogoLoader size={60} text="Checking access permissions..." />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden border border-slate-800/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-indigo-400">
              <Users size={38} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                Premium Feature
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Unlock 1:1 Mentorship</h1>
              <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                Accelerate your learning path with personalized guidance. 1:1 mentorship with top Chemistry faculty is exclusively available for Infinity plan subscribers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Personalized study strategy and doubt clearance</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Live 1:1 mentorship calls with assigned mentors</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 text-base">✓</span>
                <span className="text-slate-200 font-bold text-slate-300">Customized preparation roadmap and feedback notes</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/courses"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-brand text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition duration-200 text-center animate-pulse"
              >
                Upgrade to Infinity Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              Premium Session
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">1:1 Mentorship</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Book monthly 1:1 mentorship and weekly 1:1 doubt calls with expert Chemistry mentors.
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="sm:shrink-0 px-6 py-4 bg-white text-indigo-600 font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 self-start sm:self-auto cursor-pointer"
          >
            Book 1:1 Mentorship
          </button>
        </div>
      </div>

      {/* Bookings Lists */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your 1:1 Mentorship</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LogoLoader size={50} text="Loading sessions..." />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-200/60 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center">
            <Users className="text-slate-300 w-12 h-12 mb-3" />
            <h3 className="text-xs font-bold text-slate-600">No Sessions Booked</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Need study tips or doubt support? Book a 1:1 slot now!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map(booking => {
              const sessionLabel = booking.sessionType === 'doubt' ? '1:1 Doubt' : '1:1 Mentorship';
              const dateStr = new Date(booking.preferredDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div key={booking._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 hover:shadow-xs transition duration-200">
                  {/* Title & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">{sessionLabel}</span>
                        <span className="text-[9px] text-slate-300 font-black">/</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Subject Discussion</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800">{booking.subject}</h3>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                        <Calendar size={14} />
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Date</div>
                        <div className="font-semibold text-slate-700">{dateStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                        <Clock size={14} />
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Time Slot</div>
                        <div className="font-semibold text-slate-700">{booking.preferredTimeSlot}</div>
                      </div>
                    </div>

                    {booking.mentorName && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-400">
                          <Users size={14} />
                        </div>
                        <div>
                          <div className="text-[9px] text-indigo-500 font-bold uppercase">Assigned Mentor</div>
                          <div className="font-semibold text-slate-800">{booking.mentorName}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student description detail */}
                  <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800 text-[10px] block mb-1">Your Request Notes:</span>
                    {booking.description}
                  </div>

                  {/* Scheduled Session Call link */}
                  {booking.status === 'Scheduled' && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-indigo-900 text-xs">
                        <AlertCircle size={15} className="text-indigo-500 shrink-0" />
                        <span>Meeting is scheduled. Use the link below to join at slot time.</span>
                      </div>
                      {booking.meetingLink ? (
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer self-start sm:self-auto"
                        >
                          <span>Join Video Session</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-indigo-500 font-bold bg-indigo-100 px-3 py-1 rounded-lg">
                          Meeting Link Awaiting
                        </span>
                      )}
                    </div>
                  )}

                  {/* Mentor feedback & Notes after completion (deep tracking) */}
                  {booking.status === 'Completed' && (
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      {booking.sessionNotes && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">Mentor Session Feedback</span>
                          <p className="text-xs text-slate-600 bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl leading-relaxed whitespace-pre-line">
                            {booking.sessionNotes}
                          </p>
                        </div>
                      )}

                      {booking.studyPlan && (
                        <div className="flex items-start gap-3 bg-emerald-50/30 border border-emerald-100/50 p-3 rounded-xl text-xs text-emerald-950">
                          <FileText size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[10px] uppercase text-emerald-700 tracking-wider block">Uploaded Study Materials & Plans</span>
                            {booking.studyPlan.startsWith('http') ? (
                              <a 
                                href={booking.studyPlan} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1.5 mt-1"
                              >
                                View / Download Study Plan Document <ExternalLink size={12} />
                              </a>
                            ) : (
                              <p className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{booking.studyPlan}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ratings feedback section */}
                      {booking.rating ? (
                        <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
                          <span className="text-xs font-semibold text-slate-400">Your Session Rating:</span>
                          <div className="flex items-center text-amber-400">
                            {[...Array(booking.rating)].map((_, i) => (
                              <Star key={i} size={14} fill="currentColor" />
                            ))}
                            {[...Array(5 - booking.rating)].map((_, i) => (
                              <Star key={i} size={14} />
                            ))}
                          </div>
                          {booking.studentFeedback && (
                            <span className="text-xs text-slate-500 italic ml-2">"{booking.studentFeedback}"</span>
                          )}
                        </div>
                      ) : (
                        <div className="border-t border-slate-50 pt-3">
                          <button
                            onClick={() => setRatingBookingId(booking._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl text-[11px] font-bold cursor-pointer"
                          >
                            <Star size={12} fill="currentColor" />
                            <span>Rate Session Experience</span>
                          </button>
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

      {/* Book Slot Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 shrink-0">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Request 1:1 Mentorship</h3>
                <p className="text-[11px] text-slate-400">Choose session or doubt support and book a slot</p>
              </div>
            </div>

            {!mentorshipSettings.enabled ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center space-y-3">
                <AlertCircle size={40} className="text-amber-500 animate-bounce" />
                <h4 className="font-bold text-slate-850 text-sm">Session Bookings Closed</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  1:1 Mentorship requests are currently closed. Our slots will open soon. Please check back later!
                </p>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-xl cursor-pointer mt-2"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleRequestSession} className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSessionType('mentorship')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        sessionType === 'mentorship'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users size={16} className={sessionType === 'mentorship' ? 'text-indigo-600' : 'text-slate-400'} />
                      <div className="mt-2 text-xs font-black">1:1 Mentorship</div>
                      <div className="text-[10px] font-semibold opacity-75">
                        {getRangeCounts('mentorship', preferredDate || new Date()).month}/{mentorshipSettings.mentorshipMonthlyLimit} this month
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionType('doubt')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        sessionType === 'doubt'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <MessageCircle size={16} className={sessionType === 'doubt' ? 'text-indigo-600' : 'text-slate-400'} />
                      <div className="mt-2 text-xs font-black">1:1 Doubt</div>
                      <div className="text-[10px] font-semibold opacity-75">
                        {getRangeCounts('doubt', preferredDate || new Date()).month}/{mentorshipSettings.doubtMonthlyLimit} month, {getRangeCounts('doubt', preferredDate || new Date()).week}/{mentorshipSettings.doubtWeeklyLimit} week
                      </div>
                    </button>
                  </div>

                  {selectedLimitReached && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
                      {monthlyLimitReached
                        ? `Monthly limit reached for ${sessionType === 'doubt' ? '1:1 Doubt' : '1:1 Mentorship'}.`
                        : 'Weekly 1:1 Doubt limit reached for the selected date.'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Subject / Focus Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Organic Named Reactions, Study Timetable Planning..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">What would you like to cover? (Details)</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your doubts, problems, or what guide you need from the mentor deeply..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 resize-none leading-normal"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Preferred Date</label>
                      {mentorshipSettings.availableDates && mentorshipSettings.availableDates.length > 0 ? (
                        <select
                          required
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                        >
                          <option value="">Select Date</option>
                          {mentorshipSettings.availableDates.map(d => (
                            <option key={d} value={d}>
                              {new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Preferred Time Slot</label>
                      <select
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-semibold text-slate-700"
                      >
                        {mentorshipSettings.availableSlots && mentorshipSettings.availableSlots.length > 0 ? (
                          mentorshipSettings.availableSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))
                        ) : (
                          <>
                            <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                            <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                            <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                            <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                            <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </form>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestSession}
                    disabled={selectedLimitReached}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-xs font-bold text-white shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rating & Review Feedback Modal */}
      {ratingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500">
                <Star size={20} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Rate Session Experience</h3>
                <p className="text-[11px] text-slate-400">Share your feedback to help us improve</p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Stars selectors */}
              <div className="flex items-center justify-center gap-2 text-slate-300 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className={`p-1 transition-all duration-150 hover:scale-110 cursor-pointer ${
                      star <= ratingValue ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                    <Star size={28} fill={star <= ratingValue ? 'currentColor' : 'none'} className="stroke-[2.5px]" />
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Feedback (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Share a short review of your mentor session..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 resize-none leading-normal"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingBookingId(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
