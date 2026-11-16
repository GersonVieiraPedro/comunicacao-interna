export type FaqItem = { id: string; question: string; answer: string };

/** FAQ inicial (seed estático; edição admin pode evoluir depois). */
export const faqItems: FaqItem[] = [
  {
    id: "como-ler",
    question: "Como vejo os comunicados novos?",
    answer:
      "Na página Início aparecem os comunicados publicados para o seu perfil. Itens não lidos podem abrir em destaque na primeira visita.",
  },
  {
    id: "push",
    question: "Como ativo avisos no celular?",
    answer:
      "Em Mais / Configurações, permita notificações do navegador e, se possível, instale o app (PWA). Avisos importantes e urgentes podem chegar como push.",
  },
  {
    id: "contato",
    question: "Como falo com o atendimento MetaRH?",
    answer:
      "Use o e-mail de atendimento disponível na página de Contato ou Links úteis. Clientes também podem usar o canal de CS (WhatsApp ou e-mail).",
  },
  {
    id: "candidato",
    question: "Por que meu perfil é Candidato?",
    answer:
      "Quem está sem contrato ativo passa automaticamente ao perfil Candidato, com acesso às redes MetaRH e às vagas no Selecty.",
  },
];
