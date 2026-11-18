# Sync ERP → usuários (METARH NEWS)

Guia operacional e de manutenção do fluxo que cria/atualiza `comunicacao.users` a partir do ERP (GI), via Azure Data Factory + procedure SQL + bootstrap de senha na API.

Documentos relacionados:

- Decisão: [`docs/decisions/011-erp-user-sync.md`](decisions/011-erp-user-sync.md)
- ADF (resumo): [`docs/erp-sync-adf.md`](erp-sync-adf.md)
- Auth interno: [`docs/authentication.md`](authentication.md)

---

## 1. Objetivo

Manter a base de usuários da Central de Comunicação alinhada ao ERP **sem**:

- trigger em `TB_Funcionario` (carga é TRUNCATE + INSERT);
- FK para view;
- recriar usuário que já existe;
- sobrescrever senha já definida pelo colaborador;
- atribuir perfil `CLIENT` a partir de funcionário.

O volume diário de **mudança** é baixo (admissões/demissões). O volume alto ocorre sobretudo na **primeira carga** (bootstrap de senhas).

---

## 2. Fluxo ponta a ponta

```
GI (SQL origem)
  → ADF pl_extracao_gi_generic_4x_dia  (CSV no storage; TB_Funcionario com SELECT explícito)
  → ADF pl_master_orquestrador_carga   (Loop_Tabelas: TRUNCATE+INSERT em dbo.*)
  → View alocados.employees            (filtro empresas 2,3,6,7 + email, sexo, telefone, …)
  → Script: EXEC comunicacao.usp_SyncUsersFromErp   ← identidade / roles / status
  → API POST /api/cron/sync-erp-users               ← bcrypt só quem ainda não tem senha
  → Login: e-mail ou codigoFuncionario + senha (temp ou trocada)
```

| Etapa | Onde roda | Custo / tempo | Idempotente? |
| --- | --- | --- | --- |
| Extração GI → CSV | ADF | minutos (tabelas) | sobrescreve CSV |
| Carga dbo | ADF `Loop_Tabelas` | minutos | TRUNCATE+INSERT |
| MERGE usuários | SQL procedure | segundos–poucos min | sim (por `codigoFuncionario`) |
| Bootstrap senha | Node (Vercel ou script local) | **lento** (bcrypt) | só `passwordHash IS NULL` |

**Regra de ouro:** o ADF deve sempre fazer o **Script SQL**. A WebActivity de senha no ADF só é segura no **regime normal** (poucos novos). Na 1ª carga ou backlog grande, use o **script local** (ver §7).

---

## 3. Fonte: view `alocados.employees`

Mantida no SQL (time de dados / Alocados). A app **não** altera a view no deploy da Next.js.

### Filtro obrigatório

```sql
WHERE F.CodigoEmpresa IN (2, 3, 6, 7)
```

| Empresa | Significado no negócio | Role sync (ativo) | `contractType` |
| --- | --- | --- | --- |
| 2, 6 | Temporário | `COLLABORATOR` | `TEMPORARY` |
| 3 | Terceiro | `COLLABORATOR` | `THIRD_PARTY` |
| 7 | Interno Meta RH | `METARH` + `COLLABORATOR` | `NULL` |

### Colunas relevantes para o sync

| Coluna na view | Uso |
| --- | --- |
| `id` | `CodigoFuncionario` → `users.codigoFuncionario` |
| `nome` | `displayName` |
| `email` | login / `users.email` (**`TB_Funcionario.Email`**, não gestor) |
| `email_corporativo` | `CampoLivre_01` — **não** usado pela procedure de sync |
| `is_ativo` / `data_demissao` | elegibilidade + ACTIVE/INACTIVE |
| `empresa` | roles + contractType |
| `grupo_economico`, `cnpj_cliente`, `cod_cliente` | campos RH na ficha |
| `telefone`, `sexo`, … | disponíveis na view; sync de users hoje **não** exige telefone |

### Cuidados na view

- Não duplicar coluna no `SELECT` (ex.: `email_corporativo` duas vezes — SQL Server rejeita ou confunde).
- `Telefone` no **SELECT do ADF (origem GI)** só se a coluna existir em `dbo.TB_Funcionario` no GI. Erro clássico: `Nome de coluna inválido 'Telefone'.` → remover do SELECT ou mapear o nome real (`TelefoneResid`, `CelularParticular`, `TB_FuncionarioCpl`, etc.).
- `Email`/`Sexo`/`DataNascimento` precisam existir no GI **e** no destino `dbo` (CSV → INSERT) para a view refletir.

