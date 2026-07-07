"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface IntroOverlayProps {
  onComplete: () => void;
}

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [animationStage, setAnimationStage] = useState(0); // 0: Slash, 1: M Fold & Shockwave, 2: Text Reveal

  useEffect(() => {
    // 1. Check if user already saw the intro on this device
    const seen = localStorage.getItem("muviont_intro_seen");
    if (seen === "true") {
      setVisible(false);
      onComplete();
      return;
    }

    // 2. Play 3-stage cinematic timing sequence:
    // 0ms: Stage 0 (Crimson slash)
    // 800ms: Stage 1 (Logo folds + shockwave)
    // 1600ms: Stage 2 (Text reveal)
    // 2700ms: Fade-out animation starts
    // 3200ms: Completed
    const stage1Timer = setTimeout(() => setAnimationStage(1), 800);
    const stage2Timer = setTimeout(() => setAnimationStage(2), 1650);
    const endTimer = setTimeout(() => {
      localStorage.setItem("muviont_intro_seen", "true");
      setVisible(false);
      setTimeout(onComplete, 500); // Wait for AnimatePresence exit
    }, 2850);

    return () => {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  const handleForceSkip = () => {
    localStorage.setItem("muviont_intro_seen", "true");
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none overflow-hidden"
        style={{ perspective: 1000 }}
      >
        {/* Cinematic Deep Space Glow */}
        <div className="absolute inset-0 bg-radial-at-c from-red-950/20 via-black to-black opacity-90 z-0 pointer-events-none" />

        {/* Skip button for safety */}
        <button
          onClick={handleForceSkip}
          className="absolute top-6 right-6 z-30 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white text-xs font-semibold tracking-wider transition-all duration-300 active:scale-95"
        >
          Skip Intro
        </button>

        {/* Animation Wrapper */}
        <div className="relative flex flex-col items-center justify-center z-10 w-full max-w-lg h-64">
          
          {/* STAGE 0: Volumetric Crimson Light Ray Slash */}
          {animationStage === 0 && (
            <motion.div
              initial={{ x: "-120%", y: "40%", rotate: -15, scaleX: 0.1, opacity: 0 }}
              animate={{
                x: ["-100%", "0%", "120%"],
                y: ["30%", "0%", "-30%"],
                scaleX: [0.1, 1.8, 0.1],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute w-72 h-8 bg-gradient-to-r from-transparent via-red-500 to-transparent blur-[6px] shadow-[0_0_40px_#ff0011]"
              style={{ transformOrigin: "center" }}
            />
          )}

          {/* STAGE 1 & 2: M Logo Fold, Shockwave & Glow */}
          {animationStage >= 1 && (
            <div className="relative w-44 h-44 flex items-center justify-center">
              
              {/* Outer Shockwave expander */}
              {animationStage === 1 && (
                <motion.div
                  initial={{ scale: 0.1, opacity: 1, borderWidth: "3px" }}
                  animate={{ scale: 3.5, opacity: 0, borderWidth: "1px" }}
                  transition={{ duration: 0.9, ease: [0.1, 0.8, 0.2, 1] }}
                  className="absolute w-24 h-24 rounded-full border border-red-600/60 shadow-[0_0_30px_#ef4444]"
                />
              )}

              {/* High-fidelity Logo Folding Reveal */}
              <motion.div
                initial={{ rotateY: 90, scale: 0.5, opacity: 0 }}
                animate={{
                  rotateY: 0,
                  scale: 1,
                  opacity: 1,
                  filter: [
                    "drop-shadow(0 0 10px rgba(229,9,20,0.2))",
                    "drop-shadow(0 0 35px rgba(229,9,20,0.8))",
                    "drop-shadow(0 0 16px rgba(229,9,20,0.5))"
                  ]
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-28 h-28"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="logoCrimsonIntro" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FF3E4A" />
                      <stop offset="50%" stop-color="#E50914" />
                      <stop offset="100%" stop-color="#600005" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 12,85 L 12,15 L 34,15 L 50,34 L 66,15 L 88,15 L 88,85 L 70,85 L 70,38 L 50,58 L 30,38 L 30,85 Z
                       M 38,34 L 64,50 L 38,66 Z"
                    fill="url(#logoCrimsonIntro)"
                    fill-rule="evenodd"
                  />
                </svg>
              </motion.div>
            </div>
          )}

          {/* STAGE 2: Dramatic Wordmark Reveal */}
          {animationStage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 15, letterSpacing: "1px" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "8px" }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-4 flex flex-col items-center"
            >
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-neutral-400 tracking-widest font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                MUVIONT
              </h1>
              {/* Subtle crimson volumetric scanline */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 140, opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent mt-1"
              />
            </motion.div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
