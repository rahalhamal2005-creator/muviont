"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Shield, Film, Compass, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface NavbarProps {
  onSearchClick?: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll event listener for changing navbar opacity
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    // Fetch user session
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch (err) {
        console.error("Failed to load user session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "bg-black/85 backdrop-blur-md border-b border-neutral-900 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]" 
          : "bg-gradient-to-b from-black/80 via-black/20 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left Side: Logo and Main Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="relative w-36 h-10 block hover:scale-102 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="MUVIONT Logo"
              fill
              priority
              className="object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-red-500" />
              Browse
            </Link>
            <Link href="/anime" className="text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              Anime Section
            </Link>
            <Link href="/watchlist" className="text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              My Watchlist
            </Link>
          </nav>
        </div>

        {/* Right Side: Search and Account controls */}
        <div className="flex items-center gap-6">
          {/* Search Trigger */}
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all duration-200 group text-sm font-medium"
            aria-label="Search"
          >
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="hidden sm:inline">Search AI & Titles...</span>
          </button>

          {/* Login button */}
          {!loading && !user && (
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-red-650 hover:bg-red-700 text-xs font-bold text-white transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              Login
            </Link>
          )}

          {/* User Profile dropdown */}
          {!loading && user && (
            <div className="relative group flex items-center">
              <button className="flex items-center gap-2 p-1 rounded-full border border-neutral-800 bg-neutral-900 text-white/95 hover:bg-neutral-800 transition-colors duration-200">
                {user.image ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={user.image}
                      alt={user.name || "User profile"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                    {(user.name || user.email || "US").substring(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-52 bg-neutral-950 border border-neutral-800 rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50">
                <div className="px-3 py-2 border-b border-neutral-900 mb-2">
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Muviont Account</p>
                  <p className="text-xs font-bold truncate text-white mt-1">{user.name || "User"}</p>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">{user.email}</p>
                  <span className="inline-block px-2 py-0.5 rounded bg-red-950/20 text-[9px] font-bold text-red-500 border border-red-500/10 mt-1.5 uppercase">
                    {user.role}
                  </span>
                </div>

                {/* Navigation to Admin if Role is ADMIN or SUPER_ADMIN */}
                {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-900 text-xs font-medium text-red-500 transition-colors duration-200"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-neutral-900 text-xs font-medium text-neutral-400 hover:text-white transition-colors duration-200 mt-1 border-t border-neutral-900/50 pt-2"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
