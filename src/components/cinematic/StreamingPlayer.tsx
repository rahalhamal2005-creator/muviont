"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play, RefreshCw, ExternalLink, ChevronDown, Maximize2, AlertCircle,
} from "lucide-react";
import { STREAMING_SOURCES } from "@/lib/streaming";

interface StreamingPlayerProps {
  embedUrl: string;
  title: string;
  sourceIndex?: number;
  onSourceChange?: (index: number) => void;
  className?: string;
}

export default function StreamingPlayer({
  embedUrl, title, sourceIndex = 0, onSourceChange, className = "",
}: StreamingPlayerProps) {
  const [activeSource, setActiveSource]   = useState(sourceIndex);
  const [currentUrl, setCurrentUrl]       = useState(embedUrl);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [fullscreen, setFullscreen]       = useState(false);
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUrl(embedUrl);
    setLoading(true);
    setError(false);
  }, [embedUrl]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const switchSource = (idx: number) => {
    setActiveSource(idx);
    setLoading(true);
    setError(false);
    onSourceChange?.(idx);
  };

  const reloadPlayer = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Player Container */}
      <div
        ref={wrapperRef}
        className="player-container rounded-xl overflow-hidden border border-[var(--border)] shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
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
              <p className="text-sm text-[var(--text-muted)]">Try switching to a different source below</p>
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

        {/* Iframe Player */}
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

        {/* Fullscreen button overlay */}
        <button
          onClick={handleFullscreen}
          className="absolute bottom-3 right-3 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Source Switcher — CineVault pattern */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          <Play className="w-3 h-3 text-[var(--red)]" />
          Stream Source
          <span className="text-[var(--text-dim)] normal-case font-normal">— switch if stream doesn&apos;t load</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STREAMING_SOURCES.map((source, i) => (
            <button
              key={source.key}
              onClick={() => switchSource(i)}
              className={`source-btn ${activeSource === i ? "active" : ""}`}
            >
              {source.name}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
        Content is streamed from third-party providers. If one source doesn&apos;t work, try switching. For best results, disable browser ad blockers.
      </p>
    </div>
  );
}
