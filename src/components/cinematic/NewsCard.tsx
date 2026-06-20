"use client";

import Image from "next/image";
import { ExternalLink, Calendar, Film, Tv, Sparkles, AlertCircle } from "lucide-react";
import { NormalizedArticle } from "@/lib/news/news.types";
import { motion } from "framer-motion";

interface NewsCardProps {
  article: NormalizedArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "movie":
        return <Film className="w-3.5 h-3.5 text-red-500" />;
      case "series":
        return <Tv className="w-3.5 h-3.5 text-red-500" />;
      case "anime":
        return <Sparkles className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 hover:bg-neutral-900/40 hover:border-neutral-800 transition-all duration-300 group select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
    >
      {/* Article Image backdrop */}
      <div className="relative w-full md:w-32 aspect-video md:aspect-square rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-neutral-900">
        <Image
          src={article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop"}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 150px"
        />
      </div>

      {/* Article Text Content */}
      <div className="flex flex-col justify-between flex-grow">
        <div>
          {/* Metadata Category and Date */}
          <div className="flex items-center gap-4 mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {getCategoryIcon(article.category)}
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-neutral-500">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-red-500 transition-colors duration-200 line-clamp-2">
            {article.title}
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
            {article.description || "Read full coverage of this entertainment industry report."}
          </p>
        </div>

        {/* Source link indicator */}
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-neutral-900/60">
          <span className="text-[10px] font-semibold text-neutral-500">
            Source: <span className="text-neutral-400">{article.source}</span>
          </span>
          <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 group-hover:underline">
            Read Article
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.a>
  );
}
