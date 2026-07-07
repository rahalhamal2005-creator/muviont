import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TMDBProvider } from "@/lib/providers/tmdb.provider";
import { AniListProvider } from "@/lib/providers/anilist.provider";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, guest: true });
    }

    const body = await req.json();
    const { mediaId, mediaType, season, episode, progress, duration } = body;

    if (!mediaId || !mediaType) {
      return NextResponse.json({ error: "Missing mediaId or mediaType" }, { status: 400 });
    }

    const history = await db.history.upsert({
      where: {
        userId_mediaId_mediaType: {
          userId: user.id,
          mediaId,
          mediaType
        }
      },
      update: {
        progress: Number(progress || 0),
        duration: Number(duration || 0),
        season: season ? Number(season) : null,
        episode: episode ? Number(episode) : null,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        mediaId,
        mediaType,
        progress: Number(progress || 0),
        duration: Number(duration || 0),
        season: season ? Number(season) : null,
        episode: episode ? Number(episode) : null
      }
    });

    return NextResponse.json({ success: true, history });
  } catch (err: any) {
    console.error("Watch progress save error:", err.message);
    return NextResponse.json({ error: "Failed to save watch progress" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ history: [] });
    }

    const dbHistory = await db.history.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 12
    });

    const tmdb = new TMDBProvider();
    const anilist = new AniListProvider();

    const enrichedHistory = await Promise.all(
      dbHistory.map(async (h) => {
        try {
          if (h.mediaType === "anime") {
            const details = await anilist.getDetails(h.mediaId).catch(() => null);
            if (details) {
              return {
                id: details.id,
                title: details.title,
                posterPath: details.posterPath,
                rating: details.rating,
                type: "anime",
                releaseDate: details.releaseDate,
                season: h.season || 1,
                episode: h.episode || 1,
                progress: h.progress,
                duration: h.duration
              };
            }
          } else {
            const details = await tmdb.getDetails(h.mediaId).catch(() => null);
            if (details) {
              return {
                id: details.id,
                title: details.title,
                posterPath: details.posterPath,
                rating: details.rating,
                type: details.type,
                releaseDate: details.releaseDate,
                season: h.season || 1,
                episode: h.episode || 1,
                progress: h.progress,
                duration: h.duration
              };
            }
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    return NextResponse.json({
      history: enrichedHistory.filter(Boolean)
    });
  } catch (err: any) {
    console.error("Watch progress fetch error:", err.message);
    return NextResponse.json({ error: "Failed to fetch watch progress" }, { status: 500 });
  }
}
