# ADF — Sync usuários após carga ERP

Guia completo (lógica, roles, senhas, diagnóstico, FAQ): [`erp-user-sync.md`](erp-user-sync.md).  
Diagnóstico SQL: `scripts/sql/diagnostics-erp-user-sync.sql`.

## Quando

Depois que `pl_master_orquestrador_carga` terminar o `Loop_Tabelas` com sucesso (TRUNCATE+INSERT em `dbo` + view `alocados.employees` consistente).

## Activity sugerida no master

1. **Script** (linked service SQL do `database-all-apps`):

```sql
EXEC [comunicacao].[usp_SyncUsersFromErp];
```

`dependsOn`: `Loop_Tabelas` → `Succeeded`.

2. **WebActivity** (opcional — bcrypt no Node; **depois** do Script):

- Method: `POST`
- URL: `https://<app>/api/cron/sync-erp-users`
- Header: `Authorization: Bearer <CRON_SECRET>` (sem espaço extra)
- Body (recomendado — MERGE já rodou no Script):

```json
{ "passwordsOnly": true, "batchSize": 100 }
```

- `dependsOn`: Script sync → `Succeeded`
- Timeout da activity: ≥ 60–90s

**Não** use body vazio/`bootstrapPasswords` sem `passwordsOnly` se o Script já executou o MERGE: isso refaz `EXEC usp_SyncUsersFromErp` na API e, se falhar, o ADF só via `INTERNAL` genérico (antes do deploy com `step`/`detail`/`hint`).

### Armadilhas ADF (WebActivity)

1. **`@` no `CRON_SECRET`:** o Data Factory trata `@` como início de expressão. No header, escape como `@@` (um `@` literal). Ex.: secret `abc@xyz` → `Bearer abc@@xyz`.
2. **Body:** preferir expressão para garantir JSON:
   - `@json('{"passwordsOnly":true,"batchSize":100}')`
3. **Secret:** não hardcode no JSON do pipeline; use Azure Key Vault / parâmetro seguro.
4. Resposta de erro (após deploy): `{ "code": "ERP_SYNC_FAILED", "step": "...", "detail": "...", "hint": "..." }`.

A WebActivity só hasheia pendentes (`passwordHash` null). Com backlog zerado, retorna rápido `updated: 0`, `done: true`.

## Trecho JSON (referência)

```json
{
  "name": "Sync_Users_Comunicacao",
  "type": "Script",
  "dependsOn": [
    {
      "activity": "Loop_Tabelas",
      "dependencyConditions": ["Succeeded"]
    }
  ],
  "typeProperties": {
    "scripts": [
      {
        "type": "Query",
        "text": "EXEC [comunicacao].[usp_SyncUsersFromErp];"
      }
    ]
  }
}
```

## Observações

- Não use trigger em `TB_Funcionario`: a carga é TRUNCATE + INSERT.
- Não há FK para a view; o vínculo é `comunicacao.users.codigoFuncionario`.
- A procedure usa `alocados.employees.[email]` (`TB_Funcionario.Email` no CSV), **não** `email_corporativo` / `CampoLivre_01`.
- View deve filtrar `CodigoEmpresa IN (2, 3, 6, 7)` (7 = internos Meta RH).
- **Roles no sync:** empresa 7 ativo → `METARH`(+`COLLABORATOR`); 2/3/6 ativos → `COLLABORATOR`; inativos → `CANDIDATE`. `CLIENT` não vem do ERP.
- Rodar o Script **depois** da carga que já inclui Email/Telefone/Sexo no CSV (a partir ~16:40).
- Falha do sync: reutilize o padrão `SendEmailFalha` do pipeline filho se desejar alerta.
- Migration: `prisma/migrations/20261117170000_sync_use_employee_email`.
- Script manual: `scripts/sql/alter_usp_SyncUsersFromErp.sql` → depois `EXEC [comunicacao].[usp_SyncUsersFromErp];`.
