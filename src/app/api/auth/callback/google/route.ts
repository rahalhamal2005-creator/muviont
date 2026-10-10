import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { isSuperAdmin, createSignedSessionToken } from "@/lib/auth";


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
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  let redirectUri = "";
  
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    redirectUri = `http://${host}/api/auth/callback/google`;
  } else {
    redirectUri = "https://muviont.com/api/auth/callback/google";
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
    const role: "SUPER_ADMIN" | "USER" = isEmailSuperAdmin ? "SUPER_ADMIN" : "USER";
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

    let userId = `usr_${Buffer.from(email).toString("hex").slice(0, 16)}`;

    // Optional database synchronization (safe, non-blocking on edge)
    try {
      if (db?.user && typeof db.user.upsert === "function") {
        const dbUser = await db.user.upsert({
          where: { email },
          update: { name, image, role, emailVerified: new Date() },
          create: { email, name, image, role, emailVerified: new Date() }
        });
        if (dbUser?.id) userId = dbUser.id;
      }
    } catch (dbErr) {
      console.warn("DB user sync skipped:", dbErr);
    }

    // Create cryptographically signed edge session token
    const token = await createSignedSessionToken({
      id: userId,
      email,
      name,
      image,
      role,
      expiresAt: expiresAt.getTime(),
    });

    // Optional DB session record
    try {
      if (db?.session && typeof db.session.create === "function") {
        await db.session.create({
          data: {
            userId,
            token,
            expiresAt
          }
        });
      }
    } catch {
      // Non-blocking
    }

    // Set HTTP-only Cookie
    cookieStore.set("muviont_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err: any) {
    console.error("OAuth Callback Error:", err.message);

    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
