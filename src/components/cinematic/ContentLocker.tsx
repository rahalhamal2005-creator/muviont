"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
}

export default function ContentLocker({ onUnlock, title, backdropUrl }: ContentLockerProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

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
      className="w-full relative rounded-2xl flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 text-center overflow-hidden border border-white/[0.06] bg-neutral-950" 
      style={{ aspectRatio: "16/9", minHeight: "360px" }}
    >
      {/* Blurred Backdrop Image */}
      {backdropUrl && (
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img 
            src={backdropUrl} 
            alt="" 
            className="w-full h-full object-cover blur-[8px] scale-105 opacity-30" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07070f]/90 via-[#07070f]/80 to-[#07070f]/95" />
        </div>
      )}

      {/* Content Container (Glassmorphic panel matching site style) */}
      <div className="relative z-10 max-w-lg w-full bg-[#0c0c18]/80 border border-white/[0.06] rounded-2xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-between gap-4">
        
        {/* Header: Transparent MUVIONT Logo */}
        <div className="flex items-center gap-2 select-none">
          <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span className="text-lg font-black tracking-[0.25em] text-white">MUVIONT</span>
        </div>

        {/* Locked Title & Movie Name */}
        <div className="space-y-1">
          <div className="text-[10px] sm:text-xs text-[var(--red)] font-black uppercase tracking-[0.2em] animate-pulse">
            🔒 Link Verification Required
          </div>
          {title && (
            <h4 className="text-xs sm:text-sm font-bold text-neutral-300 line-clamp-1 italic px-2">
              &ldquo;{title}&rdquo;
            </h4>
          )}
        </div>

        {/* Custom description requested by user */}
        <p className="text-[10px] sm:text-xs text-neutral-400 font-medium leading-relaxed max-w-sm">
          Due to extreme server traffic, unverified streaming is locked. Complete just 1 quick 60-second option below to permanently unlock the player. Once verified, your movie will play instantly in Ultra-HD quality, and your direct download link will be fully activated.
        </p>

        {/* Exactly 2 Offers */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <Loader2 className="w-5 h-5 text-[var(--red)] animate-spin" />
            <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-extrabold">Loading Offers...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="w-full p-3 border border-white/[0.04] rounded-xl bg-white/[0.01]">
            <span className="text-[10px] text-neutral-500">No verification options available right now.</span>
            <button 
              onClick={onUnlock}
              className="mt-2 block w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
            >
              Skip and Play
            </button>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {offers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => handleOfferClick(offer.url)}
                className="w-full p-2.5 text-left rounded-xl transition-all duration-300 flex items-center justify-between border bg-red-950/15 border-[var(--red)]/35 hover:border-[var(--red)] hover:bg-red-950/25 shadow-[0_0_8px_rgba(229,56,59,0.04)] group"
              >
                <div className="flex items-center gap-3">
                  {offer.network_icon && (
                    <img 
                      src={offer.network_icon} 
                      alt="" 
                      className="w-6 h-6 rounded-lg object-contain bg-white/5 p-0.5 border border-white/10" 
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

                <span className="text-[9px] font-black uppercase text-[var(--red)] tracking-wider shrink-0 ml-2">
                  ⚡ Unlock
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Permanent Real-Time Verification Status Panel with pulse animation */}
        <div className="w-full p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                System Status: Listening
              </div>
              <div className="text-[8px] text-neutral-450 font-bold mt-1.5">
                {verifying 
                  ? "Detecting offer completion... keep this window open." 
                  : "Click any offer above to start verification process."}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">
              {verifying ? "Verifying" : "Ready"}
            </span>
            <Loader2 className={`w-3.5 h-3.5 text-emerald-400 ${verifying ? "animate-spin" : "opacity-40"}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
