import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff,
  Users, MessageCircle, Send, Loader2, ArrowLeft,
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function LiveRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [meta, setMeta] = useState(null);
  const [role, setRole] = useState(null); // 'host' | 'viewer'
  const [connecting, setConnecting] = useState(true);
  const [hostName, setHostName] = useState('Instructor');
  const [hostStreamReady, setHostStreamReady] = useState(false);
  const [peers, setPeers] = useState([]); // for host: list of viewers
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');

  // Local media controls
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [shareOn, setShareOn] = useState(false);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map());   // peerId -> MediaStream
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);          // viewer's main video
  const myPeerIdRef = useRef(null);
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((v) => v + 1);

  // ── Fetch live class metadata ──
  useEffect(() => {
    api.get(`/live/${id}`)
      .then(({ data }) => setMeta(data))
      .catch((err) => {
        toast.error(err.message || 'Cannot access live class');
        nav('/dashboard');
      });
  }, [id, nav]);

  // ── Build a peer connection ──
  const createPeerConnection = useCallback((peerId, isInitiator, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

    // Add local tracks if we have a stream (host always; viewer doesn't)
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          to: peerId,
          data: { type: 'ice', candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      const remoteStream = e.streams[0] || new MediaStream([e.track]);
      remoteStreamsRef.current.set(peerId, remoteStream);
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        setHostStreamReady(true);
      }
      rerender();
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        cleanupPeer(peerId);
      }
    };

    if (isInitiator) {
      (async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit('signal', { to: peerId, data: { type: 'offer', sdp: pc.localDescription } });
        } catch (e) { console.error('offer err', e); }
      })();
    }

    return pc;
  }, []);

  const cleanupPeer = (peerId) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) { try { pc.close(); } catch { /* */ } peerConnectionsRef.current.delete(peerId); }
    remoteStreamsRef.current.delete(peerId);
    rerender();
  };

  // ── Connect socket + WebRTC once meta + user ready ──
  const connect = async (joinAsHost) => {
    setConnecting(true);
    try {
      // Get local media for host
      let stream = null;
      if (joinAsHost) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }

      const token = localStorage.getItem('token');
      const socket = io({ auth: { token }, path: '/socket.io' });
      socketRef.current = socket;

      socket.on('connect_error', (err) => {
        toast.error('Connection failed: ' + err.message);
        setConnecting(false);
      });

      socket.on('connect', () => {
        socket.emit('join', { liveClassId: id, role: joinAsHost ? 'host' : 'viewer' }, (ack) => {
          if (ack?.error) {
            toast.error(ack.error);
            socket.disconnect();
            setConnecting(false);
            return;
          }
          myPeerIdRef.current = ack.peerId;
          setRole(ack.role);
          setConnecting(false);
        });
      });

      // Existing peers in room (for host: existing viewers; for viewer: existing host)
      socket.on('peers', ({ list }) => {
        list.forEach((p) => {
          if (joinAsHost && p.role === 'viewer') {
            setPeers((prev) => [...prev, p]);
            createPeerConnection(p.peerId, true, stream);
          } else if (!joinAsHost && p.role === 'host') {
            setHostName(p.name || 'Instructor');
            // host will initiate offer when it sees us joining
          }
        });
      });

      socket.on('peer-joined', (p) => {
        if (joinAsHost && p.role === 'viewer') {
          setPeers((prev) => [...prev, p]);
          createPeerConnection(p.peerId, true, stream); // host initiates
        } else if (!joinAsHost && p.role === 'host') {
          setHostName(p.name || 'Instructor');
        }
      });

      socket.on('peer-left', ({ peerId }) => {
        cleanupPeer(peerId);
        setPeers((prev) => prev.filter((p) => p.peerId !== peerId));
      });

      socket.on('signal', async ({ from, data }) => {
        let pc = peerConnectionsRef.current.get(from);
        if (!pc) {
          // Viewer: receives offer from host → create non-initiator PC, no local stream
          pc = createPeerConnection(from, false, joinAsHost ? stream : null);
        }
        try {
          if (data.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', { to: from, data: { type: 'answer', sdp: pc.localDescription } });
          } else if (data.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } else if (data.type === 'ice' && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } catch (e) { console.error('signal err', e); }
      });

      socket.on('host-ended', () => {
        toast('Live class ended by host', { icon: '⏹️' });
        cleanupAll();
        setTimeout(() => nav(user.role === 'admin' ? '/admin/live-classes' : '/dashboard'), 1500);
      });

      socket.on('chat', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    } catch (e) {
      toast.error('Failed to access camera/microphone: ' + e.message);
      setConnecting(false);
    }
  };

  const cleanupAll = () => {
    peerConnectionsRef.current.forEach((pc) => { try { pc.close(); } catch { /* */ } });
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (socketRef.current) { try { socketRef.current.disconnect(); } catch { /* */ } socketRef.current = null; }
  };

  useEffect(() => () => cleanupAll(), []);

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((v) => !v);
  };
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((v) => !v);
  };

  const toggleScreenShare = async () => {
    if (shareOn) {
      // Stop screen share, restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && camTrack) sender.replaceTrack(camTrack);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setShareOn(false);
    } else {
      try {
        const ds = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = ds;
        const screenTrack = ds.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = ds;
        screenTrack.onended = () => toggleScreenShare();
        setShareOn(true);
      } catch (e) {
        toast.error('Screen share denied');
      }
    }
  };

  const endClass = () => {
    if (!confirm('End this live class for everyone?')) return;
    socketRef.current?.emit('end');
    cleanupAll();
    nav('/admin/live-classes');
  };

  const leave = () => {
    cleanupAll();
    nav(user?.role === 'admin' ? '/admin/live-classes' : '/dashboard');
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatText.trim() || !socketRef.current) return;
    socketRef.current.emit('chat', { text: chatText.trim() });
    setChatText('');
  };

  if (!meta) {
    return (
      <div className="min-h-screen bg-slate-900 grid place-items-center text-white">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // ── Pre-join screen ──
  if (!role) {
    const isAdmin = user?.role === 'admin';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <button onClick={() => nav(-1)} className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm mb-4">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 grid place-items-center text-white">
              <Video size={22} />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight">{meta.title}</h1>
              <div className="text-xs text-slate-500">{meta.courseName || 'General'} · {meta.instructor}</div>
            </div>
          </div>
          <div className="text-sm text-slate-600 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div><b>Scheduled:</b> {new Date(meta.scheduledAt).toLocaleString('en-AE')}</div>
            <div><b>Duration:</b> {meta.durationMins} minutes</div>
            <div className="mt-1">
              <span className={`chip text-[10px] ${
                meta.status === 'live' ? 'bg-rose-100 text-rose-700' :
                meta.status === 'ended' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'
              }`}>
                {meta.status === 'live' ? '🔴 LIVE NOW' : meta.status === 'ended' ? 'Ended' : 'Scheduled'}
              </span>
            </div>
          </div>
          {meta.status === 'ended' ? (
            <p className="text-center text-slate-500 text-sm mt-6">This class has ended.</p>
          ) : (
            <div className="space-y-3 mt-6">
              {isAdmin && (
                <button onClick={() => connect(true)} disabled={connecting} className="btn-primary w-full justify-center">
                  {connecting ? <Loader2 className="animate-spin" size={16} /> : <Video size={16} />}
                  Start as Host (Instructor)
                </button>
              )}
              <button onClick={() => connect(false)} disabled={connecting} className={`btn w-full justify-center ${isAdmin ? 'btn-outline' : 'btn-primary'}`}>
                {connecting ? <Loader2 className="animate-spin" size={16} /> : <Users size={16} />}
                Join as Viewer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── In-room screen ──
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <div>
            <div className="font-bold text-sm leading-tight">{meta.title}</div>
            <div className="text-[11px] text-slate-400">
              {role === 'host' ? `You're hosting · ${peers.length} viewer${peers.length !== 1 ? 's' : ''}` : `Hosted by ${hostName}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen((v) => !v)}
            className={`p-2 rounded-xl ${chatOpen ? 'bg-brand-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative">
          {role === 'host' ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="max-w-full max-h-full rounded-2xl bg-black shadow-2xl" />
          ) : (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className={`max-w-full max-h-full rounded-2xl bg-black shadow-2xl ${!hostStreamReady && 'opacity-0'}`} />
              {!hostStreamReady && (
                <div className="absolute inset-0 grid place-items-center text-white">
                  <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-3" size={36} />
                    <div className="text-sm">Waiting for host to start streaming…</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700 text-white text-sm font-bold flex items-center justify-between">
              <span>Live Chat</span>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">No messages yet</div>
              ) : messages.map((m, i) => (
                <div key={i} className={`text-xs ${m.from === myPeerIdRef.current ? 'text-right' : ''}`}>
                  <div className="text-slate-400 mb-0.5">{m.name}</div>
                  <div className={`inline-block px-3 py-2 rounded-xl max-w-[85%] break-words ${
                    m.from === myPeerIdRef.current ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-slate-700 flex gap-2">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:border-brand-500 outline-none"
              />
              <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-lg">
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 flex items-center justify-center gap-2">
        {role === 'host' && (
          <>
            <button onClick={toggleMic} className={`p-3 rounded-full transition ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'}`}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button onClick={toggleCam} className={`p-3 rounded-full transition ${camOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'}`}>
              {camOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button onClick={toggleScreenShare} className={`p-3 rounded-full transition ${shareOn ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
              {shareOn ? <MonitorOff size={18} /> : <Monitor size={18} />}
            </button>
            <button onClick={endClass} className="px-4 py-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 font-semibold text-sm flex items-center gap-2">
              <PhoneOff size={16} /> End Class
            </button>
          </>
        )}
        {role === 'viewer' && (
          <button onClick={leave} className="px-4 py-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 font-semibold text-sm flex items-center gap-2">
            <PhoneOff size={16} /> Leave
          </button>
        )}
      </div>
    </div>
  );
}
