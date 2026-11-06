BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'comunicacao') EXEC sp_executesql N'CREATE SCHEMA [comunicacao];';

-- CreateTable
CREATE TABLE [comunicacao].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [entraObjectId] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [displayName] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_entraObjectId_key] UNIQUE NONCLUSTERED ([entraObjectId])
);

-- CreateTable
CREATE TABLE [comunicacao].[user_roles] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [user_roles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_roles_userId_role_key] UNIQUE NONCLUSTERED ([userId],[role])
);

-- CreateTable
CREATE TABLE [comunicacao].[communication_categories] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [communication_categories_sortOrder_df] DEFAULT 0,
    CONSTRAINT [communication_categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [communication_categories_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [comunicacao].[communications] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [subtitle] NVARCHAR(300),
    [summary] NVARCHAR(500) NOT NULL,
    [bodyHtml] NVARCHAR(max) NOT NULL,
    [coverPath] NVARCHAR(500),
    [categoryId] NVARCHAR(1000) NOT NULL,
    [authorUserId] NVARCHAR(1000) NOT NULL,
    [publishedByUserId] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL,
    [priority] NVARCHAR(1000) NOT NULL,
    [audienceType] NVARCHAR(1000) NOT NULL CONSTRAINT [communications_audienceType_df] DEFAULT 'ALL',
    [scheduledPublishAt] DATETIME2,
    [publishedAt] DATETIME2,
    [expiresAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [communications_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [communications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [comunicacao].[communication_targets] (
    [id] NVARCHAR(1000) NOT NULL,
    [communicationId] NVARCHAR(1000) NOT NULL,
    [targetType] NVARCHAR(1000) NOT NULL,
    [targetValue] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [communication_targets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [comunicacao].[communication_reads] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [communicationId] NVARCHAR(1000) NOT NULL,
    [firstViewedAt] DATETIME2 NOT NULL CONSTRAINT [communication_reads_firstViewedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lastViewedAt] DATETIME2 NOT NULL CONSTRAINT [communication_reads_lastViewedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [viewCount] INT NOT NULL CONSTRAINT [communication_reads_viewCount_df] DEFAULT 1,
    CONSTRAINT [communication_reads_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [communication_reads_userId_communicationId_key] UNIQUE NONCLUSTERED ([userId],[communicationId])
);

-- CreateTable
CREATE TABLE [comunicacao].[push_subscriptions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [endpoint] NVARCHAR(max) NOT NULL,
    [endpointHash] NVARCHAR(1000) NOT NULL,
    [p256dh] NVARCHAR(1000) NOT NULL,
    [auth] NVARCHAR(1000) NOT NULL,
    [userAgent] NVARCHAR(500),
    [active] BIT NOT NULL CONSTRAINT [push_subscriptions_active_df] DEFAULT 1,
    [lastUsedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [push_subscriptions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [push_subscriptions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [push_subscriptions_endpointHash_key] UNIQUE NONCLUSTERED ([endpointHash])
);

-- CreateTable
CREATE TABLE [comunicacao].[notifications] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [communicationId] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [body] NVARCHAR(500) NOT NULL,
    [readAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notifications_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [notifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [comunicacao].[notification_deliveries] (
    [id] NVARCHAR(1000) NOT NULL,
    [communicationId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [channel] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [errorCode] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notification_deliveries_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [notification_deliveries_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [comunicacao].[audit_events] (
    [id] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [actorUserId] NVARCHAR(1000),
    [communicationId] NVARCHAR(1000),
    [metadata] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [audit_events_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_events_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_email_idx] ON [comunicacao].[users]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [communications_status_publishedAt_idx] ON [comunicacao].[communications]([status], [publishedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [communications_categoryId_idx] ON [comunicacao].[communications]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [communications_authorUserId_idx] ON [comunicacao].[communications]([authorUserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [communications_priority_publishedAt_idx] ON [comunicacao].[communications]([priority], [publishedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [communication_targets_communicationId_idx] ON [comunicacao].[communication_targets]([communicationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [communication_reads_communicationId_idx] ON [comunicacao].[communication_reads]([communicationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [push_subscriptions_userId_active_idx] ON [comunicacao].[push_subscriptions]([userId], [active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_userId_createdAt_idx] ON [comunicacao].[notifications]([userId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_userId_readAt_idx] ON [comunicacao].[notifications]([userId], [readAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notification_deliveries_communicationId_channel_idx] ON [comunicacao].[notification_deliveries]([communicationId], [channel]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notification_deliveries_status_createdAt_idx] ON [comunicacao].[notification_deliveries]([status], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_events_communicationId_createdAt_idx] ON [comunicacao].[audit_events]([communicationId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_events_actorUserId_createdAt_idx] ON [comunicacao].[audit_events]([actorUserId], [createdAt]);

-- AddForeignKey
ALTER TABLE [comunicacao].[user_roles] ADD CONSTRAINT [user_roles_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [comunicacao].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[communications] ADD CONSTRAINT [communications_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [comunicacao].[communication_categories]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[communications] ADD CONSTRAINT [communications_authorUserId_fkey] FOREIGN KEY ([authorUserId]) REFERENCES [comunicacao].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [comunicacao].[communications] ADD CONSTRAINT [communications_publishedByUserId_fkey] FOREIGN KEY ([publishedByUserId]) REFERENCES [comunicacao].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [comunicacao].[communication_targets] ADD CONSTRAINT [communication_targets_communicationId_fkey] FOREIGN KEY ([communicationId]) REFERENCES [comunicacao].[communications]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[communication_reads] ADD CONSTRAINT [communication_reads_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [comunicacao].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[communication_reads] ADD CONSTRAINT [communication_reads_communicationId_fkey] FOREIGN KEY ([communicationId]) REFERENCES [comunicacao].[communications]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[push_subscriptions] ADD CONSTRAINT [push_subscriptions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [comunicacao].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[notifications] ADD CONSTRAINT [notifications_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [comunicacao].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[notifications] ADD CONSTRAINT [notifications_communicationId_fkey] FOREIGN KEY ([communicationId]) REFERENCES [comunicacao].[communications]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[notification_deliveries] ADD CONSTRAINT [notification_deliveries_communicationId_fkey] FOREIGN KEY ([communicationId]) REFERENCES [comunicacao].[communications]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [comunicacao].[notification_deliveries] ADD CONSTRAINT [notification_deliveries_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [comunicacao].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [comunicacao].[audit_events] ADD CONSTRAINT [audit_events_actorUserId_fkey] FOREIGN KEY ([actorUserId]) REFERENCES [comunicacao].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [comunicacao].[audit_events] ADD CONSTRAINT [audit_events_communicationId_fkey] FOREIGN KEY ([communicationId]) REFERENCES [comunicacao].[communications]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
