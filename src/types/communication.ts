export const CommunicationStatus = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export type CommunicationStatus = (typeof CommunicationStatus)[keyof typeof CommunicationStatus];

export const CommunicationPriority = {
  NORMAL: "NORMAL",
  IMPORTANT: "IMPORTANT",
  URGENT: "URGENT",
} as const;

export type CommunicationPriority = (typeof CommunicationPriority)[keyof typeof CommunicationPriority];

export const AudienceType = {
  ALL: "ALL",
} as const;

export const NotificationChannel = {
  IN_APP: "IN_APP",
  WEB_PUSH: "WEB_PUSH",
} as const;

export const DeliveryStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
} as const;

export const PRIORITY_RANK: Record<CommunicationPriority, number> = {
  URGENT: 0,
  IMPORTANT: 1,
  NORMAL: 2,
};

export function isCommunicationStatus(value: string): value is CommunicationStatus {
  return Object.values(CommunicationStatus).includes(value as CommunicationStatus);
}

export function isCommunicationPriority(value: string): value is CommunicationPriority {
  return Object.values(CommunicationPriority).includes(value as CommunicationPriority);
}
