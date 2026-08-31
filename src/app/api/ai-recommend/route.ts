import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/security/limiter";
import { db } from "@/lib/db";
import { getPersonalizedRecommendations } from "@/lib/recommendations";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate Limit
  const limitRes = await rateLimit(ip, 30, 60);
  if (!limitRes.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "anonymous-default-user";

  try {
    // If user is new, verify or create default profile in db to allow testing
    if (userId !== "anonymous-default-user") {
      const userExists = await db.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        await db.user.create({
          data: {
            id: userId,
            email: `${userId}@muviont.com`,
            name: "Muviont Guest",
            role: "USER"
          }
        });
      }
    }

    const { recommendations, lastWatchedTitle } = await getPersonalizedRecommendations(userId);

    return NextResponse.json({
      recommendations,
      lastWatchedTitle
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" }
    });
  } catch (err: any) {
    console.error("AI Recommendations Error:", err.message);
    return NextResponse.json(
      { error: "Failed to generate AI recommendations" },
      { status: 500 }
    );
  }
}

