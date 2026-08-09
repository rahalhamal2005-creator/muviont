"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search, Shield, Film, Tv, Star,
  Heart, Home, User, LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/",        label: "Home",      icon: Home  },
  { href: "/movies",  label: "Movies",    icon: Film  },
  { href: "/series",  label: "Series",    icon: Tv    },
  { href: "/anime",   label: "Anime",     icon: Star  },
  { href: "/watchlist",label: "Watchlist",icon: Heart },
];

interface NavbarProps {
  onSearchClick?: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [user, setUser]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });

    fetch("/api/auth/session")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setUser(d?.user || null); setLoading(false); })
      .catch(() => setLoading(false));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    window.location.href = "/";
  };

  return (
    <>
      {/* Desktop Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-45 transition-all duration-300 hidden md:block ${
          scrolled
            ? "bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
            : "bg-gradient-to-b from-[var(--bg)]/90 via-[var(--bg)]/30 to-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[var(--navbar-h)] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white group flex-shrink-0" aria-label="MUVIONT Home">
            <svg viewBox="0 0 100 100" className="h-8 w-8 object-contain" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoCrimsonD" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF2E3B" />
                  <stop offset="40%" stopColor="#E50914" />
                  <stop offset="100%" stopColor="#7A000A" />
                </linearGradient>
                <linearGradient id="highlightGradientD" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
                </linearGradient>
                <filter id="logoGlowD" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E50914" strokeOpacity="0.08" strokeWidth="1.5" />
              <path
                d="M 12,85 L 12,15 L 34,15 L 50,34 L 66,15 L 88,15 L 88,85 L 70,85 L 70,38 L 50,58 L 30,38 L 30,85 Z M 38,34 L 64,50 L 38,66 Z"
                fill="url(#logoCrimsonD)"
                fillRule="evenodd"
                filter="url(#glowD)"
              />
              <path
                d="M 12,85 L 12,15 L 34,15 L 50,34 L 66,15 L 88,15 L 88,85 L 70,85 L 70,38 L 50,58 L 30,38 L 30,85 Z M 38,34 L 64,50 L 38,66 Z"
                fill="url(#highlightGradientD)"
                fillRule="evenodd"
                pointerEvents="none"
              />
            </svg>
            <span className="font-extrabold tracking-[0.25em] text-white text-base select-none uppercase group-hover:text-neutral-200 transition-colors duration-150">
              MUVIONT<span className="text-[#E50914] font-black">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    active
                      ? "text-white bg-white/8"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Search Button */}
            <button
              onClick={onSearchClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Search…</span>
            </button>

            {/* Auth */}
            {!loading && !user && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-[var(--red)] hover:bg-[var(--red)]/90 text-white text-sm font-bold transition-all duration-200 hover:scale-105 shadow-[0_0_16px_var(--red-glow)]"
              >
                Sign In
              </Link>
            )}

            {/* Profile Dropdown */}
            {!loading && user && (
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 rounded-full border border-[var(--border)] bg-[var(--bg3)] hover:border-[var(--border2)] transition-all duration-150">
                  {user.image ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image src={user.image} alt={user.name || "User"} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--red)] flex items-center justify-center font-bold text-sm shadow-[0_0_10px_var(--red-glow)]">
                      {(user.name || user.email || "U").substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg3)] border border-[var(--border2)] rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-[0_16px_48px_rgba(0,0,0,0.8)] z-50">
                  <div className="px-3 py-2 border-b border-[var(--border)] mb-2">
                    <p className="text-[10px] text-[var(--text-dim)] font-semibold uppercase tracking-wider">MUVIONT Account</p>
                    <p className="text-xs font-bold text-white mt-1 truncate">{user.name || "User"}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                    <span className="inline-block px-2 py-0.5 rounded bg-[var(--red-dim)] text-[9px] font-bold text-[var(--red)] border border-[var(--red)]/15 mt-1 uppercase tracking-wide">
                      {user.role}
                    </span>
                  </div>

                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs font-semibold text-[var(--red)] transition-colors duration-150">
                      <Shield className="w-3.5 h-3.5" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/watchlist" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors duration-150">
                    <Heart className="w-3.5 h-3.5" />
                    My Watchlist
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors duration-150">
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs font-semibold text-[var(--text-muted)] hover:text-red-400 transition-colors duration-150 mt-1 border-t border-[var(--border)] pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile Top Header (Fixed with Logo, Search, and profile button) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/92 backdrop-blur-2xl border-b border-white/8 h-[var(--navbar-h)] flex items-center justify-between px-4 md:hidden">
        {/* Logo — explicit inline SVG avoids external gradient reference bugs */}
        <Link href="/" className="flex items-center gap-2 text-white group flex-shrink-0" aria-label="MUVIONT Home">
          <svg viewBox="0 0 100 100" className="h-7 w-7 object-contain animate-fade-in" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoCrimsonM" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF2E3B" />
                <stop offset="40%" stopColor="#E50914" />
                <stop offset="100%" stopColor="#7A000A" />
              </linearGradient>
              <linearGradient id="highlightGradientM" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </linearGradient>
              <filter id="glowM" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#E50914" strokeOpacity="0.08" strokeWidth="1.5" />
            <path
              d="M 12,85 L 12,15 L 34,15 L 50,34 L 66,15 L 88,15 L 88,85 L 70,85 L 70,38 L 50,58 L 30,38 L 30,85 Z M 38,34 L 64,50 L 38,66 Z"
              fill="url(#logoCrimsonM)"
              fillRule="evenodd"
              filter="url(#glowM)"
            />
            <path
              d="M 12,85 L 12,15 L 34,15 L 50,34 L 66,15 L 88,15 L 88,85 L 70,85 L 70,38 L 50,58 L 30,38 L 30,85 Z M 38,34 L 64,50 L 38,66 Z"
              fill="url(#highlightGradientM)"
              fillRule="evenodd"
              pointerEvents="none"
            />
          </svg>
          <span className="font-extrabold tracking-[0.25em] text-white text-sm select-none uppercase group-hover:text-neutral-200 transition-colors duration-150">
            MUVIONT<span className="text-[#E50914] font-black">.</span>
          </span>
        </Link>

        {/* Action icons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSearchClick}
            className="p-2 rounded-md bg-white/8 border border-white/12 text-neutral-400 hover:text-white hover:bg-white/14 transition-all duration-150"
            aria-label="Search"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {!loading && user ? (
            <Link
              href="/profile"
              className="flex items-center p-0.5 rounded-full border border-white/15 bg-neutral-900 hover:border-white/30 transition-all"
            >
              {user.image ? (
                <div className="relative w-7 h-7 rounded-full overflow-hidden">
                  <Image src={user.image} alt={user.name || "User"} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[var(--red)] flex items-center justify-center font-black text-[10px] text-white shadow-[0_0_8px_var(--red-glow)]">
                  {(user.name || user.email || "U").substring(0, 1).toUpperCase()}
                </div>
              )}
            </Link>
          ) : !loading ? (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md bg-[var(--red)] hover:bg-[var(--red)]/90 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_0_12px_var(--red-glow)]"
            >
              Sign In
            </Link>
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/8 animate-pulse border border-white/10" />
          )}
        </div>
      </header>
    </>
  );
}
