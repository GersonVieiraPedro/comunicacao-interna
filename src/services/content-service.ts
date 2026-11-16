import type { SessionUser } from "@/lib/authz";
import { requireMetarh, requireUser } from "@/lib/authz";
import { NotFoundError } from "@/lib/errors";
import { faqItems } from "@/config/faq";
import { usefulLinks } from "@/config/useful-links";
import {
  countFaqEntries,
  countUsefulLinkEntries,
  createFaqEntry,
  createUsefulLinkEntry,
  deleteFaqEntry,
  deleteUsefulLinkEntry,
  listFaqEntries,
  listUsefulLinkEntries,
  updateFaqEntry,
  updateUsefulLinkEntry,
} from "@/repositories/content-repository";
import {
  faqInputSchema,
  faqUpdateSchema,
  usefulLinkInputSchema,
  usefulLinkUpdateSchema,
} from "@/validations/content";

async function ensureFaqSeeded() {
  const count = await countFaqEntries();
  if (count > 0) return;
  for (const [index, item] of faqItems.entries()) {
    await createFaqEntry({
      question: item.question,
      answer: item.answer,
      sortOrder: index + 1,
    });
  }
}

async function ensureUsefulLinksSeeded() {
  const count = await countUsefulLinkEntries();
  if (count > 0) return;
  for (const [index, item] of usefulLinks.entries()) {
    await createUsefulLinkEntry({
      label: item.label,
      href: item.href,
      description: item.description ?? null,
      sortOrder: index + 1,
    });
  }
}

export async function getFaqPageData(user: SessionUser | undefined) {
  requireUser(user);
  await Promise.all([ensureFaqSeeded(), ensureUsefulLinksSeeded()]);
  const [faqs, links] = await Promise.all([
    listFaqEntries({ includeInactive: false }),
    listUsefulLinkEntries({ includeInactive: false }),
  ]);
  return { faqs, links };
}

export async function getFaqAdminData(user: SessionUser | undefined) {
  requireMetarh(user);
  await Promise.all([ensureFaqSeeded(), ensureUsefulLinksSeeded()]);
  const [faqs, links] = await Promise.all([
    listFaqEntries({ includeInactive: true }),
    listUsefulLinkEntries({ includeInactive: true }),
  ]);
  return { faqs, links };
}

export async function createFaq(user: SessionUser | undefined, raw: unknown) {
  requireMetarh(user);
  const parsed = faqInputSchema.parse(raw);
  return createFaqEntry(parsed);
}

export async function updateFaq(user: SessionUser | undefined, raw: unknown) {
  requireMetarh(user);
  const parsed = faqUpdateSchema.parse(raw);
  try {
    return await updateFaqEntry(parsed.id, {
      question: parsed.question,
      answer: parsed.answer,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
    });
  } catch {
    throw new NotFoundError("Pergunta não encontrada.");
  }
}

export async function removeFaq(user: SessionUser | undefined, id: string) {
  requireMetarh(user);
  try {
    return await deleteFaqEntry(id);
  } catch {
    throw new NotFoundError("Pergunta não encontrada.");
  }
}

export async function createUsefulLink(user: SessionUser | undefined, raw: unknown) {
  requireMetarh(user);
  const parsed = usefulLinkInputSchema.parse(raw);
  return createUsefulLinkEntry(parsed);
}

export async function updateUsefulLink(user: SessionUser | undefined, raw: unknown) {
  requireMetarh(user);
  const parsed = usefulLinkUpdateSchema.parse(raw);
  try {
    return await updateUsefulLinkEntry(parsed.id, {
      label: parsed.label,
      href: parsed.href,
      description: parsed.description,
      sortOrder: parsed.sortOrder,
      active: parsed.active,
    });
  } catch {
    throw new NotFoundError("Link não encontrado.");
  }
}

export async function removeUsefulLink(user: SessionUser | undefined, id: string) {
  requireMetarh(user);
  try {
    return await deleteUsefulLinkEntry(id);
  } catch {
    throw new NotFoundError("Link não encontrado.");
  }
}
