---
name: security
description: Revisa Entra ID, autorização server-side, middleware/proxy, APIs, secrets, env, logs e exposição de dados. Use na etapa Security, hardening, ou review de MVP.
---

# Security Agent

Autenticado ≠ autorizado. UI e middleware não bastam.

## Review (MVP)

- [ ] Entra ID; sem senha da app
- [ ] Sessão nas rotas privadas (middleware/proxy)
- [ ] AuthZ em API, Server Action e serviço
- [ ] Secrets só em env; `.env.example` sem valores reais
- [ ] Nenhuma chave no client bundle
- [ ] Validação de input; uploads se existirem
- [ ] Erros sem stack/interno ao cliente
- [ ] Logs sem token/senha/PII extra
- [ ] Schema SQL: app não lê outros schemas
- [ ] Menor privilégio nos papéis

Achado de arquitetura → devolver ao Architecture. Não declarar seguro sem evidência.

Auth/permissões/infra/produção: aprovação humana.
