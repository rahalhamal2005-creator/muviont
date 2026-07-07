"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Film, Tv, Star, Heart, User, Flame } from "lucide-react";

const TABS = [
  { href: "/",         label: "Home",      icon: Home  },
  { href: "/movies",   label: "Movies",    icon: Film  },
  { href: "/series",   label: "Series",    icon: Tv    },
  { href: "/anime",    label: "Anime",     icon: Star  },
  { href: "/trending", label: "Trending",  icon: Flame },
  { href: "/watchlist",label: "Watchlist", icon: Heart },
  { href: "/profile",  label: "Profile",   icon: User  },
];

export default function BottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="bottom-nav pb-[safe-area-inset-bottom]" aria-label="Mobile navigation">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || 
                       (href === "/movies" && (pathname.startsWith("/movie/") || pathname.startsWith("/watch/movie/"))) ||
                       (href === "/series" && (pathname.startsWith("/series/") || pathname.startsWith("/watch/series/"))) ||
                       (href === "/anime" && (pathname.startsWith("/anime/") || pathname.startsWith("/watch/anime/"))) ||
                       (href === "/trending" && (pathname.startsWith("/trending") || pathname.startsWith("/watch/trending")));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[9px] font-semibold transition-colors duration-150 relative ${
              active ? "text-[var(--red)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            }`}
          >
            <Icon
              className={`w-4.5 h-4.5 transition-all duration-150 ${active ? "scale-110 text-[var(--red)]" : ""}`}
              strokeWidth={active ? 2.5 : 1.8}
            />
            <span>{label}</span>
            {active && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[var(--red)] rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
