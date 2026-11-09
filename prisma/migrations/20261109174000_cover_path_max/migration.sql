BEGIN TRY

BEGIN TRAN;

-- Capa pode ser path local, URL Blob ou data URL (piloto Vercel sem disco).
ALTER TABLE [comunicacao].[communications] ALTER COLUMN [coverPath] NVARCHAR(MAX) NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
