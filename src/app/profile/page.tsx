"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Shield, History, LogOut, ArrowRight, Trash2 } from "lucide-react";
import Navbar from "@/components/cinematic/Navbar";
import BottomNav from "@/components/cinematic/BottomNav";
import MediaCard from "@/components/cinematic/MediaCard";
import AISearchInput from "@/components/cinematic/AISearchInput";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch user session
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          } else {
            // Redirect to login if no session exists
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // 2. Fetch watch history from localStorage
    const savedHistory = JSON.parse(localStorage.getItem("muviont_history") || "[]");
    setHistory(savedHistory);
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (res.ok) {
        // Clear history / local storage if necessary, or just redirect
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("muviont_history");
    setHistory([]);
  };

  if (loading) {
    return (
      <div className="bg-[#040405] min-h-screen text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[var(--red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-extrabold uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <div className="bg-[#040405] min-h-screen text-white pb-28 font-sans selection:bg-red-650 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] pointer-events-none overflow-hidden z-0 opacity-10 select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#040405] z-10" />
        <div className="absolute inset-0 bg-black/60 z-10" />
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            fill
            className="object-cover blur-[100px] scale-110"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-red-600 blur-[150px] opacity-20" />
        )}
      </div>

      <Navbar onSearchClick={() => setShowSearch(true)} />
      {showSearch && <AISearchInput onClose={() => setShowSearch(false)} />}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 relative z-10 space-y-8">
        
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--red)] shadow-[0_0_15px_rgba(229,56,59,0.3)] bg-neutral-900 flex items-center justify-center flex-shrink-0">
            {user.image ? (
              <Image src={user.image} alt={user.name || "User avatar"} fill className="object-cover" unoptimized />
            ) : (
              <User className="w-10 h-10 text-neutral-500" />
            )}
          </div>

          {/* User Details */}
          <div className="text-center sm:text-left flex-grow space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{user.name || "Muviont User"}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-neutral-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                {user.email}
              </span>
              <span className="text-neutral-750 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 rounded text-[10px] tracking-wide font-extrabold uppercase text-neutral-300">
                {user.role}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--red)] to-red-500 text-xs font-extrabold uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(229,56,59,0.25)] hover:shadow-[0_6px_25px_rgba(229,56,59,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 select-none"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* Watch History Section */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--red)] flex items-center gap-2">
              <History className="w-4 h-4" />
              Watch History
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 hover:text-red-400 transition-colors duration-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear History
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {history.map((item) => (
                <div key={item.id} className="relative group">
                  <MediaCard
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    rating={item.rating}
                    type={item.type}
                    releaseDate={item.releaseDate}
                  />
                  {item.episode && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-white/10 text-[9px] font-extrabold text-neutral-350 tracking-wider">
                      EP {item.episode}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 max-w-sm mx-auto">
              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                No watch history found. Start watching movies or anime and your progress will appear here automatically!
              </p>
            </div>
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
