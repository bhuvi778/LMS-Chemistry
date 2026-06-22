import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, CheckCheck, Video, X as XIcon } from 'lucide-react';
import { initFirebase, requestFCMToken, onForegroundMessage } from '../services/firebase.js';

export default function NotificationBell({ darkMode = false }) {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isFirstLoadRef = useRef(true);
  const prevUnreadRef = useRef(0);

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Tone 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      // Tone 2: A5 (880.00 Hz) slightly delayed
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880.00, ctx.currentTime);
          gain2.gain.setValueAtTime(0.08, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.25);
        } catch (e) {
          console.error(e);
        }
      }, 120);
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  };

  const load = () => {
    if (!user) return;
    api.get('/notifications').then(({ data }) => {
      setList(data.list || []);
      const newUnread = data.unread || 0;
      setUnread(newUnread);

      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      } else if (newUnread > prevUnreadRef.current) {
        playChime();
      }
      prevUnreadRef.current = newUnread;
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) { setList([]); setUnread(0); return; }
    load();
    const id = setInterval(load, 30000);

    // Register FCM token
    initFirebase();
    requestFCMToken().then((token) => {
      if (token) {
        api.post('/notifications/fcm-token', { token }).catch(() => {});
      }
    });

    // Foreground message handler
    const unsub = onForegroundMessage((payload) => {
      load(); // Refresh notifications on new push
    });

    return () => { clearInterval(id); if (unsub) unsub(); };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markOne = async (n) => {
    if (n.read) return;
    try { await api.put(`/notifications/${n._id}/read`); load(); } catch { /* */ }
  };
  const trackClick = async (n) => {
    try {
      await api.put(`/notifications/${n._id}/click`);
    } catch (_) {}
  };
  const handleCtaClick = async (e, n, action) => {
    e.stopPropagation();
    e.preventDefault();
    await trackClick(n);
    await markOne(n);
    setOpen(false);
    if (action === 'buy') {
      window.location.href = `/courses/${n.buyCourseId}`;
    } else if (action === 'call') {
      window.location.href = `tel:${n.callPhoneNumber}`;
    }
  };
  const dismissOne = async (e, n) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.put(`/notifications/${n._id}/read`);
      load();
    } catch { /* */ }
  };
  const markAll = async () => {
    try { await api.put('/notifications/read-all'); load(); } catch { /* */ }
  };

  const fmtTime = (ts) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-xl transition ${
          darkMode ? 'text-white/80 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center px-1 ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-soft">
            <div>
              <div className="font-bold text-sm">Notifications</div>
              <div className="text-[11px] text-slate-500">{unread} unread</div>
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {list.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No notifications yet</div>
            ) : (
              list.map((n) => {
                const Inner = (
                  <div
                    onClick={() => markOne(n)}
                    className={`flex gap-3 p-3 border-b border-slate-50 cursor-pointer transition relative group ${
                      n.read ? 'bg-white hover:bg-slate-50' : 'bg-brand-50/50 hover:bg-brand-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg shrink-0 grid place-items-center ${
                      n.type === 'live_class' ? 'bg-rose-100 text-rose-600' :
                      n.type === 'enrollment' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-brand-100 text-brand-600'
                    }`}>
                      {n.type === 'live_class' ? <Video size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-slate-800 leading-snug">{n.title}</div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />}
                      </div>
                       {n.message && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-3 whitespace-pre-wrap">{n.message}</div>
                      )}
                      {n.image && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-100 max-h-24">
                          <img src={n.image} alt="Notification Banner" className="w-full h-auto object-cover max-h-24" />
                        </div>
                      )}
                      {(n.showBuyButton || n.showCallButton) && (
                        <div className="flex gap-2 mt-2">
                          {n.showBuyButton && n.buyCourseId && (
                            <button
                              onClick={(e) => handleCtaClick(e, n, 'buy')}
                              className="px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-[10px] font-bold transition"
                            >
                              Buy Course
                            </button>
                          )}
                          {n.showCallButton && n.callPhoneNumber && (
                            <a
                              href={`tel:${n.callPhoneNumber}`}
                              onClick={(e) => handleCtaClick(e, n, 'call')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center justify-center"
                            >
                              Call Now
                            </a>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">{fmtTime(n.createdAt)}</div>
                    </div>
                    {n.isDismissable !== false && !n.read && (
                      <button
                        onClick={(e) => dismissOne(e, n)}
                        title="Dismiss"
                        className="absolute right-2 top-2 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                      >
                        <XIcon size={12} />
                      </button>
                    )}
                  </div>
                );
                return n.link ? (
                  <Link key={n._id} to={n.link} onClick={() => setOpen(false)}>{Inner}</Link>
                ) : (
                  <div key={n._id}>{Inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
