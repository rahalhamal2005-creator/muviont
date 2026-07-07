import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
  let redirectUri = "";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("3000")) {
    redirectUri = `http://${host}/api/auth/callback/google`;
  } else if (appUrl) {
    const cleanAppUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
    redirectUri = `${cleanAppUrl}/api/auth/callback/google`;
  } else {
    redirectUri = `https://muviont.com/api/auth/callback/google`;
  }
  const scope = "openid email profile";
  
  // Generate secure random state
  const state = Math.random().toString(36).substring(2, 15);
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: proto === "https",
    path: "/",
    maxAge: 3600
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=consent&access_type=online`;

  return NextResponse.redirect(googleAuthUrl);
}
