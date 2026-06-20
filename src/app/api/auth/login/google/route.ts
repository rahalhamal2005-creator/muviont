import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/callback/google`;
  const scope = "openid email profile";
  
  // Generate secure random state
  const state = Math.random().toString(36).substring(2, 15);
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 3600
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=consent&access_type=online`;

  return NextResponse.redirect(googleAuthUrl);
}
