import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const email = "rahalhaml2005@gmail.com";
    const user = await db.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json({ message: `No user found with email: ${email}` });
    }
    
    await db.user.delete({
      where: { id: user.id }
    });
    
    return NextResponse.json({ message: `User ${email} deleted successfully!` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
