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

    const country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
    const ua = userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIOS || isAndroid || /mobile|tablet/.test(ua);
    const isDesktop = !isMobile;

    // Filter out exhausting high-friction CPE offers (games requiring levels, hours of play, or deposits)
    // Streaming visitors will abandon these; they only convert on quick 30-60s tasks.
    const isHighFrictionCPE = (o: any) => {
      const text = `${o.name || ""} ${o.conversion || ""} ${o.anchor || ""}`.toLowerCase();
      if (text.includes(" cpe") || text.includes("(cpe)")) return true;
      if (
        text.includes("reach level") ||
        text.includes("level ") ||
        text.includes("play 3") ||
        text.includes("play games") ||
        text.includes("deposit") ||
        text.includes("milestone") ||
        text.includes("points") ||
        text.includes("cash back")
      ) {
        return true;
      }
      return false;
    };

    // Filter by visitor's actual device so desktop users don't see mobile APKs, and iOS users don't see Android APKs
    const matchesDevice = (o: any) => {
      const text = `${o.name || ""} ${o.device || ""} ${o.devices || ""}`.toLowerCase();
      if (isIOS && text.includes("android") && !text.includes("ios") && !text.includes("iphone")) return false;
      if (isAndroid && (text.includes("ios") || text.includes("iphone") || text.includes("ipad")) && !text.includes("android")) return false;
      if (isDesktop && (text.includes("android") || text.includes("ios") || text.includes("iphone") || text.includes("ipad") || text.includes("install and open"))) {
        return false;
      }
      return true;
    };

    // Helper to determine if an offer is a 100% free survey/install/quiz/email submit (no phone billing)
    const isFreeOrEmailOffer = (o: any) => {
      const cat = String(o.category_id || "");
      const text = `${o.conversion || ""} ${o.name || ""} ${o.anchor || ""}`.toLowerCase();
      return (
        cat === "66f5d911099a5325888c82d8" || // General Survey
        text.includes("email") ||
        text.includes("zip") ||
        text.includes("giftcard") ||
        text.includes("survey") ||
        text.includes("quiz") ||
        text.includes("install") ||
        text.includes("open") ||
        text.includes("download") ||
        text.includes("game") ||
        text.includes("free") ||
        text.includes("valid information") ||
        text.includes("rewards")
      );
    };

    // Parse valid feed offers with deduplication, CPE filter, and device matching
    const validFeedOffers: any[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    for (const o of feedOffers) {
      if (!o || !o.url || typeof o.url !== "string" || o.url.includes("check.php")) continue;
      if (isHighFrictionCPE(o)) continue; // Block exhausting CPE offers
      if (!matchesDevice(o)) continue;    // Block wrong-device offers

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

    // Curated high-converting US / Tier 1 offers (Email Submits $2.50-$3.12 & Instant CPI $2.40)
    const usCuratedOffers = [
      {
        id: "576",
        name: "CTConnect - Paypal $100",
        anchor: "Enter for a chance to win $100 PayPal Balance",
        conversion: "Enter your email & zip code to qualify",
        url: "https://app.trcefy.com/click?pid=2&offer_id=576&sub2=u329901",
        payout: "3.12",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/31462/1353090480.200x200.jpeg",
        offer_type: "free",
        badge: "⚡ Fast 30s Entry • $3.12",
        badge_ar: "⚡ إدخال الإيميل (سريع ومجاني)",
        device_match: "all",
      },
      {
        id: "14565",
        name: "CTConnect - Nike GiftCard",
        anchor: "Enter for a chance to win a $100 Nike Gift Card",
        conversion: "Enter your email & zip to qualify",
        url: "https://app.trcefy.com/click?pid=2&offer_id=14565&sub2=u329901",
        payout: "3.04",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/31462/1353090480.200x200.jpeg",
        offer_type: "free",
        badge: "🎁 Free Gift Card Entry",
        badge_ar: "🎁 استبيان هدية مجانية",
        device_match: "all",
      },
      {
        id: "24647",
        name: "Prizezappy - Win $50K",
        anchor: "Enter your email for instant unlock",
        conversion: "Enter your info to get started",
        url: "https://app.trcefy.com/click?pid=2&offer_id=24647&sub2=u329901",
        payout: "2.56",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/33018/4276840248.200x200.jpeg",
        offer_type: "free",
        badge: "⚡ Quick 30s Entry",
        badge_ar: "⚡ إدخال سريع 30 ثانية",
        device_match: "all",
      },
      {
        id: "21801",
        name: "Top Tycoon iOS CPI",
        anchor: "Install and Open Top Tycoon App",
        conversion: "Install and Open the app to verify",
        url: "https://app.trcefy.com/click?pid=2&offer_id=21801&sub2=u329901",
        payout: "2.40",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101510/3021954007.200x200.png",
        offer_type: "free",
        badge: "📲 Free Install & Open",
        badge_ar: "📲 تثبيت وفتح التطبيق مجاناً",
        device_match: "ios",
      },
      {
        id: "6385",
        name: "Cleanfox Android CPR",
        anchor: "Install and register free Cleanfox app",
        conversion: "Install and create a free account",
        url: "https://app.trcefy.com/click?pid=2&offer_id=6385&sub2=u329901",
        payout: "2.36",
        network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101511/3636068551.200x200.png",
        offer_type: "free",
        badge: "📲 Free Android App",
        badge_ar: "📲 تطبيق أندرويد مجاني",
        device_match: "android",
      },
    ];

    // Pick offers based on visitor's geo location:
    const chosenOffers: any[] = [];

    // If US / CA / UK / AU visitor:
    const isTier1 = ["US", "CA", "GB", "AU", "NZ"].includes(country);

    if (isTier1 && validFeedOffers.length < 2) {
      // Prioritize high-payout US email submit and CPI
      const matchingCurated = usCuratedOffers.filter((o) => {
        if (o.device_match === "ios" && !isIOS) return false;
        if (o.device_match === "android" && !isAndroid) return false;
        if (isDesktop && (o.device_match === "ios" || o.device_match === "android")) return false;
        return true;
      });

      for (const cur of matchingCurated) {
        if (chosenOffers.length >= 2) break;
        chosenOffers.push(cur);
      }
    }

    // Separate feed offers into free/survey/email vs mobile pin
    const freeBucket = validFeedOffers
      .filter(isFreeOrEmailOffer)
      .sort((a, b) => parseFloat(b.payout || "0") - parseFloat(a.payout || "0"));

    const mobileBucket = validFeedOffers
      .filter((o) => !isFreeOrEmailOffer(o))
      .sort((a, b) => parseFloat(b.payout || "0") - parseFloat(a.payout || "0"));

    // If we need more offers, populate from the feed
    if (chosenOffers.length < 2 && freeBucket.length > 0) {
      const topFree = freeBucket[0];
      if (!chosenOffers.some((o) => String(o.id) === String(topFree.id))) {
        chosenOffers.push({
          ...topFree,
          offer_type: "free",
          badge: topFree.badge || "⚡ Free • No Phone Needed",
          badge_ar: topFree.badge_ar || "⚡ استطلاع مجاني (بدون رقم هاتف)",
          boosted: true,
        });
      }
    }

    if (chosenOffers.length < 2 && mobileBucket.length > 0) {
      const topMobile = mobileBucket[0];
      if (!chosenOffers.some((o) => String(o.id) === String(topMobile.id))) {
        chosenOffers.push({
          ...topMobile,
          offer_type: "mobile",
          badge: topMobile.badge || "📱 1-Click Mobile • SMS",
          badge_ar: topMobile.badge_ar || "📱 تفعيل بالهاتف (رمز SMS)",
          boosted: false,
        });
      }
    }

    // Fallback defaults for MENA / Global if still under 2
    const fallbackFree = {
      id: "19035",
      name: "Tap Rewards - Coin Rewards",
      anchor: "انقر للحصول على مكافأتك ومتابعة المشاهدة!",
      conversion: "Complete the survey",
      url: "https://app.trcefy.com/click?pid=2&offer_id=19035&sub2=u329901",
      payout: "0.20",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/959/31462/1353090480.200x200.jpeg",
      offer_type: "free",
      badge: "⚡ Free Survey • No Phone",
      badge_ar: "⚡ استطلاع مجاني (بدون رقم هاتف)",
    };

    const fallbackMobile = {
      id: "24742",
      name: "Starzplay - Popular Content",
      anchor: "أدخل رقم هاتفك وشاهد العروض الشعبية!",
      conversion: "Enter your mobile number and verify the pin",
      url: "https://app.trcefy.com/click?pid=2&offer_id=24742&sub2=u329901",
      payout: "0.20",
      network_icon: "https://cdn.affise.com/affise-media-service-prod/offers/962/101510/3021954007.200x200.png",
      offer_type: "mobile",
      badge: "📱 1-Click Mobile • SMS",
      badge_ar: "📱 تفعيل بالهاتف (رمز SMS)",
    };

    while (chosenOffers.length < 2) {
      if (chosenOffers.length === 0) {
        chosenOffers.push(fallbackFree);
      } else if (String(chosenOffers[0].id) !== String(fallbackMobile.id)) {
        chosenOffers.push(fallbackMobile);
      } else {
        chosenOffers.push(fallbackFree);
      }
    }

    return NextResponse.json(chosenOffers.slice(0, 2), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err: any) {
    console.error("CPA offers route error:", err.message);
    const fallback = [
      {
        id: "19035",
        name: "Tap Rewards - Coin Rewards",
        anchor: "انقر للحصول على مكافأتك ومتابعة المشاهدة!",
        conversion: "Complete the survey",
        url: "https://app.trcefy.com/click?pid=2&offer_id=19035&sub2=u329901",
        payout: "0.20",
        offer_type: "free",
        badge: "⚡ Free Survey • No Phone",
        badge_ar: "⚡ استطلاع مجاني (بدون رقم هاتف)",
        boosted: true,
      },
      {
        id: "24742",
        name: "Starzplay - Popular Content",
        anchor: "أدخل رقم هاتفك وشاهد العروض الشعبية!",
        conversion: "Enter your mobile number and verify the pin",
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
