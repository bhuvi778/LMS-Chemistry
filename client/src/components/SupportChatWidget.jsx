import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { io } from 'socket.io-client';
import api from '../api/client.js';
import { MessageCircle, X, Send, AlertCircle, User, Loader2 } from 'lucide-react';

export default function SupportChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const socketRef = useRef(null);
  const listEndRef = useRef(null);
  const historyFetchedRef = useRef(false);

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (historyFetchedRef.current) return;
    historyFetchedRef.current = true;
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/chats/history');
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Socket connection
  useEffect(() => {
    if (!user || user.role === 'admin') return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please re-login to use chat support.');
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Join private support room
      socket.emit('chat:join', { studentId: String(user._id) }, (res) => {
        if (res?.error) {
          console.error('[Chat] Join error:', res.error);
          setError('Could not join support chat. Retrying...');
        } else {
          // Load history once connected
          loadHistory();
        }
      });
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError('Connection failed. Please try again shortly.');
      console.error('[Chat] connect_error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setError('Disconnected from support. Reconnecting...');
      }
    });

    socket.on('reconnect', () => {
      setError(null);
      setConnected(true);
      // Rejoin room on reconnect
      socket.emit('chat:join', { studentId: String(user._id) });
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        // Dedup by _id
        if (msg._id && prev.some((m) => m._id && m._id.toString() === msg._id.toString())) {
          return prev;
        }
        // Replace optimistic message by text match
        const optIdx = prev.findIndex((m) => m._optimistic && m.text === msg.text);
        if (optIdx !== -1) {
          const next = [...prev];
          next[optIdx] = msg;
          return next;
        }
        return [...prev, msg];
      });

      // Increment unread if chat is closed and message is from support (not us)
      const senderId = String(msg.sender?._id || msg.sender || '');
      const myId = String(user._id);
      if (!open && senderId !== myId) {
        setUnread((v) => v + 1);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Scroll and unread reset when opening chat
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, [open, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!socketRef.current?.connected) {
      setError('Not connected to support. Please wait...');
      return;
    }

    // Optimistic message
    const optimistic = {
      _optimistic: true,
      _id: null,
      sender: user._id,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    socketRef.current.emit('chat:message', {
      studentId: String(user._id),
      text: trimmed,
    });
    setText('');
  };

  const fmtTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!user || user.role === 'admin') return null;

  const myId = String(user._id);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-brand-600 to-violet-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group"
          aria-label="Open support chat"
        >
          <MessageCircle size={24} className="group-hover:rotate-6 transition-transform" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white animate-bounce">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Drawer */}
      {open && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-violet-600 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative">
                <User size={20} className="text-white" />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-brand-600 ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Support Chat</h4>
                <p className="text-[11px] text-white/80">
                  {connected ? '🟢 Online' : '🟡 Connecting...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 flex items-center gap-2 text-xs text-rose-600 font-semibold shrink-0">
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <div className="text-center py-2">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Support Chat
              </div>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                Ask any question — our team will respond here.
              </p>
            </div>

            {historyLoading && (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-brand-400" />
              </div>
            )}

            {messages.map((m, idx) => {
              const senderId = String(m.sender?._id || m.sender || '');
              const isMe = senderId === myId;
              return (
                <div key={m._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm text-sm ${
                    isMe
                      ? `bg-brand-600 text-white rounded-tr-sm ${m._optimistic ? 'opacity-70' : ''}`
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                  }`}>
                    {!isMe && m.senderName && (
                      <div className="text-[10px] font-bold text-violet-600 mb-0.5">{m.senderName}</div>
                    )}
                    <div className="leading-relaxed break-words">{m.text}</div>
                    <div className={`text-[9px] text-right mt-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                      {m._optimistic ? 'Sending...' : fmtTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={connected ? 'Type your message...' : 'Connecting to support...'}
              disabled={!connected}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!text.trim() || !connected}
              className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 hover:bg-brand-700 disabled:opacity-50 transition"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
