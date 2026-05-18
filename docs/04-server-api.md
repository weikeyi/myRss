# 8. NestJS Module Design

## 8.1 推荐模块

```text
ConfigModule
PrismaModule
WorkspaceModule
FeedsModule
ArticlesModule
ContentModule
WorkflowModule
PipelineModule
JobsModule
WorkerModule
AiModule
TranslationModule
FetchingModule
SettingsModule
AuthModule
```

## 8.2 模块职责

### `ConfigModule`

职责：

- 读取 env
- 校验 env
- 提供 app paths
- 提供 feature flags
- 提供默认设置

Provider：

- `AppConfigService`
- `PathConfigService`

不做：

- 业务设置持久化

### `PrismaModule`

职责：

- 创建 Prisma Client
- 应用 SQLite pragmas
- graceful shutdown
- 注入 repositories

Provider：

- `PrismaService`
- `WorkspaceRepository`
- `FeedRepository`
- `ArticleRepository`
- `JobRepository`
- `PipelineRepository`

### `WorkspaceModule`

职责：

- 启动时创建 default workspace / user
- workspace context
- 后续多 workspace 查询

第一版可以没有复杂 controller，只提供 bootstrap service。

### `FeedsModule`

Controller：

- feed CRUD
- manual sync
- feed workflow 配置

Service：

- feed validation
- URL normalize
- enqueue feed sync job

Worker 共用：

- `FeedSyncService`

### `ArticlesModule`

Controller：

- article list
- article detail
- read state
- favorite
- reprocess

Service：

- article query
- reading state
- reprocess orchestration

### `ContentModule`

职责：

- article content 查询
- worker 写入 extracted content
- content hash
- content cleanup

第一版可合并到 ArticlesModule，等复杂后拆出。

### `WorkflowModule`

职责：

- workflow CRUD
- 默认 workflow
- workflow validation
- workflow versioning

核心 engine 不放这里，放 `packages/core`。

### `PipelineModule`

职责：

- start pipeline
- schedule next step
- retry step
- skip step
- update run status

API 和 worker 共用。

### `JobsModule`

职责：

- enqueue job
- claim job
- job status update
- dead letter query
- admin/debug API

Worker 强依赖，API 只用 enqueue 和 debug 查询。

### `WorkerModule`

职责：

- standalone worker loop
- job handler registry
- concurrency control

只给 worker 入口使用。

### `AiModule`

职责：

- provider registry
- 从 settings 读取 provider config
- 生成 summary / translation / insight

真正 provider adapter 放 `packages/ai`。

### `TranslationModule`

第一版可以并入 `AiModule`。如果翻译策略变复杂，再拆。

### `FetchingModule`

职责：

- safe fetch
- RSS fetch
- fulltext extraction
- SSRF guard 配置

主要 worker 使用。

### `SettingsModule`

职责：

- AI provider 设置
- API key 设置
- fetching 设置
- worker 设置
- cleanup 设置

### `AuthModule`

第一版建议做极简：

- personal mode：本地默认 user
- web private mode：可开启密码登录
- session cookie
- workspace context

不做：

- OAuth
- team invitation
- RBAC UI
- billing

## 8.3 Worker standalone 启动

```ts
// apps/server/src/worker.ts
import { NestFactory } from '@nestjs/core'
import { WorkerAppModule } from './modules/worker/worker-app.module'
import { WorkerService } from './modules/worker/worker.service'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(WorkerAppModule, {
        bufferLogs: true,
    })

    const worker = app.get(WorkerService)
    await worker.start()

    process.on('SIGTERM', async () => {
        await worker.stop()
        await app.close()
    })

    process.on('SIGINT', async () => {
        await worker.stop()
        await app.close()
    })
}

void bootstrap()
```

## 8.4 避免 Nest module 过度拆分

第一版可以合并：

```text
ContentModule -> ArticlesModule 内部 service
TranslationModule -> AiModule 内部 service
AuthModule -> 简单 LocalAuthService
```

等代码超过以下阈值再拆：

- 单模块 service 超过 5 个
- controller 超过 3 个
- worker-only provider 和 API provider 明显混乱
- 测试 fixture 难以维护

## 8.5 DTO、Zod、Prisma types 组织

推荐：

- API request/response schema 用 Zod 放 `packages/shared/api`
- Nest controller 用 Zod pipe 或手动 parse
- Prisma model 不直接暴露给前端
- response mapper 显式转换
- 状态 union 放 `packages/shared/constants` 或 `packages/core`

示例：

```ts
// packages/shared/src/api/articles.schema.ts
import { z } from 'zod'

export const ArticleListQuerySchema = z.object({
    status: z.string().optional(),
    feedId: z.string().optional(),
    q: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(30),
})

export const ArticleListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    feedTitle: z.string().nullable(),
    status: z.string(),
    readState: z.string(),
    favorite: z.boolean(),
    publishedAt: z.string().nullable(),
    summaryPreview: z.string().nullable(),
})
```

---

