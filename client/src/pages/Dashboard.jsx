import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  BookOpen, GraduationCap, Coins, Flame, Video, ExternalLink,
  Calendar, Clock, ArrowRight, Play, ChevronRight, Bell, Zap,
  TrendingUp, Users, Award
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveClasses, setLiveClasses] = useState({ ongoing: [], upcoming: [] });

  useEffect(() => {
    api.get('/enroll/me').then(r => setEnrollments(r.data)).finally(() => setLoading(false));
    api.get('/admin/live-classes/all').then(r => setLiveClasses(r.data)).catch(() => {});
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const stats = [
    { icon: BookOpen, label: 'Enrolled Courses', value: enrollments.length, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
    { icon: Flame, label: 'Day Streak', value: `${user?.streak || 0}🔥`, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-600' },
    { icon: Coins, label: 'Ace Coins', value: user?.coins || 0, color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
    { icon: TrendingUp, label: 'Total Invested', value: `AED ${enrollments.reduce((a, e) => a + (e.pricePaid || 0), 0).toLocaleString()}`, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];

  const quickLinks = [
    { to: '/student/courses', label: 'My Courses', icon: BookOpen, color: 'from-brand-500 to-indigo-600', desc: 'Continue learning' },
    { to: '/student/practice', label: 'Practice Tests', icon: Award, color: 'from-emerald-500 to-teal-600', desc: 'Test your skills' },
    { to: '/student/streak', label: 'Daily Streak', icon: Flame, color: 'from-amber-500 to-orange-600', desc: 'Maintain your streak' },
    { to: '/student/wallet', label: 'Ace Coins', icon: Coins, color: 'from-yellow-400 to-amber-500', desc: 'Earn & redeem rewards' },
    { to: '/student/refer', label: 'Refer & Earn', icon: Users, color: 'from-rose-500 to-pink-600', desc: 'Invite friends for coins' },
    { to: '/student/library', label: 'E-Library', icon: GraduationCap, color: 'from-blue-500 to-cyan-600', desc: 'Books & resources' },
  ];

  const allLive = [...(liveClasses.ongoing || []), ...(liveClasses.upcoming || [])].slice(0, 3);

  return (
    <div className="space-y-7">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white p-7 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white blur-3xl translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-2xl -translate-x-10 translate-y-10" />
        </div>
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">{greeting} 👋</p>
            <h1 className="font-display text-3xl font-extrabold leading-tight">
              {user?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-white/80 text-sm mt-2">
              Student ID: <span className="font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg text-xs">{user?.studentId}</span>
            </p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-sm font-semibold">
                <Flame size={16} className="text-amber-300" /> {user?.streak || 0} Day Streak
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-sm font-semibold">
                <Coins size={16} className="text-yellow-300" /> {user?.coins || 0} Coins
              </div>
            </div>
          </div>
          <Link
            to="/student/courses"
            className="flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Play size={15} fill="currentColor" /> Continue Learning
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.text} flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <div className="text-2xl font-extrabold text-slate-800 font-display">{s.value}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-extrabold text-slate-800 text-lg">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((q, i) => (
            <Link
              key={i}
              to={q.to}
              className="group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.color} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <q.icon size={18} />
              </div>
              <div className="font-bold text-slate-800 text-sm">{q.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{q.desc}</div>
              <ChevronRight size={14} className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-500 transition" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
        {/* Enrolled Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-slate-800 text-lg">My Courses</h2>
            <Link to="/student/courses" className="text-sm text-brand-600 font-bold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-20 h-14 bg-slate-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                      <div className="h-2 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm font-semibold mb-4">No courses enrolled yet</p>
              <Link to="/student/courses" className="inline-flex items-center gap-2 bg-gradient-brand text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-soft">
                Browse Courses <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 4).map(e => (
                <div key={e._id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200 group">
                  <div className="relative shrink-0">
                    <img
                      src={e.course?.thumbnail}
                      alt={e.course?.title}
                      className="w-20 h-14 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-brand-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play size={18} className="text-white" fill="white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-brand-700 transition">{e.course?.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{e.course?.category}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>Progress</span>
                        <span>{e.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-brand rounded-full transition-all" style={{ width: `${e.progress || 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <Link to={`/student/learn/${e.course?._id}`} className="shrink-0 px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-xl hover:bg-brand-100 transition">
                    Continue
                  </Link>
                </div>
              ))}
              {enrollments.length > 4 && (
                <Link to="/student/courses" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 font-semibold hover:text-brand-700 transition py-3 border border-dashed border-slate-200 rounded-2xl hover:border-brand-300">
                  +{enrollments.length - 4} more courses <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Live Classes + Notifications */}
        <div className="space-y-5">
          {/* Live Classes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                Live Classes
              </h2>
            </div>
            {allLive.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm">
                <Video size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400 text-sm font-semibold">No upcoming live classes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allLive.map(lc => (
                  <div key={lc._id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0">
                        <Video size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{lc.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <Calendar size={11} />
                          <span>{new Date(lc.scheduledAt).toLocaleString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      {lc.useInternalRoom ? (
                        <Link to={`/live/${lc._id}`} className="shrink-0 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition whitespace-nowrap">
                          {lc.status === 'live' ? '🔴 Join' : 'Open'}
                        </Link>
                      ) : (
                        <a href={lc.meetLink} target="_blank" rel="noreferrer" className="shrink-0 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak Motivation Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-sm">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
              <Flame size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="font-display font-extrabold text-lg">
                {user?.streak ? `${user.streak} Day Streak! 🔥` : 'Start Your Streak!'}
              </h3>
              <p className="text-white/85 text-xs mt-1 leading-relaxed">
                {user?.streak
                  ? `Amazing! You've been active for ${user.streak} consecutive days. Keep it up!`
                  : 'Visit the Streak page to log today\'s activity and start earning bonus coins!'}
              </p>
              <Link
                to="/student/streak"
                className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                <Zap size={13} /> View Streak <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
