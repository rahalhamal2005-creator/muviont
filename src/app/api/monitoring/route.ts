import { NextRequest, NextResponse } from "next/server";
import { TelemetryService } from "@/lib/monitoring/telemetry";
import { rateLimit } from "@/lib/security/limiter";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  
  // Rate Limit for dashboard metrics
  const limitRes = await rateLimit(ip, 10, 60); // 10 request limit
  if (!limitRes.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    // 1. Read session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("muviont_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized: No session token found" }, { status: 403 });
    }

    // 2. Query session in database
    const session = await db.session.findUnique({
      where: { token: sessionToken }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired session" }, { status: 403 });
    }

    // 3. Query user role to check authorization
    const user = await db.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Record current system metrics (memory, cache ratio) asynchronously
    await TelemetryService.recordSystemMetrics();
    
    // Retrieve aggregated stats for display
    const stats = await TelemetryService.getPlatformStats();

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("Monitoring Route Error:", err.message);
    return NextResponse.json(
      { error: "Failed to compile monitoring metrics" },
      { status: 500 }
    );
  }
}
