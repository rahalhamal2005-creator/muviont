import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Missing GOOGLE_CLIENT_ID environment variable");
      return NextResponse.redirect(new URL("/login?error=missing_client_id", req.url));
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

    let redirectUri = "";
    if (isLocalhost) {
      redirectUri = `http://${host}/api/auth/callback/google`;
    } else {
      redirectUri = "https://muviont.com/api/auth/callback/google";
    }

    const scope = "openid email profile";
    const state = Math.random().toString(36).substring(2, 15);

    const cookieStore = await cookies();
    cookieStore.set("oauth_state", state, {
      httpOnly: true,
      secure: !isLocalhost,
      path: "/",
      maxAge: 3600,
      sameSite: "lax",
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&prompt=consent&access_type=online`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (err: any) {
    console.error("Google Auth Init Error:", err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message || "auth_init_failed")}`, req.url));
  }
}
