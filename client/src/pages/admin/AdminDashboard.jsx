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
  Smartphone,
  Laptop,
  Flame,
  Zap,
  Target,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

const formatCurrency = (value = 0) => `₹ ${(value || 0).toLocaleString('en-IN')}`;

const safePercent = (value, max) => `${Math.max(4, ((value || 0) / Math.max(1, max)) * 100)}%`;

function MetricPill({ label, value, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className={`rounded-xl px-3 py-2 ${tones[tone] || tones.brand}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide opacity-80">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function HorizontalBars({ items = [], maxValue = 1, labelKey = 'label', valueKey = 'count', color = 'bg-brand-500', empty = 'No data yet' }) {
  if (!items.length) return <p className="text-sm text-slate-400 py-5 text-center">{empty}</p>;
  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item, i) => (
        <div key={`${item[labelKey] || item._id || i}-${i}`}>
          <div className="flex justify-between gap-3 text-xs mb-1">
            <span className="font-semibold text-slate-700 truncate">{item[labelKey] || item._id || 'Uncategorized'}</span>
            <span className="text-slate-500 font-bold shrink-0">{item[valueKey] || 0}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: safePercent(item[valueKey], maxValue) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0, courses: 0, powerBatches: 0, allCourses: 0, enrollments: 0,
    courseEnrollments: 0, powerBatchEnrollments: 0, revenue: 0,
    courseRevenue: 0, powerBatchRevenue: 0, appDownloads: 0,
  });
  const [detail, setDetail] = useState({
    enrollmentsByCat: [], recentDays: [], topCourses: [], publishedCourses: 0,
    monthlyRevenue: [], studentGrowth: [], doubtStats: { open: 0, answered: 0 },
    courseAnalytics: { planSplit: [], categorySplit: [], topItems: [] },
    powerBatchAnalytics: { planSplit: [], categorySplit: [], typeSplit: [], topItems: [], progress: {} },
    monthlyProductRevenue: [],
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
    { label: 'Courses', value: (stats.courses || 0).toLocaleString(), icon: BookOpen, color: 'from-violet-500 to-fuchsia-500', sub: `${detail.publishedCourses || 0} live courses`, link: '/admin/courses' },
    { label: 'Power Batch', value: (stats.powerBatches || 0).toLocaleString(), icon: Flame, color: 'from-rose-500 to-orange-500', sub: `${detail.publishedPowerBatches || 0} live batches`, link: '/admin/power-batch' },
    { label: 'Enrollments', value: stats.enrollments.toLocaleString(), icon: FileText, color: 'from-emerald-500 to-teal-500', sub: `${stats.courseEnrollments || 0} course · ${stats.powerBatchEnrollments || 0} batch`, link: '/admin/enrollments' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue || 0), icon: DollarSign, color: 'from-amber-500 to-orange-500', sub: 'All-time earned', link: null },
    { label: 'App Downloads', value: (stats.appDownloads || 0).toLocaleString(), icon: Smartphone, color: 'from-sky-500 to-blue-500', sub: 'App installations', link: null },
  ];

  const maxSplitDay = useMemo(() => Math.max(1, ...(detail.recentDays || []).flatMap((d) => [d.course || 0, d.powerBatch || 0])), [detail.recentDays]);
  const maxCat = useMemo(() => Math.max(1, ...(detail.enrollmentsByCat || []).map((d) => d.count)), [detail.enrollmentsByCat]);
  const maxPowerCat = useMemo(() => Math.max(1, ...(detail.powerBatchAnalytics?.categorySplit || []).map((d) => d.count)), [detail.powerBatchAnalytics]);
  const maxPowerType = useMemo(() => Math.max(1, ...(detail.powerBatchAnalytics?.typeSplit || []).map((d) => d.count)), [detail.powerBatchAnalytics]);
  const maxProductRevenue = useMemo(() => Math.max(1, ...(detail.monthlyProductRevenue || []).flatMap((d) => [d.courseRevenue || 0, d.powerBatchRevenue || 0])), [detail.monthlyProductRevenue]);
  const maxStudentGrowth = useMemo(() => Math.max(1, ...(detail.studentGrowth || []).map((d) => d.count)), [detail.studentGrowth]);
  const courseAnalytics = detail.courseAnalytics || {};
  const powerAnalytics = detail.powerBatchAnalytics || {};
  const powerProgress = powerAnalytics.progress || {};

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

      <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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

      <div className="grid xl:grid-cols-2 gap-5">
        <div className="card p-6 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={17} className="text-violet-500" /> Course Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Long-form course sales and enrollment health</p>
            </div>
            <Link to="/admin/courses" className="text-xs text-brand-700 font-semibold flex items-center gap-1 hover:underline">
              Manage <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MetricPill label="Courses" value={(stats.courses || 0).toLocaleString()} icon={BookOpen} tone="brand" />
            <MetricPill label="Live" value={(courseAnalytics.published || 0).toLocaleString()} icon={CheckCircle2} tone="emerald" />
            <MetricPill label="Enroll" value={(stats.courseEnrollments || 0).toLocaleString()} icon={Users} tone="slate" />
            <MetricPill label="Revenue" value={formatCurrency(stats.courseRevenue || 0)} icon={DollarSign} tone="amber" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5"><PieChart size={14} /> Category Split</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Enrollments</span>
              </div>
              <HorizontalBars items={courseAnalytics.categorySplit || []} maxValue={maxCat} labelKey="_id" color="bg-violet-500" />
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5"><Target size={14} /> Plan Mix</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
              </div>
              <div className="space-y-3">
                {(courseAnalytics.planSplit || []).length === 0 ? (
                  <p className="text-sm text-slate-400 py-5 text-center">No plan data yet</p>
                ) : (courseAnalytics.planSplit || []).map((plan) => (
                  <div key={plan.planType} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                    <div>
                      <div className="text-xs font-black text-slate-800 capitalize">{plan.planType}</div>
                      <div className="text-[10px] font-semibold text-slate-400">{plan.count} enrollments</div>
                    </div>
                    <div className="text-xs font-black text-emerald-600">{formatCurrency(plan.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 overflow-hidden border-rose-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Flame size={17} className="text-rose-500" /> Power Batch Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Short challenge sales, progress and completion health</p>
            </div>
            <Link to="/admin/power-batch" className="text-xs text-rose-700 font-semibold flex items-center gap-1 hover:underline">
              Manage <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MetricPill label="Batches" value={(stats.powerBatches || 0).toLocaleString()} icon={Flame} tone="rose" />
            <MetricPill label="Enroll" value={(stats.powerBatchEnrollments || 0).toLocaleString()} icon={Users} tone="slate" />
            <MetricPill label="Revenue" value={formatCurrency(stats.powerBatchRevenue || 0)} icon={DollarSign} tone="amber" />
            <MetricPill label="Avg Prog." value={`${powerProgress.avgProgress || 0}%`} icon={Zap} tone="emerald" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5"><PieChart size={14} /> Batch Type</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Enrollments</span>
              </div>
              <HorizontalBars items={powerAnalytics.typeSplit || []} maxValue={maxPowerType} labelKey="type" color="bg-rose-500" empty="No power batch sales yet" />
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5"><CheckCircle2 size={14} /> Progress Signals</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Learner action</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-xl font-black text-emerald-700">{(powerProgress.completedDays || 0).toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-emerald-700/70 uppercase">Days Done</div>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <div className="text-xl font-black text-rose-700">{(powerProgress.activeStudents || 0).toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-rose-700/70 uppercase">Active Students</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <div className="text-xl font-black text-amber-700">{(powerProgress.completedEnrollments || 0).toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-amber-700/70 uppercase">Completed</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <div className="text-xl font-black text-slate-700">{(powerProgress.progressRecords || 0).toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Progress Rows</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              <p className="text-xs text-slate-400 mt-0.5">Course vs Power Batch — last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Course</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Power Batch</span>
            </div>
          </div>
          {(detail.recentDays || []).length > 0 ? (
            <div className="flex items-end gap-2 h-40 pb-1">
              {(detail.recentDays || []).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="relative w-full flex items-end justify-center gap-1">
                    {(d.course > 0 || d.powerBatch > 0) && (
                      <span className="absolute -top-5 text-[10px] font-bold text-slate-600 opacity-0 group-hover/bar:opacity-100 transition">
                        {d.course || 0}/{d.powerBatch || 0}
                      </span>
                    )}
                    <div
                      className="w-full max-w-[18px] rounded-t-lg bg-violet-500 shadow-soft transition-all duration-500"
                      style={{ height: `${Math.max(6, ((d.course || 0) / maxSplitDay) * 126)}px` }}
                      title={`Course: ${d.course || 0}`}
                    />
                    <div
                      className="w-full max-w-[18px] rounded-t-lg bg-rose-500 shadow-soft transition-all duration-500"
                      style={{ height: `${Math.max(6, ((d.powerBatch || 0) / maxSplitDay) * 126)}px` }}
                      title={`Power Batch: ${d.powerBatch || 0}`}
                    />
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
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><BarChart2 size={16} className="text-violet-500" /> Category Split</h3>
              <p className="text-xs text-slate-400 mt-0.5">Courses and power batches</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-violet-500">Course</div>
              <HorizontalBars items={courseAnalytics.categorySplit || []} maxValue={maxCat} labelKey="_id" color="bg-violet-500" />
            </div>
            <div className="border-t border-slate-100 pt-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-rose-500">Power Batch</div>
              <HorizontalBars items={powerAnalytics.categorySplit || []} maxValue={maxPowerCat} labelKey="_id" color="bg-rose-500" empty="No power batch data yet" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue + Student Growth Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-900">Monthly Product Revenue</h3>
                <p className="text-xs text-slate-400">Course vs Power Batch — last 6 months</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Course</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Batch</span>
            </div>
          </div>
          {(detail.monthlyProductRevenue || []).length > 0 ? (
            <div className="flex items-end gap-2 h-32 pb-1">
              {detail.monthlyProductRevenue.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="relative w-full flex items-end justify-center gap-1">
                    {(m.courseRevenue > 0 || m.powerBatchRevenue > 0) && (
                      <span className="absolute -top-5 text-[9px] font-bold text-amber-600 opacity-0 group-hover/bar:opacity-100 transition">
                        {formatCurrency((m.courseRevenue || 0) + (m.powerBatchRevenue || 0))}
                      </span>
                    )}
                    <div className="w-full max-w-[20px] rounded-t-lg bg-violet-500 transition-all duration-500" style={{ height: `${Math.max(4, ((m.courseRevenue || 0) / maxProductRevenue) * 104)}px` }} />
                    <div className="w-full max-w-[20px] rounded-t-lg bg-rose-500 transition-all duration-500" style={{ height: `${Math.max(4, ((m.powerBatchRevenue || 0) / maxProductRevenue) * 104)}px` }} />
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
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Top Learning Products</h3>
            <Link to="/admin/enrollments" className="text-xs text-brand-700 font-semibold flex items-center gap-1 hover:underline">All <ArrowRight size={11} /></Link>
          </div>
          <div className="mb-3 text-[10px] font-black uppercase tracking-wide text-violet-500">Courses</div>
          <div className="space-y-3">
            {(detail.topCourses || []).map((c, i) => (
              <div key={c._id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500 grid place-items-center text-white text-xs font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-400">{c.category} · {c.enrollmentCount} enrolled</div>
                </div>
                <div className="text-xs font-bold text-emerald-600 shrink-0">₹{(c.revenue || 0).toLocaleString()}</div>
              </div>
            ))}
            {(detail.topCourses || []).length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No data yet</p>}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="mb-3 text-[10px] font-black uppercase tracking-wide text-rose-500">Power Batch</div>
            <div className="space-y-3">
              {(detail.topPowerBatches || []).map((c, i) => (
                <div key={c._id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 grid place-items-center text-white text-xs font-black shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-900 truncate">{c.title}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{c.powerCourseType || 'other'} · {c.powerCourseDuration || 7} days · {c.enrollmentCount} enrolled</div>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 shrink-0">{formatCurrency(c.revenue || 0)}</div>
                </div>
              ))}
              {(detail.topPowerBatches || []).length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No power batch data yet</p>}
            </div>
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
