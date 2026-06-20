"use client";

import { ReactNode, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ContentRailProps {
  title: string;
  icon?: ReactNode;
  seeAllHref?: string;
  children: ReactNode;
  className?: string;
}

export default function ContentRail({
  title, icon, seeAllHref, children, className = "",
}: ContentRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  return (
    <section className={`max-w-[1400px] mx-auto px-4 sm:px-6 ${className}`}>
      {/* Section header */}
      <div className="section-header">
        <h2 className="section-title">
          {icon}
          {title}
        </h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="section-see-all flex items-center gap-0.5">
            See All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Scroll rail */}
      <div ref={railRef} className="content-rail">
        {children}
      </div>
    </section>
  );
}