# 9. API Design

统一前缀：

```text
/api/v1
```

第一版 response 格式：

```json
{
    "data": {},
    "meta": {}
}
```

错误格式：

```json
{
    "error": {
        "code": "ARTICLE_NOT_FOUND",
        "message": "Article not found",
        "details": {}
    }
}
```

## 9.1 Feed API

| 方法     | 路径                         | 说明                 |
| -------- | ---------------------------- | -------------------- |
| `POST`   | `/api/v1/feeds`              | 添加 RSS             |
| `GET`    | `/api/v1/feeds`              | Feed 列表            |
| `GET`    | `/api/v1/feeds/:id`          | Feed 详情            |
| `POST`   | `/api/v1/feeds/:id/sync`     | 手动同步             |
| `PATCH`  | `/api/v1/feeds/:id`          | 修改 feed            |
| `PATCH`  | `/api/v1/feeds/:id/workflow` | 修改 workflow config |
| `DELETE` | `/api/v1/feeds/:id`          | 删除 feed            |

### 添加 RSS

```http
POST /api/v1/feeds
Content-Type: application/json
```

```json
{
    "url": "https://example.com/feed.xml",
    "title": "Example Feed",
    "workflowConfigId": "wf_default",
    "syncNow": true
}
```

响应：

```json
{
    "data": {
        "id": "feed_123",
        "url": "https://example.com/feed.xml",
        "title": "Example Feed",
        "enabled": true,
        "workflowConfigId": "wf_default",
        "lastSyncAt": null,
        "createdAt": "2026-05-15T12:00:00.000Z"
    },
    "meta": {
        "syncJobId": "job_123"
    }
}
```

### 手动同步

```http
POST /api/v1/feeds/feed_123/sync
```

```json
{
    "force": false
}
```

响应：

```json
{
    "data": {
        "jobId": "job_456",
        "status": "pending"
    }
}
```

## 9.2 Article API

| 方法    | 路径                              | 说明          |
| ------- | --------------------------------- | ------------- |
| `POST`  | `/api/v1/articles`                | 手动添加 URL  |
| `GET`   | `/api/v1/articles`                | 阅读列表      |
| `GET`   | `/api/v1/articles/:id`            | 文章详情      |
| `PATCH` | `/api/v1/articles/:id/read-state` | 阅读状态      |
| `PATCH` | `/api/v1/articles/:id/favorite`   | 收藏          |
| `POST`  | `/api/v1/articles/:id/reprocess`  | 重新处理      |
| `GET`   | `/api/v1/articles/:id/pipeline`   | pipeline 状态 |

### 手动添加 URL

```http
POST /api/v1/articles
Content-Type: application/json
```

```json
{
    "url": "https://example.com/article",
    "startPipeline": true
}
```

响应：

```json
{
    "data": {
        "articleId": "art_123",
        "pipelineRunId": "run_123",
        "status": "queued"
    }
}
```

手动 URL 也写入 `ArticleSource`，`dedupeKey` 使用 `manual:${canonicalUrlHash}`。如果文章已存在，接口返回已有 article，并按需创建新的 pipeline run。

### 列表

```http
GET /api/v1/articles?status=ready&readState=unread&feedId=feed_123&limit=30&cursor=abc
```

响应：

```json
{
    "data": [
        {
            "id": "art_123",
            "title": "An Example Article",
            "feed": {
                "id": "feed_123",
                "title": "Example Feed"
            },
            "status": "ready",
            "readState": "unread",
            "favorite": false,
            "publishedAt": "2026-05-14T10:00:00.000Z",
            "language": "en",
            "summaryPreview": "这篇文章主要讨论……",
            "pipeline": {
                "latestRunId": "run_123",
                "status": "succeeded",
                "completedSteps": 7,
                "totalSteps": 7
            }
        }
    ],
    "meta": {
        "nextCursor": "next_cursor"
    }
}
```

### 详情

```http
GET /api/v1/articles/art_123
```

响应：

```json
{
    "data": {
        "id": "art_123",
        "title": "An Example Article",
        "originalUrl": "https://example.com/article",
        "canonicalUrl": "https://example.com/article",
        "status": "ready",
        "readState": "unread",
        "favorite": false,
        "sources": [
            {
                "sourceType": "rss",
                "feedId": "feed_123",
                "feedTitle": "Example Feed"
            }
        ],
        "content": {
            "markdownContent": "# Article\n\nContent...",
            "textContent": "Article content...",
            "wordCount": 1800,
            "fetchedAt": "2026-05-15T12:10:00.000Z"
        },
        "aiOutputs": {
            "summary": {
                "language": "zh-CN",
                "outputJson": {
                    "shortSummary": "……",
                    "keyPoints": ["……"]
                }
            },
            "translation": null,
            "insight": {
                "language": "zh-CN",
                "outputJson": {
                    "whyItMatters": "……"
                }
            }
        }
    }
}
```

### 重新处理

```http
POST /api/v1/articles/art_123/reprocess
Content-Type: application/json
```

