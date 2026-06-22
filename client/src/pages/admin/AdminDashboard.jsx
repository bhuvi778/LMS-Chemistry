import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
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
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, courses: 0, enrollments: 0, revenue: 0 });
  const [detail, setDetail] = useState({
    enrollmentsByCat: [], recentDays: [], topCourses: [], publishedCourses: 0,
    monthlyRevenue: [], studentGrowth: [], doubtStats: { open: 0, answered: 0 },
  });
  const [recent, setRecent] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/admin/stats/detail').then((r) => setDetail(r.data)).catch(() => {});
    api.get('/admin/enrollments').then((r) => setRecent(r.data.slice(0, 6))).catch(() => {});
    api.get('/admin/live-classes').then((r) => setLiveClasses(r.data)).catch(() => {});
  }, []);

  const kpis = [
    { label: 'Total Students', value: stats.students.toLocaleString(), icon: Users, color: 'from-blue-500 to-indigo-500', sub: 'Registered learners', link: '/admin/students' },
    { label: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'from-violet-500 to-fuchsia-500', sub: `${detail.publishedCourses || 0} live`, link: '/admin/courses' },
    { label: 'Enrollments', value: stats.enrollments.toLocaleString(), icon: FileText, color: 'from-emerald-500 to-teal-500', sub: 'All time', link: '/admin/enrollments' },
    { label: 'Total Revenue', value: `₹ ${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-amber-500 to-orange-500', sub: 'All-time earned', link: null },
  ];

  const maxDay = useMemo(() => Math.max(1, ...(detail.recentDays || []).map((d) => d.count)), [detail.recentDays]);
  const maxCat = useMemo(() => Math.max(1, ...(detail.enrollmentsByCat || []).map((d) => d.count)), [detail.enrollmentsByCat]);
  const maxRevenue = useMemo(() => Math.max(1, ...(detail.monthlyRevenue || []).map((d) => d.revenue)), [detail.monthlyRevenue]);
  const maxStudentGrowth = useMemo(() => Math.max(1, ...(detail.studentGrowth || []).map((d) => d.count)), [detail.studentGrowth]);

  const upcomingLive = liveClasses
    .filter((lc) => lc.isActive && new Date(lc.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">Analytics Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time overview — Ace2Examz • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
