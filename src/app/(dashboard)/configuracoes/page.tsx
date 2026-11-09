import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PushSettings } from "@/components/pwa/push-settings";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { hasCommunicatorRole } from "@/types/roles";

export default async function SettingsPage() {
  const session = await auth();
  const user = session!.user;
  const firstName = user.name?.split(/\s+/)[0] ?? user.name;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        eyebrow="Conta"
        title="Configurações"
        description="Gerencie notificações, instalação do app e dados da sua sessão."
      />
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-4 bg-gradient-to-r from-accent to-accent-hover px-5 py-6 text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
            {(firstName?.[0] ?? "U").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.name}</p>
            <p className="truncate text-sm text-white/80">{user.email}</p>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Papel</p>
          <p className="mt-1 text-sm font-medium text-fg">
            {hasCommunicatorRole(user.roles) ? "Comunicador" : "Colaborador"}
          </p>
        </div>
      </Card>
      <InstallAppCard variant="settings" />
      <PushSettings canBroadcastTest={hasCommunicatorRole(user.roles)} />
    </div>
  );
}
