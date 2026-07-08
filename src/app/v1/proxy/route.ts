import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    const res = await fetch(targetUrl, { headers });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
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
