import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("Missing url parameter", { status: 400 });
    }

    console.log(`Fetching SRT subtitle from: ${url}`);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return new Response(`Failed to fetch subtitle: ${res.statusText}`, { status: res.status });
    }

    const srtText = await res.text();

    // Convert SRT to WebVTT
    let vttText = "WEBVTT\n\n" + srtText;

    // Replace timing commas with periods: e.g. 00:00:01,000 -> 00:00:01.000
    const timecodeRegex = /(\d{2}:\d{2}:\d{2}),(\d{3})/g;
    vttText = vttText.replace(timecodeRegex, "$1.$2");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/vtt; charset=utf-8");
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(vttText, {
      status: 200,
      headers: responseHeaders
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
