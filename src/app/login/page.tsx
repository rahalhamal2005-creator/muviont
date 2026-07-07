"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Sparkles, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync OAuth errors
  const urlError = searchParams.get("error");
  useEffect(() => {
    if (urlError) {
      setError(urlError);
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const endpoint = activeTab === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const bodyPayload = activeTab === "signin" 
        ? { email, password } 
        : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (activeTab === "signup") {
        setSuccessMsg("Account created successfully! Logging you in...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-[0_24px_60px_rgba(229,56,59,0.12)] text-center flex flex-col items-center relative z-10 transition-all duration-300">
      
      {/* Brand Logo */}
      <div className="relative w-36 h-10 mb-6 select-none">
        <Image src="/logo.png" alt="MUVIONT Logo" fill className="object-contain" priority />
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 justify-center">
        <Sparkles className="w-5 h-5 text-[var(--red)]" />
        Cinematic Experience Awaits
      </h1>
      <p className="text-xs text-neutral-400 mt-2 max-w-xs leading-relaxed font-light">
        Access premium AI search, personalized recommendations, watchlist tracking, and curated entertainment.
      </p>

      {/* Tab Selector */}
      <div className="w-full mt-6 grid grid-cols-2 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
        <button
          onClick={() => {
            setActiveTab("signin");
            setError(null);
            setSuccessMsg(null);
          }}
          className={`py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
            activeTab === "signin"
              ? "bg-[var(--red)] text-white shadow-[0_0_15px_rgba(229,56,59,0.3)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setActiveTab("signup");
            setError(null);
            setSuccessMsg(null);
          }}
          className={`py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
            activeTab === "signup"
              ? "bg-[var(--red)] text-white shadow-[0_0_15px_rgba(229,56,59,0.3)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Create Account
        </button>
      </div>

      {error && (
        <div className="w-full mt-4 p-3.5 rounded-xl bg-red-950/20 border border-red-800/30 flex items-center gap-3 text-red-400 text-left transition-all duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold leading-snug">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="w-full mt-4 p-3.5 rounded-xl bg-green-950/20 border border-green-800/30 flex items-center gap-3 text-green-400 text-left transition-all duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span className="text-xs font-semibold leading-snug">{successMsg}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="w-full mt-5 space-y-4 text-left">
        {activeTab === "signup" && (
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500 pointer-events-none">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Your Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-all duration-300 font-medium"
            />
          </div>
        )}

        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500 pointer-events-none">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-all duration-300 font-medium"
          />
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-500 pointer-events-none">
            <Lock className="w-4 h-4" />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-all duration-300 font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white transition-colors duration-200"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--red)] to-red-500 text-white font-extrabold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(229,56,59,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none select-none"
        >
          {loading ? "Processing..." : activeTab === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full my-6 flex items-center gap-3">
        <span className="h-[1px] flex-grow bg-white/[0.06]" />
        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-extrabold select-none">Or continue with</span>
        <span className="h-[1px] flex-grow bg-white/[0.06]" />
      </div>

      {/* OAuth Button */}
      <a
        href="/api/auth/login/google"
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_15px_rgba(255,255,255,0.1)] group select-none"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Google
      </a>

      {/* Footer metadata */}
      <div className="mt-8 border-t border-white/[0.05] pt-6 w-full flex items-center justify-between text-[10px] text-neutral-500 font-medium select-none">
        <span>© 2026 MUVIONT INC.</span>
        <Link href="/" className="hover:text-white transition-colors duration-200">
          Go back Home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-black min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none select-none" />

      <Suspense fallback={<div className="text-sm text-neutral-400 font-semibold">Loading MUVIONT...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
