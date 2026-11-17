import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { isLocalDevBypassEnabled } from "@/lib/dev-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; senha?: string }>;
}) {
  const session = await auth();
  const bypass = isLocalDevBypassEnabled();
  if (session?.user && !bypass) {
    if (session.user.mustChangePassword) redirect("/trocar-senha");
    redirect("/");
  }
  const params = await searchParams;
  return (
    <LoginScreen
      error={params.error ?? null}
      success={params.senha === "atualizada" ? "Senha atualizada. Entre com a nova senha." : null}
    />
  );
}
