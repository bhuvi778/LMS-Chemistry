import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Calendar, Clock, Loader2, Play, ExternalLink, HelpCircle } from 'lucide-react';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

export default function LiveClasses() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState({ ongoing: [], upcoming: [], past: [] });
  const [activeTab, setActiveTab] = useState('ongoing');

  useEffect(() => {
    api.get('/admin/live-classes/all')
      .then(({ data }) => {
        setClasses(data || { ongoing: [], upcoming: [], past: [] });
        // Auto-select tab if ongoing has classes
        if (data && data.ongoing && data.ongoing.length > 0) {
          setActiveTab('ongoing');
        } else if (data && data.upcoming && data.upcoming.length > 0) {
          setActiveTab('upcoming');
        } else {
          setActiveTab('past');
        }
      })
      .catch((err) => {
        toast.error('Failed to fetch live classes');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getTabCount = (tabName) => {
    return classes[tabName]?.length || 0;
  };

  const renderClassList = (tabName) => {
    const list = classes[tabName] || [];

    if (list.length === 0) {
      return (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Video size={28} />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">No Live Classes Here</h3>
          <p className="text-slate-400 text-sm mt-1">
            {tabName === 'ongoing' ? 'There are no classes live right now. Check upcoming schedule!' :
             tabName === 'upcoming' ? 'No future live classes scheduled at the moment.' :
             'No past live class history found.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((lc) => {
          const isLive = tabName === 'ongoing';
          const startTime = new Date(lc.scheduledAt);
          const isFree = !lc.course;
          
          return (
            <div key={lc._id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
              <div className="p-5 space-y-4">
                {/* Header info */}
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    isFree ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-brand-50 text-brand-700'
                  }`}>
                    {isFree ? 'Free Class' : 'Enrolled Course'}
                  </span>

                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {lc.platform === 'agora_stream' ? 'Ace Live' :
                     lc.platform === 'agora_call' ? 'Ace Meet' :
                     lc.platform === 'agora_interactive' ? 'Ace Interactive' :
                     lc.platform === 'agora_broadcast' ? 'Ace Broadcast' : 'Ace Meet'}
                  </span>
                </div>

                {/* Title and details */}
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-slate-800 text-base leading-snug group-hover:text-brand-700 transition">
                    {lc.title}
                  </h3>
                  {lc.description && (
                    <p className="text-xs text-slate-450 leading-relaxed line-clamp-2">
                      {lc.description}
                    </p>
                  )}
                </div>

                {/* Meta details */}
                <div className="space-y-1.5 pt-3 border-t border-slate-50 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      {startTime.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-slate-400" />
                    <span>
                      {startTime.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {lc.durationMins && ` (${lc.durationMins} Mins)`}
                    </span>
                  </div>
                  {!isFree && lc.course?.title && (
                    <div className="text-[11px] text-slate-405 font-medium truncate pt-1">
                      Course: {lc.course.title}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                {['internal', 'agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast', 'youtube'].includes(lc.platform || (lc.useInternalRoom ? 'internal' : 'meet')) ? (
                  <Link
                    to={`/live/${lc._id}`}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                      isLive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-soft animate-pulse'
                        : 'bg-gradient-brand text-white shadow-soft hover:shadow-glow'
                    }`}
                  >
                    <Video size={14} />
                    <span>{isLive ? 'Join Now (Live)' : 'Open Room'}</span>
                  </Link>
                ) : (lc.meetLink || lc.meetingUrl) ? (
                  <a
                    href={lc.meetLink || lc.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-soft hover:shadow-glow transition-all duration-200"
                  >
                    <ExternalLink size={14} />
                    <span>Join Class</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  >
                    <span>Room Offline</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Video size={24} className="text-brand-600 animate-pulse" /> Live Classes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Access all live courses, interactive batches, and free open sessions in one place.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 size={32} className="animate-spin text-brand-600 mr-2" />
          <span className="font-semibold">Loading live classes...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-100 pb-px scrollbar-none overflow-x-auto">
            {[
              { id: 'ongoing', label: 'Live & Ongoing' },
              { id: 'upcoming', label: 'Upcoming Scheduled' },
              { id: 'past', label: 'Past Classes' }
            ].map((tab) => {
              const count = getTabCount(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-brand-600 text-brand-700 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List display */}
          <div>
            {renderClassList(activeTab)}
          </div>
        </div>
      )}
    </div>
  );
}
