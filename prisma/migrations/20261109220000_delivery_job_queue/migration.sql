BEGIN TRY

BEGIN TRAN;

-- Idempotência: remove duplicatas de notificação antes do unique
;WITH ranked AS (
  SELECT
    [id],
    ROW_NUMBER() OVER (
      PARTITION BY [userId], [communicationId]
      ORDER BY [createdAt] ASC, [id] ASC
    ) AS rn
  FROM [comunicacao].[notifications]
)
DELETE FROM ranked WHERE rn > 1;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'notifications_userId_communicationId_key'
    AND object_id = OBJECT_ID(N'comunicacao.notifications')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX [notifications_userId_communicationId_key]
  ON [comunicacao].[notifications]([userId], [communicationId]);
END;

IF OBJECT_ID(N'comunicacao.delivery_jobs', N'U') IS NULL
BEGIN
  CREATE TABLE [comunicacao].[delivery_jobs] (
      [id] NVARCHAR(1000) NOT NULL,
      [type] NVARCHAR(1000) NOT NULL,
      [communicationId] NVARCHAR(1000) NOT NULL,
      [status] NVARCHAR(1000) NOT NULL,
      [cursor] NVARCHAR(Max),
      [attempts] INT NOT NULL CONSTRAINT [delivery_jobs_attempts_df] DEFAULT 0,
      [lastError] NVARCHAR(500),
      [availableAt] DATETIME2 NOT NULL CONSTRAINT [delivery_jobs_availableAt_df] DEFAULT CURRENT_TIMESTAMP,
      [startedAt] DATETIME2,
      [completedAt] DATETIME2,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [delivery_jobs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL,
      CONSTRAINT [delivery_jobs_pkey] PRIMARY KEY CLUSTERED ([id])
  );

  CREATE NONCLUSTERED INDEX [delivery_jobs_status_availableAt_idx]
  ON [comunicacao].[delivery_jobs]([status], [availableAt]);

  CREATE NONCLUSTERED INDEX [delivery_jobs_communicationId_type_idx]
  ON [comunicacao].[delivery_jobs]([communicationId], [type]);

  ALTER TABLE [comunicacao].[delivery_jobs]
  ADD CONSTRAINT [delivery_jobs_communicationId_fkey]
  FOREIGN KEY ([communicationId]) REFERENCES [comunicacao].[communications]([id])
  ON DELETE CASCADE
  ON UPDATE CASCADE;
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
