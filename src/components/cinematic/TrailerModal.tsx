"use client";

import { useEffect } from "react";
import { X, Film, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrailerModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrailerModal({ videoId, isOpen, onClose }: TrailerModalProps) {
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

  // Clean YouTube video ID extractor
  const getEmbedId = (idOrUrl: string | undefined | null) => {
    if (!idOrUrl) return null;
    if (idOrUrl.includes("youtube.com") || idOrUrl.includes("youtu.be")) {
      const match = idOrUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      return match ? match[1] : null;
    }
    return idOrUrl || null;
  };

  const embedId = getEmbedId(videoId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-10"
      >
        {/* Backdrop clickable area */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-[0_0_50px_rgba(255,0,0,0.2)] z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 border border-neutral-800 text-white hover:bg-red-600 hover:border-red-500 hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Close trailer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* YouTube Video Iframe or Loaders */}
          {videoId === "loading" ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 p-6">
              <RefreshCw className="w-12 h-12 text-red-500 animate-spin mb-4" />
              <p className="text-sm font-bold uppercase tracking-wider text-neutral-300">Searching Official Trailer</p>
              <p className="text-xs text-neutral-500 mt-2 text-center">Invoking YouTube scraper indexes...</p>
            </div>
          ) : !embedId ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 p-6">
              <Film className="w-12 h-12 text-neutral-600 mb-4 animate-pulse" />
              <p className="text-sm font-bold uppercase tracking-wider text-neutral-300">Trailer Not Available</p>
              <p className="text-xs text-neutral-500 mt-2 text-center">We couldn't locate an official cinematic trailer for this title.</p>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=0&rel=0&showinfo=0`}
              title="MUVIONT Cinematic Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
