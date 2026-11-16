IF OBJECT_ID(N'[comunicacao].[faq_entries]', N'U') IS NULL
BEGIN
  CREATE TABLE [comunicacao].[faq_entries] (
    [id] NVARCHAR(1000) NOT NULL,
    [question] NVARCHAR(300) NOT NULL,
    [answer] NVARCHAR(max) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [faq_entries_sortOrder_df] DEFAULT 0,
    [active] BIT NOT NULL CONSTRAINT [faq_entries_active_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [faq_entries_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [faq_entries_pkey] PRIMARY KEY CLUSTERED ([id])
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'faq_entries_active_sortOrder_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[faq_entries]')
)
  CREATE INDEX [faq_entries_active_sortOrder_idx]
    ON [comunicacao].[faq_entries]([active], [sortOrder]);

IF OBJECT_ID(N'[comunicacao].[useful_link_entries]', N'U') IS NULL
BEGIN
  CREATE TABLE [comunicacao].[useful_link_entries] (
    [id] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(160) NOT NULL,
    [href] NVARCHAR(500) NOT NULL,
    [description] NVARCHAR(300) NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [useful_link_entries_sortOrder_df] DEFAULT 0,
    [active] BIT NOT NULL CONSTRAINT [useful_link_entries_active_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [useful_link_entries_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [useful_link_entries_pkey] PRIMARY KEY CLUSTERED ([id])
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'useful_link_entries_active_sortOrder_idx'
    AND object_id = OBJECT_ID(N'[comunicacao].[useful_link_entries]')
)
  CREATE INDEX [useful_link_entries_active_sortOrder_idx]
    ON [comunicacao].[useful_link_entries]([active], [sortOrder]);
