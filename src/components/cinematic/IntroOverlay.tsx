"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, SkipForward } from "lucide-react";
import Image from "next/image";

interface IntroOverlayProps {
  onComplete: () => void;
}

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 1. Check if the user has already seen the intro in this browser
    const seen = localStorage.getItem("muviont_intro_seen");
    if (seen === "true") {
      setVisible(false);
      onComplete();
      return;
    }

    // 2. Enable Skip button after 2 seconds
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    // Save state to local storage and trigger fade-out transition
    localStorage.setItem("muviont_intro_seen", "true");
    setVisible(false);
    // Let the fade animation run, then call complete
    setTimeout(onComplete, 800);
  };

  const handleVideoEnded = () => {
    handleSkip();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setMuted(nextMuted);
    }
  };

  const handleVideoError = () => {
    console.warn("Cinematic video failed to play, switching to fallback logo animation.");
    setVideoError(true);
    // Switch to fallback and auto-finish after 4 seconds
    setTimeout(handleSkip, 4000);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none overflow-hidden"
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-radial-at-c from-zinc-950 via-black to-black opacity-90 z-0" />

        {!videoError ? (
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            muted={muted}
            playsInline
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className="w-full h-full object-cover z-10 opacity-90 scale-100 will-change-transform"
            style={{ filter: "contrast(1.1) brightness(0.95)" }}
          />
        ) : (
          /* High-End SVG/CSS Fallback Logo Animation */
          <div className="z-10 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 1], 
                opacity: [0, 1, 1],
                filter: ["drop-shadow(0 0 0px #FF0000)", "drop-shadow(0 0 30px #FF0000)", "drop-shadow(0 0 15px #FF0000)"]
              }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="relative w-64 h-24 flex items-center justify-center"
            >
              <Image
                src="/logo.png"
                alt="MUVIONT Logo"
                fill
                priority
                className="object-contain"
              />
            </motion.div>
            
            {/* Elegant luxury loading line */}
            <div className="w-48 h-[2px] bg-neutral-900 mt-8 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute w-24 h-full bg-gradient-to-r from-transparent via-red-600 to-transparent"
              />
            </div>
          </div>
        )}

        {/* Video Audio Overlay Control */}
        {!videoError && (
          <button
            onClick={toggleMute}
            className="absolute bottom-8 left-8 z-20 p-4 rounded-full bg-neutral-950/80 border border-neutral-800 text-white/90 backdrop-blur-md hover:bg-neutral-900 transition-all duration-300 active:scale-95"
            aria-label="Toggle Volume"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-red-500 animate-pulse" />}
          </button>
        )}

        {/* Skip button appearing after 2 seconds */}
        {showSkip && (
          <button
            onClick={handleSkip}
            className="absolute bottom-8 right-8 z-20 flex items-center gap-2 px-6 py-3 rounded-full bg-red-600/90 text-white font-medium backdrop-blur-md border border-red-500/50 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,0,0,0.3)]"
          >
            Skip Intro
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
