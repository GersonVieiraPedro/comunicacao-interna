import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { isLocalDevBypassEnabled } from "@/lib/dev-auth";
import { Icon } from "@/components/ui/icon";
import { Megaphone, User } from "lucide-react";

function isNextRedirect(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("digest" in error) || typeof (error as { digest?: unknown }).digest !== "string") {
    return false;
  }
  return (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}

export function LocalDevSignInButtons() {
  if (!isLocalDevBypassEnabled()) return null;

  async function asCollaborator() {
    "use server";
    if (!isLocalDevBypassEnabled()) return;
    try {
      const result = await signIn("local-dev", {
        persona: "collaborator",
        redirect: false,
      });
      if (result?.error) redirect("/login?error=credentials");
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      if (err instanceof AuthError) redirect("/login?error=credentials");
      throw err;
    }
    redirect("/");
  }

  async function asCommunicator() {
    "use server";
    if (!isLocalDevBypassEnabled()) return;
    try {
      const result = await signIn("local-dev", {
        persona: "communicator",
        redirect: false,
      });
      if (result?.error) redirect("/login?error=credentials");
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      if (err instanceof AuthError) redirect("/login?error=credentials");
      throw err;
    }
    redirect("/");
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        Somente desenvolvimento
      </p>
      <form action={asCollaborator}>
        <Button type="submit" variant="secondary" className="w-full">
          <Icon icon={User} />
          Entrar como colaborador (local)
        </Button>
      </form>
      <form action={asCommunicator}>
        <Button type="submit" variant="secondary" className="w-full">
          <Icon icon={Megaphone} />
          Entrar como comunicador (local)
        </Button>
      </form>
    </div>
  );
}
