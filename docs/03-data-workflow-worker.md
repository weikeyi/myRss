# 5. Database Schema Draft

下面是第一版 Prisma schema 草案。状态字段建议先用 `String`，在 TypeScript/Zod 层约束，而不是依赖数据库 enum。Prisma 当前 SQLite connector 文档显示 SQLite 中 `Json`、`Enum`、`Boolean` 等类型有各自映射和限制；尤其 SQLite enum 不会形成数据库层面的 enum enforcement，Prisma 的高级 JSON 路径过滤也主要支持 PostgreSQL / MySQL，因此第一版不要把关键查询条件只藏在 JSON 中。([Prisma][6])

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Workspace {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users           WorkspaceUser[]
  feeds           Feed[]
  articles        Article[]
  articleSources  ArticleSource[]
  workflowConfigs WorkflowConfig[]
  pipelineRuns    PipelineRun[]
  jobs            Job[]
  settings        Setting[]
  secretSettings  SecretSetting[]
}

model User {
  id           String   @id @default(cuid())
  email        String?  @unique
  displayName  String?
  passwordHash String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberships WorkspaceUser[]
}

model WorkspaceUser {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        String   @default("owner") // owner | admin | member | viewer
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([userId])
}

model Feed {
  id               String   @id @default(cuid())
  workspaceId      String
  workflowConfigId String?

  url      String
  urlHash  String
  title    String?
  siteUrl  String?
  enabled  Boolean @default(true)

  etag          String?
  lastModified  String?
  lastSyncAt    DateTime?
  lastSuccessAt DateTime?
  lastError     String?

  syncIntervalMinutes Int @default(60)

  includeRulesJson Json?
  excludeRulesJson Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workspace      Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workflowConfig WorkflowConfig? @relation(fields: [workflowConfigId], references: [id], onDelete: SetNull)
  articles       Article[]
  articleSources ArticleSource[]

  @@unique([workspaceId, urlHash])
  @@index([workspaceId, enabled, lastSyncAt])
  @@index([workflowConfigId])
}

model Article {
  id          String @id @default(cuid())
  workspaceId String
  feedId      String?

  sourceType String @default("rss") // rss | manual_url
  title      String
  author     String?
  summary    String?

  originalUrl      String
  canonicalUrl     String
  canonicalUrlHash String

  feedItemGuid String?
  feedItemUrl  String?

  language    String?
  publishedAt DateTime?
  importedAt  DateTime @default(now())

  status    String @default("new")
  // new | queued | processing | ready | partial_failed | failed | filtered | archived | paused

  readState String @default("unread")
  // unread | reading | read

  favorite Boolean @default(false)
  score    Float?

  filteredReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  readAt    DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  feed      Feed?     @relation(fields: [feedId], references: [id], onDelete: SetNull)

  content      ArticleContent?
  sources      ArticleSource[]
  aiOutputs    ArticleAiOutput[]
  pipelineRuns PipelineRun[]

  @@unique([workspaceId, canonicalUrlHash])
  @@index([workspaceId, status, importedAt])
  @@index([workspaceId, readState, publishedAt])
  @@index([workspaceId, feedId, publishedAt])
  @@index([workspaceId, favorite, updatedAt])
}

model ArticleSource {
  id          String @id @default(cuid())
  workspaceId String
  articleId   String
  feedId      String?

  sourceType String // rss | manual_url
  dedupeKey  String

  feedItemGuid String?
  feedItemUrl  String?
  originalUrl  String

  title       String?
  author      String?
  summary     String?
  publishedAt DateTime?

  rawJson Json?

  importedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  article   Article   @relation(fields: [articleId], references: [id], onDelete: Cascade)
  feed      Feed?     @relation(fields: [feedId], references: [id], onDelete: SetNull)

  @@unique([workspaceId, dedupeKey])
  @@index([workspaceId, articleId])
  @@index([workspaceId, feedId, importedAt])
}

