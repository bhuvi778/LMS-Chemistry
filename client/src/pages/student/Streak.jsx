import { useEffect, useState } from 'react';
import { Flame, Calendar as CalendarIcon, Award, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

export default function Streak() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(user);
  const [attempts, setAttempts] = useState([]);

  // Fetch streak ping & attempts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streakRes, attemptsRes] = await Promise.all([
          api.post('/auth/streak-ping'),
          api.get('/tests/attempts/me')
        ]);
        setCurrentUser(streakRes.data);
        if (setUser) setUser(streakRes.data);
        setAttempts(attemptsRes.data || []);
      } catch (err) {
        console.error(err);
        setCurrentUser(user);
        try {
          const attemptsRes = await api.get('/tests/attempts/me');
          setAttempts(attemptsRes.data || []);
        } catch (e) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const u = currentUser || user || {};
  const currentStreak = u.streak || 0;
  const longestStreak = u.longestStreak || 0;
  const streakFrozen = u.streakFrozen || false;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDays = u.activeDays || [];
  
  const attendedToday = activeDays.includes(todayStr);
  const attemptedToday = attempts.some(a => {
    if (!a.submittedAt) return false;
    const attemptDate = new Date(a.submittedAt).toISOString().split('T')[0];
    return attemptDate === todayStr;
  });

  const todayProgressPercent = (attendedToday ? 50 : 0) + (attemptedToday ? 50 : 0);

  // Days of the week for header
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Current Month calculations
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();

  const monthName = today.toLocaleString('default', { month: 'long' });
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const monthDays = Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const isActive = activeDays.includes(dateStr);
    const isToday = dayNum === todayDate;
    return { dayNum, isActive, isToday };
  });

  const calendarSlots = [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...monthDays
  ];

  const dailyTasks = [
    {
      name: 'Maintain Daily Attendance',
      status: attendedToday ? 'completed' : 'in-progress',
      progress: attendedToday ? '1/1 Day Done' : '0/1 Day Done'
    },
    {
      name: 'Solve Practice Questions',
      status: attemptedToday ? 'completed' : 'pending',
      progress: attemptedToday ? 'Active Today' : 'Pending activity'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
        <span className="font-semibold">Updating streak...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800">My Study Streak</h1>
        <p className="text-sm text-slate-500 mt-1">Keep learning daily to maintain your streak and earn rewards.</p>
      </div>

      {streakFrozen && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 flex items-center gap-3 text-blue-700 text-sm font-semibold">
          🧊 Your streak is currently frozen by admin. It won't break if you miss a day.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Streak Stats Cards */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold opacity-85 uppercase tracking-wider">Current Streak</span>
            <div className="text-4xl font-extrabold font-display">{currentStreak} Days</div>
            <p className="text-[11px] opacity-75">You are doing amazing! 🔥</p>
          </div>
          <Flame size={48} className="text-amber-200 animate-pulse shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Longest Streak</span>
            <div className="text-3xl font-extrabold font-display text-slate-800">{longestStreak} Days</div>
            <p className="text-[11px] text-slate-400">All-time record achievement</p>
          </div>
          <Award size={40} className="text-brand-500 shrink-0" />
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Progress</span>
            <div className="text-3xl font-extrabold font-display text-slate-800">
              {todayProgressPercent}%
            </div>
            <p className="text-[11px] text-slate-400">
              {todayProgressPercent === 100
                ? 'Daily activity recorded! ✅'
                : todayProgressPercent === 50
                ? 'Only attendance logged today'
                : 'No activity logged today yet'}
            </p>
          </div>
          <Zap size={40} className="text-yellow-500 shrink-0" />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.5fr,1fr] gap-6">
        {/* Calendar Box */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-display font-extrabold text-slate-800 text-base flex items-center gap-2">
              <CalendarIcon size={18} className="text-brand-500" />
              <span>{monthName} {currentYear}</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {monthDays.filter(d => d.isActive).length} Study Days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarSlots.map((slot, idx) => {
              if (!slot) {
                return <div key={`empty-${idx}`} />;
              }
              const { dayNum, isActive, isToday } = slot;
              return (
                <div
                  key={dayNum}
                  className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition relative ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-soft'
                      : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100/50'
                  } ${isToday ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}
                  title={`${dayNum} ${monthName} ${isActive ? '(Active)' : '(No Activity)'}`}
                >
                  <span>{dayNum}</span>
                  {isToday && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border border-white" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-50 pb-3">
            Today's Target Checklists
          </h3>
          <div className="space-y-3">
            {dailyTasks.map((task, i) => (
              <div key={i} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                    task.status === 'in-progress' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <CheckCircle size={15} />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                      {task.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{task.progress}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                  task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                  task.status === 'in-progress' ? 'bg-amber-50 text-amber-700 animate-pulse' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>

          {/* Streak tip */}
          <div className="mt-4 p-3 bg-orange-50 rounded-2xl border border-orange-100">
            <p className="text-xs text-orange-700 font-semibold leading-relaxed">
              💡 Visit the app every day to maintain your streak. Missing a day resets it to 1!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
