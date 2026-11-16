import { PrismaClient } from "@prisma/client";
import { AppRole } from "../src/types/roles";
import { CommunicationPriority, CommunicationStatus } from "../src/types/communication";
import { credentialsSubject, hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

/** Senha padrão do seed — sobrescreva com SEED_DEFAULT_PASSWORD em produção. */
const DEFAULT_SEED_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe_Comunicacao1";

const categories = [
  { slug: "noticias", name: "Notícias", sortOrder: 1 },
  { slug: "comunicados", name: "Comunicados", sortOrder: 2 },
  { slug: "eventos", name: "Eventos", sortOrder: 3 },
  { slug: "institucional", name: "Institucional", sortOrder: 4 },
  { slug: "pessoas", name: "Pessoas", sortOrder: 5 },
  { slug: "tecnologia", name: "Tecnologia", sortOrder: 6 },
  { slug: "rh", name: "RH", sortOrder: 7 },
  { slug: "newsletter", name: "Newsletter", sortOrder: 8 },
  { slug: "outros", name: "Outros", sortOrder: 9 },
];

async function main() {
  for (const category of categories) {
    await prisma.communicationCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    });
  }

  const storedCategories = await prisma.communicationCategory.findMany();
  const bySlug = Object.fromEntries(storedCategories.map((item) => [item.slug, item.id]));

  const collaborators = Array.from({ length: 10 }, (_, index) => ({
    entraObjectId: `seed-colab-${index + 1}`,
    email: `colaborador${index + 1}@empresa.exemplo`,
    displayName: `Colaborador ${index + 1}`,
    role: AppRole.COLLABORATOR,
    contractStatus: "ACTIVE",
    contractType: index % 2 === 0 ? "TEMPORARY" : "THIRD_PARTY",
    economicGroup: index < 5 ? "Grupo Alpha" : "Grupo Beta",
    cnpj: index < 5 ? "11222333000181" : "44555666000172",
  }));

  const metarhUsers = [
    {
      entraObjectId: "seed-com-1",
      email: "comunicador1@empresa.exemplo",
      displayName: "METARH Ana",
      role: AppRole.METARH,
      contractStatus: "ACTIVE",
    },
    {
      entraObjectId: "seed-com-2",
      email: "comunicador2@empresa.exemplo",
      displayName: "METARH Bruno",
      role: AppRole.METARH,
      contractStatus: "ACTIVE",
    },
  ];

  const extras = [
    {
      entraObjectId: "seed-client-1",
      email: "cliente1@empresa.exemplo",
      displayName: "Cliente Carla",
      role: AppRole.CLIENT,
      contractStatus: "ACTIVE",
      cnpj: "11222333000181",
      economicGroup: "Grupo Alpha",
      clientOrgId: "org-alpha",
    },
    {
      entraObjectId: "seed-cand-1",
      email: "candidato1@empresa.exemplo",
      displayName: "Candidato Diego",
      role: AppRole.CANDIDATE,
      contractStatus: "NONE",
    },
  ];

  const passwordHash = await hashPassword(DEFAULT_SEED_PASSWORD);
  const people = [...collaborators, ...metarhUsers, ...extras];
  const users = [];
  for (const person of people) {
    const email = person.email.trim().toLowerCase();
    const subject = credentialsSubject(email);
    const roles =
      person.role === AppRole.METARH
        ? [{ role: AppRole.COLLABORATOR }, { role: AppRole.METARH }]
        : [{ role: person.role }];
    const hr = {
      contractStatus: person.contractStatus ?? null,
      contractType: "contractType" in person ? (person.contractType as string | null) : null,
      economicGroup: "economicGroup" in person ? (person.economicGroup as string | null) : null,
      cnpj: "cnpj" in person ? (person.cnpj as string | null) : null,
      clientOrgId: "clientOrgId" in person ? (person.clientOrgId as string | null) : null,
    };
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        displayName: person.displayName,
        passwordHash,
        entraObjectId: subject,
        ...hr,
        roles: {
          deleteMany: {},
          create: roles,
        },
      },
      create: {
        entraObjectId: subject,
        email,
        displayName: person.displayName,
        passwordHash,
        ...hr,
        roles: { create: roles },
      },
    });
    users.push(user);
  }

  const author = users.find((item) => item.email === "comunicador1@empresa.exemplo")!;
  const now = new Date();
  const publishedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const existing = await prisma.communication.count();
  if (existing === 0) {
    const samples = [
      {
        title: "Bem-vindos à Central",
        summary: "Canal único para avisos da empresa.",
        status: CommunicationStatus.PUBLISHED,
        priority: CommunicationPriority.IMPORTANT,
        categoryId: bySlug.institucional,
        publishedAt,
      },
      {
        title: "Manutenção da rede no sábado",
        summary: "Sistemas internos indisponíveis das 8h às 12h.",
        status: CommunicationStatus.PUBLISHED,
        priority: CommunicationPriority.URGENT,
        categoryId: bySlug.tecnologia,
        publishedAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        title: "Newsletter de setembro",
        summary: "Resumo mensal de pessoas e projetos.",
        status: CommunicationStatus.PUBLISHED,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.newsletter,
        publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        title: "Confraternização do trimestre",
        summary: "Save the date no auditório.",
        status: CommunicationStatus.PUBLISHED,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.eventos,
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Novo benefício de saúde",
        summary: "Detalhes do plano a partir de outubro.",
        status: CommunicationStatus.PUBLISHED,
        priority: CommunicationPriority.IMPORTANT,
        categoryId: bySlug.rh,
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Rascunho: campanha interna",
        summary: "Texto ainda em revisão.",
        status: CommunicationStatus.DRAFT,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.comunicados,
      },
      {
        title: "Agendado: abertura do café",
        summary: "Publicação automática amanhã cedo.",
        status: CommunicationStatus.SCHEDULED,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.pessoas,
        scheduledPublishAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      {
        title: "Aviso já expirado",
        summary: "Ficou no histórico.",
        status: CommunicationStatus.EXPIRED,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.outros,
        publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        title: "Cancelado: evento adiado",
        summary: "Não será publicado.",
        status: CommunicationStatus.CANCELLED,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.eventos,
      },
      {
        title: "Pessoas: novas lideranças",
        summary: "Movimentações organizacionais.",
        status: CommunicationStatus.PUBLISHED,
        priority: CommunicationPriority.NORMAL,
        categoryId: bySlug.pessoas,
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
    ];

    for (const sample of samples) {
      await prisma.communication.create({
        data: {
          title: sample.title,
          summary: sample.summary,
          bodyHtml: `<p>${sample.summary}</p><p>Conteúdo de exemplo da Central. Nenhum dado real de empresa.</p>`,
          categoryId: sample.categoryId,
          authorUserId: author.id,
          publishedByUserId: sample.status === CommunicationStatus.PUBLISHED ? author.id : null,
          status: sample.status,
          priority: sample.priority,
          audienceType: "ALL",
          publishedAt: sample.publishedAt ?? null,
          scheduledPublishAt: sample.scheduledPublishAt ?? null,
          expiresAt: sample.expiresAt ?? null,
        },
      });
    }
  }

  const published = await prisma.communication.findMany({
    where: { status: CommunicationStatus.PUBLISHED },
  });
  const firstColab = users.find((item) => item.email === "colaborador1@empresa.exemplo")!;
  if (published[0]) {
    await prisma.communicationRead.upsert({
      where: {
        userId_communicationId: { userId: firstColab.id, communicationId: published[0].id },
      },
      update: {},
      create: { userId: firstColab.id, communicationId: published[0].id },
    });
  }

  await prisma.pushSubscription.upsert({
    where: { endpointHash: "0".repeat(64) },
    update: {},
    create: {
      userId: firstColab.id,
      endpoint: "https://example.invalid/seed-push",
      endpointHash: "0".repeat(64),
      p256dh: "seed-p256dh",
      auth: "seed-auth",
      userAgent: "seed",
      active: false,
    },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || DEFAULT_SEED_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";
  if (adminEmail) {
    const adminHash = await hashPassword(adminPassword);
    const subject = credentialsSubject(adminEmail);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        entraObjectId: subject,
        email: adminEmail,
        displayName: adminName,
        passwordHash: adminHash,
        roles: {
          create: [{ role: AppRole.COLLABORATOR }, { role: AppRole.METARH }],
        },
        contractStatus: "ACTIVE",
      },
      update: {
        displayName: adminName,
        passwordHash: adminHash,
        entraObjectId: subject,
        roles: {
          deleteMany: {},
          create: [{ role: AppRole.COLLABORATOR }, { role: AppRole.METARH }],
        },
        contractStatus: "ACTIVE",
      },
    });
  }

  console.log(
    `Seed OK. Login interno: comunicador1@empresa.exemplo / (SEED_DEFAULT_PASSWORD). Troque a senha em produção.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
