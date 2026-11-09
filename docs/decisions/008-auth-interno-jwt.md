# ADR 008 — Login interno (e-mail/senha) + JWT Auth.js

## Status

Aceito (desvio consciente do padrão Entra-only da Factory)

## Contexto

Nem todos os colaboradores terão conta Microsoft no piloto. O padrão da Software Factory exige Entra ID em produção e proíbe senha da aplicação; o dono do produto pediu login interno para a Central.

## Decisão

1. **Auth padrão:** Credentials (e-mail/senha) + sessão **JWT** do Auth.js (`session.strategy = jwt`).
2. Senhas só como **bcrypt** (`passwordHash` no schema `comunicacao`).
3. Sem auto-cadastro público — usuários via seed / processo administrativo.
4. Entra ID permanece **opcional** (botão aparece se as envs existirem).
5. `AUTH_DEV_BYPASS` continua só em localhost/dev.

## Consequências

- Desvio documentado do skill Security (Entra-only).
- Operação precisa gerenciar contas e senhas (reset manual no MVP).
- Migration `20261109120000_internal_password_auth` obrigatória antes do login em ambientes existentes.
