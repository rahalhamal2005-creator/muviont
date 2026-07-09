"use client";

import { useEffect } from "react";
import { X, Download, Server, ExternalLink, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaId: string;
  mediaType: "movie" | "series" | "anime";
  season?: number;
  episode?: number;
}

export default function DownloadModal({
  isOpen,
  onClose,
  title,
  mediaId,
  mediaType,
  season = 1,
  episode = 1
}: DownloadModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract raw ID (remove m-, s-, a- prefixes)
  let rawId = mediaId;
  if (mediaId.startsWith("m-") || mediaId.startsWith("s-") || mediaId.startsWith("a-")) {
    rawId = mediaId.substring(2);
  }

  // Construct links
  const directDownloadUrl = mediaType === "movie"
    ? `/api/download?id=${mediaId}&type=movie`
    : mediaType === "series"
      ? `/api/download?id=${mediaId}&type=series&season=${season}&episode=${episode}`
      : `/api/download?id=${mediaId}&type=anime&episode=${episode}`;

  const vidlinkUrl = mediaType === "movie"
    ? `https://vidlink.pro/movie/${rawId}`
    : `https://vidlink.pro/tv/${rawId}/${season}/${episode}`;

  const vidsrcUrl = mediaType === "movie"
    ? `https://vidsrc.to/embed/movie/${rawId}`
    : `https://vidsrc.to/embed/tv/${rawId}/${season}/${episode}`;

  const multiembedUrl = `https://multiembed.mov/?video_id=${rawId}${
    mediaType !== "movie" ? `&s=${season}&e=${episode}` : ""
  }`;

  const servers = [
    {
      name: "Direct Stream Server",
      desc: "Instant download link from direct high-speed CDN",
      url: directDownloadUrl,
      badge: "Fast & Clean",
      isDirect: true
    },
    {
      name: "VidLink Downloader",
      desc: "External video downloader & media player stream portal",
      url: vidlinkUrl,
      badge: "Recommended",
      isDirect: false
    },
    {
      name: "VidSrc Portal",
      desc: "VidSrc.to embed player containing clean download buttons",
      url: vidsrcUrl,
      badge: "High Quality",
      isDirect: false
    },
    {
      name: "MultiEmbed Mirror",
      desc: "MultiEmbed mirror streaming server with file capture",
      url: multiembedUrl,
      badge: "Alternative",
      isDirect: false
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      >
        {/* Backdrop clickable area */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-900 shadow-[0_0_50px_rgba(255,0,0,0.15)] z-10 p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-5 h-5 text-[var(--red)]" />
                Download Options
              </h2>
              <p className="text-xs text-neutral-400 font-medium line-clamp-1">{title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AdBlocker Warning */}
          <div className="flex gap-3 bg-red-950/15 border border-red-500/20 p-3.5 rounded-xl text-neutral-300">
            <ShieldAlert className="w-5 h-5 text-[var(--red)] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-[var(--red)] uppercase tracking-wider text-[10px]">Security Notice</span>
              <p className="font-light leading-relaxed">We recommend using an <strong>AdBlocker</strong> (like uBlock Origin) on external streaming mirrors to bypass third-party advertisements.</p>
            </div>
          </div>

          {/* Servers list */}
          <div className="space-y-3">
            {servers.map((srv, idx) => (
              <a
                key={idx}
                href={srv.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center justify-between p-4 rounded-xl border border-neutral-900 bg-neutral-900/20 hover:bg-neutral-900/60 hover:border-neutral-800 transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/[0.04] text-neutral-400 group-hover:text-[var(--red)] group-hover:border-[var(--red)]/20 transition-colors duration-300">
                    <Server className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-[var(--red)] transition-colors duration-300">
                        {srv.name}
                      </span>
                      {srv.badge && (
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                          srv.isDirect 
                            ? "bg-[var(--red)]/15 border border-[var(--red)]/30 text-[var(--red)]"
                            : "bg-white/[0.03] border border-white/[0.06] text-neutral-450"
                        }`}>
                          {srv.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-450 font-light leading-normal">{srv.desc}</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white transition-colors duration-300" />
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="text-[10px] text-neutral-550 text-center font-light">
            Muviont does not host any media files directly. Content is indexed via third-party providers.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
