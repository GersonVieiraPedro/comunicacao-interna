import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { isLocalDevBypassEnabled } from "@/lib/dev-auth";
import { Icon } from "@/components/ui/icon";
import { Megaphone, User } from "lucide-react";

export function LocalDevSignInButtons() {
  if (!isLocalDevBypassEnabled()) return null;

  async function asCollaborator() {
    "use server";
    if (!isLocalDevBypassEnabled()) return;
    await signIn("local-dev", { persona: "collaborator", redirectTo: "/" });
  }

  async function asCommunicator() {
    "use server";
    if (!isLocalDevBypassEnabled()) return;
    await signIn("local-dev", { persona: "communicator", redirectTo: "/" });
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
