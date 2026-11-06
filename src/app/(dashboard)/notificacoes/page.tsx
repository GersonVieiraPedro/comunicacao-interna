import { auth } from "@/auth";
import { listNotifications } from "@/repositories/notification-repository";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationList } from "@/features/notifications/notification-list";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const session = await auth();
  const items = await listNotifications(session!.user.id);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader title="Notificações" description="Avisos in-app das publicações." />
      {items.length === 0 ? (
        <EmptyState title="Nenhuma notificação" icon={Bell} />
      ) : (
        <NotificationList items={items} />
      )}
    </div>
  );
}