```json
{
    "fromStepKey": "ai_summary",
    "workflowConfigId": "wf_default",
    "forceAi": false
}
```

响应：

```json
{
    "data": {
        "pipelineRunId": "run_789",
        "status": "pending"
    }
}
```

## 9.3 Workflow API

| 方法    | 路径                                                | 说明          |
| ------- | --------------------------------------------------- | ------------- |
| `GET`   | `/api/v1/workflows`                                 | workflow 列表 |
| `GET`   | `/api/v1/workflows/default`                         | 默认 workflow |
| `POST`  | `/api/v1/workflows`                                 | 创建 workflow |
| `PUT`   | `/api/v1/workflows/:id`                             | 覆盖更新      |
| `PATCH` | `/api/v1/workflows/:id`                             | 局部更新      |
| `POST`  | `/api/v1/pipeline-runs/:runId/steps/:stepKey/retry` | retry step    |
| `POST`  | `/api/v1/pipeline-runs/:runId/steps/:stepKey/skip`  | skip step     |

### Retry step

```http
POST /api/v1/pipeline-runs/run_123/steps/ai_summary/retry
```

```json
{
    "resetDownstream": true,
    "force": false
}
```

响应：

```json
{
    "data": {
        "pipelineRunId": "run_123",
        "stepKey": "ai_summary",
        "status": "queued",
        "jobId": "job_999"
    }
}
```

### Skip step

```http
POST /api/v1/pipeline-runs/run_123/steps/translate_summary/skip
```

```json
{
    "reason": "I do not need translation for this article"
}
```

响应：

```json
{
    "data": {
        "pipelineRunId": "run_123",
        "stepKey": "translate_summary",
        "status": "skipped"
    }
}
```

## 9.4 Settings API

| 方法     | 路径                            | 说明                  |
| -------- | ------------------------------- | --------------------- |
| `GET`    | `/api/v1/settings/ai`           | AI provider 设置      |
| `PATCH`  | `/api/v1/settings/ai`           | 更新 AI provider 设置 |
| `GET`    | `/api/v1/settings/ai/usage`     | 今日 AI 用量          |
| `PUT`    | `/api/v1/settings/secrets/:key` | 设置 secret           |
| `DELETE` | `/api/v1/settings/secrets/:key` | 删除 secret           |
| `GET`    | `/api/v1/settings/fetching`     | 抓取设置              |
| `PATCH`  | `/api/v1/settings/fetching`     | 更新抓取设置          |
| `GET`    | `/api/v1/settings/worker`       | worker 设置           |
| `PATCH`  | `/api/v1/settings/worker`       | 更新 worker 设置      |
| `GET`    | `/api/v1/settings/cleanup`      | 清理设置              |
| `PATCH`  | `/api/v1/settings/cleanup`      | 更新清理设置          |

### AI 设置

```http
PATCH /api/v1/settings/ai
```

```json
{
    "provider": "openai_compatible",
    "baseUrl": "https://api.openai.com/v1",
    "summaryModel": "gpt-4.1-mini",
    "translationModel": "gpt-4.1-mini",
    "insightModel": "gpt-4.1-mini",
    "targetLanguage": "zh-CN",
    "maxInputTokensPerArticle": 12000,
    "dailyCallLimit": 200,
    "dailyInputTokenLimit": 500000,
    "dailyOutputTokenLimit": 100000,
    "dailyCostUsdLimit": 5,
    "autoRunAiForNewArticles": true
}
```

响应不返回 API key：

```json
{
    "data": {
        "provider": "openai_compatible",
        "baseUrl": "https://api.openai.com/v1",
        "summaryModel": "gpt-4.1-mini",
        "translationModel": "gpt-4.1-mini",
        "insightModel": "gpt-4.1-mini",
        "targetLanguage": "zh-CN",
        "maxInputTokensPerArticle": 12000,
        "dailyCallLimit": 200,
        "dailyCostUsdLimit": 5,
        "autoRunAiForNewArticles": true,
        "apiKeyConfigured": true,
        "apiKeyHint": "sk-...abcd"
    }
}
```

### 今日 AI 用量

```http
GET /api/v1/settings/ai/usage
```

响应：

```json
{
    "data": {
        "date": "2026-05-17",
        "calls": 48,
        "inputTokens": 120000,
        "outputTokens": 18000,
        "costUsd": 1.37,
        "limits": {
            "dailyCallLimit": 200,
            "dailyInputTokenLimit": 500000,
            "dailyOutputTokenLimit": 100000,
            "dailyCostUsdLimit": 5
        }
    }
}
```

### 设置 API key

```http
PUT /api/v1/settings/secrets/ai.openai.apiKey
```

```json
{
    "value": "sk-..."
}
```

响应：

```json
{
    "data": {
        "key": "ai.openai.apiKey",
        "configured": true,
        "keyHint": "sk-...abcd",
        "rotatedAt": "2026-05-15T12:00:00.000Z"
    }
}
```

---
