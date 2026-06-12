import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { io } from 'socket.io-client';
import api from '../../api/client.js';
import { MessageSquare, Send, AlertCircle, User, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const historyFetchedRef = useRef(false);

  // Load chat history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/chats/history');
      setMessages(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      toast.error('Failed to load chat history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Socket connection
  useEffect(() => {
    if (!user) return;

    loadHistory();

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please re-login to use chat support.');
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling'],
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
          setError('Could not join support chat room.');
        }
      });
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError('Connection failed. Retrying...');
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
    });

    return () => {
      socket.disconnect();
    };
  }, [user, loadHistory]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, historyLoading]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current || !connected) return;

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

  const myId = String(user?._id || '');

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Support Chat</h1>
          <p className="text-sm text-slate-500 mt-1">Chat directly with our team for questions and assistance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {connected ? 'Live Online' : 'Connecting...'}
          </span>
          <button
            onClick={loadHistory}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-white border border-slate-100 shadow-sm transition"
            title="Refresh Chat History"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-rose-700 shrink-0">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Main chat window container */}
      <div className="flex-1 min-h-0 bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          <div className="text-center py-2 max-w-sm mx-auto space-y-1">
            <div className="inline-block p-3 rounded-full bg-brand-50 text-brand-600 mb-2">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">Official Support Chat</h3>
            <p className="text-xs text-slate-400">
              Welcome to support. Ask details about subscription plans, validities, or general concerns, and our support team will reply to you.
            </p>
          </div>

          {historyLoading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              <Loader2 className="animate-spin text-brand-500 mr-1.5" size={16} /> Loading chat history...
            </div>
          ) : (
            messages.map((m, idx) => {
              const senderId = String(m.sender?._id || m.sender || '');
              const isMe = senderId === myId;
              return (
                <div key={m._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {!isMe && m.senderName && (
                      <div className="text-[10px] font-bold text-indigo-600 mb-1">{m.senderName}</div>
                    )}
                    <div className="leading-relaxed break-words">{m.text}</div>
                    <div className={`text-[9px] text-right mt-1.5 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                      {m._optimistic ? 'Sending...' : fmtTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Form Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center shrink-0">
          <input
            required
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={connected ? 'Write your message to support...' : 'Connecting to support service...'}
            disabled={!connected}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!text.trim() || !connected}
            className="h-11 px-5 rounded-2xl bg-brand-600 text-white flex items-center justify-center gap-1.5 hover:bg-brand-700 disabled:opacity-50 text-xs font-bold transition shadow-sm"
          >
            <Send size={14} /> Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
