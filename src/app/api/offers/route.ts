import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cfIp = req.headers.get("cf-connecting-ip");
    const realIp = req.headers.get("x-real-ip");
    const forwardedFor = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const clientIp = cfIp || realIp || forwardedFor || "";
    const userAgent = req.headers.get("user-agent") || "";

    const feedUrl = new URL("https://d1cdbd1x576ga0.cloudfront.net/public/offers/feed.php");
    feedUrl.searchParams.set("user_id", "329901");
    feedUrl.searchParams.set("api_key", "31e09587b496895f363a6b0cab347859");
    if (clientIp) {
      feedUrl.searchParams.set("ip", clientIp);
    }
    if (userAgent) {
      feedUrl.searchParams.set("user_agent", userAgent);
    }

    let feedOffers: any[] = [];
    try {
      const res = await fetch(feedUrl.toString(), {
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          feedOffers = data;
        }
      }
    } catch (e: any) {
      console.warn("AdBlueMedia feed fetch error:", e.message);
    }

    // Different distinct AdBlueMedia offers (each has unique offer_id and unique campaign)
    const distinctOffers = [
      {
        id: "24742",
        name: "Starzplay - Popular Content",
        anchor: "أدخل رقم هاتفك وشاهد العروض الشعبية!",
        conversion: "Enter your mobile number and verify the pin",
        url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
        payout: "0.50",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101510/3021954007.200x200.png",
      },
      {
        id: "23914",
        name: "Score a goal",
        anchor: "التقط كرات القدم لتحصل على عروض خاصة!",
        conversion: "Complete interactive mini-game verification",
        url: "https://app.trcefy.com/click?pid=2&offer_id=23914&sub2=u329901",
        payout: "0.45",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/100650/4211833007.200x200.png",
      },
      {
        id: "19603",
        name: "GemezZ - Kids & Family",
        anchor: "أدخل التفاصيل لتنزيل محتوى جديد!",
        conversion: "Enter details and confirm verification",
        url: "https://app.trcefy.com/click?pid=2&offer_id=19603&sub2=u329901",
        payout: "0.40",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/96320/2153833007.200x200.png",
      },
      {
        id: "19035",
        name: "Tap Rewards - Coin Bonus",
        anchor: "انقر للحصول على مكافأتك ومتابعة المشاهدة!",
        conversion: "Tap to claim your free reward bonus",
        url: "https://app.trcefy.com/click?pid=2&offer_id=19035&sub2=u329901",
        payout: "0.35",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/95740/1234567890.200x200.png",
      },
    ];

    // Combine feed offers and distinct backup offers while guaranteeing 100% uniqueness
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueList: any[] = [];

    // First, add valid offers from the real live feed
    for (const o of feedOffers) {
      if (!o || !o.url || typeof o.url !== "string" || o.url.includes("check.php")) continue;
      const offerId = String(o.id || "");
      // Extract offer_id param from url if available to detect duplicate campaigns
      let parsedOfferId = offerId;
      try {
        const u = new URL(o.url);
        parsedOfferId = u.searchParams.get("offer_id") || offerId;
      } catch {}

      if (!seenIds.has(parsedOfferId) && !seenUrls.has(o.url)) {
        seenIds.add(parsedOfferId);
        seenUrls.add(o.url);
        uniqueList.push(o);
      }
    }

    // If we have fewer than 2 distinct offers, add distinct offers from our library
    for (const d of distinctOffers) {
      if (uniqueList.length >= 2) break;
      if (!seenIds.has(d.id) && !seenUrls.has(d.url)) {
        seenIds.add(d.id);
        seenUrls.add(d.url);
        uniqueList.push(d);
      }
    }

    // Sort by payout and return exactly 2 distinct offers
    const finalOffers = uniqueList.slice(0, 2).map((offer, index) => ({
      ...offer,
      boosted: index === 0,
    }));

    return NextResponse.json(finalOffers, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
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
        boosted: true,
      },
      {
        id: "23914",
        name: "Score a goal",
        anchor: "التقط كرات القدم لتحصل على عروض خاصة!",
        conversion: "Complete interactive mini-game verification",
        url: "https://app.trcefy.com/click?pid=2&offer_id=23914&sub2=u329901",
        payout: "0.45",
        boosted: false,
      },
    ];
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }
}