---

## 4. Elegibilidade (quem entra no MERGE)

Na procedure (`@cut = agora − 5 anos`):

```text
is_ativo = 1
  OR (data_demissao IS NOT NULL AND data_demissao >= @cut)
```

- **Ativo:** colaborador / Meta RH “do dia a dia”.
- **Inativo no corte:** permanece na base para acesso restrito (vagas / `CANDIDATE`) por até **5 anos**.
- Fora do corte: usuário ERP existente → `active = 0`, role sync → `CANDIDATE` (sem delete).

---

## 5. Lógica da procedure `usp_SyncUsersFromErp`

Arquivos:

- Migration: `prisma/migrations/20261117170000_sync_use_employee_email/`
- Script manual: `scripts/sql/alter_usp_SyncUsersFromErp.sql`

### 5.1 Identidade

- Chave de negócio: `codigoFuncionario` (único filtrado).
- **Já existe** → `UPDATE` nome, e-mail (se não colidir), status, tipo, CNPJ, grupo, `clientOrgId`, `lastSyncedAt`.
- **Não existe** → `INSERT` com `passwordHash = NULL`, `mustChangePassword = 1`, `entraObjectId = erp:{codigo}`.
- **Não** apaga usuário; no máximo desativa.

### 5.2 E-mail

1. Preferência: `alocados.employees.email` válido (não vazio + contém `@`).
2. Senão: sintético `f{codigo}@erp.local`.
3. Se o mesmo e-mail aparece em mais de um código no lote: o 1º fica com o real; demais → sintético.
4. No `UPDATE`/`INSERT`, se o e-mail já pertence a outro `users.id`, mantém o atual ou cai no sintético (evita unique violation).

Login aceita **e-mail ou código**.

### 5.3 Roles (sync)

| Condição | Roles aplicadas |
| --- | --- |
| Empresa 7 e ativo | `METARH` + `COLLABORATOR` |
| Empresa 2/3/6 e ativo | `COLLABORATOR` |
| Inativo (no elegível ou fora do corte após desativar) | `CANDIDATE` |
| `CLIENT` | **nunca** atribuído nem removido pelo sync |

A cada run, para quem tem `codigoFuncionario`, o sync **reaplica** `COLLABORATOR` / `METARH` / `CANDIDATE` conforme a regra acima (exceções manuais nesses três papéis podem ser sobrescritas). `CLIENT` é preservado.

### 5.4 Senha

- Procedure **não** grava bcrypt.
- INSERT deixa `passwordHash` nulo → bootstrap separado (§6).
- Quem já trocou senha: sync **não** altera hash nem remove `mustChangePassword` se já for `0`.
- Reset admin: volta ao padrão `METARH#{codigo}` + `mustChangePassword = 1` (fluxo da app).

---

## 6. Bootstrap de senha (API / script)

### Endpoint

`POST` (ou `GET`) `/api/cron/sync-erp-users`

- Header: `Authorization: Bearer <CRON_SECRET>` (comparação timing-safe; sem secret / mismatch → 401).
- Env Vercel: `CRON_SECRET` (sem espaço no fim).

Body JSON (opcional):

| Campo | Efeito |
| --- | --- |
| `passwordsOnly: true` | **Não** roda MERGE; só bcrypt dos pendentes |
| `bootstrapPasswords: false` | Com merge: pula senhas |
| `batchSize` / `passwordBatch` | Tamanho do lote (1–500; padrão **100**) |

Quem é pendente:

```text
codigoFuncionario IS NOT NULL
AND passwordHash IS NULL
AND mustChangePassword = 1
```

Senha temporária: `METARH#{codigoFuncionario}` → usuário deve trocar em `/trocar-senha`.

### Por que o Vercel dá `FUNCTION_INVOCATION_TIMEOUT`

bcrypt é CPU-bound. Lote grande (ex.: 2000) na **primeira carga** estoura o tempo da função. O ADF WebActivity fica “pendurado” e cobra tempo de pipeline.

**Regime normal (dia a dia):** poucos INSERTs novos → lote 100 (ou WebActivity) ok.  
**Primeira carga / backlog:** use o script local (§7), não a WebActivity longa.

