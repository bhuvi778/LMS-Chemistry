import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react';

export default function SecureYTPlayer({ url, title }) {
  const containerRef = useRef(null);
  const playerIdRef = useRef(`yt-player-${Math.random().toString(36).slice(2, 11)}`);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract YouTube ID
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/
  );
  const videoId = ytMatch ? ytMatch[1] : null;

  useEffect(() => {
    if (!videoId) return;

    // Load YouTube Iframe API if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    let ytPlayer = null;
    let checkInterval = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return false;

      ytPlayer = new window.YT.Player(playerIdRef.current, {
        videoId: videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          showinfo: 0,
          autoplay: 0,
        },
        events: {
          onReady: (event) => {
            const p = event.target;
            setPlayer(p);
            setDuration(p.getDuration() || 0);
            setIsMuted(p.isMuted());
            setIsLoading(false);
          },
          onStateChange: (event) => {
            // YT.PlayerState: PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            const state = event.data;
            if (state === 1) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          },
        },
      });
      return true;
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if (initPlayer()) {
          clearInterval(checkInterval);
        }
      }, 100);
    }

    // Monitor fullscreen change events
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        try {
          ytPlayer.destroy();
        } catch (e) {
          console.error('Error destroying YT player:', e);
        }
      }
    };
  }, [videoId]);

  // Sync current time while playing
  useEffect(() => {
    let timer;
    if (isPlaying && player) {
      timer = setInterval(() => {
        if (typeof player.getCurrentTime === 'function') {
          setCurrentTime(player.getCurrentTime());
          // Periodically sync duration in case it wasn't ready at load
          if (duration === 0 && typeof player.getDuration === 'function') {
            setDuration(player.getDuration());
          }
        }
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isPlaying, player, duration]);

  if (!videoId) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400">
        Invalid YouTube URL
      </div>
    );
  }

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSeek = (e) => {
    if (!player) return;
    const time = parseFloat(e.target.value);
    player.seekTo(time, true);
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === undefined) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none group/player overflow-hidden flex items-center justify-center"
    >
      {/* Video Iframe Container */}
      <div className="w-full h-full pointer-events-none scale-[1.01]">
        <div id={playerIdRef.current} className="w-full h-full" />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-30">
          <Loader2 size={36} className="animate-spin text-brand-500" />
          <span className="text-sm font-semibold text-slate-300">Loading Secure Player...</span>
        </div>
      )}

      {/* Click and double-click interceptor overlay */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-black/0 active:bg-black/10 transition-colors"
      >
        {!isPlaying && !isLoading && (
          <div className="w-16 h-16 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <Play size={28} fill="currentColor" className="ml-1" />
          </div>
        )}
      </div>

      {/* Custom Premium Player Header */}
      <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center px-4 justify-between pointer-events-none opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <img src="/logo-light.png" alt="" className="h-5 w-auto object-contain" />
          <span className="text-white text-xs font-bold truncate max-w-[250px] sm:max-w-md">{title}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-brand-500 text-[9px] text-white font-extrabold tracking-widest uppercase">AcePlayer</span>
      </div>

      {/* Custom Premium Controls Overlay */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/90 to-transparent z-20 flex flex-col justify-end px-4 pb-3 pointer-events-auto opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
        {/* Progress Slider */}
        <div className="w-full flex items-center mb-2.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:h-1.5 transition-all outline-none"
          />
        </div>

        {/* Bottom Control Actions */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="hover:text-brand-400 transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              onClick={toggleMute}
              className="hover:text-brand-400 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <span className="text-xs text-slate-300 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-white/10 border border-white/5 rounded text-[9px] text-slate-300 font-bold tracking-wider flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Secure
            </div>
            <button
              onClick={toggleFullscreen}
              className="hover:text-brand-400 transition"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
