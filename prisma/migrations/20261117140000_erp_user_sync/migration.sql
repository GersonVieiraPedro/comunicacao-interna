-- Sync ERP: campos em users + procedure MERGE
-- Sem GO. Cada ALTER/INDEX em EXEC próprio (SQL Server compila o batch inteiro).

IF COL_LENGTH('comunicacao.users', 'codigoFuncionario') IS NULL
  EXEC(N'ALTER TABLE [comunicacao].[users] ADD [codigoFuncionario] INT NULL');

IF COL_LENGTH('comunicacao.users', 'mustChangePassword') IS NULL
  EXEC(N'ALTER TABLE [comunicacao].[users] ADD [mustChangePassword] BIT NOT NULL CONSTRAINT [DF_users_mustChangePassword] DEFAULT 0');

IF COL_LENGTH('comunicacao.users', 'passwordUpdatedAt') IS NULL
  EXEC(N'ALTER TABLE [comunicacao].[users] ADD [passwordUpdatedAt] DATETIME2 NULL');

IF COL_LENGTH('comunicacao.users', 'lastSyncedAt') IS NULL
  EXEC(N'ALTER TABLE [comunicacao].[users] ADD [lastSyncedAt] DATETIME2 NULL');

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'users_codigoFuncionario_key' AND object_id = OBJECT_ID(N'comunicacao.users')
)
  EXEC(N'CREATE UNIQUE INDEX [users_codigoFuncionario_key] ON [comunicacao].[users]([codigoFuncionario]) WHERE [codigoFuncionario] IS NOT NULL');

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'users_mustChangePassword_idx' AND object_id = OBJECT_ID(N'comunicacao.users')
)
  EXEC(N'CREATE INDEX [users_mustChangePassword_idx] ON [comunicacao].[users]([mustChangePassword])');

