import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-black/60 backdrop-blur-xl mt-16 pb-24 md:pb-12 pt-10 text-neutral-400">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Disclaimer */}
        <div className="space-y-2 text-center md:text-left max-w-lg">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-sm font-black tracking-wider text-white">MUVIONT</span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI Film Guide
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            MUVIONT operates as an automated entertainment directory and movie discovery catalog. MUVIONT does not host, store, or stream media files on its servers.
          </p>
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <Link
            href="/dmca"
            className="hover:text-white transition-colors flex items-center gap-1.5 text-red-400/90 hover:text-red-300"
          >
            <Shield className="w-3.5 h-3.5" /> DMCA Takedown Policy
          </Link>
          <span className="text-white/10">•</span>
          <Link href="/movies" className="hover:text-white transition-colors">
            Movies
          </Link>
          <span className="text-white/10">•</span>
          <Link href="/series" className="hover:text-white transition-colors">
            TV Shows
          </Link>
          <span className="text-white/10">•</span>
          <Link href="/anime" className="hover:text-white transition-colors">
            Anime
          </Link>
          <span className="text-white/10">•</span>
          <Link href="/login" className="hover:text-white transition-colors">
            Account
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 mt-6 border-t border-white/[0.04] text-center text-[10px] text-neutral-450 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} MUVIONT Platform. All rights reserved.</span>
        <span>Catalog data provided by TMDB & AniList API.</span>
      </div>
    </footer>
  );
}
