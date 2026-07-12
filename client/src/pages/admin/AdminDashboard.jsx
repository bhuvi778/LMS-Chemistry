import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';
import {
  Users,
  BookOpen,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Activity,
  BarChart2,
  Trophy,
  Clock,
  Video,
  HelpCircle,
  TrendingDown,
  Smartphone,
  Shield,
  Laptop,
  Globe
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, enrollments: 0, revenue: 0, appDownloads: 0 });
  const [detail, setDetail] = useState({
    enrollmentsByCat: [], recentDays: [], topCourses: [], publishedCourses: 0,
    monthlyRevenue: [], studentGrowth: [], doubtStats: { open: 0, answered: 0 },
  });
  const [recent, setRecent] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/admin/stats/detail').then((r) => setDetail(r.data)).catch(() => {});
    api.get('/admin/enrollments').then((r) => setRecent(r.data.slice(0, 6))).catch(() => {});
    api.get('/admin/live-classes').then((r) => setLiveClasses(r.data)).catch(() => {});
    api.get('/admin/login-analytics').then((r) => setLoginLogs(r.data.loginLogs || [])).catch(() => {});
    api.get('/ace-track/mentorship').then((r) => setMentorshipRequests((r.data || []).filter((item) => item.status === 'Pending'))).catch(() => {});
  }, []);

  const kpis = [
    { label: 'Total Students', value: stats.students.toLocaleString(), icon: Users, color: 'from-blue-500 to-indigo-500', sub: 'Registered learners', link: '/admin/students' },
    { label: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'from-violet-500 to-fuchsia-500', sub: `${detail.publishedCourses || 0} live`, link: '/admin/courses' },
    { label: 'Enrollments', value: stats.enrollments.toLocaleString(), icon: FileText, color: 'from-emerald-500 to-teal-500', sub: 'All time', link: '/admin/enrollments' },
    { label: 'Total Revenue', value: `₹ ${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-amber-500 to-orange-500', sub: 'All-time earned', link: null },
    { label: 'App Downloads', value: (stats.appDownloads || 0).toLocaleString(), icon: Smartphone, color: 'from-sky-500 to-blue-500', sub: 'App installations', link: null },
  ];

  const maxDay = useMemo(() => Math.max(1, ...(detail.recentDays || []).map((d) => d.count)), [detail.recentDays]);
  const maxCat = useMemo(() => Math.max(1, ...(detail.enrollmentsByCat || []).map((d) => d.count)), [detail.enrollmentsByCat]);
  const maxRevenue = useMemo(() => Math.max(1, ...(detail.monthlyRevenue || []).map((d) => d.revenue)), [detail.monthlyRevenue]);
  const maxStudentGrowth = useMemo(() => Math.max(1, ...(detail.studentGrowth || []).map((d) => d.count)), [detail.studentGrowth]);

  const upcomingLive = liveClasses
    .filter((lc) => lc.isActive && new Date(lc.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3);
  const latestMentorshipRequests = mentorshipRequests.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">Analytics Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time overview — Ace2Examz • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="card p-5 relative overflow-hidden group">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.color} grid place-items-center text-white mb-3 shadow-soft`}>
              <k.icon size={20} />
            </div>
            <div className="text-xs text-slate-500 font-medium">{k.label}</div>
            <div className="text-2xl font-extrabold mt-0.5 text-slate-900">{k.value}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={10} /> {k.sub}
            </div>
            {k.link && (
              <Link to={k.link} className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition text-brand-600">
                <ArrowRight size={14} />
              </Link>
            )}
            <div className={`absolute -right-5 -top-5 w-20 h-20 rounded-full bg-gradient-to-br ${k.color} opacity-10`} />
          </div>
        ))}
      </div>

      {mentorshipRequests.length > 0 && (
        <div className="card p-5 border-indigo-100 bg-indigo-50/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-soft">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Pending 1:1 Session Requests</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {mentorshipRequests.length} student request{mentorshipRequests.length > 1 ? 's' : ''} waiting to be scheduled.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {latestMentorshipRequests.map((request) => (
                <div key={request._id} className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs shadow-sm">
                  <div className="font-bold text-slate-800">{request.student?.name || 'Student'}</div>
                  <div className="mt-0.5 max-w-[180px] truncate font-semibold text-slate-400">{request.subject}</div>
                </div>
              ))}
              <Link to="/admin/mentorship" className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500">
                Review Requests <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Activity size={16} className="text-brand-500" /> Enrollment Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">New enrollments — last 7 days</p>
            </div>
          </div>
          {(detail.recentDays || []).length > 0 ? (
            <div className="flex items-end gap-2 h-36 pb-1">
              {(detail.recentDays || []).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="relative w-full flex flex-col items-center">
                    {d.count > 0 && <span className="text-[10px] font-bold text-brand-600 opacity-0 group-hover/bar:opacity-100 transition mb-1">{d.count}</span>}
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-500 to-violet-500 shadow-soft transition-all duration-500" style={{ height: `${Math.max(6, (d.count / maxDay) * 120)}px` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{d.day}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-slate-400 text-sm">No enrollment data yet</div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><BarChart2 size={16} className="text-violet-500" /> By Category</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enrollments per exam</p>
            </div>
          </div>
          <div className="space-y-3">
            {(detail.enrollmentsByCat || []).slice(0, 7).map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{d._id}</span>
                  <span className="text-slate-500 font-medium">{d.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700" style={{ width: `${(d.count / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
            {(detail.enrollmentsByCat || []).length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Monthly Revenue + Student Growth Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={16} className="text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900">Monthly Revenue</h3>
              <p className="text-xs text-slate-400">Last 6 months</p>
            </div>
          </div>
          {(detail.monthlyRevenue || []).length > 0 ? (
            <div className="flex items-end gap-2 h-28 pb-1">
              {detail.monthlyRevenue.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="relative w-full flex flex-col items-center">
                    {m.revenue > 0 && <span className="text-[9px] font-bold text-amber-600 opacity-0 group-hover/bar:opacity-100 transition mb-1">₹{m.revenue.toLocaleString()}</span>}
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-500" style={{ height: `${Math.max(4, (m.revenue / maxRevenue) * 100)}px` }} />
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{m.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-slate-400 text-sm">No revenue data</div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} className="text-blue-500" />
            <div>
              <h3 className="font-bold text-slate-900">Student Growth</h3>
              <p className="text-xs text-slate-400">New registrations per month</p>
            </div>
          </div>
          {(detail.studentGrowth || []).length > 0 ? (
            <div className="flex items-end gap-2 h-28 pb-1">
              {detail.studentGrowth.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="relative w-full flex flex-col items-center">
                    {m.count > 0 && <span className="text-[9px] font-bold text-blue-600 opacity-0 group-hover/bar:opacity-100 transition mb-1">{m.count}</span>}
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-indigo-400 transition-all duration-500" style={{ height: `${Math.max(4, (m.count / maxStudentGrowth) * 100)}px` }} />
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{m.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-slate-400 text-sm">No student data</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Top Courses</h3>
            <Link to="/admin/courses" className="text-xs text-brand-700 font-semibold flex items-center gap-1 hover:underline">All <ArrowRight size={11} /></Link>
          </div>
          <div className="space-y-3">
            {(detail.topCourses || []).map((c, i) => (
              <div key={c._id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center text-white text-xs font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-400">{c.category} · {c.enrollmentCount} enrolled</div>
                </div>
                <div className="text-xs font-bold text-emerald-600 shrink-0">₹{(c.revenue || 0).toLocaleString()}</div>
              </div>
            ))}
            {(detail.topCourses || []).length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Video size={16} className="text-rose-500" /> Live Classes</h3>
            <Link to="/admin/live-classes" className="text-xs text-brand-700 font-semibold flex items-center gap-1 hover:underline">Manage <ArrowRight size={11} /></Link>
          </div>
          <div className="space-y-3">
            {upcomingLive.map((lc) => (
              <div key={lc._id} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 grid place-items-center text-white shrink-0"><Video size={14} /></div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{lc.title}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> {new Date(lc.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
            {upcomingLive.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 mb-2">No upcoming classes</p>
                <Link to="/admin/live-classes" className="text-xs text-brand-700 font-semibold">+ Schedule one</Link>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><HelpCircle size={16} className="text-amber-500" /> Doubts Overview</h3>
            <Link to="/admin/doubts" className="text-xs text-brand-700 font-semibold flex items-center gap-1 hover:underline">Manage <ArrowRight size={11} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{detail.doubtStats?.open || 0}</div>
              <div className="text-xs text-slate-500">Open / Pending</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{detail.doubtStats?.answered || 0}</div>
              <div className="text-xs text-slate-500">Answered</div>
            </div>
          </div>
          {detail.doubtStats?.open > 0 && (
            <Link to="/admin/doubts" className="block w-full text-center text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition rounded-xl py-2">
              Answer {detail.doubtStats.open} pending doubt{detail.doubtStats.open > 1 ? 's' : ''}
            </Link>
          )}

          {/* Recent enrollments */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1"><Users size={13} /> Recent Enrollments</h4>
              <Link to="/admin/enrollments" className="text-xs text-brand-700 font-semibold">All</Link>
            </div>
            <div className="space-y-2">
              {recent.slice(0, 4).map((e) => (
                <div key={e._id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-black grid place-items-center shrink-0">{e.student?.name?.[0]?.toUpperCase() || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-900 truncate">{e.student?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{e.course?.title}</div>
                  </div>
                </div>
              ))}
              {recent.length === 0 && <p className="text-xs text-slate-400">No enrollments yet</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logins Analytics Widget */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="text-brand-500 animate-pulse" size={16} /> Recent Student Logins
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time login activity across devices</p>
          </div>
          <span className="chip bg-brand-50 text-brand-700 font-bold text-xs">
            {loginLogs.length} Recent Logins
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-650 font-semibold text-xs uppercase">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Device / Browser</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Login Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loginLogs.slice(0, 8).map((log) => {
                const info = (log.deviceInfo || '').toLowerCase();
                const DeviceIcon = (info.includes('phone') || info.includes('android') || info.includes('iphone') || info.includes('mobile'))
                  ? Smartphone
                  : Laptop;

                return (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold grid place-items-center uppercase shrink-0">
                          {log.studentName?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-850 truncate">{log.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{log.studentId} · {log.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-slate-650 text-xs">
                        <DeviceIcon size={13} className="text-slate-450 shrink-0" />
                        <span className="truncate max-w-[280px]" title={log.deviceInfo}>
                          {log.deviceInfo || 'Unknown Device'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs text-slate-555 bg-slate-105 px-1.5 py-0.5 rounded">
                        {log.ip || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-550 text-xs font-medium">
                      {new Date(log.loginTime).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
              {loginLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-slate-400 italic">
                    No recent logins recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
