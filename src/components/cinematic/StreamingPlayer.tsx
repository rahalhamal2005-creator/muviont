"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, RefreshCw, ExternalLink, AlertCircle, Server, Zap,
  Check, Sparkles, MonitorPlay, Radio, ChevronDown, ChevronUp
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
  embedUrl,
  title,
  backdropUrl,
  sourceIndex = 0,
  onSourceChange,
  className = "",
}: StreamingPlayerProps) {
  const [activeSource, setActiveSource] = useState(sourceIndex);
  const [showSources, setShowSources] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(embedUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [healthMap, setHealthMap] = useState<Record<string, "ONLINE" | "OFFLINE">>({});
  const [directStreamUrl, setDirectStreamUrl] = useState<string | null>(null);
  const [directStreamSubtitles, setDirectStreamSubtitles] = useState<any[]>([]);
  const [directStreamError, setDirectStreamError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeSourceKey = STREAMING_SOURCES[activeSource]?.key || "";
  const activeSourceName = STREAMING_SOURCES[activeSource]?.name || `Server ${activeSource + 1}`;

  const switchSource = useCallback((idx: number) => {
    setActiveSource(idx);
    setLoading(true);
    setError(false);
    setCountdown(null);
    onSourceChange?.(idx);
  }, [onSourceChange]);

  // Fetch provider health and auto-switch if active is offline
  useEffect(() => {
    fetch("/api/provider-health")
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        setHealthMap(data as Record<string, "ONLINE" | "OFFLINE">);

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
    setCountdown(null);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [embedUrl]);

  // Show sources automatically if there is an error
  useEffect(() => {
    if (directStreamError || error) {
      setShowSources(true);
    }
  }, [directStreamError, error]);

  // Load unlock state from localStorage or super_admin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isUnlocked = localStorage.getItem(`muviont_unlocked_${embedUrl}`);
      if (isUnlocked === "true") {
        setUnlocked(true);
      } else {
        fetch("/api/auth/session")
          .then(res => (res.ok ? res.json() : {}))
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
      .then(async res => {
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

    const currentKey = STREAMING_SOURCES[activeSource]?.key;
    const currentName = STREAMING_SOURCES[activeSource]?.name;
    if (currentKey) {
      setHealthMap(prev => ({ ...prev, [currentKey]: "OFFLINE" }));

      fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "stream_failure",
          provider: currentName || currentKey,
          endpoint: currentUrl,
          errorMsg: `Stream load failed for ${title}`,
        }),
      }).catch(() => {});
    }

    const nextOnlineIndex = STREAMING_SOURCES.findIndex(
      (s, idx) => idx !== activeSource && (healthMap[s.key] === "ONLINE" || !healthMap[s.key])
    );

    if (nextOnlineIndex !== -1) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            switchSource(nextOnlineIndex);
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
  };

  const reloadPlayer = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className={`flex flex-col gap-3 relative ${className}`}>
      {/* Ambient Lighting Bloom Effect */}
      {backdropUrl && unlocked && (
        <div
          className="absolute -inset-8 z-0 opacity-25 blur-3xl pointer-events-none transition-all duration-1000 hidden md:block"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Top Stream Control Bar (when unlocked) */}
      {unlocked && (
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
          {/* Left: Stream Metadata Pill */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--red)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--red)]"></span>
            </span>
            <span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[200px] sm:max-w-[320px]">
              {title}
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-[var(--red-dim)] border border-[var(--red)]/25 text-[9px] font-black uppercase text-[var(--red)] tracking-wider">
              1080P HD
            </span>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={reloadPlayer}
              title="Reload Stream Player"
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Reload</span>
            </button>

            <button
              onClick={() => setShowSources(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 border ${
                showSources
                  ? "bg-[var(--red)] text-white border-[var(--red)] shadow-[0_0_12px_rgba(229,56,59,0.35)]"
                  : "bg-white/[0.05] hover:bg-white/[0.1] text-white border-white/[0.08]"
              }`}
            >
              <Server className="w-3.5 h-3.5 text-[var(--red)]" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {activeSourceName.split("(")[0].trim()}
              </span>
              {showSources ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Player Screen Frame */}
      <div
        className={`player-container rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.9)] transition-all duration-500 group relative z-10 bg-black ${
          !unlocked ? "min-h-[460px]" : ""
        }`}
        style={{ position: "relative" }}
      >
        {/* Sleek Minimal Cinematic Loading Indicator - Only when unlocked */}
        {unlocked && loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-300 pointer-events-none">
            {backdropUrl && (
              <div className="absolute inset-0 pointer-events-none select-none opacity-20">
                <img
                  src={backdropUrl}
                  alt=""
                  className="w-full h-full object-cover filter blur-2xl"
                />
                <div className="absolute inset-0 bg-black/80" />
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--red)] animate-spin" />
              </div>
              <div className="text-center">
                <span className="text-[11px] font-medium text-neutral-300 tracking-wider uppercase">
                  Buffering Stream…
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State with Smart Countdown Recovery */}
        {error && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl gap-5 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-[var(--red)]" />
            </div>
            <div className="max-w-md space-y-1.5">
              <p className="text-white font-black text-base uppercase tracking-wider">
                Stream Server Connection Failed
              </p>
              {countdown !== null ? (
                <p className="text-xs text-[var(--red)] font-extrabold uppercase tracking-widest animate-pulse">
                  Auto-switching to next working server in {countdown}s…
                </p>
              ) : (
                <p className="text-xs text-neutral-400 font-medium">
                  This server might be temporarily busy. Please switch to another server below.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={reloadPlayer}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Current
              </button>
              <button
                onClick={() => {
                  const nextIdx = (activeSource + 1) % STREAMING_SOURCES.length;
                  switchSource(nextIdx);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--red)] hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(229,56,59,0.4)]"
              >
                <Zap className="w-3.5 h-3.5" />
                Next Server
              </button>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open External
              </a>
            </div>
          </div>
        )}

        {/* Player Core View: Content Locker, Native HLS, or Clean Iframe */}
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
            <div
              className="w-full bg-[#08080a]/95 border border-white/[0.04] backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-8 text-center"
              style={{ aspectRatio: "16/9" }}
            >
              <div className="max-w-md space-y-4">
                <AlertCircle className="w-12 h-12 text-[var(--red)] mx-auto opacity-80" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Direct Stream Configuration
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                  This direct streaming node requires CINEPRO API configuration. Please switch to
                  Server 2 for instant playback.
                </p>
                <button
                  onClick={() => switchSource(1)}
                  className="px-5 py-2.5 bg-[var(--red)] hover:bg-red-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all text-white shadow-lg"
                >
                  Switch to Server 2
                </button>
              </div>
            </div>
          ) : (
            <div
              className="relative w-full bg-neutral-950 flex items-center justify-center overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              <div className="relative z-10 flex flex-col items-center gap-3 bg-black/75 border border-white/15 p-6 rounded-2xl backdrop-blur-xl shadow-2xl max-w-xs text-center">
                <div className="relative flex items-center justify-center w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--red)] border-t-transparent animate-spin" />
                  <Play className="w-4 h-4 text-[var(--red)] fill-current" />
                </div>
                <p className="text-[11px] text-white font-bold uppercase tracking-wider">
                  Resolving Direct HLS Stream…
                </p>
              </div>
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
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>

      {/* Redesigned Server Switcher Panel */}
      {showSources && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0c16]/95 border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--red)]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Select Stream Server
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">
                ({STREAMING_SOURCES.length} High-Speed Mirrors)
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-semibold hidden sm:inline">
              Switch server if video buffers or fails
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {STREAMING_SOURCES.map((source, i) => {
              const status = healthMap[source.key] || "ONLINE";
              const isSelected = activeSource === i;
              return (
                <button
                  key={source.key}
                  onClick={() => switchSource(i)}
                  disabled={status === "OFFLINE" && !isSelected}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col gap-1.5 relative group ${
                    isSelected
                      ? "bg-[var(--red)]/15 border-[var(--red)] shadow-[0_0_15px_rgba(229,56,59,0.25)] ring-1 ring-[var(--red)]"
                      : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/15"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black truncate ${
                        isSelected ? "text-white" : "text-neutral-200 group-hover:text-white"
                      }`}
                    >
                      {source.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--red)] shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] pt-0.5">
                    <span className="flex items-center gap-1 font-bold text-neutral-400">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          status === "ONLINE"
                            ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                            : "bg-red-500 shadow-[0_0_6px_#ef4444]"
                        }`}
                      />
                      {status}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-[8px] font-black uppercase text-neutral-400">
                      {i === 0 ? "⚡ 1080p Fast" : i === 1 ? "🛡️ Auto HD" : "4K Ready"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Helpful Player Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-neutral-400 font-medium">
        <p className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
          Streamed in full 1080p HD. Use an ad blocker (uBlock Origin / Brave) for ad-free experience.
        </p>
        {!showSources && (
          <button
            onClick={() => setShowSources(true)}
            className="text-[10px] text-[var(--red)] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
          >
            Problems loading? Change server →
          </button>
        )}
      </div>
    </div>
  );
}