EXEC(N'
CREATE OR ALTER PROCEDURE [comunicacao].[usp_SyncUsersFromErp]
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @now DATETIME2 = SYSUTCDATETIME();
  DECLARE @cut DATETIME2 = DATEADD(YEAR, -5, @now);

  IF OBJECT_ID(N''alocados.employees'', N''V'') IS NULL
     AND OBJECT_ID(N''alocados.employees'', N''U'') IS NULL
  BEGIN
    RAISERROR(''Fonte alocados.employees não encontrada.'', 16, 1);
    RETURN;
  END;

  ;WITH src AS (
    SELECT
      CAST(e.[id] AS INT) AS codigoFuncionario,
      LEFT(LTRIM(RTRIM(ISNULL(e.[nome], CONCAT(N''Funcionário '', CAST(e.[id] AS NVARCHAR(20)))))), 255) AS displayName,
      CASE
        WHEN e.[email_corporativo] IS NOT NULL
          AND LTRIM(RTRIM(e.[email_corporativo])) <> N''''
          AND CHARINDEX(N''@'', e.[email_corporativo]) > 1
        THEN LOWER(LEFT(LTRIM(RTRIM(e.[email_corporativo])), 255))
        ELSE LOWER(CONCAT(N''f'', CAST(e.[id] AS NVARCHAR(20)), N''@erp.local''))
      END AS email,
      CASE WHEN e.[is_ativo] = 1 THEN N''ACTIVE'' ELSE N''INACTIVE'' END AS contractStatus,
      CASE WHEN e.[is_ativo] = 1 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS isActive,
      LEFT(NULLIF(LTRIM(RTRIM(e.[grupo_economico])), N''''), 120) AS economicGroup,
      LEFT(NULLIF(LTRIM(RTRIM(e.[cnpj_cliente])), N''''), 18) AS cnpj,
      CASE
        WHEN e.[cod_cliente] IS NULL THEN NULL
        ELSE LEFT(CAST(e.[cod_cliente] AS NVARCHAR(64)), 64)
      END AS clientOrgId,
      CASE
        WHEN e.[vinculo] LIKE N''%TEMP%'' OR e.[vinculo] LIKE N''%Tempor%'' THEN N''TEMPORARY''
        WHEN e.[vinculo] LIKE N''%TERC%'' OR e.[vinculo] LIKE N''%Terceir%'' THEN N''THIRD_PARTY''
        ELSE NULL
      END AS contractType
    FROM [alocados].[employees] AS e
    WHERE e.[is_ativo] = 1
       OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
  ),
  dedup AS (
    SELECT *
    FROM (
      SELECT
        s.*,
        ROW_NUMBER() OVER (
          PARTITION BY s.codigoFuncionario
          ORDER BY s.isActive DESC, s.email
        ) AS rn
      FROM src AS s
    ) x
    WHERE x.rn = 1
  )
  MERGE [comunicacao].[users] AS t
  USING dedup AS s
    ON t.[codigoFuncionario] = s.codigoFuncionario
  WHEN MATCHED THEN
    UPDATE SET
      t.[displayName] = s.displayName,
      t.[email] = CASE
        WHEN EXISTS (
          SELECT 1 FROM [comunicacao].[users] u2
          WHERE u2.[email] = s.email AND u2.[id] <> t.[id]
        ) THEN t.[email]
        ELSE s.email
      END,
      t.[contractStatus] = s.contractStatus,
      t.[contractType] = s.contractType,
      t.[economicGroup] = s.economicGroup,
      t.[cnpj] = s.cnpj,
      t.[clientOrgId] = s.clientOrgId,
      t.[active] = s.isActive,
      t.[lastSyncedAt] = @now,
      t.[updatedAt] = @now
  WHEN NOT MATCHED BY TARGET THEN
    INSERT (
      [id],
      [entraObjectId],
      [email],
      [displayName],
      [codigoFuncionario],
      [passwordHash],
      [mustChangePassword],
      [active],
      [contractStatus],
      [contractType],
      [economicGroup],
      [cnpj],
      [clientOrgId],
      [lastSyncedAt],
      [createdAt],
      [updatedAt]
    )
    VALUES (
      CONVERT(NVARCHAR(36), NEWID()),
      CONCAT(N''erp:'', CAST(s.codigoFuncionario AS NVARCHAR(20))),
      s.email,
      s.displayName,
      s.codigoFuncionario,
      NULL,
      1,
      s.isActive,
      s.contractStatus,
      s.contractType,
      s.economicGroup,
      s.cnpj,
      s.clientOrgId,
      @now,
      @now,
      @now
    );

  INSERT INTO [comunicacao].[user_roles] ([id], [userId], [role])
  SELECT
    CONVERT(NVARCHAR(36), NEWID()),
    u.[id],
    N''COLLABORATOR''
  FROM [comunicacao].[users] AS u
  WHERE u.[codigoFuncionario] IS NOT NULL
    AND u.[lastSyncedAt] = @now
    AND NOT EXISTS (
      SELECT 1 FROM [comunicacao].[user_roles] r WHERE r.[userId] = u.[id]
    );

  UPDATE u
  SET
    u.[active] = 0,
    u.[contractStatus] = N''INACTIVE'',
    u.[lastSyncedAt] = @now,
    u.[updatedAt] = @now
  FROM [comunicacao].[users] AS u
  WHERE u.[codigoFuncionario] IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM [alocados].[employees] AS e
      WHERE CAST(e.[id] AS INT) = u.[codigoFuncionario]
        AND (
          e.[is_ativo] = 1
          OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
        )
    );

  SELECT
    (SELECT COUNT(*) FROM [comunicacao].[users] WHERE [codigoFuncionario] IS NOT NULL AND [lastSyncedAt] = @now) AS touched,
    (SELECT COUNT(*) FROM [comunicacao].[users] WHERE [codigoFuncionario] IS NOT NULL AND [passwordHash] IS NULL AND [mustChangePassword] = 1) AS pendingTempPassword;
END
');
