import {
  CommunicationStatus,
  PRIORITY_RANK,
  type CommunicationPriority as Priority,
} from "@/types/communication";

export type LifecycleCommunication = {
  id: string;
  status: string;
  priority: string;
  audienceType: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  scheduledPublishAt: Date | null;
};

export function isVisibleToCollaborator(item: LifecycleCommunication, now: Date): boolean {
  if (item.audienceType !== "ALL") return false;
  if (item.status !== CommunicationStatus.PUBLISHED) return false;
  if (!item.publishedAt || item.publishedAt > now) return false;
  if (item.expiresAt && item.expiresAt <= now) return false;
  return true;
}

export function isInCollaboratorHistory(item: Pick<LifecycleCommunication, "status">): boolean {
  return item.status === CommunicationStatus.PUBLISHED || item.status === CommunicationStatus.EXPIRED;
}

export function shouldExpire(item: LifecycleCommunication, now: Date): boolean {
  return item.status === CommunicationStatus.PUBLISHED && Boolean(item.expiresAt && item.expiresAt <= now);
}

export function canEditContent(status: string): boolean {
  return status === CommunicationStatus.DRAFT || status === CommunicationStatus.SCHEDULED;
}

export function assertScheduleAt(scheduledAt: Date, now: Date, skewMs = 30_000): void {
  if (scheduledAt.getTime() <= now.getTime() - skewMs) {
    throw new Error("SCHEDULE_IN_PAST");
  }
}

export function compareUnreadPopup<T extends { priority: string; publishedAt: Date | null }>(a: T, b: T): number {
  const rankA = PRIORITY_RANK[a.priority as Priority] ?? 9;
  const rankB = PRIORITY_RANK[b.priority as Priority] ?? 9;
  const rank = rankA - rankB;
  if (rank !== 0) return rank;
  return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
}

export function selectUnreadPopup<T extends { priority: string; publishedAt: Date | null }>(
  unreadEligible: T[],
): T | null {
  if (unreadEligible.length === 0) return null;
  return [...unreadEligible].sort(compareUnreadPopup)[0] ?? null;
}

export function computeReadMetrics(eligibleCount: number, readCount: number) {
  const unreadCount = Math.max(0, eligibleCount - readCount);
  const percentRead = eligibleCount === 0 ? 0 : Math.round((readCount / eligibleCount) * 100);
  return { eligibleCount, readCount, unreadCount, percentRead };
}

export function computeObservabilityMetrics(input: {
  eligibleCount: number;
  deliveredCount: number;
  viewedCount: number;
  openedCount: number;
  acknowledgedCount: number;
}) {
  const { eligibleCount, deliveredCount, viewedCount, openedCount, acknowledgedCount } = input;
  const pct = (count: number) =>
    eligibleCount === 0 ? 0 : Math.round((count / eligibleCount) * 100);
  return {
    eligibleCount,
    deliveredCount,
    viewedCount,
    openedCount,
    acknowledgedCount,
    pendingAckCount: Math.max(0, eligibleCount - acknowledgedCount),
    percentDelivered: pct(deliveredCount),
    percentViewed: pct(viewedCount),
    percentOpened: pct(openedCount),
    percentAcknowledged: pct(acknowledgedCount),
    // compat: "lidos" = ciência confirmada
    readCount: acknowledgedCount,
    unreadCount: Math.max(0, eligibleCount - acknowledgedCount),
    percentRead: pct(acknowledgedCount),
  };
}

export function defaultPushCopy() {
  return {
    title: "Nova comunicação interna",
    body: "Confira o novo comunicado publicado.",
  };
}