### PowerShell (cuidado com `$` no secret)

No PowerShell, `curl` é alias de `Invoke-WebRequest`. Use `curl.exe` ou `Invoke-RestMethod`, e **aspas simples** no Bearer se o secret tiver `$`.

```powershell
$secret = Read-Host "CRON_SECRET"
Invoke-RestMethod -Method Post `
  -Uri "https://<app>/api/cron/sync-erp-users" `
  -Headers @{ Authorization = "Bearer $secret" } `
  -ContentType "application/json" `
  -Body '{"passwordsOnly": true, "batchSize": 100}'
```

---

## 7. Script local (recomendado na 1ª carga)

```bash
cd apps/comunicacao-interna
# DATABASE_URL no .env = mesmo banco da produção (cuidado)
npm run bootstrap:erp-passwords
# ou: npx tsx scripts/bootstrap-erp-passwords.ts 200
```

Arquivo: `scripts/bootstrap-erp-passwords.ts`  
Processa lotes até zerar pendentes — **sem** timeout de serverless.

Confirmar:

```sql
SELECT COUNT(*) AS pendentes_senha
FROM comunicacao.users
WHERE codigoFuncionario IS NOT NULL
  AND passwordHash IS NULL
  AND mustChangePassword = 1;
-- esperado: 0
```

---

## 8. ADF — como manter

### Extração `TB_Funcionario` (`copy_gi_to_storange_funcionario`)

- SELECT **explícito** (não `SELECT *` nesta activity).
- Só incluir colunas que **existem no GI**.
- Após mudar colunas: alinhar sink/`dbo.TB_Funcionario` e a view.

### Master `pl_master_orquestrador_carga`

1. `Loop_Tabelas` Succeeded → parâmetro `lista_tabelas` deve ser **array** (não string) — erro clássico: `ExpressionEvaluationFailed` / foreach String.
2. **Script:** `EXEC [comunicacao].[usp_SyncUsersFromErp];`
3. **WebActivity** (opcional):
   - Só após deploy com `batchSize` pequeno, **e** backlog de senhas ≈ 0; **ou**
   - Body `{ "passwordsOnly": true, "batchSize": 100 }` e aceite que um dia com muitos admitidos pode precisar de 2ª chamada / cron.
   - Na 1ª carga: **desligar** WebActivity e usar script local.

Detalhes JSON: [`erp-sync-adf.md`](erp-sync-adf.md).

---

## 9. Diagnóstico (SQL salvo)

Arquivo: [`scripts/sql/diagnostics-erp-user-sync.sql`](../scripts/sql/diagnostics-erp-user-sync.sql)

Inclui:

1. Totais elegíveis (ativos / inativos 5 anos / e-mail)
2. Quebra por empresa
3. Já em `users` vs novos
4. Pendentes de senha
5. Saúde dos users ERP
6. Contagem de roles

Rodar no SSMS sempre que houver dúvida de volume ou pós-pipeline.

---

## 10. Checklist de manutenção

### Após mudar a view `alocados.employees`

- [ ] Empresas 2, 3, 6, 7
- [ ] Coluna `email` = Email do funcionário (não só CampoLivre_01)
- [ ] Sem colunas duplicadas no SELECT
- [ ] Smoke: `SELECT TOP 20 id, nome, email, empresa, is_ativo FROM alocados.employees`

### Após mudar SELECT do ADF (funcionário)

- [ ] Colunas existem no GI (`sys.columns`)
- [ ] Destino `dbo.TB_Funcionario` tem as mesmas colunas (ou mapping)
- [ ] Pipeline filho ok antes de depender do master

### Após alterar a procedure

- [ ] Versionar migration Prisma **nova** (não editar migration já aplicada em prod às cegas)
- [ ] Ou rodar `scripts/sql/alter_usp_SyncUsersFromErp.sql`
- [ ] `EXEC usp_SyncUsersFromErp` + diagnostics

### Rotina diária / pós-ADF

- [ ] Script MERGE no master
- [ ] Pendentes de senha ≈ 0 (senão script local ou cron em lote)
- [ ] Amostra de login: código + `METARH#{codigo}` (usuário novo) → `/trocar-senha`

### Segurança

- [ ] `CRON_SECRET` forte, só em env / ADF (não commit, não chat)
- [ ] Rotacionar se vazou
- [ ] `AUTH_ALLOW_DEV_LOGIN` nunca em production

