import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ChangePasswordForm } from "@/features/users/change-password-form";
import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const forced = Boolean(session.user.mustChangePassword);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-4 py-10">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          {appConfig.brand}
        </p>
        <p className="mt-1 text-sm font-semibold text-fg">{appConfig.name}</p>
      </div>
      <ChangePasswordForm forced={forced} />
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="ghost">
          Sair
        </Button>
      </form>
    </main>
  );
}
