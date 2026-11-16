-- SQL Server: novas colunas e UPDATEs que as referenciam precisam de batches separados (EXEC).

IF COL_LENGTH('comunicacao.users', 'contractStatus') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [contractStatus] NVARCHAR(32) NULL;

IF COL_LENGTH('comunicacao.users', 'contractType') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [contractType] NVARCHAR(32) NULL;

IF COL_LENGTH('comunicacao.users', 'economicGroup') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [economicGroup] NVARCHAR(120) NULL;

IF COL_LENGTH('comunicacao.users', 'cnpj') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [cnpj] NVARCHAR(18) NULL;

IF COL_LENGTH('comunicacao.users', 'healthPlan') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [healthPlan] NVARCHAR(120) NULL;

IF COL_LENGTH('comunicacao.users', 'reimbursementCard') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [reimbursementCard] NVARCHAR(120) NULL;

IF COL_LENGTH('comunicacao.users', 'clientOrgId') IS NULL
  ALTER TABLE [comunicacao].[users] ADD [clientOrgId] NVARCHAR(64) NULL;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'users_contractStatus_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[users]')
)
  CREATE INDEX [users_contractStatus_idx] ON [comunicacao].[users]([contractStatus]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'users_cnpj_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[users]')
)
  CREATE INDEX [users_cnpj_idx] ON [comunicacao].[users]([cnpj]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'users_economicGroup_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[users]')
)
  CREATE INDEX [users_economicGroup_idx] ON [comunicacao].[users]([economicGroup]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'users_clientOrgId_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[users]')
)
  CREATE INDEX [users_clientOrgId_idx] ON [comunicacao].[users]([clientOrgId]);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'communication_targets_targetType_targetValue_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[communication_targets]')
)
  CREATE INDEX [communication_targets_targetType_targetValue_idx]
    ON [comunicacao].[communication_targets]([targetType], [targetValue]);

EXEC(N'
UPDATE [comunicacao].[user_roles]
SET [role] = N''METARH''
WHERE [role] = N''COMMUNICATOR'';
');

EXEC(N'
UPDATE [comunicacao].[users]
SET [contractStatus] = N''ACTIVE''
WHERE [contractStatus] IS NULL
  AND EXISTS (
    SELECT 1 FROM [comunicacao].[user_roles] ur
    WHERE ur.[userId] = [comunicacao].[users].[id]
      AND ur.[role] IN (N''COLLABORATOR'', N''METARH'')
  );
');
