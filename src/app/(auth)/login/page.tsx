import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { isLocalDevBypassEnabled } from "@/lib/dev-auth";

export default async function LoginPage() {
  const session = await auth();
  const bypass = isLocalDevBypassEnabled();
  if (session?.user && !bypass) redirect("/");
  return <LoginScreen />;
}