model ArticleContent {
  id          String @id @default(cuid())
  workspaceId String
  articleId   String @unique

  finalUrl     String?
  contentHash  String?
  title        String?
  byline       String?
  siteName     String?
  excerpt      String?

  textContent     String?
  markdownContent String?
  htmlContent     String?

  // 不建议长期保存 raw HTML 到 SQLite。
  // 可改为保存文件路径或短期 debug blob。
  rawHtmlPath          String?
  rawHtmlRetainedUntil DateTime?

  extractor       String?
  extractorVersion String?
  contentType     String?
  byteLength      Int?
  wordCount       Int?
  language        String?

  fetchedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([workspaceId, contentHash])
  @@index([workspaceId, fetchedAt])
}

model ArticleAiOutput {
  id          String @id @default(cuid())
  workspaceId String
  articleId   String

  type     String // summary | translation | insight
  language String

  provider String
  model    String

  promptKey     String
  promptVersion String
  promptHash    String?

  inputHash String
  contentHash String?

  outputJson Json
  outputText String?

  inputTokens  Int?
  outputTokens Int?
  costUsd      Float?

  status       String @default("succeeded") // succeeded | failed | stale
  errorCode    String?
  errorMessage String?

  pipelineRunId     String?
  pipelineStepRunId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([
    workspaceId,
    articleId,
    type,
    language,
    provider,
    model,
    promptKey,
    promptVersion,
    inputHash
  ])
  @@index([workspaceId, articleId, type, language])
  @@index([workspaceId, type, createdAt])
}

model WorkflowConfig {
  id          String @id @default(cuid())
  workspaceId String

  name        String
  description String?
  version     Int    @default(1)
  enabled     Boolean @default(true)
  isDefault   Boolean @default(false)

  // WorkflowDefinition JSON.
  definitionJson Json

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  feeds        Feed[]
  pipelineRuns PipelineRun[]

  @@unique([workspaceId, name])
  @@index([workspaceId, isDefault])
}

model PipelineRun {
  id          String @id @default(cuid())
  workspaceId String
  articleId   String
  feedId      String?

  workflowConfigId String?
  workflowVersion  Int
  workflowSnapshotJson Json

  trigger String // feed_sync | manual_url | manual_reprocess | retry

  status String @default("pending")
  // pending | running | succeeded | partial_failed | failed | canceled | filtered | paused

  currentStepKey String?

  errorCode    String?
  errorMessage String?

  startedAt  DateTime?
  finishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workspace      Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  article        Article         @relation(fields: [articleId], references: [id], onDelete: Cascade)
  workflowConfig WorkflowConfig? @relation(fields: [workflowConfigId], references: [id], onDelete: SetNull)

  steps PipelineStepRun[]
  jobs  Job[]

  @@index([workspaceId, articleId, createdAt])
  @@index([workspaceId, status, createdAt])
}

model PipelineStepRun {
  id            String @id @default(cuid())
  workspaceId   String
  pipelineRunId String
  articleId     String

  stepKey   String
  stepType  String
  stepIndex Int

  status String @default("pending")
  // pending | queued | running | succeeded | failed | skipped | canceled | paused

  attempts    Int @default(0)
  maxAttempts Int @default(3)

  required Boolean @default(true)

  inputHash  String?
  outputHash String?

  errorCode    String?
  errorMessage String?
  skippedReason String?

  startedAt  DateTime?
  finishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  pipelineRun PipelineRun @relation(fields: [pipelineRunId], references: [id], onDelete: Cascade)

  @@unique([pipelineRunId, stepKey])
  @@index([workspaceId, articleId])
  @@index([workspaceId, status, updatedAt])
}

model Job {
  id          String @id @default(cuid())
  workspaceId String

  type String
  // feed.sync | article.pipeline.step | cleanup.run | backup.run

  status String @default("pending")
  // pending | running | succeeded | failed | dead | canceled | paused

  priority Int @default(0)

  payloadJson Json

  dedupeKey String?

  runAfter DateTime @default(now())

  attempts    Int @default(0)
  maxAttempts Int @default(3)

  lockedAt DateTime?
  lockedBy String?
  lockVersion Int @default(0)

  heartbeatAt DateTime?

  lastErrorCode    String?
  lastErrorMessage String?

  pipelineRunId     String?
  pipelineStepRunId String?

  startedAt  DateTime?
  finishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  pipelineRun PipelineRun? @relation(fields: [pipelineRunId], references: [id], onDelete: SetNull)

  @@unique([workspaceId, dedupeKey])
  @@index([status, runAfter, priority])
  @@index([lockedAt])
  @@index([workspaceId, status, createdAt])
  @@index([workspaceId, pipelineRunId])
}

