import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
  let redirectUri = "";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("3000")) {
    redirectUri = `http://${host}/api/auth/callback/google`;
  } else if (appUrl) {
    const cleanAppUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
    redirectUri = `${cleanAppUrl}/api/auth/callback/google`;
  } else {
    redirectUri = `https://muviont.com/api/auth/callback/google`;
  }

  try {
    // Exchange Code for Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Token Exchange Error Status:", tokenRes.status, errBody);
      throw new Error(`Token exchange failed with status ${tokenRes.status}`);
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    // Fetch User Profile using Access Token
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch user profile: ${userRes.status}`);
    }

    const profile = await userRes.json();
    const email = profile.email;
    const name = profile.name || "";
    const image = profile.picture || null;

    if (!email) {
      throw new Error("No email returned from Google OAuth");
    }

    // Determine user role
    const isEmailSuperAdmin = isSuperAdmin(email);
    
    const updateData: any = {
      name,
      image,
      emailVerified: new Date()
    };
    if (isEmailSuperAdmin) {
      updateData.role = "SUPER_ADMIN";
    }

    const createData: any = {
      email,
      name,
      image,
      role: isEmailSuperAdmin ? "SUPER_ADMIN" : "USER",
      emailVerified: new Date()
    };

    // Upsert User
    const user = await db.user.upsert({
      where: { email },
      update: updateData,
      create: createData
    });

    // Create session in database
    const token = `session-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // Set HTTP-only Cookie
    cookieStore.set("muviont_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt
    });

    // Log successful OAuth operation
    await db.providerMetric.create({
      data: {
        provider: "GoogleOAuth",
        endpoint: "/api/auth/callback/google",
        latency: 0,
        success: true
      }
    }).catch(() => {});

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err: any) {
    console.error("OAuth Callback Error:", err.message);
    
    // Log failed OAuth operation
    await db.providerMetric.create({
      data: {
        provider: "GoogleOAuth",
        endpoint: "/api/auth/callback/google",
        latency: 0,
        success: false,
        errorMsg: err.message || "OAuth Callback Error"
      }
    }).catch(() => {});

    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
