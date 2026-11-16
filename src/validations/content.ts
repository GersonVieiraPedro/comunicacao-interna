import { z } from "zod";

export const faqInputSchema = z.object({
  question: z.string().trim().min(3, "Informe a pergunta.").max(300),
  answer: z.string().trim().min(3, "Informe a resposta.").max(8000),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const faqUpdateSchema = faqInputSchema.partial().extend({
  id: z.string().uuid(),
});

export const usefulLinkInputSchema = z.object({
  label: z.string().trim().min(2, "Informe o rótulo.").max(160),
  href: z
    .string()
    .trim()
    .min(3, "Informe o link.")
    .max(500)
    .refine(
      (value) =>
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("mailto:") ||
        value.startsWith("tel:") ||
        value.startsWith("/"),
      "Use http(s), mailto, tel ou caminho interno.",
    ),
  description: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const usefulLinkUpdateSchema = usefulLinkInputSchema.partial().extend({
  id: z.string().uuid(),
});