model Setting {
  id          String @id @default(cuid())
  workspaceId String
  userId      String?

  scope String @default("workspace")
  // workspace | user

  key       String
  valueJson Json

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId, key])
  @@index([workspaceId, key])
}

model SecretSetting {
  id          String @id @default(cuid())
  workspaceId String
  userId      String?

  key String

  // Web 私有部署可存加密密文；
  // Electron 版本优先走 OS keychain / safeStorage，只在 DB 存 reference。
  encryptedValue Bytes?
  storageBackend String @default("db_encrypted")
  keyHint        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  rotatedAt DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId, key])
  @@index([workspaceId, key])
}
```

## 5.1 所有核心业务表是否带 `workspaceId`

建议带。

必须带：

- Feed
- Article
- ArticleSource
- ArticleContent
- ArticleAiOutput
- WorkflowConfig
- PipelineRun
- PipelineStepRun
- Job
- Setting
- SecretSetting

原因：

1. 第一版虽然单用户，但默认 workspace 可以保持简单。
2. 所有 repository 方法从第一天就要求 `workspaceId`。
3. 后续多用户时不需要大规模补字段。
4. 数据清理、备份、导出、权限检查都可以按 workspace 做。

## 5.2 URL 唯一约束设计

不要直接对原始 URL 做唯一约束。应该：

1. normalize URL：
    - lower-case host
    - 去掉 fragment
    - 去掉常见 tracking query，例如 `utm_*`、`fbclid`
    - 规范化 trailing slash
    - punycode host

2. 得到 `canonicalUrl`
3. 计算 `canonicalUrlHash = sha256(canonicalUrl)`
4. 用：

```prisma
@@unique([workspaceId, canonicalUrlHash])
```

这样可以避免 SQLite 索引超长 URL，也避免不同 workspace 之间冲突。

RSS GUID 只作为来源去重的辅助，因为很多 feed 的 GUID 不稳定或缺失。来源级唯一性放到 `ArticleSource.dedupeKey`：

```prisma
ArticleSource.dedupeKey
```

但主去重仍以 canonical URL 为准。

## 5.3 ArticleSource：保留多来源，不复制文章

同一篇文章可能同时出现在多个 RSS feed，也可能先由手动 URL 添加，之后又被某个 feed 同步到。`Article` 应该表示去重后的文章主体；`ArticleSource` 负责记录每一次来源。

推荐规则：

- `Article.canonicalUrlHash` 仍是文章级主去重键。
- `Article.feedId` 只作为第一来源或默认展示来源，不代表唯一来源。
- 每次 feed item 或手动 URL 摄入，都写入 `ArticleSource`。
- `ArticleSource.dedupeKey` 用稳定字符串生成，例如：
    - `feed:${feedId}:guid:${feedItemGuid}`
    - `feed:${feedId}:url:${canonicalUrlHash}`
    - `manual:${canonicalUrlHash}`
- 列表展示默认用 `Article.feedId`，详情页可以后续展示“也来自这些 feed”。

这样第一版 UI 可以保持简单，但不会把“同一文章多来源”这个常见 RSS 场景堵死。

## 5.4 Pipeline 和 Job 的关系

推荐：

- `PipelineRun`：一次文章处理流程。
- `PipelineStepRun`：某个 workflow step 的执行记录。
- `Job`：异步执行载体。

第一版推荐 **一个 step 一个 job**：

```text
PipelineRun
  ├─ StepRun pre_filter      -> Job article.pipeline.step
  ├─ StepRun fetch_fulltext  -> Job article.pipeline.step
  ├─ StepRun content_filter  -> Job article.pipeline.step
  ├─ StepRun ai_summary      -> Job article.pipeline.step
  ├─ StepRun translate       -> Job article.pipeline.step
  └─ StepRun ai_insight      -> Job article.pipeline.step
