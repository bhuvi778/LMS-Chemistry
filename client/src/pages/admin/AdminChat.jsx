import { useState, useEffect, useRef } from 'react';
import api from '../../api/client.js';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, Send, User, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // student object
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState('');

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const selectedStudentRef = useRef(null);

  // Sync ref to use inside event listeners
  useEffect(() => {
    selectedStudentRef.current = selectedStudent;
  }, [selectedStudent]);

  // Load conversation rooms list
  const loadConversations = (silent = false) => {
    if (!silent) setLoadingConv(true);
    api.get('/chats/admin/conversations')
      .then(({ data }) => {
        setConversations(data || []);
      })
      .catch(() => {
        toast.error('Failed to load active chats');
      })
      .finally(() => {
        if (!silent) setLoadingConv(false);
      });
  };

  useEffect(() => {
    loadConversations();

    // Setup Socket
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token: token || '' },
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // If we already have a student selected, rejoin their room
      if (selectedStudentRef.current) {
        socket.emit('chat:join', { studentId: selectedStudentRef.current._id });
      }
    });

    // Listen to real-time messages
    socket.on('chat:message', (msg) => {
      const activeStudent = selectedStudentRef.current;
      const isForActiveRoom =
        activeStudent &&
        (msg.sender === activeStudent._id || msg.recipient === activeStudent._id);

      if (isForActiveRoom) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Call read endpoint silently
        if (msg.sender === activeStudent._id) {
          api.put(`/chats/admin/read/${activeStudent._id}`).catch(() => {});
        }
      }

      // Refresh sidebar list silently to update last message and badges
      loadConversations(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch chat history for selected student
  useEffect(() => {
    if (!selectedStudent) {
      setMessages([]);
      return;
    }

    setLoadingHistory(true);
    // Join student socket room
    if (socketRef.current) {
      socketRef.current.emit('chat:join', { studentId: selectedStudent._id }, (res) => {
        if (res?.error) console.error(res.error);
      });
    }

    api.get(`/chats/admin/history/${selectedStudent._id}`)
      .then(({ data }) => {
        setMessages(data || []);
        // Reset unread count for this student in local state
        setConversations((prev) =>
          prev.map((c) =>
            c.student._id === selectedStudent._id ? { ...c, unreadCount: 0 } : c
          )
        );
      })
      .catch(() => {
        toast.error('Failed to load chat history');
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [selectedStudent]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingHistory]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedStudent || !socketRef.current) return;

    socketRef.current.emit('chat:message', {
      studentId: selectedStudent._id,
      text: text.trim(),
    });

    setText('');
  };

  const filteredConversations = conversations.filter((c) =>
    c.student.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.student.email?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtTime = (ts) => {
    return new Date(ts).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex rounded-2xl bg-white border border-slate-100 shadow-soft overflow-hidden">
      {/* Conversations Sidebar (Left Pane) */}
      <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-sm">Active Support Chats</h2>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-black uppercase">Live</span>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search chat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConv ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Loader2 className="animate-spin mx-auto mb-1.5 text-brand-500" size={16} /> Loading rooms...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No active rooms.</div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = selectedStudent?._id === c.student._id;
              return (
                <div
                  key={c.student._id}
                  onClick={() => setSelectedStudent(c.student)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-100/50 transition relative ${
                    isSelected ? 'bg-white border-l-4 border-brand-600' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-xs truncate">{c.student.name}</span>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">
                        {c.lastMessage._id ? fmtTime(c.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.student.email}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-1 flex items-center justify-between">
                      <span className={c.unreadCount > 0 ? 'font-bold text-slate-800' : ''}>
                        {c.lastMessage.sender === user._id ? 'You: ' : ''}{c.lastMessage.text}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold shrink-0 ml-1">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Pane (Right Pane) */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedStudent ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{selectedStudent.name}</h3>
                  <p className="text-[10px] text-slate-400">{selectedStudent.email}</p>
                </div>
              </div>
            </div>

            {/* Messages Listing */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {loadingHistory ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  <Loader2 className="animate-spin text-brand-500 mr-1.5" size={16} /> Loading messages...
                </div>
              ) : (
                messages.map((m) => {
                  const isSupportSender = String(m.sender?._id || m.sender) === String(user._id);
                  return (
                    <div key={m._id} className={`flex ${isSupportSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isSupportSender
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        {!isSupportSender && (
                          <div className="text-[9px] font-bold text-violet2-600 mb-0.5">{m.senderName}</div>
                        )}
                        <div className="leading-relaxed break-words">{m.text}</div>
                        <div className={`text-[9px] text-right mt-1 ${isSupportSender ? 'text-white/70' : 'text-slate-400'}`}>
                          {fmtTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center shrink-0">
              <input
                required
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type message to student..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="h-11 px-5 rounded-xl bg-brand-600 text-white flex items-center justify-center gap-1.5 hover:bg-brand-700 disabled:opacity-50 text-xs font-bold transition shadow-sm"
              >
                <Send size={14} /> Send Message
              </button>
            </form>
          </>
        ) : (
          /* Welcome/Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/20">
            <MessageSquare size={48} className="text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No chat room selected</h3>
            <p className="text-xs max-w-[280px] mt-1">Select an active student room from the left pane to view correspondence and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
