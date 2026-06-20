import { getCurrentUser } from "../auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
