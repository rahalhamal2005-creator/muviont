import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("muviont_session")?.value;
    
    if (token) {
      // Delete session from DB
      await db.session.delete({ where: { token } }).catch(() => {});
    }

    // Clear cookie
    cookieStore.delete("muviont_session");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Logout Error:", err.message);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
