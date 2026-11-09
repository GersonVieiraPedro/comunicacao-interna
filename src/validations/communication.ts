import { z } from "zod";
import { CommunicationPriority, CommunicationStatus } from "@/types/communication";

export const communicationInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(300).optional().nullable(),
  summary: z.string().trim().min(3).max(500),
  bodyHtml: z.string().min(1),
  categoryId: z.string().uuid(),
  priority: z.enum([
    CommunicationPriority.NORMAL,
    CommunicationPriority.IMPORTANT,
    CommunicationPriority.URGENT,
  ]),
  expiresAt: z.coerce.date().optional().nullable(),
  // Disco local (~path curto), Blob URL ou data URL (piloto na Vercel sem Blob).
  coverPath: z.string().max(5_000_000).optional().nullable(),
  scheduledPublishAt: z.coerce.date().optional().nullable(),
});

export const historyQuerySchema = z.object({
  q: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  unreadOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const adminQuerySchema = z.object({
  status: z
    .enum([
      CommunicationStatus.DRAFT,
      CommunicationStatus.SCHEDULED,
      CommunicationStatus.PUBLISHED,
      CommunicationStatus.EXPIRED,
      CommunicationStatus.CANCELLED,
    ])
    .optional(),
  categoryId: z.string().uuid().optional(),
  priority: z
    .enum([
      CommunicationPriority.NORMAL,
      CommunicationPriority.IMPORTANT,
      CommunicationPriority.URGENT,
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
