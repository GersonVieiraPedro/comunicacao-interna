import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PushSettings } from "@/components/pwa/push-settings";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { ProfileForm } from "@/features/users/profile-form";
import { getProfile } from "@/services/user-service";
import { hasCommunicatorRole } from "@/types/roles";

export default async function SettingsPage() {
  const session = await auth();
  const profile = await getProfile(session?.user);
  const firstName = profile.displayName?.split(/\s+/)[0] ?? profile.displayName;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        eyebrow="Conta"
        title="Configurações"
        description="Perfil, notificações, instalação do app e dados da sessão."
      />
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-4 bg-gradient-to-r from-accent to-accent-hover px-5 py-6 text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
            {(firstName?.[0] ?? "U").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{profile.displayName}</p>
            <p className="truncate text-sm text-white/80">{profile.email}</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Papel</p>
          <p className="mt-1 text-sm font-medium text-fg">
            {hasCommunicatorRole(profile.roles) ? "Comunicador" : "Colaborador"}
          </p>
        </div>
      </Card>
      <ProfileForm
        displayName={profile.displayName}
        email={profile.email}
        hasPassword={profile.hasPassword}
      />
      <InstallAppCard variant="settings" />
      <PushSettings canBroadcastTest={hasCommunicatorRole(profile.roles)} />
    </div>
  );
}
