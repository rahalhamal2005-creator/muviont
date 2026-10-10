import { NextResponse } from "next/server";

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
    const res = await fetch(feedUrl.toString(), { next: { revalidate: 180 } });
    
    let rawOffers: any[] = [];
    if (res.ok) {
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        rawOffers = data;
      }
    }

    // High-converting AdBlueMedia fallback offers if IP feed is empty or fails
    const defaultOffers = [
      {
        id: "24742",
        name: "Starzplay - Popular Content",
        anchor: "أدخل رقم هاتفك وشاهد العروض الشعبية!",
        conversion: "Enter your mobile number and verify the pin",
        url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
        payout: "0.50",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101510/3021954007.200x200.png",
        boosted: true,
      },
      {
        id: "24743",
        name: "HD Stream Player Access",
        anchor: "Complete 1 Free Step to Unlock HD Stream",
        conversion: "Free 60-second verification • Mobile & Desktop",
        url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
        payout: "0.40",
        boosted: false,
      },
    ];

    const sourceOffers = rawOffers.length > 0 ? rawOffers : defaultOffers;

    // Filter to ensure all offers have a valid redirect url
    const validOffers = sourceOffers.filter(o => o.url && typeof o.url === "string" && !o.url.includes("check.php"));

    const toUse = validOffers.length > 0 ? validOffers : defaultOffers;

    // Sort by payout (descending) to get the highest earning/converting offers
    const sortedOffers = [...toUse].sort((a, b) => {
      const payoutA = parseFloat(a.payout || "0");
      const payoutB = parseFloat(b.payout || "0");
      return payoutB - payoutA;
    });

    // Mark the top 2 offers as "boosted"
    const finalOffers = sortedOffers.slice(0, 2).map((offer, index) => ({
      ...offer,
      boosted: index === 0,
    }));

    return NextResponse.json(finalOffers, {
      headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=300" }
    });
  } catch (err: any) {
    console.error("CPA offers route error:", err.message);
    const fallback = [
      {
        id: "24742",
        name: "Starzplay - Popular Content",
        anchor: "أدخل رقم هاتفك وشاهد العروض الشعبية!",
        conversion: "Enter your mobile number and verify the pin",
        url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
        payout: "0.50",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101510/3021954007.200x200.png",
        boosted: true,
      }
    ];
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "public, s-maxage=60" }
    });
  }
}
