import { getCurrentUser } from "../auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }
  return user;
}