```

这样失败点清晰，用户可以 retry / skip 某一步。

## 5.5 状态源头与同步规则

系统里会同时存在 `Article.status`、`PipelineRun.status`、`PipelineStepRun.status` 和 `Job.status`。这不是重复设计，但必须明确职责边界：

| 状态字段 | 负责表达 | 谁能更新 |
| --- | --- | --- |
| `Job.status` | 异步执行载体是否可运行、运行中、重试、死亡、暂停 | `JobRepository` / worker runner |
| `PipelineStepRun.status` | 某个 workflow step 的业务执行结果 | step handler / `PipelineService` |
| `PipelineRun.status` | 整条文章处理流程的聚合结果 | `PipelineService` |
| `Article.status` | 阅读列表上的用户可理解状态 | pipeline finalizer / 明确的 article status sync |

约束：

- step handler 不直接随意改 `Article.status`。
- job 成功不等于 step 成功；job 只是 handler 执行完，step 结果要由 handler 明确写入。
- optional step 失败后，`PipelineRun` 可以是 `partial_failed`，`Article.status` 仍可以是 `ready` 或 `partial_failed`，由 finalizer 统一决定。
- budget、用户配置或缺少 API key 造成的暂停，不应该记为永久失败，可用 `paused` 表达。
- API 读侧不要现场推导一套新状态，统一读取已持久化的 pipeline/article 状态。

这个规则要从第一版写进 repository/service 测试，避免后面出现“job succeeded 但文章 failed”这类状态漂移。

## 5.6 SQLite / Prisma 注意事项

- 查询频繁的状态字段不要只放 JSON。
- `WorkflowDefinition` 可以放 JSON，因为主要按 id 读取。
- AI output 可以放 JSON，但 `type/language/model/inputHash` 必须是列。
- `Job.payloadJson` 可以放 JSON，但 `status/runAfter/lockedAt/priority` 必须是列。
- 大 raw HTML 不建议长期放 SQLite。
- 迁移 PostgreSQL 前，不要依赖 SQLite 的宽松类型行为。
- 不要把核心状态建成数据库 enum，先用 TS union + Zod 校验，迁移 PostgreSQL 时更灵活。
- 保持 repository 层，不让 Prisma 查询散落在所有业务代码中。

---

# 6. Workflow / Pipeline Design

## 6.1 第一版 workflow：线性即可

第一版不需要 DAG。

推荐默认 workflow：

```text
article_created
  -> pre_filter
  -> fetch_fulltext
  -> content_filter
  -> ai_summary
  -> translate_summary
  -> ai_insight
  -> finalize_reading
```

手动 URL 进入：

```text
manual_url_created
  -> fetch_fulltext
  -> content_filter
  -> ai_summary
  -> translate_summary
  -> ai_insight
  -> finalize_reading
```

实施时可以先启用最短前缀：

```text
manual_url_created
  -> fetch_fulltext
  -> finalize_reading
