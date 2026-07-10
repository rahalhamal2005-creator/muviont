"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface Offer {
  id: string;
  name: string;
  anchor: string;
  conversion: string;
  url: string;
  payout: string;
  network_icon?: string;
  boosted?: boolean;
}

interface ContentLockerProps {
  onUnlock: () => void;
  title: string;
  backdropUrl?: string;
  mode?: "stream" | "download";
}

export default function ContentLocker({ onUnlock, title, backdropUrl, mode = "stream" }: ContentLockerProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const isDownload = mode === "download";

  // 1. Register locker view/impression in AdBlueMedia dashboard on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://d1cdbd1x576ga0.cloudfront.net/public/external/check.php?pub_key=64ddf7cdfac75ce75979";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 2. Fetch offers from our API
  useEffect(() => {
    fetch("/api/offers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Offer[]) => {
        // Only keep exactly 2 offers as requested by the user
        setOffers(data.slice(0, 2));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // 3. Poll lead completion (JSONP to AdBlueMedia)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkLeads = () => {
      const callbackName = `cb_check_leads_${Date.now()}`;
      const url = "https://d1cdbd1x576ga0.cloudfront.net/public/external/check2.php?testing=0";

      const script = document.createElement("script");
      script.src = `${url}&callback=${callbackName}`;
      script.async = true;

      (window as any)[callbackName] = (leads: any[]) => {
        if (leads && leads.length > 0) {
          setVerifying(false);
          onUnlock();
        }
        cleanup();
      };

      script.onerror = () => {
        cleanup();
      };

      document.body.appendChild(script);

      function cleanup() {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete (window as any)[callbackName];
      }
    };

    // Poll every 8 seconds for fast UX response
    intervalId = setInterval(checkLeads, 8000);

    return () => {
      clearInterval(intervalId);
    };
  }, [onUnlock]);

  const handleOfferClick = (offerUrl: string) => {
    setVerifying(true);
    window.open(offerUrl, "_blank");
  };

  return (
    <div 
      className={isDownload 
        ? "w-full flex flex-col items-center justify-center text-center space-y-3" 
        : "w-full relative rounded-2xl flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 text-center overflow-hidden border border-white/[0.06] bg-neutral-950 min-h-[460px]"
      }
    >
      {/* Blurred Backdrop Image - Only for stream mode */}
      {!isDownload && backdropUrl && (
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img 
            src={backdropUrl} 
            alt="" 
            className="w-full h-full object-cover blur-[6px] scale-105 opacity-55 animate-pulse" 
            style={{ animationDuration: '6s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07070f]/75 via-[#07070f]/65 to-[#07070f]/80" />
        </div>
      )}

      {/* Custom Keyframe animations for sonar/radar pulse */}
      <style jsx>{`
        @keyframes sonar {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        .sonar-wave {
          animation: sonar 2s infinite cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Content Container (Glassmorphic panel for stream, simple div for download) */}
      <div 
        className={isDownload 
          ? "relative z-10 w-full flex flex-col items-center gap-3" 
          : "relative z-10 max-w-md w-full bg-[#0c0c18]/90 border border-white/[0.06] rounded-2xl p-5 sm:p-7 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-between gap-4"
        }
      >
        {/* Header: Transparent MUVIONT Logo */}
        <div className="flex items-center gap-2 select-none justify-center w-full">
          <svg className={isDownload ? "w-5 h-5" : "w-8 h-8"} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lockerCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF2E3B" />
                <stop offset="40%" stop-color="#E50914" />
                <stop offset="100%" stop-color="#7A000A" />
              </linearGradient>
              <filter id="lockerGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 12,85 L 12,15 L 34,15 L 50,34 L 66,15 L 88,15 L 88,85 L 70,85 L 70,38 L 50,58 L 30,38 L 30,85 Z M 38,34 L 64,50 L 38,66 Z"
              fill="url(#lockerCrimson)"
              fill-rule="evenodd"
              filter="url(#lockerGlow)"
            />
          </svg>
          <span className={isDownload ? "text-xs font-black tracking-[0.25em] text-white" : "text-lg font-black tracking-[0.25em] text-white"}>MUVIONT</span>
        </div>

        {/* Locked Title & Movie Name Centered */}
        <div className="space-y-1 w-full text-center flex flex-col items-center justify-center">
          <div className="text-[10px] sm:text-xs text-[var(--red)] font-black uppercase tracking-[0.2em] animate-pulse text-center">
            🔒 {isDownload ? "Download Verification Required" : "Link Verification Required"}
          </div>
          {!isDownload && title && (
            <h4 className="text-xs sm:text-sm font-bold text-neutral-350 line-clamp-1 italic px-2 text-center">
              &ldquo;{title}&rdquo;
            </h4>
          )}
        </div>

        {/* 3-Step Visual Conversion Timeline (Marketing Hook) - Hide in download mode */}
        {!isDownload && (
          <div className="w-full grid grid-cols-3 gap-1.5 border-y border-white/[0.04] py-2 text-center select-none">
            <div className="space-y-1">
              <div className="w-4 h-4 rounded-full bg-[var(--red)]/15 border border-[var(--red)]/35 text-[8px] font-black text-[var(--red)] flex items-center justify-center mx-auto shadow-[0_0_6px_rgba(229,56,59,0.15)]">
                1
              </div>
              <div className="text-[8px] font-black text-white uppercase tracking-wider">Choose Offer</div>
              <p className="text-[7px] text-neutral-500 font-semibold leading-tight">Click below</p>
            </div>
            
            <div className="space-y-1 border-x border-white/[0.04]">
              <div className="w-4 h-4 rounded-full bg-[var(--red)]/15 border border-[var(--red)]/35 text-[8px] font-black text-[var(--red)] flex items-center justify-center mx-auto shadow-[0_0_6px_rgba(229,56,59,0.15)]">
                2
              </div>
              <div className="text-[8px] font-black text-white uppercase tracking-wider">Verify Free</div>
              <p className="text-[7px] text-neutral-500 font-semibold leading-tight">Fill f 60s</p>
            </div>

            <div className="space-y-1">
              <div className="w-4 h-4 rounded-full bg-[var(--red)]/15 border border-[var(--red)]/35 text-[8px] font-black text-[var(--red)] flex items-center justify-center mx-auto shadow-[0_0_6px_rgba(229,56,59,0.15)]">
                3
              </div>
              <div className="text-[8px] font-black text-white uppercase tracking-wider">Play Movie</div>
              <p className="text-[7px] text-neutral-500 font-semibold leading-tight">Instant 4K</p>
            </div>
          </div>
        )}

        {/* Custom description with bold highlighted marketing hooks */}
        <p className="text-[10px] sm:text-xs text-neutral-300 font-bold leading-relaxed text-center px-1 tracking-wide font-sans w-full">
          {isDownload ? (
            <>
              Complete 1 quick free offer below to <span className="text-[var(--red)] font-black">permanently unlock</span> your high-speed download link.
            </>
          ) : (
            <>
              Due to extreme server traffic, unverified streaming is locked. Complete just <span className="text-[var(--red)] font-black underline decoration-[1.5px]">1 quick 60-second option</span> below to <span className="text-[var(--red)] font-black">permanently unlock</span> the player. Once verified, your movie will play <span className="text-emerald-400 font-black">instantly f Ultra-HD quality</span>, and your direct download link will be fully activated.
            </>
          )}
        </p>

        {/* Exactly 2 Offers */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Loader2 className="w-4 h-4 text-[var(--red)] animate-spin" />
            <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-extrabold">Loading Offers…</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="w-full p-3 border border-white/[0.04] rounded-xl bg-white/[0.01]">
            <span className="text-[10px] text-neutral-500">No verification options available right now.</span>
            <button 
              onClick={onUnlock}
              className="mt-2 block w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
            >
              {isDownload ? "Skip and Download" : "Skip and Play"}
            </button>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {offers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => handleOfferClick(offer.url)}
                className="w-full p-2.5 text-left rounded-xl transition-all duration-300 flex items-center justify-between border bg-red-950/10 border-[var(--red)]/20 hover:border-[var(--red)] hover:bg-red-950/20 shadow-[0_0_8px_rgba(229,56,59,0.04)] group"
              >
                <div className="flex items-center gap-2.5">
                  {offer.network_icon && (
                    <img 
                      src={offer.network_icon} 
                      alt="" 
                      className="w-5 h-5 rounded-lg object-contain bg-white/5 p-0.5 border border-white/10" 
                    />
                  )}
                  <div>
                    <div className="text-[10px] sm:text-[11px] font-black text-white group-hover:text-[var(--red)] transition-colors leading-tight">
                      {offer.anchor}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-neutral-400 font-semibold mt-0.5">
                      {offer.conversion}
                    </div>
                  </div>
                </div>

                <span className="text-[8px] font-black uppercase text-[var(--red)] tracking-wider shrink-0 ml-2 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-[var(--red)]" /> Unlock
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Centered Sonar Radar Verification Pulse Status */}
        <div className="w-full flex flex-col items-center justify-center gap-2 border-t border-white/[0.04] pt-3">
          <div className="flex items-center gap-2 justify-center">
            {/* Dynamic Concentric Sonar Waves - Only for stream mode */}
            {!isDownload ? (
              <div className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--red)]/30 sonar-wave" style={{ animationDelay: '0s' }} />
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--red)]/20 sonar-wave" style={{ animationDelay: '0.6s' }} />
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--red)]/10 sonar-wave" style={{ animationDelay: '1.2s' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--red)] shadow-[0_0_6px_var(--red)]" />
              </div>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
            )}
            
            {/* Centered Status Label */}
            <span className="text-[8px] sm:text-[9px] font-black text-neutral-450 uppercase tracking-widest leading-none">
              {verifying 
                ? "Verifying completion… keep window open" 
                : "System: Listening for offer completion"}
            </span>

            {/* Verification active loading spinner */}
            {verifying && (
              <Loader2 className="w-3 h-3 text-[var(--red)] animate-spin" />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
