-- Aplicar no SQL Server após alocados.employees expor [email] e empresas 2,3,6,7.
-- Equivalente à migration 20261117170000_sync_use_employee_email.
-- Roles: 7 ativo → METARH(+COLLABORATOR); 2/3/6 ativos → COLLABORATOR;
--        inativos (corte 5 anos ou fora) → CANDIDATE; CLIENT nunca pelo sync.

SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE [comunicacao].[usp_SyncUsersFromErp]
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @now DATETIME2 = SYSUTCDATETIME();
  DECLARE @cut DATETIME2 = DATEADD(YEAR, -5, @now);

  IF OBJECT_ID(N'alocados.employees', N'V') IS NULL
     AND OBJECT_ID(N'alocados.employees', N'U') IS NULL
  BEGIN
    RAISERROR('Fonte alocados.employees não encontrada.', 16, 1);
    RETURN;
  END;

  ;WITH src AS (
    SELECT
      CAST(e.[id] AS INT) AS codigoFuncionario,
      LEFT(LTRIM(RTRIM(ISNULL(e.[nome], CONCAT(N'Funcionário ', CAST(e.[id] AS NVARCHAR(20)))))), 255) AS displayName,
      CASE
        WHEN e.[email] IS NOT NULL
          AND LTRIM(RTRIM(e.[email])) <> N''
          AND CHARINDEX(N'@', e.[email]) > 1
        THEN LOWER(LEFT(LTRIM(RTRIM(e.[email])), 255))
        ELSE LOWER(CONCAT(N'f', CAST(e.[id] AS NVARCHAR(20)), N'@erp.local'))
      END AS emailPref,
      CASE WHEN e.[is_ativo] = 1 THEN N'ACTIVE' ELSE N'INACTIVE' END AS contractStatus,
      CASE WHEN e.[is_ativo] = 1 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS isActive,
      CAST(e.[empresa] AS INT) AS empresa,
      LEFT(NULLIF(LTRIM(RTRIM(e.[grupo_economico])), N''), 120) AS economicGroup,
      LEFT(NULLIF(LTRIM(RTRIM(e.[cnpj_cliente])), N''), 18) AS cnpj,
      CASE
        WHEN e.[cod_cliente] IS NULL THEN NULL
        ELSE LEFT(CAST(e.[cod_cliente] AS NVARCHAR(64)), 64)
      END AS clientOrgId,
      CASE
        WHEN e.[empresa] IN (2, 6) THEN N'TEMPORARY'
        WHEN e.[empresa] = 3 THEN N'THIRD_PARTY'
        WHEN e.[empresa] = 7 THEN NULL
        WHEN e.[vinculo] LIKE N'%TEMP%' OR e.[vinculo] LIKE N'%Tempor%' THEN N'TEMPORARY'
        WHEN e.[vinculo] LIKE N'%TERC%' OR e.[vinculo] LIKE N'%Terceir%' THEN N'THIRD_PARTY'
        ELSE NULL
      END AS contractType
    FROM [alocados].[employees] AS e
    WHERE e.[is_ativo] = 1
       OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
  ),
  by_codigo AS (
    SELECT
      s.*,
      ROW_NUMBER() OVER (
        PARTITION BY s.codigoFuncionario
        ORDER BY s.isActive DESC, s.emailPref
      ) AS rnCodigo
    FROM src AS s
  ),
  one AS (
    SELECT * FROM by_codigo WHERE rnCodigo = 1
  ),
  email_rank AS (
    SELECT
      o.*,
      ROW_NUMBER() OVER (
        PARTITION BY o.emailPref
        ORDER BY o.isActive DESC, o.codigoFuncionario
      ) AS rnEmail
    FROM one AS o
  ),
  dedup AS (
    SELECT
      codigoFuncionario,
      displayName,
      CASE
        WHEN rnEmail = 1 THEN emailPref
        ELSE LOWER(CONCAT(N'f', CAST(codigoFuncionario AS NVARCHAR(20)), N'@erp.local'))
      END AS email,
      contractStatus,
      isActive,
      empresa,
      economicGroup,
      cnpj,
      clientOrgId,
      contractType
    FROM email_rank
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
      CONCAT(N'erp:', CAST(s.codigoFuncionario AS NVARCHAR(20))),
      CASE
        WHEN EXISTS (
          SELECT 1 FROM [comunicacao].[users] u3 WHERE u3.[email] = s.email
        )
        THEN LOWER(CONCAT(N'f', CAST(s.codigoFuncionario AS NVARCHAR(20)), N'@erp.local'))
        ELSE s.email
      END,
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

  /* Roles gerenciadas pelo sync (nunca CLIENT). */
  ;WITH role_src AS (
    SELECT
      u.[id] AS userId,
      CASE
        WHEN e.[is_ativo] <> 1 THEN N'CANDIDATE'
        WHEN e.[empresa] = 7 THEN N'METARH'
        WHEN e.[empresa] IN (2, 3, 6) THEN N'COLLABORATOR'
        ELSE N'COLLABORATOR'
      END AS syncPrimaryRole,
      ROW_NUMBER() OVER (
        PARTITION BY u.[id]
        ORDER BY CASE WHEN e.[is_ativo] = 1 THEN 1 ELSE 0 END DESC
      ) AS rn
    FROM [comunicacao].[users] AS u
    INNER JOIN [alocados].[employees] AS e
      ON CAST(e.[id] AS INT) = u.[codigoFuncionario]
    WHERE u.[codigoFuncionario] IS NOT NULL
      AND u.[lastSyncedAt] = @now
      AND (
        e.[is_ativo] = 1
        OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
      )
  ),
  touched AS (
    SELECT userId, syncPrimaryRole FROM role_src WHERE rn = 1
  )
  DELETE r
  FROM [comunicacao].[user_roles] AS r
  INNER JOIN touched AS t ON t.userId = r.[userId]
  WHERE r.[role] IN (N'COLLABORATOR', N'METARH', N'CANDIDATE');

  INSERT INTO [comunicacao].[user_roles] ([id], [userId], [role])
  SELECT
    CONVERT(NVARCHAR(36), NEWID()),
    t.userId,
    t.syncPrimaryRole
  FROM (
    SELECT
      u.[id] AS userId,
      CASE
        WHEN e.[is_ativo] <> 1 THEN N'CANDIDATE'
        WHEN e.[empresa] = 7 THEN N'METARH'
        WHEN e.[empresa] IN (2, 3, 6) THEN N'COLLABORATOR'
        ELSE N'COLLABORATOR'
      END AS syncPrimaryRole,
      ROW_NUMBER() OVER (
        PARTITION BY u.[id]
        ORDER BY CASE WHEN e.[is_ativo] = 1 THEN 1 ELSE 0 END DESC
      ) AS rn
    FROM [comunicacao].[users] AS u
    INNER JOIN [alocados].[employees] AS e
      ON CAST(e.[id] AS INT) = u.[codigoFuncionario]
    WHERE u.[codigoFuncionario] IS NOT NULL
      AND u.[lastSyncedAt] = @now
      AND (
        e.[is_ativo] = 1
        OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
      )
  ) AS t
  WHERE t.rn = 1
    AND NOT EXISTS (
      SELECT 1 FROM [comunicacao].[user_roles] r
      WHERE r.[userId] = t.userId AND r.[role] = t.syncPrimaryRole
    );

  /* METARH ativo também recebe COLLABORATOR (padrão da UI admin). */
  INSERT INTO [comunicacao].[user_roles] ([id], [userId], [role])
  SELECT
    CONVERT(NVARCHAR(36), NEWID()),
    r.[userId],
    N'COLLABORATOR'
  FROM [comunicacao].[user_roles] AS r
  INNER JOIN [comunicacao].[users] AS u ON u.[id] = r.[userId]
  WHERE r.[role] = N'METARH'
    AND u.[codigoFuncionario] IS NOT NULL
    AND u.[lastSyncedAt] = @now
    AND u.[active] = 1
    AND NOT EXISTS (
      SELECT 1 FROM [comunicacao].[user_roles] r2
      WHERE r2.[userId] = r.[userId] AND r2.[role] = N'COLLABORATOR'
    );

  UPDATE u
  SET
    u.[active] = 0,
    u.[contractStatus] = N'INACTIVE',
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

  /* Fora do corte: CANDIDATE; preserva CLIENT. */
  DELETE r
  FROM [comunicacao].[user_roles] AS r
  INNER JOIN [comunicacao].[users] AS u ON u.[id] = r.[userId]
  WHERE u.[codigoFuncionario] IS NOT NULL
    AND u.[lastSyncedAt] = @now
    AND u.[active] = 0
    AND NOT EXISTS (
      SELECT 1
      FROM [alocados].[employees] AS e
      WHERE CAST(e.[id] AS INT) = u.[codigoFuncionario]
        AND (
          e.[is_ativo] = 1
          OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
        )
    )
    AND r.[role] IN (N'COLLABORATOR', N'METARH', N'CANDIDATE');

  INSERT INTO [comunicacao].[user_roles] ([id], [userId], [role])
  SELECT
    CONVERT(NVARCHAR(36), NEWID()),
    u.[id],
    N'CANDIDATE'
  FROM [comunicacao].[users] AS u
  WHERE u.[codigoFuncionario] IS NOT NULL
    AND u.[lastSyncedAt] = @now
    AND u.[active] = 0
    AND NOT EXISTS (
      SELECT 1
      FROM [alocados].[employees] AS e
      WHERE CAST(e.[id] AS INT) = u.[codigoFuncionario]
        AND (
          e.[is_ativo] = 1
          OR (e.[data_demissao] IS NOT NULL AND e.[data_demissao] >= @cut)
        )
    )
    AND NOT EXISTS (
      SELECT 1 FROM [comunicacao].[user_roles] r
      WHERE r.[userId] = u.[id] AND r.[role] = N'CANDIDATE'
    )
    AND NOT EXISTS (
      SELECT 1 FROM [comunicacao].[user_roles] r
      WHERE r.[userId] = u.[id] AND r.[role] = N'CLIENT'
    );
END
GO

-- Smoke:
-- EXEC [comunicacao].[usp_SyncUsersFromErp];
