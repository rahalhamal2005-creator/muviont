"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, RefreshCw, ExternalLink, Maximize2, AlertCircle, Moon, Sun
} from "lucide-react";
import { STREAMING_SOURCES } from "@/lib/streaming";
import HLSPlayer from "./HLSPlayer";
import ContentLocker from "./ContentLocker";

interface StreamingPlayerProps {
  embedUrl: string;
  title: string;
  backdropUrl?: string;
  sourceIndex?: number;
  onSourceChange?: (index: number) => void;
  className?: string;
}

export default function StreamingPlayer({
  embedUrl, title, backdropUrl, sourceIndex = 0, onSourceChange, className = "",
}: StreamingPlayerProps) {
  const [activeSource, setActiveSource]   = useState(sourceIndex);
  const [showSources, setShowSources]     = useState(false);
  const [currentUrl, setCurrentUrl]       = useState(embedUrl);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [unlocked, setUnlocked]           = useState(false);
  const [healthMap, setHealthMap]         = useState<Record<string, "ONLINE" | "OFFLINE">>({});
  const [directStreamUrl, setDirectStreamUrl] = useState<string | null>(null);
  const [directStreamSubtitles, setDirectStreamSubtitles] = useState<any[]>([]);
  const [directStreamError, setDirectStreamError] = useState<string | null>(null);
  const [theaterMode, setTheaterMode] = useState(false);
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeSourceKey = STREAMING_SOURCES[activeSource]?.key || "";

  const switchSource = useCallback((idx: number) => {
    setActiveSource(idx);
    setLoading(true);
    setError(false);
    onSourceChange?.(idx);
  }, [onSourceChange]);

  // Fetch provider health and auto-switch if active is offline
  useEffect(() => {
    fetch("/api/provider-health")
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => {
        setHealthMap(data as Record<string, "ONLINE" | "OFFLINE">);
        
        // Auto-switch logic: if current active source is offline, find first online one
        const currentSourceKey = STREAMING_SOURCES[activeSource]?.key;
        if (data[currentSourceKey] === "OFFLINE") {
          const firstOnlineIndex = STREAMING_SOURCES.findIndex(s => data[s.key] === "ONLINE");
          if (firstOnlineIndex !== -1 && firstOnlineIndex !== activeSource) {
            switchSource(firstOnlineIndex);
          }
        }
      })
      .catch(() => {});
  }, [activeSource, switchSource]);

  useEffect(() => {
    setCurrentUrl(embedUrl);
    setLoading(true);
    setError(false);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, [embedUrl]);

  // Show sources automatically if there is an error on the default player
  useEffect(() => {
    if (directStreamError || error) {
      setShowSources(true);
    }
  }, [directStreamError, error]);

  // Load and check unlock state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isUnlocked = localStorage.getItem(`muviont_unlocked_${embedUrl}`);
      if (isUnlocked === "true") {
        setUnlocked(true);
      } else {
        // Fetch session to check if user is SUPER_ADMIN
        fetch("/api/auth/session")
          .then((res) => (res.ok ? res.json() : {}))
          .then((data: any) => {
            if (data.user && data.user.role === "SUPER_ADMIN") {
              setUnlocked(true);
            } else {
              setUnlocked(false);
            }
          })
          .catch(() => {
            setUnlocked(false);
          });
      }
    }
  }, [embedUrl]);

  const handleUnlock = useCallback(() => {
    setUnlocked(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`muviont_unlocked_${embedUrl}`, "true");
    }
  }, [embedUrl]);

  // Load stream URL if direct-stream is active
  useEffect(() => {
    if (activeSourceKey !== "direct-stream") {
      setDirectStreamUrl(null);
      setDirectStreamSubtitles([]);
      setDirectStreamError(null);
      return;
    }

    setLoading(true);
    setDirectStreamError(null);
    setDirectStreamUrl(null);
    setDirectStreamSubtitles([]);

    fetch(embedUrl)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.url) {
          setDirectStreamUrl(data.url);
          setDirectStreamSubtitles(data.subtitles || []);
          setLoading(false);
        } else {
          setDirectStreamError(data.message || "Failed to load stream link.");
          setLoading(false);
        }
      })
      .catch(() => {
        setDirectStreamError("Failed to fetch stream details from server.");
        setLoading(false);
      });
  }, [activeSourceKey, embedUrl]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    
    // Mark current source as offline dynamically
    const currentKey = STREAMING_SOURCES[activeSource]?.key;
    const currentName = STREAMING_SOURCES[activeSource]?.name;
    if (currentKey) {
      setHealthMap(prev => ({ ...prev, [currentKey]: "OFFLINE" }));
      
      // Report stream failure
      fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "stream_failure",
          provider: currentName || currentKey,
          endpoint: currentUrl,
          errorMsg: `Stream load failed for ${title}`
        })
      }).catch(() => {});
    }

    // Attempt auto-switch to next working source
    const nextOnlineIndex = STREAMING_SOURCES.findIndex((s, idx) => 
      idx !== activeSource && (healthMap[s.key] === "ONLINE" || !healthMap[s.key])
    );
    if (nextOnlineIndex !== -1) {
      setTimeout(() => {
        switchSource(nextOnlineIndex);
      }, 3000); // 3s delay to let user see status change
    }
  };

  const reloadPlayer = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const isVidSrc = activeSourceKey.includes("vidsrc");
  const sandboxValue = isVidSrc 
    ? undefined 
    : "allow-scripts allow-same-origin allow-forms allow-presentation";

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Theater Mode Overlay */}
      {theaterMode && (
        <div
          className="fixed inset-0 bg-black/95 z-30 transition-opacity duration-500 cursor-pointer pointer-events-auto"
          onClick={() => setTheaterMode(false)}
        />
      )}

      {/* Ambient Glow Backdrop Effect */}
      {backdropUrl && unlocked && !theaterMode && (
        <div
          className="absolute -inset-12 z-0 opacity-30 blur-3xl pointer-events-none transition-all duration-1000 hidden md:block"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Player Container */}
      <div
        ref={wrapperRef}
        className={`player-container rounded-xl overflow-hidden border shadow-[0_12px_50px_rgba(0,0,0,0.8)] transition-all duration-500 group ${
          theaterMode 
            ? "relative z-35 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)]" 
            : "relative z-10 border-[var(--border)]"
        } ${
          !unlocked ? "min-h-[460px]" : ""
        }`}
        style={{ position: "relative" }}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg2)] gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--red)] border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">Loading stream...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg2)] gap-4 p-6">
            <AlertCircle className="w-12 h-12 text-[var(--red)]/60" />
            <div className="text-center">
              <p className="text-white font-bold mb-1">Stream failed to load</p>
              <p className="text-xs text-[var(--red)] font-semibold uppercase tracking-wider animate-pulse mb-1">
                Auto-switching to next working source...
              </p>
              <p className="text-sm text-[var(--text-muted)]">Try switching to a different source below manually if it persists</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reloadPlayer}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg3)] hover:bg-[var(--card-hover)] border border-[var(--border2)] text-sm font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--red)]/15 hover:bg-[var(--red)]/25 border border-[var(--red)]/30 text-[var(--red)] text-sm font-semibold rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Externally
              </a>
            </div>
          </div>
        )}

        {/* Iframe, Native HLS Player, or Content Locker */}
        {!unlocked ? (
          <ContentLocker onUnlock={handleUnlock} title={title} backdropUrl={backdropUrl} />
        ) : activeSourceKey === "direct-stream" ? (
          directStreamUrl ? (
            <HLSPlayer
              src={directStreamUrl}
              title={title}
              subtitles={directStreamSubtitles}
            />
          ) : directStreamError ? (
            <div className="w-full bg-[#08080a]/95 border border-white/[0.04] backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-8 text-center" style={{ aspectRatio: "16/9" }}>
              <div className="max-w-md space-y-4">
                <AlertCircle className="w-12 h-12 text-[var(--red)] mx-auto opacity-80" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">CinePro Setup Required</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                  Had l-option dial <strong>Direct Stream</strong> khassha configuration dial <code>CINEPRO_API_URL</code> f Vercel environment variables.
                </p>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Ila bghiti t-tferrj bla isharat db, khdem b source <strong>VidLink</strong> (li darna fiha block popups 9wi f sandbox).
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <a
                    href="https://github.com/cinepro-org/core"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-colors"
                  >
                    CinePro GitHub
                  </a>
                  <button
                    onClick={() => switchSource(1)}
                    className="px-4 py-2 bg-[var(--red)] hover:bg-red-750 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-colors text-white font-black"
                  >
                    Switch to VidLink
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-neutral-950 flex flex-col items-center justify-center gap-3" style={{ aspectRatio: "16/9" }}>
              <div className="w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Resolving Direct HLS Stream...</p>
            </div>
          )
        ) : (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title={`Watch ${title}`}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            frameBorder="0"
            scrolling="no"
            className="w-full block"
            style={{ aspectRatio: "16/9", display: "block" }}
            sandbox={sandboxValue}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}

        {/* Theater mode and Fullscreen overlay controls */}
        {unlocked && (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className={`p-2 rounded-lg bg-black/60 hover:bg-black/85 border text-white backdrop-blur-md transition-all shadow-md active:scale-95 ${
                theaterMode ? "border-red-500/40 text-red-400" : "border-white/10"
              }`}
              title={theaterMode ? "Turn Lights On" : "Turn Lights Off (Theater Mode)"}
            >
              {theaterMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            {activeSourceKey !== "direct-stream" && (
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-lg bg-black/60 hover:bg-black/85 border border-white/10 text-white backdrop-blur-md transition-all shadow-md active:scale-95"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toggle Server Button */}
      {!showSources && (
        <div className="flex justify-end mt-1">
          <button
            onClick={() => setShowSources(true)}
            className="text-[10px] text-neutral-500 hover:text-white uppercase tracking-wider font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Switch Server / Problems playing?
          </button>
        </div>
      )}

      {/* Source Switcher — CineVault pattern */}
      {showSources && (
        <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
            <Play className="w-3 h-3 text-[var(--red)]" />
            Stream Source
            <span className="text-[var(--text-dim)] normal-case font-normal">— switch if stream doesn&apos;t load</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STREAMING_SOURCES.map((source, i) => {
              const status = healthMap[source.key] || "ONLINE";
              return (
                <button
                  key={source.key}
                  onClick={() => switchSource(i)}
                  disabled={status === "OFFLINE" && activeSource !== i}
                  className={`source-btn flex items-center gap-1.5 ${activeSource === i ? "active" : ""} disabled:opacity-40 disabled:cursor-not-allowed disabled:border-neutral-900`}
                >
                  {source.name}
                  <span className={`w-1.5 h-1.5 rounded-full ${status === "ONLINE" ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-red-500 shadow-[0_0_6px_#ef4444]"}`} />
                  <span className="text-[8px] uppercase tracking-wide opacity-65 font-bold">
                    {status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
        Content is streamed from third-party providers. If one source doesn&apos;t work, try switching. For best results, use an ad blocker (like uBlock Origin).
      </p>
    </div>
  );
}
