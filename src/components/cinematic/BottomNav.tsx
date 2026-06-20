"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Tv, Star, Heart } from "lucide-react";

const TABS = [
  { href: "/",         label: "Home",      icon: Home  },
  { href: "/movies",   label: "Movies",    icon: Film  },
  { href: "/series",   label: "Series",    icon: Tv    },
  { href: "/anime",    label: "Anime",     icon: Star  },
  { href: "/watchlist",label: "Watchlist", icon: Heart },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors duration-150 ${
              active ? "text-[var(--red)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-all duration-150 ${active ? "scale-110" : ""}`}
              strokeWidth={active ? 2.5 : 1.8}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
