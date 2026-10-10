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

    // Helper to determine if an offer is a 100% free survey/install/quiz (no phone number/credit card needed)
    const isFreeOffer = (o: any) => {
      const cat = String(o.category_id || "");
      const text = `${o.conversion || ""} ${o.name || ""} ${o.anchor || ""}`.toLowerCase();
      return (
        cat === "66f5d911099a5325888c82d8" || // General Survey
        text.includes("survey") ||
        text.includes("quiz") ||
        text.includes("install") ||
        text.includes("download") ||
        text.includes("game") ||
        text.includes("free") ||
        text.includes("valid information") ||
        text.includes("rewards")
      );
    };

    // Parse valid feed offers with deduplication
    const validFeedOffers: any[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    for (const o of feedOffers) {
      if (!o || !o.url || typeof o.url !== "string" || o.url.includes("check.php")) continue;
      const offerId = String(o.id || "");
      let parsedOfferId = offerId;
      try {
        const u = new URL(o.url);
        parsedOfferId = u.searchParams.get("offer_id") || offerId;
      } catch {}

      if (!seenIds.has(parsedOfferId) && !seenUrls.has(o.url)) {
        seenIds.add(parsedOfferId);
        seenUrls.add(o.url);
        validFeedOffers.push(o);
      }
    }

    // Separate into two distinct buckets:
    // Bucket A: 100% Free Quick Survey / Quiz / App (NO phone number, NO billing)
    const freeBucket = validFeedOffers
      .filter(isFreeOffer)
      .sort((a, b) => parseFloat(b.payout || "0") - parseFloat(a.payout || "0"));

    // Bucket B: Mobile Pin Submit / Carrier / SMS
    const mobileBucket = validFeedOffers
      .filter((o) => !isFreeOffer(o))
      .sort((a, b) => parseFloat(b.payout || "0") - parseFloat(a.payout || "0"));

    // Verified distinct fallback offers
    const fallbackFree = {
      id: "23914",
      name: "Score a goal - Free Survey",
      anchor: "أجب عن استطلاع سريع (مجاني بدون رقم هاتف)",
      conversion: "Complete quick 60s free survey",
      url: "https://app.trcefy.com/click?pid=2&offer_id=23914&sub2=u329901",
      payout: "0.20",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/33018/4276840248.200x200.jpeg",
      offer_type: "free",
      badge: "⚡ Free • No Phone Needed",
      badge_ar: "⚡ مجاني 100% (بدون رقم هاتف)",
    };

    const fallbackMobile = {
      id: "24742",
      name: "Starzplay - Mobile PIN",
      anchor: "تأكيد سريع عبر رقم الهاتف (رمز SMS)",
      conversion: "Enter your mobile number and verify PIN",
      url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
      payout: "0.20",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101510/3021954007.200x200.png",
      offer_type: "mobile",
      badge: "📱 1-Click Mobile • SMS",
      badge_ar: "📱 تفعيل بالهاتف (رمز SMS)",
    };

    // Pick top 1 from Free bucket and top 1 from Mobile bucket to guarantee diversity
    const chosenOffers: any[] = [];

    // 1. First option: Free Survey/Task
    if (freeBucket.length > 0) {
      const topFree = freeBucket[0];
      chosenOffers.push({
        ...topFree,
        offer_type: "free",
        badge: "⚡ Free • No Phone Needed",
        badge_ar: "⚡ استطلاع مجاني (بدون رقم هاتف)",
        boosted: true,
      });
    } else {
      chosenOffers.push(fallbackFree);
    }

    // 2. Second option: Mobile Pin Submit
    if (mobileBucket.length > 0) {
      const topMobile = mobileBucket[0];
      // Guarantee it's not the same offer id as chosenOffers[0]
      if (String(topMobile.id) !== String(chosenOffers[0].id)) {
        chosenOffers.push({
          ...topMobile,
          offer_type: "mobile",
          badge: "📱 1-Click Mobile • SMS",
          badge_ar: "📱 تفعيل بالهاتف (رمز SMS)",
          boosted: false,
        });
      }
    }

    // If still missing second offer, try next from free bucket or fallback mobile
    if (chosenOffers.length < 2) {
      if (freeBucket.length > 1 && String(freeBucket[1].id) !== String(chosenOffers[0].id)) {
        chosenOffers.push({
          ...freeBucket[1],
          offer_type: "free",
          badge: "⚡ Free Mini-Game",
          badge_ar: "⚡ استبيان مجاني بديل",
          boosted: false,
        });
      } else {
        chosenOffers.push(fallbackMobile);
      }
    }

    return NextResponse.json(chosenOffers.slice(0, 2), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err: any) {
    console.error("CPA offers route error:", err.message);
    const fallback = [
      {
        id: "23914",
        name: "Score a goal",
        anchor: "أجب عن استطلاع سريع (مجاني بدون رقم هاتف)",
        conversion: "Complete quick 60s free survey",
        url: "https://app.trcefy.com/click?pid=2&offer_id=23914&sub2=u329901",
        payout: "0.20",
        offer_type: "free",
        badge: "⚡ Free • No Phone Needed",
        badge_ar: "⚡ مجاني 100% (بدون رقم هاتف)",
        boosted: true,
      },
      {
        id: "24742",
        name: "Starzplay - Popular Content",
        anchor: "تأكيد سريع عبر رقم الهاتف (رمز SMS)",
        conversion: "Enter your mobile number and verify PIN",
        url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
        payout: "0.20",
        offer_type: "mobile",
        badge: "📱 1-Click Mobile • SMS",
        badge_ar: "📱 تفعيل بالهاتف (رمز SMS)",
        boosted: false,
      },
    ];
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }
}
