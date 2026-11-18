# ADR-011 — Sync ERP → usuários METARH NEWS

## Status

Aceito (2026-11-17); roles por empresa/ativo atualizados no mesmo dia.

## Contexto

Atributos de RH estavam locais (ADR-010). O ETL (Azure Data Factory) já carrega fatos do ERP em `dbo` (TRUNCATE + INSERT) e existe a view `alocados.employees`. A app precisa de usuários alinhados a essa fonte, sem trigger na carga e sem FK para view.

## Decisão

1. **Sync pós-ETL:** procedure `[comunicacao].[usp_SyncUsersFromErp]` + bootstrap de senha no app (`/api/cron/sync-erp-users`). ADF chama após `Loop_Tabelas` Succeeded (quando `TB_Funcionario.Email` / telefone / sexo já estão no CSV→dbo).
2. **Fonte:** view `alocados.employees` (empresas **2, 3, 6, 7**). E-mail de login = coluna `[email]` (`TB_Funcionario.Email`). `CampoLivre_01` / `email_corporativo` **não** alimenta `users.email`. Vazio/inválido → sintético `f{codigo}@erp.local`. Duplicata de e-mail no lote → 1º mantém o real; demais recebem sintético.
3. **Elegíveis:** `is_ativo = 1` + demitidos com `data_demissao` nos últimos 5 anos.
4. **Vínculo:** `users.codigoFuncionario` (INT único, lógico — sem FK à view).
5. **Login:** e-mail (`[email]` da view) **ou** código do funcionário.
6. **contractType por empresa:** 2 e 6 → `TEMPORARY`; 3 → `THIRD_PARTY`; 7 (Meta RH interno) → `NULL` (fallback por texto de `vinculo` se empresa não mapear).
7. **Senha:** temp `METARH#{codigo}` no primeiro INSERT; `mustChangePassword = true`; troca em `/trocar-senha`. Sync **não** sobrescreve senha já trocada. Reset admin volta ao padrão + flag.
8. **Papéis (sync gerencia COLLABORATOR / METARH / CANDIDATE; nunca CLIENT):**
   - Empresa **7** ativo → `METARH` + `COLLABORATOR` (internos Meta RH).
   - Empresas **2, 3, 6** ativos → `COLLABORATOR`.
   - Inativos no corte (ou fora do elegível) → `CANDIDATE` (acesso a vagas / perfil sem contrato ativo).
   - `CLIENT` **fora deste sync** — clientes não vêm de `alocados.employees`; cadastro manual à parte. A procedure não atribui nem remove `CLIENT`.
9. **Fora do corte:** some do conjunto elegível → `active = 0`, `contractStatus = INACTIVE`, role sync → `CANDIDATE` (sem delete do usuário).

## Consequências

- Admin ainda pode ajustar exceções; campos RH vindos do ERP ficam read-only na UI para usuários sincronizados.
- Roles sync sobrescrevem COLLABORATOR/METARH/CANDIDATE a cada run para quem tem `codigoFuncionario`; `CLIENT` é preservado.
- bcrypt fica no Node (API pós-procedure); T-SQL não gera hash compatível.
- Documentar activity ADF em `docs/erp-sync-adf.md`.
- Migration / script: `20261117170000_sync_use_employee_email` e `scripts/sql/alter_usp_SyncUsersFromErp.sql`.
