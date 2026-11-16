import { prisma } from "@/lib/db";

export async function listFaqEntries(options?: { includeInactive?: boolean }) {
  return prisma.faqEntry.findMany({
    where: options?.includeInactive ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createFaqEntry(data: {
  question: string;
  answer: string;
  sortOrder?: number;
}) {
  const max = await prisma.faqEntry.aggregate({ _max: { sortOrder: true } });
  return prisma.faqEntry.create({
    data: {
      question: data.question,
      answer: data.answer,
      sortOrder: data.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      active: true,
    },
  });
}

export async function updateFaqEntry(
  id: string,
  data: { question?: string; answer?: string; sortOrder?: number; active?: boolean },
) {
  return prisma.faqEntry.update({ where: { id }, data });
}

export async function deleteFaqEntry(id: string) {
  return prisma.faqEntry.delete({ where: { id } });
}

export async function countFaqEntries() {
  return prisma.faqEntry.count();
}

export async function listUsefulLinkEntries(options?: { includeInactive?: boolean }) {
  return prisma.usefulLinkEntry.findMany({
    where: options?.includeInactive ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createUsefulLinkEntry(data: {
  label: string;
  href: string;
  description?: string | null;
  sortOrder?: number;
}) {
  const max = await prisma.usefulLinkEntry.aggregate({ _max: { sortOrder: true } });
  return prisma.usefulLinkEntry.create({
    data: {
      label: data.label,
      href: data.href,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      active: true,
    },
  });
}

export async function updateUsefulLinkEntry(
  id: string,
  data: {
    label?: string;
    href?: string;
    description?: string | null;
    sortOrder?: number;
    active?: boolean;
  },
) {
  return prisma.usefulLinkEntry.update({ where: { id }, data });
}

export async function deleteUsefulLinkEntry(id: string) {
  return prisma.usefulLinkEntry.delete({ where: { id } });
}

export async function countUsefulLinkEntries() {
  return prisma.usefulLinkEntry.count();
}
