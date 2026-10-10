import { db } from "./db";
import { cookies } from "next/headers";

export function isSuperAdmin(email: string): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "rahalhamal2005@gmail.com";
  return email.toLowerCase() === superAdminEmail.toLowerCase() || email.toLowerCase() === "rahalhamal2005@gmail.com";
}

const SECRET_KEY = process.env.BETTER_AUTH_SECRET || "muviont_super_secret_signing_key_1234567890";

async function getCryptoKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSignedSessionToken(user: any): Promise<string> {
  const payloadStr = JSON.stringify(user);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  const sigB64 = Buffer.from(signatureBuffer).toString("base64url");
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const key = await getCryptoKey();
    const sigBuffer = Buffer.from(sigB64, "base64url");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;

    const user = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (user.expiresAt && user.expiresAt < Date.now()) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("muviont_session")?.value;
    if (!token) return null;

    // 1. Verify signed token (Edge-native, zero-DB latency)
    if (token.includes(".")) {
      const verified = await verifySessionToken(token);
      if (verified) {
        return {
          id: verified.id,
          email: verified.email,
          name: verified.name,
          image: verified.image,
          role: verified.role,
        };
      }
    }

    // 2. Fallback to DB session if available
    try {
      if (db?.session?.findUnique) {
        const session = await db.session.findUnique({
          where: { token }
        });

        if (session && session.expiresAt >= new Date()) {
          const user = await db.user.findUnique({
            where: { id: session.userId }
          });
          if (user) return user;
        }
      }
    } catch {
      // Ignore database failures in edge runtime
    }

    return null;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}
