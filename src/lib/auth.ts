import { db } from "./db";
import { cookies } from "next/headers";

export function isSuperAdmin(email: string): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "rahalhamal2005@gmail.com";
  return email.toLowerCase() === superAdminEmail.toLowerCase();
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("muviont_session")?.value;
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { token }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: session.userId }
    });

    return user;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}
