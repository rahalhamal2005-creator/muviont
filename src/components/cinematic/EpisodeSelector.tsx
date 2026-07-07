"use client";

import { useState, useEffect } from "react";
import { Tv } from "lucide-react";

interface Episode {
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string;
  airDate: string;
  runtime: number;
}

interface Season {
  seasonNumber: number;
  episodeCount: number;
  name: string;
}

interface EpisodeSelectorProps {
  seriesId: string;
  totalSeasons: number;
  seasons?: Season[];
  currentSeason?: number;
  currentEpisode?: number;
  onEpisodeSelect: (season: number, episode: number) => void;
}

export default function EpisodeSelector({
  seriesId,
  totalSeasons,
  seasons = [],
  currentSeason: initialSeason = 1,
  currentEpisode: initialEpisode = 1,
  onEpisodeSelect,
}: EpisodeSelectorProps) {
  const [selectedSeason,  setSelectedSeason]  = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [episodes,        setEpisodes]        = useState<Episode[]>([]);
  const [loading,         setLoading]         = useState(false);

  // Load episodes when season changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/episodes?id=${seriesId}&season=${selectedSeason}`);
        if (res.ok) {
          const data = await res.json();
          setEpisodes(data.episodes || []);
        } else {
          // Fallback: generate generic episodes
          const count = seasons.find(s => s.seasonNumber === selectedSeason)?.episodeCount || 12;
          setEpisodes(
            Array.from({ length: count }, (_, i) => ({
              episodeNumber: i + 1,
              name: `Episode ${i + 1}`,
              overview: "",
              stillPath: "",
              airDate: "",
              runtime: 45,
            }))
          );
        }
      } catch {
        const count = 12;
        setEpisodes(
          Array.from({ length: count }, (_, i) => ({
            episodeNumber: i + 1,
            name: `Episode ${i + 1}`,
            overview: "",
            stillPath: "",
            airDate: "",
            runtime: 45,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [seriesId, selectedSeason, seasons]);

  const selectSeason = (n: number) => {
    setSelectedSeason(n);
    setSelectedEpisode(1);
  };

  const selectEpisode = (ep: number) => {
    setSelectedEpisode(ep);
    onEpisodeSelect(selectedSeason, ep);
  };

  const seasonCount = Math.max(totalSeasons, seasons.length, 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
        <Tv className="w-3.5 h-3.5 text-[var(--red)]" />
        Episodes
      </div>

      {/* Season Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {Array.from({ length: seasonCount }, (_, i) => i + 1).map(s => (
          <button
            key={s}
            onClick={() => selectSeason(s)}
            className={`season-tab flex-shrink-0 ${selectedSeason === s ? "active" : ""}`}
          >
            {seasons.find(se => se.seasonNumber === s)?.name || `Season ${s}`}
          </button>
        ))}
      </div>

      {/* Episode Grid */}
      {loading ? (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-12 h-9 rounded-lg skeleton-base" />
          ))}
        </div>
      ) : (
        <div className="flex gap-1.5 flex-wrap">
          {episodes.map(ep => (
            <button
              key={ep.episodeNumber}
              onClick={() => selectEpisode(ep.episodeNumber)}
              title={ep.name}
              className={`ep-btn ${selectedEpisode === ep.episodeNumber && selectedSeason === initialSeason ? "active" : ""}`}
            >
              E{ep.episodeNumber}
            </button>
          ))}
        </div>
      )}

      {/* Current selection info */}
      {!loading && episodes.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
          {(() => {
            const ep = episodes.find(e => e.episodeNumber === selectedEpisode);
            if (!ep) return null;
            return (
              <div>
                <p className="text-xs font-bold text-white">
                  S{selectedSeason}E{selectedEpisode} — {ep.name}
                </p>
                {ep.overview && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                    {ep.overview}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {ep.airDate && (
                    <span className="text-[10px] text-[var(--text-dim)]">{ep.airDate.substring(0, 7)}</span>
                  )}
                  {ep.runtime > 0 && (
                    <span className="text-[10px] text-[var(--text-dim)]">{ep.runtime}m</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
