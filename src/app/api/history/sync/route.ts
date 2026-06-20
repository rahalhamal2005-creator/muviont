import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, history, watchlist } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Upsert user to ensure they exist
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@muviont.com`,
        name: "Muviont Guest",
        role: "USER"
      }
    });

    // Sync History
    if (Array.isArray(history)) {
      for (const item of history) {
        const mediaId = String(item.id || item.mediaId);
        const mediaType = item.type || item.mediaType || "movie";
        const progress = Number(item.progress ?? 0);
        const duration = Number(item.duration ?? 0);

        await db.history.upsert({
          where: {
            userId_mediaId_mediaType: {
              userId,
              mediaId,
              mediaType
            }
          },
          update: {
            progress,
            duration,
            updatedAt: new Date()
          },
          create: {
            userId,
            mediaId,
            mediaType,
            progress,
            duration
          }
        });
      }
    }

    // Sync Watchlist
    if (Array.isArray(watchlist)) {
      for (const item of watchlist) {
        const mediaId = String(item.id || item.mediaId);
        const mediaType = item.type || item.mediaType || "movie";
        const title = item.title || "Unknown Title";
        const posterPath = item.posterPath || null;

        await db.watchlist.upsert({
          where: {
            userId_mediaId_mediaType: {
              userId,
              mediaId,
              mediaType
            }
          },
          update: {
            title,
            posterPath
          },
          create: {
            userId,
            mediaId,
            mediaType,
            title,
            posterPath
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Sync Error:", err.message);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
