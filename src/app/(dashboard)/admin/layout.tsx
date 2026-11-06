import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { hasCommunicatorRole } from "@/types/roles";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || !hasCommunicatorRole(session.user.roles)) {
    redirect("/");
  }
  return children;
}
