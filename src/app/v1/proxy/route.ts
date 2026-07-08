import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rewritePlaylist(text: string): string {
  const regex = /\/v1\/proxy\?data=([^\s"'\`<>]+)/g;
  return text.replace(regex, (match, encodedData) => {
    try {
      const decodedData = decodeURIComponent(encodedData);
      const parsed = JSON.parse(decodedData);
      if (parsed.url) {
        const isSubPlaylist = parsed.url.includes(".m3u8") || parsed.url.includes("playlist");
        if (isSubPlaylist) {
          return match; // Keep sub-playlists proxied
        }
        return parsed.url; // Return original direct URL for segments to bypass datacenter IP blocks!
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return match;
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");

    if (!data) {
      return new Response("Missing data parameter", { status: 400 });
    }

    const cineproUrl = process.env.CINEPRO_API_URL;
    if (!cineproUrl) {
      return new Response("CinePro not configured", { status: 503 });
    }

    const baseUrl = cineproUrl.endsWith("/") ? cineproUrl.slice(0, -1) : cineproUrl;
    const targetUrl = `${baseUrl}/v1/proxy?data=${encodeURIComponent(data)}`;

    const rangeHeader = req.headers.get("Range") || req.headers.get("range");
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const res = await fetch(targetUrl, { 
      headers,
      cache: "no-store"
    });

    const responseHeaders = new Headers();
    const contentType = res.headers.get("content-type") || "";
    const isPlaylist = contentType.includes("mpegurl") || contentType.includes("mpegURL") || contentType.includes("text");

    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === "content-length" && isPlaylist) {
        return; // Prevent length mismatch on gzipped playlists
      }
      if ([
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
        "content-disposition"
      ].includes(lowerKey)) {
        responseHeaders.set(key, value);
      }
    });

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type");

    if (isPlaylist) {
      const text = await res.text();
      const rewrittenText = rewritePlaylist(text);
      return new Response(rewrittenText, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders
      });
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type");
  return new Response(null, { status: 204, headers });
}
