import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";
import { isSuperAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existingUser = await db.user.findUnique({
      where: { email: emailTrimmed }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = hashPassword(password);
    const isEmailSuperAdmin = isSuperAdmin(emailTrimmed);

    // Create User
    const user = await db.user.create({
      data: {
        email: emailTrimmed,
        name: name?.trim() || null,
        passwordHash,
        role: isEmailSuperAdmin ? "SUPER_ADMIN" : "USER"
      }
    });

    // Create Session
    const token = `session-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("muviont_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong during signup" },
      { status: 500 }
    );
  }
}
