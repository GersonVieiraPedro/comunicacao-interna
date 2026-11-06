import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PushSettings } from "@/components/pwa/push-settings";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { hasCommunicatorRole } from "@/types/roles";

export default async function SettingsPage() {
  const session = await auth();
  const user = session!.user;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader title="Configurações" />
      <Card>
        <p className="text-sm text-fg-muted">Conta</p>
        <p className="mt-1 font-medium">{user.name}</p>
        <p className="text-sm text-fg-muted">{user.email}</p>
        <p className="mt-2 text-sm">Papel: {hasCommunicatorRole(user.roles) ? "Comunicador" : "Colaborador"}</p>
      </Card>
      <InstallAppCard variant="settings" />
      <PushSettings />
    </div>
  );
}
