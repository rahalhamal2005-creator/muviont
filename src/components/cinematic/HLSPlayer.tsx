"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Hls: any;
    Plyr: any;
  }
}

interface HLSPlayerProps {
  src: string; // .m3u8 or .mp4 URL
  title: string;
  onProgress?: (progress: number) => void;
  className?: string;
}

export default function HLSPlayer({ src, title, onProgress, className = "" }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const hlsRef = useRef<any>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load HLS.js and Plyr.js from CDN dynamically
  useEffect(() => {
    let plyrCss = document.getElementById("plyr-cdn-css");
    if (!plyrCss) {
      plyrCss = document.createElement("link");
      plyrCss.id = "plyr-cdn-css";
      (plyrCss as HTMLLinkElement).rel = "stylesheet";
      (plyrCss as HTMLLinkElement).href = "https://cdn.plyr.io/3.7.8/plyr.css";
      document.head.appendChild(plyrCss);
    }

    const loadScript = (id: string, url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.id = id;
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.body.appendChild(script);
      });
    };

    Promise.all([
      loadScript("hls-cdn-js", "https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js"),
      loadScript("plyr-cdn-js", "https://cdn.plyr.io/3.7.8/plyr.js")
    ])
      .then(() => {
        setScriptsLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load video player dependencies.");
      });
  }, []);

  // Initialize Player
  useEffect(() => {
    if (!scriptsLoaded || !videoRef.current || !window.Hls || !window.Plyr) return;

    const video = videoRef.current;
    const Hls = window.Hls;
    const Plyr = window.Plyr;

    // Destruct previous player & hls instances
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const initPlyr = () => {
      const plyr = new Plyr(video, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "captions",
          "settings",
          "pip",
          "airplay",
          "fullscreen"
        ],
        settings: ["quality", "speed", "loop"],
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        title: title,
      });

      // Track progress
      plyr.on("timeupdate", () => {
        if (onProgress) {
          onProgress(Math.floor(plyr.currentTime));
        }
      });

      playerRef.current = plyr;
    };

    // If source is HLS (.m3u8)
    if (src.includes(".m3u8") || src.includes("application/x-mpegURL")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxMaxBufferLength: 30, // 30s max buffer size
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          initPlyr();
        });

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("HLS Network error, attempting recovery...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("HLS Media error, attempting recovery...");
                hls.recoverMediaError();
                break;
              default:
                setError("Streaming playback encountered a fatal error.");
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = src;
        initPlyr();
      } else {
        setError("HLS Streaming is not supported by your browser.");
      }
    } else {
      // Direct MP4 fallback
      video.src = src;
      initPlyr();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, scriptsLoaded, title, onProgress]);

  return (
    <div className={`w-full aspect-video bg-black relative rounded-xl overflow-hidden border border-white/5 ${className}`}>
      
      {/* Override Plyr Red Brand Styling */}
      <style jsx global>{`
        .plyr {
          --plyr-color-main: #e5383b !important;
          --plyr-video-background: #000000 !important;
          font-family: inherit;
          border-radius: 12px;
        }
        .plyr__control--overlaid {
          background: rgba(229, 56, 59, 0.9) !important;
        }
        .plyr__control--overlaid:hover {
          background: #e5383b !important;
        }
      `}</style>

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-950 text-center gap-3">
          <p className="text-red-500 font-extrabold text-sm uppercase tracking-wider">Playback Error</p>
          <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">{error}</p>
        </div>
      ) : !scriptsLoaded ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 gap-3">
          <div className="w-8 h-8 border-2 border-[#e5383b] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">Initializing Core Player...</p>
        </div>
      ) : null}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        crossOrigin="anonymous"
      />
    </div>
  );
}