---

## 11. FAQ / troubleshooting

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Unique email / gestor repetido | Procedure antiga em `email_corporativo` | Usar `email` + script `alter_usp_…` |
| `Nome de coluna inválido 'Telefone'` | SELECT ADF no GI sem essa coluna | Remover ou renomear no Source |
| `foreach` / `lista_tabelas` String | Parâmetro não é array | Tipo array ou `@json(...)` |
| `FUNCTION_INVOCATION_TIMEOUT` | bcrypt em massa no Vercel | Script local / `batchSize` 100 em loop; não WebActivity longa |
| ADF WebActivity `INTERNAL` / `ERP_SYNC_FAILED` | Exceção na API (merge ou bcrypt); body vazio refaz MERGE | Ver `step`+`detail`+`hint` no JSON; logs Vercel `cron_sync_erp_users_failed`; body `{ "passwordsOnly": true, "batchSize": 100 }` |
| `Não autorizado` no cron | Secret errado; PowerShell comeu `$` | Aspas simples / `Read-Host`; conferir env Vercel |
| Usuário duplicado | — | Não deve: MERGE por código. Conferir se alguém criou user sem `codigoFuncionario` |
| Cliente sem acesso | Esperado | `CLIENT` é cadastro manual, fora do ERP |
| Inativo não vê conteúdo geral | Role `CANDIDATE` | Só fluxo de vagas / regras de audience |
| E-mail sintético `@erp.local` | Email vazio/inválido/duplicado | Login pelo **código**; corrigir Email no ERP na próxima carga |
| Pipeline demora / custa | WebActivity esperando timeout | Tirar bootstrap pesado do ADF |
| Amanhã vai timeout de novo? | Só se ainda houver milhares sem hash | Zerar pendentes (§7); depois só delta |

### “Usuário já criado — cria de novo?”

**Não.** Match em `codigoFuncionario` → UPDATE. Só INSERT se o código ainda não existe em `users`.

### “Precisa de fila (Service Bus)?”

Com o headcount e rotatividade descritos (temporário ~meses, candidato até 5 anos), **não** é necessário no MVP. Bateladas + cron/script bastam. Reavaliar só se o bootstrap diário passar a falhar com frequência.

---

## 12. Admin de usuários (UI)

Com ~5 mil usuários ERP, a tela `/admin/usuarios` **não** carrega a base inteira:

- Paginação no servidor (`page` / `pageSize`, padrão 25, máx. 100)
- Filtros: busca (nome/e-mail/código), status, perfil, push, origem ERP/manual, tipo de contrato
- AuthZ: apenas `METARH` (`requireMetarh` nas actions/service)
- Dados RH de sync ficam somente leitura; reset de senha temp disponível para ERP

Schema de query: `listUsersQuerySchema` em `validations/user.ts`.

---

## 13. Índice de arquivos

| Artefato | Caminho |
| --- | --- |
| ADR | `docs/decisions/011-erp-user-sync.md` |
| Este guia | `docs/erp-user-sync.md` |
| ADF curto | `docs/erp-sync-adf.md` |
| Procedure (manual) | `scripts/sql/alter_usp_SyncUsersFromErp.sql` |
| Diagnóstico | `scripts/sql/diagnostics-erp-user-sync.sql` |
| Bootstrap local | `scripts/bootstrap-erp-passwords.ts` (`npm run bootstrap:erp-passwords`) |
| API cron | `src/app/api/cron/sync-erp-users/route.ts` |
| Service | `src/services/erp-user-sync-service.ts` |
| Migration sync email/roles | `prisma/migrations/20261117170000_sync_use_employee_email/` |
| Admin usuários | `src/app/(dashboard)/admin/usuarios/page.tsx` |

---

## 14. Ordem sugerida na 1ª operação (histórico)

1. Corrigir view + SELECT ADF (`Email` ok; `Telefone` só se existir no GI).
2. Aplicar `alter_usp_SyncUsersFromErp.sql`.
3. Rodar master até o Script MERGE (WebActivity opcional/desligada).
4. Diagnostics → ver totais / pendentes.
5. `npm run bootstrap:erp-passwords` até pendentes = 0.
6. Deploy API com `batchSize` 100; recolocar WebActivity leve ou cron.
7. Rotacionar `CRON_SECRET` se exposto.
