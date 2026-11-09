import { describe, expect, it } from "vitest";
import {
  compareUnreadPopup,
  computeObservabilityMetrics,
  computeReadMetrics,
  isVisibleToCollaborator,
  selectUnreadPopup,
  shouldExpire,
} from "@/domain/communication-rules";
import { CommunicationPriority, CommunicationStatus } from "@/types/communication";

const base = {
  id: "1",
  audienceType: "ALL",
  publishedAt: new Date("2026-01-01T12:00:00Z"),
  expiresAt: null as Date | null,
  scheduledPublishAt: null as Date | null,
};

describe("visibilidade", () => {
  it("mostra publicado vigente", () => {
    expect(
      isVisibleToCollaborator(
        { ...base, status: CommunicationStatus.PUBLISHED, priority: CommunicationPriority.NORMAL },
        new Date("2026-01-02T00:00:00Z"),
      ),
    ).toBe(true);
  });

  it("esconde rascunho e expirado por data", () => {
    expect(
      isVisibleToCollaborator(
        { ...base, status: CommunicationStatus.DRAFT, priority: CommunicationPriority.NORMAL },
        new Date("2026-01-02T00:00:00Z"),
      ),
    ).toBe(false);
    expect(
      shouldExpire(
        {
          ...base,
          status: CommunicationStatus.PUBLISHED,
          priority: CommunicationPriority.NORMAL,
          expiresAt: new Date("2026-01-01T13:00:00Z"),
        },
        new Date("2026-01-01T14:00:00Z"),
      ),
    ).toBe(true);
  });
});

describe("popup não visualizado", () => {
  it("prioriza urgente, depois importante, depois o mais recente", () => {
    const unread = [
      {
        id: "n",
        priority: CommunicationPriority.NORMAL,
        publishedAt: new Date("2026-01-03T00:00:00Z"),
      },
      {
        id: "i",
        priority: CommunicationPriority.IMPORTANT,
        publishedAt: new Date("2026-01-04T00:00:00Z"),
      },
      {
        id: "u",
        priority: CommunicationPriority.URGENT,
        publishedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];
    expect(selectUnreadPopup(unread)?.id).toBe("u");
    const onlyNormal = unread.filter((item) => item.priority === CommunicationPriority.NORMAL);
    expect(selectUnreadPopup(onlyNormal)?.id).toBe("n");
  });

  it("desempate por data", () => {
    const a = { id: "a", priority: CommunicationPriority.NORMAL, publishedAt: new Date("2026-01-01") };
    const b = { id: "b", priority: CommunicationPriority.NORMAL, publishedAt: new Date("2026-01-02") };
    expect(compareUnreadPopup(a, b)).toBeGreaterThan(0);
  });
});

describe("métricas", () => {
  it("calcula percentual a partir do banco", () => {
    expect(computeReadMetrics(400, 280)).toEqual({
      eligibleCount: 400,
      readCount: 280,
      unreadCount: 120,
      percentRead: 70,
    });
  });

  it("separa entrega, visualização, abertura e ciência", () => {
    expect(
      computeObservabilityMetrics({
        eligibleCount: 100,
        deliveredCount: 90,
        viewedCount: 70,
        openedCount: 60,
        acknowledgedCount: 40,
      }),
    ).toMatchObject({
      percentDelivered: 90,
      percentViewed: 70,
      percentOpened: 60,
      percentAcknowledged: 40,
      pendingAckCount: 60,
      readCount: 40,
      percentRead: 40,
    });
  });
});