```

RSS、过滤、AI 摘要、翻译和解读稳定后，再逐步打开后续 step。workflow engine 从第一天支持完整定义，但第一版落地要按垂直闭环递进。

## 6.2 WorkflowConfig 表示

`WorkflowConfig.definitionJson` 示例：

```json
{
    "version": 1,
    "mode": "linear",
    "steps": [
        {
            "key": "pre_filter",
            "type": "PRE_FILTER",
            "enabled": true,
            "required": true,
            "timeoutMs": 10000,
            "retry": {
                "maxAttempts": 1,
                "baseDelayMs": 0,
                "maxDelayMs": 0
            },
            "params": {
                "minTitleLength": 8,
                "excludeTitleKeywords": ["招聘", "促销"]
            }
        },
        {
            "key": "fetch_fulltext",
            "type": "FETCH_FULLTEXT",
            "enabled": true,
            "required": true,
            "timeoutMs": 30000,
            "retry": {
                "maxAttempts": 3,
                "baseDelayMs": 30000,
                "maxDelayMs": 600000
            },
            "params": {
                "extractor": "readability",
                "saveRawHtml": false
            }
        },
        {
            "key": "content_filter",
            "type": "CONTENT_FILTER",
            "enabled": true,
            "required": true,
            "timeoutMs": 10000,
            "retry": {
                "maxAttempts": 1,
                "baseDelayMs": 0,
                "maxDelayMs": 0
            },
            "params": {
                "minWordCount": 200
            }
        },
        {
            "key": "ai_summary",
            "type": "AI_SUMMARY",
            "enabled": true,
            "required": false,
            "timeoutMs": 90000,
            "retry": {
                "maxAttempts": 3,
                "baseDelayMs": 60000,
                "maxDelayMs": 1800000
            },
            "params": {
                "promptKey": "summary",
                "promptVersion": "v1",
                "targetLanguage": "zh-CN"
            }
        },
        {
            "key": "translate_summary",
            "type": "AI_TRANSLATION",
            "enabled": true,
            "required": false,
            "timeoutMs": 90000,
            "retry": {
                "maxAttempts": 3,
                "baseDelayMs": 60000,
                "maxDelayMs": 1800000
            },
            "params": {
                "mode": "summary_only",
                "targetLanguage": "zh-CN"
            }
        },
        {
            "key": "ai_insight",
            "type": "AI_INSIGHT",
            "enabled": true,
            "required": false,
            "timeoutMs": 90000,
            "retry": {
                "maxAttempts": 3,
                "baseDelayMs": 60000,
                "maxDelayMs": 1800000
            },
            "params": {
                "promptKey": "insight",
                "promptVersion": "v1",
                "targetLanguage": "zh-CN"
            }
        },
        {
            "key": "finalize_reading",
            "type": "FINALIZE_READING",
            "enabled": true,
            "required": true,
            "timeoutMs": 10000,
            "retry": {
                "maxAttempts": 1,
                "baseDelayMs": 0,
                "maxDelayMs": 0
            },
            "params": {}
        }
    ]
}
```

## 6.3 TypeScript 类型示例

```ts
export type PipelineStepStatus =
    | 'pending'
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'skipped'
    | 'canceled'
    | 'paused'

export type PipelineRunStatus =
    | 'pending'
    | 'running'
    | 'succeeded'
    | 'partial_failed'
    | 'failed'
    | 'filtered'
    | 'canceled'
    | 'paused'

export type ArticleStatus =
    | 'new'
    | 'queued'
    | 'processing'
    | 'ready'
    | 'partial_failed'
    | 'failed'
    | 'filtered'
    | 'archived'
    | 'paused'

export type AiOutputType = 'summary' | 'translation' | 'insight'

export type WorkflowStepType =
    | 'PRE_FILTER'
    | 'FETCH_FULLTEXT'
    | 'CONTENT_FILTER'
    | 'AI_SUMMARY'
    | 'AI_TRANSLATION'
    | 'AI_INSIGHT'
    | 'FINALIZE_READING'

export interface RetryPolicy {
    maxAttempts: number
    baseDelayMs: number
    maxDelayMs: number
    jitterRatio?: number
}

export interface WorkflowStepDefinition {
    key: string
    type: WorkflowStepType
    enabled: boolean
    required: boolean
    timeoutMs: number
    retry: RetryPolicy
    params: Record<string, unknown>
    condition?: {
        expression: string
    }
}

export interface WorkflowDefinition {
    version: number
    mode: 'linear'
    steps: WorkflowStepDefinition[]
}

export interface PipelineContext {
    workspaceId: string
    articleId: string
    pipelineRunId: string
    stepRunId: string
    now: Date
}

export type StepResult<TOutput = unknown> =
    | {
          status: 'succeeded'
          output?: TOutput
          nextArticleStatus?: ArticleStatus
      }
    | {
          status: 'skipped'
          reason: string
      }
    | {
          status: 'filtered'
          reason: string
      }
    | {
          status: 'failed'
          errorCode: string
          errorMessage: string
          retryable: boolean
      }
    | {
          status: 'paused'
          reason: string
          resumeAfter?: Date
      }

export interface PipelineStep<TInput = unknown, TOutput = unknown> {
    key: WorkflowStepType
    run(ctx: PipelineContext, input: TInput): Promise<StepResult<TOutput>>
}
```

## 6.4 PipelineRun 如何启动

启动流程：

```text
1. Article 创建或用户点击重新处理
2. 选择 WorkflowConfig
   - Feed.workflowConfigId
   - 否则 workspace default workflow
