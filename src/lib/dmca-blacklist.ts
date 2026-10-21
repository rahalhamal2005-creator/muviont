/**
 * DMCA Takedown Compliance Blacklist
 * IDs or slugs listed here are automatically disabled from playback
 * to comply with Digital Millennium Copyright Act (DMCA) 512(c) notices.
 */

export interface BlacklistEntry {
  id: string;
  title: string;
  claimant: string;
  removedAt: string;
}

export const DMCA_BLACKLIST: BlacklistEntry[] = [
  {
    id: "m-823482",
    title: "Dream Scenario (2023)",
    claimant: "OSN GULF DTH FZ LLC / A24",
    removedAt: "2026-10-17",
  },
  {
    id: "s-194583",
    title: "The Walking Dead: Dead City",
    claimant: "Playco Entertainment FZ LLC / Piracymeter UAB",
    removedAt: "2026-10-20",
  },
];

export function isBlacklisted(id: string): BlacklistEntry | null {
  if (!id) return null;
  const normalizedId = id.trim().toLowerCase();
  const rawId = normalizedId.replace(/^(m-|s-|a-)/, "");

  const found = DMCA_BLACKLIST.find((entry) => {
    const entryNorm = entry.id.toLowerCase();
    const entryRaw = entryNorm.replace(/^(m-|s-|a-)/, "");
    return (
      entryNorm === normalizedId ||
      entryRaw === rawId ||
      entryNorm === `m-${rawId}` ||
      entryNorm === `s-${rawId}`
    );
  });

  return found || null;
}
