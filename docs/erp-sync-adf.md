# ADF — Sync usuários após carga ERP

## Quando

Depois que `pl_master_orquestrador_carga` terminar o `Loop_Tabelas` com sucesso (TRUNCATE+INSERT em `dbo` + view `alocados.employees` consistente).

## Activity sugerida no master

1. **Script** (linked service SQL do `database-all-apps`):

```sql
EXEC [comunicacao].[usp_SyncUsersFromErp];
```

`dependsOn`: `Loop_Tabelas` → `Succeeded`.

2. **WebActivity** (opcional mas recomendado — bcrypt no Node):

- Method: `POST`
- URL: `https://<app>/api/cron/sync-erp-users`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Body: `{ "bootstrapPasswords": true }`
- `dependsOn`: Script sync → `Succeeded`

A WebActivity aplica `METARH#{codigo}` (bcrypt) em usuários novos com `passwordHash` null e `mustChangePassword = 1`.

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
- Falha do sync: reutilize o padrão `SendEmailFalha` do pipeline filho se desejar alerta.
