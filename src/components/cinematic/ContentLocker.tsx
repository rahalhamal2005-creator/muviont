"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Sparkles, AlertCircle, Loader2 } from "lucide-react";

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
}

export default function ContentLocker({ onUnlock, title }: ContentLockerProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [completedOffer, setCompletedOffer] = useState<string | null>(null);

  // 1. Fetch offers from our API
  useEffect(() => {
    fetch("/api/offers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Offer[]) => {
        setOffers(data.slice(0, 5)); // Take top 5 offers
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // 2. Poll lead completion (JSONP to AdBlueMedia)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkLeads = () => {
      // Define unique callback name
      const callbackName = `cb_check_leads_${Date.now()}`;
      const url = "https://d1cdbd1x576ga0.cloudfront.net/public/external/check2.php?testing=0";

      // JSONP Implementation
      const script = document.createElement("script");
      script.src = `${url}&callback=${callbackName}`;
      script.async = true;

      (window as any)[callbackName] = (leads: any[]) => {
        if (leads && leads.length > 0) {
          // Lead completed! Unlock player
          setVerifying(false);
          setCompletedOffer(leads[0].offer_id);
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

    // Poll every 8 seconds for faster UX response
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
      className="w-full bg-[#09090d] border border-white/[0.04] backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-6 md:p-10 text-center relative overflow-hidden" 
      style={{ aspectRatio: "16/9" }}
    >
      {/* Background Cinematic Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[var(--red)]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl space-y-6 z-10 w-full">
        {/* Header Icon */}
        <div className="relative inline-block">
          <div className="w-14 h-14 bg-red-950/40 border border-[var(--red)]/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(229,56,59,0.1)]">
            {verifying ? (
              <Loader2 className="w-6 h-6 text-[var(--red)] animate-spin" />
            ) : (
              <Lock className="w-6 h-6 text-[var(--red)] animate-pulse" />
            )}
          </div>
          {verifying && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
            🔐 Verification Required
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            Had l-video locked. Khtar offer wa7ed mn hado l-ta7t bach t-unlocki l-film dynamic w completely fabor!
          </p>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Loading Fast Offers...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="p-4 border border-white/[0.04] rounded-lg bg-white/[0.02]">
            <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">No offers available for your country right now.</p>
            <button 
              onClick={onUnlock}
              className="mt-3 px-4 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-[10px] uppercase tracking-wider font-extrabold rounded-md"
            >
              Skip Verification
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {offers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => handleOfferClick(offer.url)}
                className={`w-full p-3 text-left rounded-xl transition-all duration-300 flex items-center justify-between border ${
                  offer.boosted
                    ? "bg-red-950/20 border-[var(--red)]/40 hover:border-[var(--red)] hover:bg-red-950/30 shadow-[0_0_12px_rgba(229,56,59,0.06)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {offer.network_icon && (
                    <img 
                      src={offer.network_icon} 
                      alt="" 
                      className="w-7 h-7 rounded-lg object-contain bg-white/5 p-0.5 border border-white/10" 
                    />
                  )}
                  <div>
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5 leading-snug">
                      {offer.anchor}
                      {offer.boosted && (
                        <span className="px-1.5 py-0.5 bg-[var(--red)] text-[8px] font-black uppercase rounded tracking-wider text-white flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 fill-white" /> Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                      {offer.conversion}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-[var(--red)] tracking-wider">
                    {offer.boosted ? "⚡ Fast Unlock" : "Free"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Verification Status */}
        {verifying && (
          <div className="pt-2 text-center animate-pulse">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Waiting for completion... Keep this page open
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
