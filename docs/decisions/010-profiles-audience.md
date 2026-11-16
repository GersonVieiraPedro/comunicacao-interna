# ADR-010 — Quatro perfis, atributos RH locais e audiência filtrada

## Status

Aceito (2026-11-16)

## Contexto

O product original previa só Colaborador e Comunicador com `audienceType = ALL`.
O negócio MetaRH exige quatro perfis (METARH, Cliente, Colaborador, Candidato),
bloco institucional de redes/site/YouTube, e filtros de disparo por atributos de contrato/RH.

Não há integração ERP/folha neste ciclo.

## Decisão

1. **Papéis persistidos:** `METARH` | `CLIENT` | `COLLABORATOR` | `CANDIDATE`.
   - `METARH` substitui `COMMUNICATOR` (migração de dados: string de papel).
   - Alias de leitura: valores legados `COMMUNICATOR` normalizam para `METARH`.
2. **Atributos de RH no `User` (local):** `contractStatus`, `contractType`, `economicGroup`,
   `cnpj`, `healthPlan`, `reimbursementCard`, `clientOrgId`. Editáveis pelo perfil METARH.
   Sync externo fica fora de escopo.
3. **Perfil efetivo:** se `contractStatus` ≠ `ACTIVE` (ou nulo quando o papel base não é METARH/CLIENT),
   o perfil efetivo de consumo é `CANDIDATE`.
4. **Audiência:** `ALL` | `FILTERED`. Critérios em `communication_targets` com
   `targetType` ∈ `CONTRACT_STATUS` | `CONTRACT_TYPE` | `ECONOMIC_GROUP` | `CNPJ` |
   `HEALTH_PLAN` | `REIMBURSEMENT_CARD` | `USER_ID` | `ROLE`. Critérios preenchidos combinam com AND.
5. **Institucional / CS / pesquisas / Selecty:** config tipada (`src/config/*`) + env;
   sem WhatsApp API nem scraping Selecty.

## Consequências

- Fan-out e visibilidade passam a resolver elegíveis por targets quando `FILTERED`.
- Admin de usuários passa a editar atributos de RH e papéis ampliados.
- Menus e home diferem por perfil efetivo.
