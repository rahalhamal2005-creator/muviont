"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Server, ExternalLink, ShieldAlert, Loader2, Copy, Check, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  // Locker-specific states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Check for Admin status or previous unlock
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      const alreadyUnlocked = localStorage.getItem("muviont_unlocked_download");
      if (alreadyUnlocked === "true") {
        setIsUnlocked(true);
        return;
      }
    }

    // Fetch session to check role
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        if (data.user && data.user.role === "SUPER_ADMIN") {
          setIsAdmin(true);
          setIsUnlocked(true);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // 2. Fetch Direct Stream URL on open
  useEffect(() => {
    if (!isOpen) {
      setResolvedUrl(null);
      setCopied(false);
      return;
    }

    setIsLoadingUrl(true);
    fetch(`/api/stream?id=${mediaId}&type=${mediaType}&season=${season}&episode=${episode}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        if (data.url) {
          setResolvedUrl(data.url);
        }
        setIsLoadingUrl(false);
      })
      .catch(() => {
        setIsLoadingUrl(false);
      });
  }, [isOpen, mediaId, mediaType, season, episode]);

  // 3. Register AdBlueMedia view when locker is shown (pendingUrl is set)
  useEffect(() => {
    if (!pendingUrl) return;

    const script = document.createElement("script");
    script.src = "https://d1cdbd1x576ga0.cloudfront.net/public/external/check.php?pub_key=64ddf7cdfac75ce75979";
    script.async = true;
    document.body.appendChild(script);

    // Fetch offers
    setLoadingOffers(true);
    fetch("/api/offers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Offer[]) => {
        // Only keep top 2 offers for clean professional UI
        setOffers(data.slice(0, 2));
        setLoadingOffers(false);
      })
      .catch(() => {
        setLoadingOffers(false);
      });

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [pendingUrl]);

  // 4. Poll lead completion when locker is active
  useEffect(() => {
    if (!pendingUrl || isUnlocked) return;

    const checkLeads = () => {
      const callbackName = `cb_download_leads_${Date.now()}`;
      const url = "https://d1cdbd1x576ga0.cloudfront.net/public/external/check2.php?testing=0";

      const script = document.createElement("script");
      script.src = `${url}&callback=${callbackName}`;
      script.async = true;

      (window as any)[callbackName] = (leads: any[]) => {
        if (leads && leads.length > 0) {
          setIsUnlocked(true);
          setVerifying(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("muviont_unlocked_download", "true");
          }
          // Redirect to the pending download link
          window.open(pendingUrl, "_blank");
          setPendingUrl(null);
        }
        cleanup();
      };

      script.onerror = () => cleanup();
      document.body.appendChild(script);

      function cleanup() {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete (window as any)[callbackName];
      }
    };

    const interval = setInterval(checkLeads, 8000);
    return () => clearInterval(interval);
  }, [pendingUrl, isUnlocked]);

  // Keyboard listener
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

  const handleCopy = () => {
    if (!resolvedUrl) return;
    navigator.clipboard.writeText(resolvedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleServerClick = (url: string) => {
    if (isUnlocked) {
      // Direct pass
      window.open(url, "_blank");
      onClose();
    } else {
      // Trigger locker
      setPendingUrl(url);
    }
  };

  const handleOfferClick = (offerUrl: string) => {
    setVerifying(true);
    window.open(offerUrl, "_blank");
  };

  if (!isOpen) return null;

  // Extract raw ID
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
      name: "Direct Stream File",
      desc: "Downloads the direct high-speed MP4/HLS stream file",
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
          className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-900 shadow-[0_0_50px_rgba(255,0,0,0.15)] z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4.5 h-4.5 text-[var(--red)]" />
                Download Options
              </h2>
              <p className="text-[11px] text-neutral-400 font-medium line-clamp-1">{title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/[0.02] border border-white/[0.06] text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!pendingUrl ? (
            /* VIEW 1: Servers List */
            <>
              {/* Direct Link Copier & Instructions */}
              <div className="space-y-2">
                {isLoadingUrl ? (
                  <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-neutral-900 bg-neutral-900/10 text-xs text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--red)]" />
                    <span>Resolving direct stream URL...</span>
                  </div>
                ) : resolvedUrl ? (
                  <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[var(--red)] uppercase tracking-wider">Direct HLS Stream Link</span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide bg-emerald-500/15 border border-emerald-500/30 text-emerald-450">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={resolvedUrl}
                        className="flex-1 bg-black/60 border border-neutral-900 px-3 py-2 rounded-lg text-[10px] text-neutral-400 font-mono focus:outline-none"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-3.5 py-2 bg-[var(--red)] hover:bg-red-650 text-white font-bold rounded-lg text-xs transition-colors duration-200 flex items-center gap-1.5 active:scale-95 shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-light leading-normal space-y-1.5 border-t border-white/[0.04] pt-2">
                      <p className="font-semibold text-neutral-350">How to download offline:</p>
                      <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                        <li>
                          Paste the link in{" "}
                          <a href="https://m3u8downloader.app" target="_blank" rel="noopener noreferrer" className="text-[var(--red)] hover:underline font-bold">
                            m3u8downloader.app
                          </a>{" "}
                          to download as MP4 instantly.
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Status bar */}
              {isUnlocked && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{isAdmin ? "Admin Locker Bypass Active" : "Unlocks Purchased / Completed"}</span>
                </div>
              )}

              {/* AdBlocker Warning */}
              <div className="flex gap-3 bg-red-950/15 border border-red-500/20 p-3.5 rounded-xl text-neutral-300">
                <ShieldAlert className="w-5 h-5 text-[var(--red)] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-extrabold text-[var(--red)] uppercase tracking-wider text-[10px]">Security Notice</span>
                  <p className="font-light leading-relaxed">We recommend using an <strong>AdBlocker</strong> (like uBlock Origin) on external streaming mirrors to bypass third-party advertisements.</p>
                </div>
              </div>

              {/* Servers list */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block pl-1">Downloader Servers</span>
                {servers.map((srv, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleServerClick(srv.url)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-900 bg-neutral-900/20 hover:bg-neutral-900/60 hover:border-neutral-800 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-900 border border-white/[0.04] text-neutral-400 group-hover:text-[var(--red)] group-hover:border-[var(--red)]/20 transition-colors duration-300">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-[var(--red)] transition-colors duration-300">
                            {srv.name}
                          </span>
                          {srv.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-extrabold uppercase tracking-wide ${
                              srv.isDirect 
                                ? "bg-[var(--red)]/15 border border-[var(--red)]/30 text-[var(--red)]"
                                : "bg-white/[0.03] border border-white/[0.06] text-neutral-450"
                            }`}>
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-450 font-light leading-normal">{srv.desc}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-white transition-colors duration-300" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* VIEW 2: Content Locker */
            <div className="space-y-6 text-center py-4 relative">
              {/* Back to server list */}
              <button
                onClick={() => {
                  setPendingUrl(null);
                  setVerifying(false);
                }}
                className="absolute top-0 left-0 text-[10px] font-black uppercase tracking-wider text-neutral-500 hover:text-[var(--red)] transition-colors"
              >
                ← Back
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-[var(--red)]/10 border border-[var(--red)]/20 flex items-center justify-center mx-auto text-[var(--red)] animate-pulse shadow-[0_0_20px_var(--red-glow)]">
                  🔒
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Locker Verification Required</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto font-light leading-relaxed">
                  Complete one of the free offers below to verify you are not a bot and unlock your download server.
                </p>
              </div>

              {/* Offers list */}
              <div className="space-y-3 max-w-sm mx-auto">
                {loadingOffers ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-neutral-500 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--red)]" />
                    <span>Loading verified offers...</span>
                  </div>
                ) : offers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-900 text-xs text-neutral-550">
                    No offers available for your location. Please try again.
                  </div>
                ) : (
                  offers.map((offer) => (
                    <button
                      key={offer.id}
                      onClick={() => handleOfferClick(offer.url)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-900 bg-neutral-900/10 hover:bg-neutral-900/40 hover:border-neutral-800 transition-all duration-300 group text-left relative overflow-hidden"
                    >
                      {offer.boosted && (
                        <div className="absolute top-0 right-0 px-2 py-0.5 bg-[var(--red)] text-[7px] font-extrabold uppercase tracking-widest text-white rounded-bl">
                          Boosted
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white group-hover:text-[var(--red)] transition-colors duration-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--red)]" />
                          {offer.name}
                        </span>
                        <p className="text-[10px] text-neutral-400 font-light leading-normal">{offer.anchor}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white transition-colors shrink-0 ml-4" />
                    </button>
                  ))
                )}
              </div>

              {/* Status Verification Loader */}
              {verifying && (
                <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-red-950/10 border border-red-500/15 max-w-xs mx-auto text-xs text-neutral-350">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--red)]" />
                  <span className="font-medium animate-pulse">Waiting for offer completion...</span>
                </div>
              )}

              <div className="text-[9px] text-neutral-650 font-light max-w-xs mx-auto">
                Keep this window open. Once you complete the offer, your download link will open automatically.
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-[9px] text-neutral-600 text-center font-light pt-2 border-t border-white/[0.04]">
            Muviont does not host any media files directly. Content is indexed via third-party providers.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
