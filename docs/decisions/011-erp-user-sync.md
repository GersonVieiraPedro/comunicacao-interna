# ADR-011 — Sync ERP → usuários METARH NEWS

## Status

Aceito (2026-11-17)

## Contexto

Atributos de RH estavam locais (ADR-010). O ETL (Azure Data Factory) já carrega fatos do ERP em `dbo` (TRUNCATE + INSERT) e existe a view `alocados.employees`. A app precisa de usuários alinhados a essa fonte, sem trigger na carga e sem FK para view.

## Decisão

1. **Sync pós-ETL:** procedure `[comunicacao].[usp_SyncUsersFromErp]` + bootstrap de senha no app (`/api/cron/sync-erp-users`). ADF chama após `Loop_Tabelas` Succeeded.
2. **Elegíveis:** todos `is_ativo = 1` + demitidos com `data_demissao` nos últimos 5 anos (view já filtra empresas 2, 3, 6).
3. **Vínculo:** `users.codigoFuncionario` (INT único, lógico — sem FK à view).
4. **Login:** usuário = e-mail corporativo **ou** código do funcionário.
5. **Senha:** temp determinística `METARH#{codigo}` no primeiro INSERT; `mustChangePassword = true`; troca obrigatória em `/trocar-senha`. Sync **não** sobrescreve senha já trocada. Reset admin volta ao padrão + flag.
6. **Papéis:** sync cria/mantém `COLLABORATOR`; `METARH`/`CLIENT` só manuais e não são removidos pelo sync. `contractStatus` ACTIVE/INACTIVE a partir de `is_ativo`.
7. **Fora do corte:** usuário com `codigoFuncionario` que some do conjunto elegível → `active = 0`, `contractStatus = INACTIVE` (sem delete).

## Consequências

- Admin edita papéis/acesso/senha; campos RH vindos do ERP ficam read-only na UI para usuários sincronizados.
- bcrypt fica no Node (API pós-procedure); T-SQL não gera hash compatível.
- Documentar activity ADF em `docs/erp-sync-adf.md`.
