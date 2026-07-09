import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";

    // Clean IP in case of proxy chains (take first IP)
    const clientIp = ip.split(",")[0].trim();

    const feedUrl = new URL("https://d1cdbd1x576ga0.cloudfront.net/public/offers/feed.php");
    feedUrl.searchParams.set("user_id", "329901");
    feedUrl.searchParams.set("api_key", "31e09587b496895f363a6b0cab347859");
    if (clientIp) {
      feedUrl.searchParams.set("ip", clientIp);
    }
    if (userAgent) {
      feedUrl.searchParams.set("user_agent", userAgent);
    }

    console.log(`Fetching CPA offers for IP: ${clientIp}`);
    const res = await fetch(feedUrl.toString(), { cache: "no-store" });
    if (!res.ok) {
      return new Response(`Failed to fetch offers feed: ${res.statusText}`, { status: res.status });
    }

    const offers = await res.json();
    if (!Array.isArray(offers)) {
      return NextResponse.json([]);
    }

    // Sort by payout (descending) to get the highest earning/converting offers
    const sortedOffers = [...offers].sort((a, b) => {
      const payoutA = parseFloat(a.payout || "0");
      const payoutB = parseFloat(b.payout || "0");
      return payoutB - payoutA;
    });

    // Mark the top 2 offers as "boosted"
    const finalOffers = sortedOffers.map((offer, index) => ({
      ...offer,
      boosted: index < 2,
    }));

    return NextResponse.json(finalOffers);
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
