-- Diagnóstico: volume e cobertura do sync ERP → comunicacao.users
-- Fonte: alocados.employees (empresas 2, 3, 6, 7) + corte 5 anos.
-- Uso: SSMS / Azure Data Studio no database-all-apps (mesmo banco da app).

SET NOCOUNT ON;

DECLARE @cut DATETIME2 = DATEADD(YEAR, -5, SYSUTCDATETIME());

PRINT N'=== 1) Total elegível ao sync (+ quebra) ===';
SELECT
  COUNT(*) AS total_elegiveis,
  SUM(CASE WHEN e.is_ativo = 1 THEN 1 ELSE 0 END) AS ativos,
  SUM(CASE WHEN e.is_ativo = 0 OR e.is_ativo IS NULL THEN 1 ELSE 0 END) AS inativos_corte_5anos,
  SUM(CASE WHEN e.empresa = 7 AND e.is_ativo = 1 THEN 1 ELSE 0 END) AS metarh_ativos_emp7,
  SUM(CASE WHEN e.empresa IN (2, 3, 6) AND e.is_ativo = 1 THEN 1 ELSE 0 END) AS colaboradores_ativos_2_3_6,
  SUM(CASE
        WHEN e.is_ativo = 1
         AND e.email IS NOT NULL
         AND LTRIM(RTRIM(e.email)) <> N''
         AND CHARINDEX(N'@', e.email) > 1
        THEN 1 ELSE 0
      END) AS com_email_valido,
  SUM(CASE
        WHEN e.is_ativo = 1
         AND (
           e.email IS NULL
           OR LTRIM(RTRIM(e.email)) = N''
           OR CHARINDEX(N'@', e.email) <= 1
         )
        THEN 1 ELSE 0
      END) AS ativos_sem_email
FROM alocados.employees AS e
WHERE e.is_ativo = 1
   OR (e.data_demissao IS NOT NULL AND e.data_demissao >= @cut);

PRINT N'=== 2) Por empresa ===';
SELECT
  e.empresa,
  SUM(CASE WHEN e.is_ativo = 1 THEN 1 ELSE 0 END) AS ativos,
  SUM(CASE WHEN NOT (e.is_ativo = 1) THEN 1 ELSE 0 END) AS inativos_no_corte,
  COUNT(*) AS total
FROM alocados.employees AS e
WHERE e.is_ativo = 1
   OR (e.data_demissao IS NOT NULL AND e.data_demissao >= @cut)
GROUP BY e.empresa
ORDER BY e.empresa;

PRINT N'=== 3) Já existem em users vs novos (INSERT potencial) ===';
SELECT
  SUM(CASE WHEN u.codigoFuncionario IS NOT NULL THEN 1 ELSE 0 END) AS ja_existem_em_users,
  SUM(CASE WHEN u.codigoFuncionario IS NULL THEN 1 ELSE 0 END) AS novos_a_inserir
FROM alocados.employees AS e
LEFT JOIN comunicacao.users AS u
  ON u.codigoFuncionario = CAST(e.id AS INT)
WHERE e.is_ativo = 1
   OR (e.data_demissao IS NOT NULL AND e.data_demissao >= @cut);

PRINT N'=== 4) Senhas pendentes de bootstrap (bcrypt) ===';
SELECT COUNT(*) AS pendentes_senha
FROM comunicacao.users
WHERE codigoFuncionario IS NOT NULL
  AND passwordHash IS NULL
  AND mustChangePassword = 1;

PRINT N'=== 5) Usuários ERP já sincronizados (amostra de saúde) ===';
SELECT
  COUNT(*) AS users_com_codigo,
  SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_1,
  SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) AS active_0,
  SUM(CASE WHEN passwordHash IS NULL THEN 1 ELSE 0 END) AS sem_hash,
  SUM(CASE WHEN email LIKE N'%@erp.local' THEN 1 ELSE 0 END) AS email_sintetico,
  MAX(lastSyncedAt) AS ultimo_sync
FROM comunicacao.users
WHERE codigoFuncionario IS NOT NULL;

PRINT N'=== 6) Roles atuais (usuários com codigoFuncionario) ===';
SELECT r.role, COUNT(*) AS qtd
FROM comunicacao.user_roles AS r
INNER JOIN comunicacao.users AS u ON u.id = r.userId
WHERE u.codigoFuncionario IS NOT NULL
GROUP BY r.role
ORDER BY r.role;
