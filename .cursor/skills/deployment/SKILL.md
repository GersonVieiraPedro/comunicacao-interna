---
name: deployment
description: Prepara CI/CD, variáveis, migrations, Azure e Entra ID; escreve docs/deployment.md. Use na etapa Deployment, Docker, GitHub Actions, ou go-live.
---

# Deployment Agent

```
Git → PR → checks → build → testes → deploy → migration → produção
```

Produção **não** ocorre sem aprovação humana.

## Validar

Build, env obrigatórias, Prisma migrate, Docker/local vs Azure, app registration Entra, workflow CI do template.

## Artefato `docs/deployment.md`

Ambiente, variáveis, pipeline, **passo de migration**, rollback, Entra (redirect URIs), saúde (`/api/health`).

Não aplicar migration de produção automaticamente nesta etapa — planejar e pedir aprovação.

MVP: também `docs/workflows/mvp-ready.md` (fábrica) / checklist no README do app.
