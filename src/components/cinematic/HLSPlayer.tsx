"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Settings, Captions, Maximize, Minimize,
  ArrowLeft, Loader2, RotateCcw, RotateCw, Check
} from "lucide-react";

declare global {
  interface Window {
    Hls: any;
  }
}

interface HLSPlayerProps {
  src: string; // .m3u8 or .mp4 URL
  title: string;
  subtitles?: Array<{ url: string; label: string; language: string }>;
  onProgress?: (progress: number) => void;
  className?: string;
}

export default function HLSPlayer({
  src, title, subtitles = [], onProgress, className = ""
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);

  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [qualities, setQualities] = useState<string[]>(["Auto"]);
  const [activeQuality, setActiveQuality] = useState("Auto");
  const [activeSubtitle, setActiveSubtitle] = useState("Off");
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [hudAction, setHudAction] = useState<{ type: string; key: number } | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic script loading for HLS.js
  useEffect(() => {
    if (window.Hls) {
      setScriptsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "hls-cdn-js";
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js";
    script.onload = () => setScriptsLoaded(true);
    script.onerror = () => setError("Failed to load streaming dependencies.");
    document.body.appendChild(script);

    return () => {
      // Keep script in body to avoid multiple injections
    };
  }, []);

  // Controls Visibility Timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false);
        setShowSubtitlesMenu(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
      setShowSettings(false);
      setShowSubtitlesMenu(false);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimeout]);

  // Sync state on source or dependencies load
  useEffect(() => {
    if (!scriptsLoaded || !videoRef.current || !window.Hls) return;

    const video = videoRef.current;
    const Hls = window.Hls;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);

    if (src.includes(".m3u8") || src.includes("application/x-mpegURL")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxMaxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels || [];
          setQualities(["Auto", ...levels.map((l: any) => `${l.height}p`)]);
        });

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError("Playback network error. Please refresh.");
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        setError("Your browser does not support HLS streaming.");
      }
    } else {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, scriptsLoaded]);

  // HUD Action bubble trigger
  const triggerHud = (type: string) => {
    setHudAction({ type, key: Date.now() });
  };

  // Player functionality
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      triggerHud("play");
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerHud("pause");
    }
    resetControlsTimeout();
  };

  const handleRewind = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    setCurrentTime(videoRef.current.currentTime);
    triggerHud("rewind");
    resetControlsTimeout();
  };

  const handleForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
    setCurrentTime(videoRef.current.currentTime);
    triggerHud("forward");
    resetControlsTimeout();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const muted = !isMuted;
    videoRef.current.muted = muted;
    setIsMuted(muted);
    triggerHud(muted ? "mute" : "unmute");
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
    resetControlsTimeout();
  };

  const adjustVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVol = Math.min(1, Math.max(0, volume + delta));
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
    triggerHud(delta > 0 ? "volume-up" : "volume-down");
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = Math.min(videoRef.current.duration || 0, Math.max(0, pos * (videoRef.current.duration || 0)));
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleQualityChange = (q: string) => {
    setActiveQuality(q);
    if (!hlsRef.current) return;
    if (q === "Auto") {
      hlsRef.current.currentLevel = -1;
    } else {
      const height = parseInt(q);
      const idx = hlsRef.current.levels.findIndex((l: any) => l.height === height);
      if (idx !== -1) {
        hlsRef.current.currentLevel = idx;
      }
    }
    setShowSettings(false);
  };

  const handleSubtitleChange = (langCode: string) => {
    setActiveSubtitle(langCode);
    if (!videoRef.current) return;
    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      if (langCode === "Off") {
        tracks[i].mode = "disabled";
      } else if (tracks[i].language === langCode) {
        tracks[i].mode = "showing";
      } else {
        tracks[i].mode = "disabled";
      }
    }
    setShowSubtitlesMenu(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onProgress) {
        onProgress(Math.floor(videoRef.current.currentTime));
      }
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleRewind();
          break;
        case 'arrowright':
          e.preventDefault();
          handleForward();
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.05);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, isFullscreen]);

  // Set default subtitles active
  useEffect(() => {
    if (subtitles.length > 0) {
      handleSubtitleChange(subtitles[0].language);
    }
  }, [subtitles]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    
    const mm = m < 10 ? `0${m}` : m;
    const ss = s < 10 ? `0${s}` : s;
    
    if (h > 0) {
      return `${h}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <div
      ref={containerRef}
      className={`w-full aspect-video bg-black relative rounded-xl overflow-hidden group select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Custom styles for Range Slider and HUD animation */}
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          background: #e5383b;
          border: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        input[type="range"]::-moz-range-thumb {
          background: #e5383b;
          border: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        @keyframes pingOnce {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-ping-once {
          animation: pingOnce 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        crossOrigin="anonymous"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
      >
        {subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="captions"
            label={sub.label}
            src={sub.url}
            srcLang={sub.language}
          />
        ))}
      </video>

      {/* Cinematic Vignette Shadows */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 pointer-events-none transition-opacity duration-500 z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 z-20">
          <Loader2 className="w-12 h-12 text-[var(--red)] animate-spin" />
        </div>
      )}

      {/* Middle HUD Action Indicator */}
      {hudAction && (
        <div
          key={hudAction.key}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-25"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-black/60 rounded-full animate-ping-once text-white border border-white/5">
            {hudAction.type === 'play' && <Play className="w-6 h-6 fill-current text-[var(--red)]" />}
            {hudAction.type === 'pause' && <Pause className="w-6 h-6 fill-current text-[var(--red)]" />}
            {hudAction.type === 'forward' && <RotateCw className="w-6 h-6 text-[var(--red)]" />}
            {hudAction.type === 'rewind' && <RotateCcw className="w-6 h-6 text-[var(--red)]" />}
            {hudAction.type === 'mute' && <VolumeX className="w-6 h-6 text-[var(--red)]" />}
            {hudAction.type === 'unmute' && <Volume2 className="w-6 h-6 text-[var(--red)]" />}
            {hudAction.type.includes('volume-') && <Volume2 className="w-6 h-6 text-[var(--red)]" />}
          </div>
        </div>
      )}

      {/* Top Title Bar */}
      <div className={`absolute top-0 inset-x-0 p-6 z-20 flex items-center justify-between transition-all duration-300 transform ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group/back"
        >
          <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-0.5 transition-transform" />
          <span className="font-extrabold text-sm uppercase tracking-wider drop-shadow-md">{title}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[var(--red-dim)] border border-[var(--red)]/20 text-[var(--red)] text-[9px] font-black tracking-widest uppercase">
            Ultra HD
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider">
            Dolby Vision
          </span>
        </div>
      </div>

      {/* Large Center Controls */}
      <div className={`absolute inset-0 flex items-center justify-center gap-10 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={handleRewind} className="p-3.5 rounded-full bg-black/55 hover:bg-black/80 border border-white/10 text-white transition-all hover:scale-105 active:scale-95 shadow-lg">
          <RotateCcw className="w-6 h-6" />
        </button>
        <button onClick={togglePlay} className="p-5.5 rounded-full bg-[var(--red)] hover:bg-red-600 text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_35px_var(--red-glow)]">
          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-0.5" />}
        </button>
        <button onClick={handleForward} className="p-3.5 rounded-full bg-black/55 hover:bg-black/80 border border-white/10 text-white transition-all hover:scale-105 active:scale-95 shadow-lg">
          <RotateCw className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 inset-x-0 p-6 z-20 flex flex-col gap-4 transition-all duration-300 transform ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Progress Seeker */}
        <div className="flex items-center gap-3 group/progress">
          <span className="text-[10px] font-extrabold text-neutral-300 tracking-wider tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="flex-grow h-1 bg-white/20 rounded-full relative cursor-pointer transition-all duration-150 overflow-visible"
          >
            <div
              className="absolute inset-y-0 left-0 bg-[var(--red)] rounded-full transition-all duration-75 relative"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            >
              {/* Seeker Handle (glow) */}
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[var(--red)] border border-white rounded-full shadow-[0_0_10px_var(--red-glow)] cursor-pointer" />
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-neutral-300 tracking-wider tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Action icons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={togglePlay} className="text-white hover:text-[var(--red)] transition-colors">
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button onClick={handleRewind} className="text-white hover:text-[var(--red)] transition-colors" title="Rewind 10s">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={handleForward} className="text-white hover:text-[var(--red)] transition-colors" title="Forward 10s">
              <RotateCw className="w-5 h-5" />
            </button>
            
            {/* Volume section */}
            <div className="flex items-center gap-2 group/volume relative">
              <button onClick={toggleMute} className="text-white hover:text-[var(--red)] transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 transition-all duration-300 origin-left scale-x-0 group-hover/volume:scale-x-100 h-1 rounded-full bg-white/20 accent-[var(--red)] appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 relative">
            {/* Quality Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowSettings(!showSettings); setShowSubtitlesMenu(false); }}
                className="text-white hover:text-[var(--red)] transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
              >
                <Settings className="w-5 h-5 text-white/80 hover:text-white" />
                <span className="hidden sm:inline">{activeQuality}</span>
              </button>
              {showSettings && (
                <div className="absolute bottom-10 right-0 bg-neutral-950/95 border border-white/10 rounded-xl p-2 min-w-[120px] backdrop-blur-md shadow-2xl z-30">
                  <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-2.5 py-1.5 border-b border-white/5">
                    Quality
                  </div>
                  <div className="max-h-48 overflow-y-auto mt-1 space-y-0.5">
                    {qualities.map(q => (
                      <button
                        key={q}
                        onClick={() => handleQualityChange(q)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${activeQuality === q ? 'text-[var(--red)] bg-[var(--red-dim)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'}`}
                      >
                        <span>{q}</span>
                        {activeQuality === q && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtitles Selector */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSettings(false); }}
                  className="text-white hover:text-[var(--red)] transition-colors flex items-center gap-1 text-xs font-bold"
                >
                  <Captions className="w-5 h-5 text-white/80 hover:text-white" />
                </button>
                {showSubtitlesMenu && (
                  <div className="absolute bottom-10 right-0 bg-neutral-950/95 border border-white/10 rounded-xl p-2 min-w-[140px] backdrop-blur-md shadow-2xl z-30">
                    <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest px-2.5 py-1.5 border-b border-white/5">
                      Subtitles
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <button
                        onClick={() => handleSubtitleChange("Off")}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${activeSubtitle === "Off" ? 'text-[var(--red)] bg-[var(--red-dim)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'}`}
                      >
                        <span>Off</span>
                        {activeSubtitle === "Off" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      {subtitles.map(sub => (
                        <button
                          key={sub.language}
                          onClick={() => handleSubtitleChange(sub.language)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${activeSubtitle === sub.language ? 'text-[var(--red)] bg-[var(--red-dim)]' : 'text-neutral-300 hover:text-white hover:bg-white/5'}`}
                        >
                          <span>{sub.label}</span>
                          {activeSubtitle === sub.language && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} className="text-white hover:text-[var(--red)] transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