3. 创建 PipelineRun
4. 将 workflow definition snapshot 存入 PipelineRun.workflowSnapshotJson
5. 为每个 enabled step 创建 PipelineStepRun
6. 将第一个 step 标为 queued
7. 创建 Job: article.pipeline.step
```

为什么要保存 workflow snapshot：

- 文章处理过程中 workflow 被用户修改，不应影响正在跑的 run。
- 失败排查可以知道当时使用的 workflow 版本。
- 后续重跑可以选择“使用原版本”或“使用最新版本”。

## 6.5 Step 状态机

```text
pending
  -> queued
  -> running
  -> succeeded

running
  -> failed
  -> skipped
  -> canceled
  -> paused

failed
  -> queued        manual retry / auto retry
  -> skipped       manual skip
  -> canceled

paused
  -> queued        budget restored / user resumes
  -> canceled
```

约束：

- `succeeded/skipped/canceled` 是终态。
- `failed` 可以 retry。
- `paused` 不是失败，通常用于预算、缺少 key、用户关闭自动 AI 等可恢复阻塞。
- required step failed 且不可重试，则 PipelineRun failed。
- optional step failed 且不可重试，则 PipelineRun partial_failed，并可继续后续 step。
- filter step 返回 filtered 时，Article.status = filtered，其余 step skipped。

## 6.6 如何支持失败重试

失败分两层：

### Job retry

用于临时错误：

- 网络 timeout
- 429 rate limit
- AI provider 5xx
- DNS 短暂失败
- SQLite busy transient

### Step retry

用于业务层可重试：

- `PipelineStepRun.attempts`
- `PipelineStepRun.maxAttempts`
- 每次 job 执行 step 时增加 attempts
- 如果失败且 retryable，则创建下一次 job
- 如果超限，则 step failed

backoff：

```ts
export function computeBackoffMs(input: {
    attempts: number
    baseDelayMs: number
    maxDelayMs: number
    jitterRatio?: number
}): number {
    const exp = input.baseDelayMs * 2 ** Math.max(0, input.attempts - 1)
    const capped = Math.min(exp, input.maxDelayMs)
    const jitter = capped * (input.jitterRatio ?? 0.2) * Math.random()
    return Math.round(capped + jitter)
}
```

OpenAI 官方文档也建议在速率限制场景使用指数退避并加入 jitter。([OpenAI Developers][7])

## 6.7 如何支持跳过某一步

API：

```http
POST /api/v1/pipeline-runs/:runId/steps/:stepKey/skip
```

行为：

1. 校验 step 不是 required，或者用户明确强制跳过。
2. 将 step status 改为 `skipped`。
3. 记录 `skippedReason`。
4. 调度下一个 step。
5. 如果后续依赖该输出，则由 step 自己决定降级处理。

示例：

- 翻译失败，可以 skip translation，文章仍进入 `partial_failed` 或 `ready`。
- 全文抓取失败，不建议 skip，因为后续 AI 没有内容，除非允许用 RSS 摘要继续。

## 6.8 未来不同 feed 使用不同 workflow

第一版用：

```text
Feed.workflowConfigId nullable
```

运行时：

```ts
const workflowConfig = feed.workflowConfigId
    ? await workflowRepo.getById(workspaceId, feed.workflowConfigId)
    : await workflowRepo.getDefault(workspaceId)
```

这样后续可以：

- 技术博客使用“摘要 + 解读”
- 外文新闻使用“摘要 + 翻译”
- 低价值源只做预过滤和标题列表
- 长文源做更强的 AI 解读

## 6.9 从线性 workflow 演进到 DAG

第一版 schema 已经足够演进，因为：

- Step 有独立 `stepKey`
- StepRun 独立记录状态
- Workflow snapshot 是 JSON
- Job payload 可以指向任意 step

后续将：

```ts
interface WorkflowDefinitionV2 {
    version: number
    mode: 'dag'
    steps: Array<
        WorkflowStepDefinition & {
            dependsOn: string[]
        }
    >
}
```

调度逻辑从“找下一个 index”变成：

```text
当 step succeeded/skipped 后：
  找到所有 dependsOn 已完成的 pending step
  enqueue 这些 step
