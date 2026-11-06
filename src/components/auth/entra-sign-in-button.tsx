import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { isEntraConfigured } from "@/lib/dev-auth";

function MicrosoftMark() {
  return (
    <svg aria-hidden className="h-4 w-4" viewBox="0 0 23 23">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#00a4ef" d="M12 1h10v10H12z" />
      <path fill="#7fba00" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function EntraSignInButton() {
  if (!isEntraConfigured()) return null;
  return (
    <form
      action={async () => {
        "use server";
        await signIn("microsoft-entra-id", { redirectTo: "/" });
      }}
    >
      <Button type="submit" className="w-full">
        <MicrosoftMark />
        Entrar com Microsoft
      </Button>
    </form>
  );
}
