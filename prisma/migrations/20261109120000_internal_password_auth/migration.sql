BEGIN TRY

BEGIN TRAN;

-- Password hash for internal (email/password) login
ALTER TABLE [comunicacao].[users] ADD [passwordHash] NVARCHAR(1000) NULL;

-- Email becomes unique (replace non-unique index)
DROP INDEX [users_email_idx] ON [comunicacao].[users];

CREATE UNIQUE NONCLUSTERED INDEX [users_email_key] ON [comunicacao].[users]([email]);

COMMIT TRAN;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH;