```

第一版不要做 DAG UI，也不要做并行 step。否则会显著增加 debug 难度。

---

# 7. Job Queue and Worker Design

## 7.1 Job 表结构重点

`Job` 必须有：

- `status`
- `type`
- `payloadJson`
- `runAfter`
- `attempts`
- `maxAttempts`
- `lockedAt`
- `lockedBy`
- `lockVersion`
- `heartbeatAt`
- `lastErrorCode`
- `lastErrorMessage`
- `dedupeKey`
- `pipelineRunId`
- `pipelineStepRunId`

Job status：

```ts
export type JobStatus =
    | 'pending'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'dead'
    | 'canceled'
    | 'paused'
```

## 7.2 Worker polling 策略

第一版推荐：

```ts
const POLL_INTERVAL_MS = 1000
const IDLE_MAX_INTERVAL_MS = 5000
const CLAIM_BATCH_SIZE = 1 // 先从 1 开始
const WORKER_CONCURRENCY = 1 // 可配置为 2-3
const LOCK_TIMEOUT_MS = 15 * 60 * 1000
```

策略：

- 有 job 时每 1s poll。
- 空闲时逐步退避到 5s。
- 本地个人应用无需 100ms 级别响应。
- worker concurrency 默认 1，避免 SQLite 写竞争。
- 后续可以按类型设置并发：
    - fetching: 2
    - ai: 1
    - cleanup: 1

## 7.3 如何 claim job，避免重复执行

SQLite 没有 Redis 那样的原子队列语义，所以关键是 **短事务 + 条件更新**。

Prisma 版本伪代码：

```ts
export async function claimOneJob(input: {
    prisma: PrismaClient
    workerId: string
    now: Date
    staleBefore: Date
}) {
    const candidate = await input.prisma.job.findFirst({
        where: {
            status: 'pending',
            runAfter: { lte: input.now },
            OR: [{ lockedAt: null }, { lockedAt: { lt: input.staleBefore } }],
        },
        orderBy: [{ priority: 'desc' }, { runAfter: 'asc' }, { createdAt: 'asc' }],
    })

    if (!candidate) return null

    const updated = await input.prisma.job.updateMany({
        where: {
            id: candidate.id,
            status: 'pending',
            runAfter: { lte: input.now },
            OR: [{ lockedAt: null }, { lockedAt: { lt: input.staleBefore } }],
        },
        data: {
            status: 'running',
            lockedAt: input.now,
            lockedBy: input.workerId,
            lockVersion: { increment: 1 },
            heartbeatAt: input.now,
            startedAt: candidate.startedAt ?? input.now,
            attempts: { increment: 1 },
        },
    })

    if (updated.count !== 1) {
        return null
    }

    return input.prisma.job.findUnique({
        where: { id: candidate.id },
    })
}
```

更强版本可以在 `packages/db` 中使用 raw SQL：

```sql
UPDATE Job
SET
  status = 'running',
  lockedAt = ?,
  lockedBy = ?,
  lockVersion = lockVersion + 1,
  heartbeatAt = ?,
  attempts = attempts + 1,
  updatedAt = ?
WHERE id = (
  SELECT id
  FROM Job
  WHERE status = 'pending'
    AND runAfter <= ?
  ORDER BY priority DESC, runAfter ASC, createdAt ASC
  LIMIT 1
)
RETURNING *;
```

这个 raw SQL 应集中封装在 `JobRepository`，不要散落在业务代码里。

### 状态更新必须校验锁归属

claim 成功后，worker 后续所有写入都必须带锁归属条件：

```ts
await jobs.markSucceeded({
    jobId: job.id,
    workerId,
    lockVersion: job.lockVersion,
    finishedAt: new Date(),
})
```

`markSucceeded`、`markDead`、`markPendingForRetry`、`heartbeat` 都要在 `WHERE` 中校验：

```text
id = jobId
status = running
lockedBy = workerId
lockVersion = claimedLockVersion
```

如果更新数量不是 1，说明 job 已经被恢复逻辑或另一个 worker 接管，当前 worker 必须停止写入业务状态。这个约束比单纯检查 `job.id` 更重要，可以避免旧 worker 在超时恢复后“补写成功”覆盖新执行结果。

## 7.4 Job runner 伪代码

```ts
export class JobRunner {
    constructor(
        private readonly jobs: JobRepository,
        private readonly handlers: JobHandlerRegistry,
        private readonly workerId: string
    ) {}

