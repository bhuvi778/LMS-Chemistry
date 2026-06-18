import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, PhoneOff,
  Users, MessageCircle, Send, Loader2, ArrowLeft, ExternalLink,
  Volume2, VolumeX, Maximize, Minimize,
} from 'lucide-react';
import SecureYTPlayer from '../components/SecureYTPlayer.jsx';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Agora Video Player sub-component
function AgoraVideoPlayer({ videoTrack, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!videoTrack || !containerRef.current) return;
    videoTrack.play(containerRef.current);
    return () => {
      try {
        videoTrack.stop();
      } catch (e) {
        console.error('Error stopping track:', e);
      }
    };
  }, [videoTrack]);

  return <div ref={containerRef} className={className} />;
}

// Helper to extract YouTube embed URL
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('embed/')) return url;
  
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    videoId = url.trim();
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

export default function LiveRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [meta, setMeta] = useState(null);
  const [role, setRole] = useState(null); // 'host' | 'viewer'
  const [connecting, setConnecting] = useState(false);
  const [hostName, setHostName] = useState('Instructor');
  const [hostStreamReady, setHostStreamReady] = useState(false);
  const [peers, setPeers] = useState([]); // list of viewers
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');

  // Local media states
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [shareOn, setShareOn] = useState(false);

  // Agora states
  const [remoteUsers, setRemoteUsers] = useState([]); // users subscribed
  const [handRaised, setHandRaised] = useState(false);
  const [localIsCoHost, setLocalIsCoHost] = useState(false);
  const [handRaisers, setHandRaisers] = useState([]);
  const [activeCoHosts, setActiveCoHosts] = useState([]);
  const [hostAgoraUid, setHostAgoraUid] = useState(null);
  const [showRaiseRequests, setShowRaiseRequests] = useState(false);

  // WebRTC refs
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map());   // peerId -> MediaStream
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const myPeerIdRef = useRef(null);

  // Agora refs
  const agoraClientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const screenTrackRef = useRef(null);

  // Agora player controls state & refs
  const [streamMuted, setStreamMuted] = useState(false);
  const streamMutedRef = useRef(streamMuted);
  const streamContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    streamMutedRef.current = streamMuted;
  }, [streamMuted]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === streamContainerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleStreamMute = () => {
    const nextMuted = !streamMuted;
    setStreamMuted(nextMuted);
    remoteUsers.forEach((u) => {
      if (u.audioTrack) {
        try {
          u.audioTrack.setVolume(nextMuted ? 0 : 100);
        } catch (e) {
          console.error('Error setting volume:', e);
        }
      }
    });
  };

  const toggleFullscreen = () => {
    if (!streamContainerRef.current) return;
    if (!document.fullscreenElement) {
      streamContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const [, forceRender] = useState(0);
  const rerender = () => forceRender((v) => v + 1);

  // Fetch live class metadata
  useEffect(() => {
    api.get(`/live/${id}`)
      .then(({ data }) => setMeta(data))
      .catch((err) => {
        toast.error(err.message || 'Cannot access live class');
        nav('/dashboard');
      });
  }, [id, nav]);

  // WebRTC - create peer connection
  const createPeerConnection = useCallback((peerId, isInitiator, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

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

  // Connect to Agora
  const connectAgora = async (appId, channel, token, agoraUid, platform, joinAsHost) => {
    try {
      const isCall = platform === 'agora_call';
      const client = AgoraRTC.createClient({ mode: isCall ? 'rtc' : 'live', codec: 'vp8' });
      agoraClientRef.current = client;

      if (!isCall) {
        const agoraRole = joinAsHost ? 'host' : 'audience';
        await client.setClientRole(agoraRole);
      }

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers((prev) => {
            if (prev.find((u) => u.uid === user.uid)) {
              return prev.map((u) => u.uid === user.uid ? user : u);
            }
            return [...prev, user];
          });
        }
        if (mediaType === 'audio') {
          if (user.audioTrack) {
            try {
              user.audioTrack.play();
              user.audioTrack.setVolume(streamMutedRef.current ? 0 : 100);
            } catch (e) {
              console.error('Error auto-playing remote audio:', e);
            }
          }
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      client.on('user-left', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      const numericUid = Number(agoraUid);
      await client.join(appId, channel, token, numericUid);

      if (joinAsHost || isCall) {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
          { mode: 'motion' },
          { AEC: true, ANS: true }
        );
        const [audioTrack, videoTrack] = tracks;
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        await client.publish([audioTrack, videoTrack]);
        rerender();
      }
    } catch (err) {
      console.error('Agora connection error:', err);
      toast.error('Failed to initialize Agora RTC: ' + err.message);
    }
  };

  const promoteSelfToAgora = async () => {
    try {
      if (!agoraClientRef.current) return;
      await agoraClientRef.current.setClientRole('host');
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        { mode: 'motion' },
        { AEC: true, ANS: true }
      );
      const [audioTrack, videoTrack] = tracks;
      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;
      await agoraClientRef.current.publish([audioTrack, videoTrack]);
      setLocalIsCoHost(true);
      setCamOn(true);
      setMicOn(true);
      toast.success('You are now a co-host! You can speak and share video.');
      rerender();
    } catch (e) {
      console.error('Failed to promote to co-host:', e);
      toast.error('Failed to start streaming: ' + e.message);
    }
  };

  const demoteSelfFromAgora = async () => {
    try {
      if (agoraClientRef.current) {
        const tracksToUnpublish = [];
        if (localAudioTrackRef.current) tracksToUnpublish.push(localAudioTrackRef.current);
        if (localVideoTrackRef.current) tracksToUnpublish.push(localVideoTrackRef.current);
        if (screenTrackRef.current) tracksToUnpublish.push(screenTrackRef.current);
        if (tracksToUnpublish.length > 0) {
          await agoraClientRef.current.unpublish(tracksToUnpublish);
        }
        if (localAudioTrackRef.current) {
          try { localAudioTrackRef.current.stop(); localAudioTrackRef.current.close(); } catch {}
          localAudioTrackRef.current = null;
        }
        if (localVideoTrackRef.current) {
          try { localVideoTrackRef.current.stop(); localVideoTrackRef.current.close(); } catch {}
          localVideoTrackRef.current = null;
        }
        if (screenTrackRef.current) {
          try { screenTrackRef.current.stop(); screenTrackRef.current.close(); } catch {}
          screenTrackRef.current = null;
        }
        await agoraClientRef.current.setClientRole('audience');
      }
      setLocalIsCoHost(false);
      setHandRaised(false);
      setCamOn(false);
      setMicOn(false);
      toast('You are no longer a co-host', { icon: 'ℹ️' });
      rerender();
    } catch (e) {
      console.error('Failed to demote from co-host:', e);
    }
  };

  const approveHandRaise = (peerId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('approve-hand', { peerId });
  };

  const declineHandRaise = (peerId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('lower-hand', { peerId });
  };

  const removeCoHost = (peerId) => {
    if (!peerId || !socketRef.current) return;
    socketRef.current.emit('remove-cohost', { peerId });
  };

  const connect = async (joinAsHost) => {
    setConnecting(true);
    const platform = meta.platform || (meta.useInternalRoom ? 'internal' : 'meet');
    const isAgora = ['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'].includes(platform);
    const isYoutube = platform === 'youtube';

    try {
      if (!isAgora && !isYoutube && joinAsHost) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }

      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      const socket = io(socketUrl, { auth: { token }, path: '/socket.io', transports: ['polling'] });
      socketRef.current = socket;

      socket.on('connect_error', (err) => {
        toast.error('Connection failed: ' + err.message);
        setConnecting(false);
      });

      socket.on('connect', () => {
        socket.emit('join', { liveClassId: id, role: joinAsHost ? 'host' : 'viewer', agoraUid: meta.agoraUid }, async (ack) => {
          if (ack?.error) {
            toast.error(ack.error);
            socket.disconnect();
            setConnecting(false);
            return;
          }
          myPeerIdRef.current = ack.peerId;
          setRole(ack.role);
          
          if (isAgora) {
            try {
              const { data } = await api.get(`/live/${id}`);
              if (data.agoraToken && data.agoraAppId) {
                await connectAgora(data.agoraAppId, data.agoraChannel, data.agoraToken, data.agoraUid, platform, joinAsHost);
              } else {
                toast.error('Agora session token not generated by server.');
              }
            } catch (err) {
              console.error('Error fetching Agora token:', err);
            }
          }
          setConnecting(false);
        });
      });

      if (!isAgora && !isYoutube) {
        socket.on('peers', ({ list }) => {
          list.forEach((p) => {
            if (joinAsHost && p.role === 'viewer') {
              setPeers((prev) => [...prev, p]);
              createPeerConnection(p.peerId, true, localStreamRef.current);
            } else if (!joinAsHost && p.role === 'host') {
              setHostName(p.name || 'Instructor');
            }
          });
        });

        socket.on('peer-joined', (p) => {
          if (joinAsHost && p.role === 'viewer') {
            setPeers((prev) => [...prev, p]);
            createPeerConnection(p.peerId, true, localStreamRef.current);
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
            pc = createPeerConnection(from, false, joinAsHost ? localStreamRef.current : null);
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
      } else {
        socket.on('peers', ({ list }) => {
          list.forEach((p) => {
            if (p.role === 'viewer') {
              setPeers((prev) => {
                if (prev.some((x) => x.peerId === p.peerId)) return prev;
                return [...prev, p];
              });
            } else if (p.role === 'host') {
              setHostName(p.name || 'Instructor');
              setHostAgoraUid(p.agoraUid);
            }
          });
        });

        socket.on('peer-joined', (p) => {
          if (p.role === 'viewer') {
            setPeers((prev) => {
              if (prev.some((x) => x.peerId === p.peerId)) return prev;
              return [...prev, p];
            });
          } else if (p.role === 'host') {
            setHostName(p.name || 'Instructor');
            setHostAgoraUid(p.agoraUid);
          }
        });

        socket.on('peer-left', ({ peerId }) => {
          setPeers((prev) => prev.filter((p) => p.peerId !== peerId));
          setActiveCoHosts((prev) => prev.filter((id) => id !== peerId));
          setHandRaisers((prev) => prev.filter((h) => h.peerId !== peerId));
        });

        socket.on('raise-hand', ({ peerId, name }) => {
          setHandRaisers((prev) => {
            if (prev.some((h) => h.peerId === peerId)) return prev;
            return [...prev, { peerId, name }];
          });
          if (joinAsHost) {
            toast(`${name} raised hand`, { icon: '✋' });
          }
        });

        socket.on('lower-hand', ({ peerId }) => {
          setHandRaisers((prev) => prev.filter((h) => h.peerId !== peerId));
          setActiveCoHosts((prev) => prev.filter((id) => id !== peerId));
          if (peerId === myPeerIdRef.current) {
            setHandRaised(false);
            if (localIsCoHost) {
              demoteSelfFromAgora();
            }
          }
        });

        socket.on('approve-hand', ({ peerId }) => {
          setHandRaisers((prev) => prev.filter((h) => h.peerId !== peerId));
          setActiveCoHosts((prev) => {
            if (prev.includes(peerId)) return prev;
            return [...prev, peerId];
          });
          if (peerId === myPeerIdRef.current) {
            promoteSelfToAgora();
          }
        });

        socket.on('remove-cohost', ({ peerId }) => {
          setActiveCoHosts((prev) => prev.filter((id) => id !== peerId));
          if (peerId === myPeerIdRef.current) {
            demoteSelfFromAgora();
          }
        });
      }

      socket.on('host-ended', () => {
        toast('Live class ended by host', { icon: '⏹️' });
        cleanupAll();
        setTimeout(() => nav(user.role === 'admin' ? '/admin/live-classes' : '/student/dashboard'), 1500);
      });

      socket.on('chat', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    } catch (e) {
      toast.error('Failed to initialize: ' + e.message);
      setConnecting(false);
    }
  };

  const cleanupAll = () => {
    peerConnectionsRef.current.forEach((pc) => { try { pc.close(); } catch { /* */ } });
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());

    if (localAudioTrackRef.current) {
      try { localAudioTrackRef.current.stop(); localAudioTrackRef.current.close(); } catch (e) {}
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      try { localVideoTrackRef.current.stop(); localVideoTrackRef.current.close(); } catch (e) {}
      localVideoTrackRef.current = null;
    }
    if (screenTrackRef.current) {
      try { screenTrackRef.current.stop(); screenTrackRef.current.close(); } catch (e) {}
      screenTrackRef.current = null;
    }
    if (agoraClientRef.current) {
      try { agoraClientRef.current.leave(); } catch (e) {}
      agoraClientRef.current = null;
    }

    if (socketRef.current) { try { socketRef.current.disconnect(); } catch { /* */ } socketRef.current = null; }
  };

  useEffect(() => () => cleanupAll(), []);

  // Media toggles
  const toggleCam = async () => {
    const platform = meta.platform || (meta.useInternalRoom ? 'internal' : 'meet');
    const isAgora = ['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'].includes(platform);

    if (isAgora) {
      if (localVideoTrackRef.current) {
        const nextState = !camOn;
        await localVideoTrackRef.current.setEnabled(nextState);
        setCamOn(nextState);
      }
    } else {
      if (!localStreamRef.current) return;
      localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setCamOn((v) => !v);
    }
  };

  const toggleMic = async () => {
    const platform = meta.platform || (meta.useInternalRoom ? 'internal' : 'meet');
    const isAgora = ['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'].includes(platform);

    if (isAgora) {
      if (localAudioTrackRef.current) {
        const nextState = !micOn;
        await localAudioTrackRef.current.setEnabled(nextState);
        setMicOn(nextState);
      }
    } else {
      if (!localStreamRef.current) return;
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setMicOn((v) => !v);
    }
  };

  const toggleScreenShare = async () => {
    const platform = meta.platform || (meta.useInternalRoom ? 'internal' : 'meet');
    const isAgora = ['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast'].includes(platform);

    if (isAgora) {
      if (!agoraClientRef.current) return;
      if (shareOn) {
        if (screenTrackRef.current) {
          await agoraClientRef.current.unpublish(screenTrackRef.current);
          screenTrackRef.current.stop();
          screenTrackRef.current.close();
          screenTrackRef.current = null;
        }
        if (localVideoTrackRef.current) {
          await agoraClientRef.current.publish(localVideoTrackRef.current);
        }
        setShareOn(false);
      } else {
        try {
          const track = await AgoraRTC.createScreenVideoTrack();
          screenTrackRef.current = track;
          if (localVideoTrackRef.current) {
            await agoraClientRef.current.unpublish(localVideoTrackRef.current);
          }
          await agoraClientRef.current.publish(track);
          track.on('track-ended', () => {
            toggleScreenShare();
          });
          setShareOn(true);
        } catch (e) {
          toast.error('Screen share denied or failed');
        }
      }
    } else {
      if (shareOn) {
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
    nav(user?.role === 'admin' ? '/admin/live-classes' : '/student/dashboard');
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

  const platform = meta.platform || (meta.useInternalRoom ? 'internal' : 'meet');

  // Pre-join screen
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
            <div className="mt-1 flex gap-1.5 flex-wrap">
              <span className={`chip text-[10px] ${
                meta.status === 'live' ? 'bg-rose-100 text-rose-700' :
                meta.status === 'ended' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'
              }`}>
                {meta.status === 'live' ? '🔴 LIVE NOW' : meta.status === 'ended' ? 'Ended' : 'Scheduled'}
              </span>
              <span className="chip text-[10px] bg-brand-50 text-brand-700 uppercase">
                Platform: {platform === 'internal' ? 'In-App Room' :
                           platform === 'agora_call' ? 'Agora Call' :
                           platform === 'agora_stream' ? 'Agora Stream (Legacy)' :
                           platform === 'agora_interactive' ? 'Agora Interactive' :
                           platform === 'agora_broadcast' ? 'Agora Broadcast' :
                           platform === 'youtube' ? 'YouTube Live' : platform}
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

  // In-room screen
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
          {role === 'host' && platform === 'agora_interactive' && (
            <button
              onClick={() => {
                setShowRaiseRequests((v) => !v);
                setChatOpen(false);
              }}
              className={`p-2 rounded-xl relative ${showRaiseRequests ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
            >
              <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                ✋ {handRaisers.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {handRaisers.length}
                  </span>
                )}
                Requests
              </span>
            </button>
          )}
          <button
            onClick={() => {
              setChatOpen((v) => !v);
              setShowRaiseRequests(false);
            }}
            className={`p-2 rounded-xl ${chatOpen ? 'bg-brand-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative bg-slate-950">
          
          {/* YouTube Embed Player */}
          {platform === 'youtube' && (
            <div className="w-full h-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-700">
              <SecureYTPlayer url={meta.meetingUrl || meta.meetLink} title={meta.title} />
            </div>
          )}

          {/* WebRTC Video Player */}
          {!['agora_call', 'agora_stream', 'agora_interactive', 'agora_broadcast', 'youtube'].includes(platform) && (
            role === 'host' ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="max-w-full max-h-full rounded-2xl bg-black shadow-2xl" />
            ) : (
              <>
                <video ref={remoteVideoRef} autoPlay playsInline className={`max-w-full max-h-full rounded-2xl bg-black shadow-2xl ${!hostStreamReady && 'opacity-0'}`} />
                {!hostStreamReady && (
                  <div className="absolute inset-0 grid place-items-center text-white bg-slate-900/50">
                    <div className="text-center">
                      <Loader2 className="animate-spin mx-auto mb-3" size={36} />
                      <div className="text-sm">Waiting for host to start streaming…</div>
                    </div>
                  </div>
                )}
              </>
            )
          )}

          {/* Agora Call Grid */}
          {platform === 'agora_call' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl h-full p-4 overflow-y-auto align-middle justify-items-center items-center">
              {/* Local Stream */}
              {(role === 'host' || localVideoTrackRef.current) && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 w-full aspect-video shadow-lg border border-slate-700">
                  {camOn && localVideoTrackRef.current ? (
                    <AgoraVideoPlayer videoTrack={localVideoTrackRef.current} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-sm">
                      Camera Off (You)
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-white text-xs font-bold">
                    You ({user.name})
                  </div>
                </div>
              )}
              
              {/* Remote Streams */}
              {remoteUsers.map((rUser) => (
                <div key={rUser.uid} className="relative rounded-2xl overflow-hidden bg-slate-900 w-full aspect-video shadow-lg border border-slate-700">
                  {rUser.hasVideo && rUser.videoTrack ? (
                    <AgoraVideoPlayer videoTrack={rUser.videoTrack} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-sm">
                      Camera Off
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-white text-xs font-bold">
                    Participant {rUser.uid}
                  </div>
                </div>
              ))}
              
              {remoteUsers.length === 0 && (role !== 'host' && !localVideoTrackRef.current) && (
                <div className="col-span-full flex items-center justify-center text-slate-400 py-16">
                  No other participants in the call.
                </div>
              )}
            </div>
          )}

          {/* Agora Interactive Live Stream Player */}
          {['agora_stream', 'agora_interactive', 'agora_broadcast'].includes(platform) && (() => {
            const hostUser = remoteUsers.find((u) => u.uid === Number(hostAgoraUid));
            const remoteCoHosts = remoteUsers.filter((u) => u.uid !== Number(hostAgoraUid));
            return (
              <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 items-center justify-center max-w-6xl overflow-hidden">
                {/* Left Column: Main Host Stream */}
                <div className="flex-1 w-full flex items-center justify-center relative">
                  {role === 'host' ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-700">
                      {camOn && localVideoTrackRef.current ? (
                        <AgoraVideoPlayer videoTrack={localVideoTrackRef.current} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-semibold text-lg bg-slate-950">
                          <VideoOff size={48} className="text-slate-600 mb-2" />
                          <div className="text-sm">Camera is Off</div>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-xl text-white text-sm font-bold">
                        Instructor (You)
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={streamContainerRef}
                      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-700 group/agora"
                    >
                      {hostUser && hostUser.hasVideo && hostUser.videoTrack ? (
                        <AgoraVideoPlayer videoTrack={hostUser.videoTrack} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-950">
                          <Loader2 className="animate-spin mb-3 text-brand-500" size={32} />
                          <div className="text-sm font-semibold">Waiting for instructor to start broadcasting…</div>
                        </div>
                      )}

                      {/* Top Live Badge */}
                      <div className="absolute top-4 left-4 bg-rose-600 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide flex items-center gap-1 z-10">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        LIVE
                      </div>

                      {/* Hover Controls Overlay */}
                      {hostUser && (
                        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/90 to-transparent z-20 flex items-center justify-between px-4 pb-3 opacity-0 group-hover/agora:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={toggleStreamMute}
                              className="text-white hover:text-brand-400 transition"
                              title={streamMuted ? 'Unmute' : 'Mute'}
                            >
                              {streamMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <span className="text-xs text-slate-300 font-semibold">
                              Instructor Stream
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-white/10 border border-white/5 rounded text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                              Agora RTC
                            </span>
                            <button
                              onClick={toggleFullscreen}
                              className="text-white hover:text-brand-400 transition"
                              title="Fullscreen"
                            >
                              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column/Grid: Co-hosts */}
                {(remoteCoHosts.length > 0 || (role !== 'host' && localIsCoHost)) && (
                  <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
                    <h3 className="text-white font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active Co-hosts ({remoteCoHosts.length + (localIsCoHost ? 1 : 0)})
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 max-h-[200px] lg:max-h-[400px] overflow-y-auto pr-1">
                      {/* Local student stream if co-hosting */}
                      {role !== 'host' && localIsCoHost && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border-2 border-emerald-500 shadow-md">
                          {camOn && localVideoTrackRef.current ? (
                            <AgoraVideoPlayer videoTrack={localVideoTrackRef.current} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-[10px]">
                              <VideoOff size={18} />
                              <span>Camera Off</span>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 bg-emerald-600/90 px-2 py-0.5 rounded text-[9px] text-white font-bold">
                            You (Co-host)
                          </div>
                        </div>
                      )}

                      {/* Remote co-host streams */}
                      {remoteCoHosts.map((rUser) => {
                        const peerObj = peers.find((p) => Number(p.agoraUid) === rUser.uid);
                        const displayName = peerObj ? peerObj.name : `Student (${rUser.uid})`;

                        return (
                          <div key={rUser.uid} className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md">
                            {rUser.hasVideo && rUser.videoTrack ? (
                              <AgoraVideoPlayer videoTrack={rUser.videoTrack} className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-[10px]">
                                <VideoOff size={18} />
                                <span>Camera Off</span>
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white font-bold">
                              {displayName}
                            </div>
                            {role === 'host' && (
                              <button
                                onClick={() => removeCoHost(peerObj?.peerId)}
                                className="absolute top-2 right-2 bg-rose-600/95 hover:bg-rose-700 p-1 px-2 rounded-md text-white text-[9px] font-bold transition"
                                title="Remove Co-host"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
        {/* Raise Hand Requests Panel */}
        {showRaiseRequests && role === 'host' && (
          <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700 text-white text-sm font-bold flex items-center justify-between">
              <span>Hand Raise Requests</span>
              <button onClick={() => setShowRaiseRequests(false)} className="text-slate-400 hover:text-white">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {handRaisers.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">No active requests</div>
              ) : (
                handRaisers.map((hr) => (
                  <div key={hr.peerId} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 flex flex-col gap-2">
                    <div className="text-white text-xs font-bold flex items-center gap-1.5">
                      <span className="text-base">👤</span> {hr.name}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveHandRaise(hr.peerId)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-xs font-semibold transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => declineHandRaise(hr.peerId)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-2 rounded-lg text-xs font-semibold transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Active Co-hosts section in drawer */}
            <div className="p-3 border-t border-slate-700/80 bg-slate-900/20">
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                Active Co-hosts ({activeCoHosts.length})
              </div>
              {activeCoHosts.length === 0 ? (
                <div className="text-slate-500 text-xs py-2 italic text-center">No active co-hosts</div>
              ) : (
                <div className="space-y-2">
                  {activeCoHosts.map((cohostId) => {
                    const peerObj = peers.find((p) => p.peerId === cohostId);
                    const name = peerObj ? peerObj.name : `Student (${cohostId})`;
                    return (
                      <div key={cohostId} className="flex items-center justify-between bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-750">
                        <span className="text-xs text-white truncate max-w-[150px]">{name}</span>
                        <button
                          onClick={() => removeCoHost(cohostId)}
                          className="text-xs text-rose-500 hover:text-rose-400 font-semibold px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 rounded transition"
                        >
                          Revoke
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 flex items-center justify-center gap-2">
        {role === 'host' ? (
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
        ) : (
          <>
            {/* Student controls */}
            {platform === 'agora_interactive' && (
              <>
                {localIsCoHost ? (
                  <>
                    <button onClick={toggleMic} className={`p-3 rounded-full transition ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'}`}>
                      {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <button onClick={toggleCam} className={`p-3 rounded-full transition ${camOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'}`}>
                      {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                    <button
                      onClick={() => socketRef.current?.emit('lower-hand', { peerId: myPeerIdRef.current })}
                      className="px-4 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm flex items-center gap-2"
                    >
                      ✋ Stop Streaming
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (handRaised) {
                        socketRef.current?.emit('lower-hand', { peerId: myPeerIdRef.current });
                        setHandRaised(false);
                      } else {
                        socketRef.current?.emit('raise-hand');
                        setHandRaised(true);
                      }
                    }}
                    className={`px-4 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition ${
                      handRaised ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    ✋ {handRaised ? 'Lower Hand' : 'Raise Hand'}
                  </button>
                )}
              </>
            )}

            {platform === 'agora_call' && (
              <>
                <button onClick={toggleMic} className={`p-3 rounded-full transition ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'}`}>
                  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button onClick={toggleCam} className={`p-3 rounded-full transition ${camOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'}`}>
                  {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </>
            )}

            <button onClick={leave} className="px-4 py-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 font-semibold text-sm flex items-center gap-2">
              <PhoneOff size={16} /> Leave Room
            </button>
          </>
        )}
      </div>
    </div>
  );
}
