import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

export default function StudentExamCounter() {
  const [countdowns, setCountdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    api.get('/exam-countdown/active')
      .then(r => {
        setCountdowns(r.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (countdowns.length === 0) return;

    const calculateTimeLeft = () => {
      const newTimers = {};
      countdowns.forEach(c => {
        const diff = new Date(c.examDate) - new Date();
        if (diff > 0) {
          newTimers[c._id] = {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            ended: false
          };
        } else {
          newTimers[c._id] = { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
        }
      });
      setTimers(newTimers);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [countdowns]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const colorClasses = {
    cyan: 'from-cyan-500 via-cyan-600 to-blue-600 border-cyan-400 bg-cyan-50/10 text-cyan-700 dark:text-cyan-400',
    blue: 'from-blue-500 via-blue-600 to-indigo-600 border-blue-400 bg-blue-50/10 text-blue-700 dark:text-blue-400',
    red: 'from-red-500 via-red-600 to-pink-600 border-red-400 bg-red-50/10 text-red-700 dark:text-red-400',
    green: 'from-green-500 via-green-600 to-emerald-600 border-green-400 bg-green-50/10 text-green-700 dark:text-green-400',
    purple: 'from-purple-500 via-purple-600 to-pink-600 border-purple-400 bg-purple-50/10 text-purple-700 dark:text-purple-400',
    orange: 'from-orange-500 via-orange-600 to-red-600 border-orange-400 bg-orange-50/10 text-orange-700 dark:text-orange-400',
    pink: 'from-pink-500 via-pink-600 to-rose-600 border-pink-400 bg-pink-50/10 text-pink-700 dark:text-pink-400'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-brand-500" /> Exam Counter
          </h1>
          <p className="text-slate-500 text-sm">Ticking countdowns for your upcoming category-specific exams.</p>
        </div>
      </div>

      {countdowns.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center max-w-lg mx-auto mt-8 shadow-inner">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Countdown Configured</h3>
          <p className="text-slate-500 text-sm mt-1">There are no upcoming active exam countdowns for your course categories at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countdowns.map(c => {
            const grad = colorClasses[c.color] || colorClasses.cyan;
            const timer = timers[c._id] || { days: 0, hours: 0, minutes: 0, seconds: 0, ended: false };

            return (
              <div key={c._id} className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Accent Top Bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${grad.split(' ').slice(0, 3).join(' ')}`} />

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center`}>
                        <i className={`fas ${c.icon} text-lg`}></i>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-base leading-tight truncate">{c.examName}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">{c.category}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-xs text-slate-500 mb-6 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">{c.description}</p>
                    )}

                    {/* Clock numbers */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {[
                        { val: timer.days, lbl: 'Days' },
                        { val: timer.hours, lbl: 'Hours' },
                        { val: timer.minutes, lbl: 'Mins' },
                        { val: timer.seconds, lbl: 'Secs' }
                      ].map((t, idx) => (
                        <div key={idx} className="text-center">
                          <div className={`bg-gradient-to-br ${grad.split(' ').slice(0, 3).join(' ')} text-white font-black text-xl md:text-2xl p-3 rounded-2xl shadow-sm tracking-tight`}>
                            {String(t.val).padStart(2, '0')}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1.5">{t.lbl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Footer */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(c.examDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    {timer.ended ? (
                      <span className="text-red-500 font-extrabold uppercase tracking-widest text-[9px] bg-red-50 px-2 py-0.5 rounded border border-red-100">Ended</span>
                    ) : (
                      <span className="text-emerald-600 font-extrabold uppercase tracking-widest text-[9px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Live</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