    async tick() {
        await this.jobs.recoverStaleRunningJobs({
            staleBefore: new Date(Date.now() - 15 * 60 * 1000),
        })

        const job = await this.jobs.claimOne({
            workerId: this.workerId,
            now: new Date(),
        })

        if (!job) return { claimed: false }

        await this.execute(job)
        return { claimed: true }
    }

    private async execute(job: JobRecord) {
        const handler = this.handlers.get(job.type)

        try {
            const heartbeat = this.startHeartbeat(job.id, job.lockVersion)

            try {
                await handler.handle(job)
            } finally {
                clearInterval(heartbeat)
            }

            await this.jobs.markSucceeded({
                jobId: job.id,
                workerId: this.workerId,
                lockVersion: job.lockVersion,
                finishedAt: new Date(),
            })
        } catch (err) {
            if (isLostJobLockError(err)) {
                return
            }

            const classified = classifyError(err)
            const next = decideJobFailure({
                attempts: job.attempts,
                maxAttempts: job.maxAttempts,
                retryable: classified.retryable,
                retryPolicy: classified.retryPolicy,
            })

            if (next.action === 'retry') {
                await this.jobs.markPendingForRetry({
                    jobId: job.id,
                    workerId: this.workerId,
                    lockVersion: job.lockVersion,
                    runAfter: next.runAfter,
                    lastErrorCode: classified.code,
                    lastErrorMessage: classified.message,
                })
            } else {
                await this.jobs.markDead({
                    jobId: job.id,
                    workerId: this.workerId,
                    lockVersion: job.lockVersion,
                    lastErrorCode: classified.code,
                    lastErrorMessage: classified.message,
                    finishedAt: new Date(),
                })
            }
        }
    }

    private startHeartbeat(jobId: string, lockVersion: number) {
        return setInterval(() => {
            void this.jobs.heartbeat({
                jobId,
                workerId: this.workerId,
                lockVersion,
                at: new Date(),
            })
        }, 30_000)
    }
}
```

## 7.5 Worker crash 后如何恢复

启动 worker 时：

```text
UPDATE Job
SET status = 'pending',
    lockedAt = NULL,
    lockedBy = NULL,
    runAfter = CURRENT_TIMESTAMP
WHERE status = 'running'
  AND lockedAt < now - lockTimeout
  AND attempts < maxAttempts;
```

不要重置 `lockVersion`。下一次 claim 会继续递增它，旧 worker 带着旧 `lockVersion` 回来时无法再写入。

超限则：

```text
status = 'dead'
```

需要 dead letter。否则用户无法知道哪些任务永久失败，也无法手动介入。

## 7.6 SQLite 并发写入限制下的处理

做法：

- claim job 单条或小 batch
- job 状态更新短事务
- AI / HTTP 请求不要包在数据库事务中
- step 执行前后分别写库
- 大文本一次性写入，不循环频繁 update
- worker concurrency 默认 1
- WAL 开启
- busy timeout 设置，例如 5s
- 遇到 `SQLITE_BUSY` 可短暂 retry

SQLite 官方事务文档说明多个读事务可同时存在，但同一时间只能有一个写事务；`BEGIN IMMEDIATE` 可以立即启动写事务，但如果已有写者则可能失败。([SQLite][8])

## 7.7 API 和 worker 同进程注意事项

同进程可以，但要注意：

- worker 必须能关闭：`onApplicationShutdown`
- API e2e test 默认禁用 worker
- worker loop 不要阻塞 event loop
- job handler 内部必须有 timeout
- AI/fetch 并发要限制
- server 启动失败时不要启动 worker
- worker 异常不能让整个 API crash，除非是不可恢复配置错误

## 7.8 Electron 场景下 worker 如何运行

推荐：

```text
Electron main
  -> resolve app data dir
  -> start Nest API process on random localhost port
  -> start worker process or same Nest standalone context
  -> wait /healthz
  -> create BrowserWindow loading local renderer
```

第一版 Electron preview 可以同进程，正式桌面版建议 API 和 worker 用 child process / utility process，便于崩溃恢复和日志隔离。

---
