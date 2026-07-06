import { useEffect, useState } from 'react';
import { Clock, Video, Search, ArrowRight, PlayCircle, Calendar, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import LogoLoader from '../../components/LogoLoader.jsx';

export default function WatchHistory() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        const res = await api.get('/enroll/watch-history');
        setHistoryList(res.data || []);
      } catch (err) {
        console.error('Failed to load watch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchHistory();
  }, []);

  // Filter history by search term
  const filteredHistory = historyList.filter((item) => {
    const titleMatch = item.videoTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const courseMatch = item.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || courseMatch;
  });

  // Calculate statistics
  const totalSeconds = historyList.reduce((acc, curr) => acc + (curr.watchedDuration || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(2);
  const totalVideos = historyList.length;

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 flex items-center justify-center min-h-[400px]">
        <LogoLoader size={60} text="Loading your watch stats..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Block */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-soft relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">Watch History</h1>
            <p className="text-brand-100 text-xs sm:text-sm mt-1 font-medium">
              Track how many hours of video lectures you have completed
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[10px] text-brand-100 font-bold uppercase tracking-wider">Total Time</div>
                <div className="text-lg font-black">{totalHours} Hrs</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Video size={20} />
              </div>
              <div>
                <div className="text-[10px] text-brand-100 font-bold uppercase tracking-wider">Lectures</div>
                <div className="text-lg font-black">{totalVideos} Watched</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by lecture title or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        {/* Watch History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-100">
              <Video size={24} />
            </div>
            <h3 className="font-bold text-slate-700 text-base">No Watch History Found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto font-medium">
              {searchTerm ? "We couldn't find any watched lectures matching your search." : "Start watching your course video lectures to view history records here."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredHistory.map((item) => (
              <div
                key={item._id}
                className="group bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail / Course Icon */}
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {item.course?.thumbnail ? (
                      <img
                        src={item.course.thumbnail}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <GraduationCap size={22} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-brand-700 transition">
                      {item.videoTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-400">
                      <span className="text-slate-500">{item.course?.title || 'Course Details'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Watched: {formatDuration(item.watchedDuration || 0)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(item.lastWatchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                {item.course?._id && (
                  <Link
                    to={`/student/learn/${item.course._id}`}
                    className="inline-flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-white hover:bg-brand-50 text-brand-700 border border-slate-200 hover:border-brand-200 text-xs font-bold rounded-xl transition shadow-inner"
                  >
                    <PlayCircle size={14} /> Resume Lecture <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
