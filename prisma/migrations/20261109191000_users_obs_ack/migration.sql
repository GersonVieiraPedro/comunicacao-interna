BEGIN TRY

BEGIN TRAN;

ALTER TABLE [comunicacao].[users] ADD [active] BIT NOT NULL CONSTRAINT [users_active_df] DEFAULT 1;

ALTER TABLE [comunicacao].[communication_reads] ADD [acknowledgedAt] DATETIME2;

ALTER TABLE [comunicacao].[notifications] ADD [openedAt] DATETIME2;

CREATE NONCLUSTERED INDEX [communication_reads_communicationId_acknowledgedAt_idx]
ON [comunicacao].[communication_reads]([communicationId], [acknowledgedAt]);

CREATE NONCLUSTERED INDEX [notifications_communicationId_openedAt_idx]
ON [comunicacao].[notifications]([communicationId], [openedAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
