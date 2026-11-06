import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button variant="secondary" type="submit" aria-label="Sair" className="min-h-11 px-3">
        <Icon icon={LogOut} />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </form>
  );
}
