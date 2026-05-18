# 2. Recommended Architecture

## 2.1 总体架构图

```text
                  ┌────────────────────────────┐
                  │        Vue 3 + Vite         │
                  │  Reading UI / Settings UI   │
                  └─────────────┬──────────────┘
                                │ REST / JSON
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       NestJS Server                         │
│                                                             │
│  Controllers / DTO / Auth-lite / Validation / Composition   │
│                                                             │
│  ┌───────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │ FeedsModule   │   │ArticlesModule│   │WorkflowModule │  │
│  └───────┬───────┘   └──────┬───────┘   └───────┬───────┘  │
│          │                  │                   │          │
│          └──────────────────┼───────────────────┘          │
│                             ▼                              │
│              packages/core workflow engine                  │
│              pure TypeScript state machine                  │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
                    packages/db repositories
                              │
                              ▼
                      Prisma + SQLite
                              ▲
                              │
┌─────────────────────────────┴──────────────────────────────┐
│                        Nest Worker                         │
│                                                             │
│  Poll Job table → claim job → execute step → update runs    │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ fetching pkg │   │   ai pkg     │   │ core pipeline  │  │
│  │ RSS/fulltext │   │ summary etc. │   │ step registry  │  │
│  └──────────────┘   └──────────────┘   └────────────────┘  │
└─────────────────────────────────────────────────────────────┘

External:
  RSS feeds / URLs / websites
  OpenAI-compatible AI providers
  Optional Jina Reader / Browserless fallback

Future:
  Electron main process
     ├─ starts Nest server
     ├─ starts worker
     ├─ stores SQLite under app data path
     └─ renderer reuses Vue app
```

## 2.2 模块职责

| 模块              | 职责                                                            | 不做什么                                        |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Vue Web           | 阅读列表、文章详情、feed 管理、workflow 设置、pipeline 状态展示 | 不直接访问 SQLite，不持有 AI key                |
| Nest API          | REST API、请求校验、session/auth-lite、组合应用服务             | 不写核心 workflow 状态机                        |
| Nest Worker       | 轮询 job、claim job、执行 pipeline step、失败重试               | 不暴露 UI API，不做复杂调度平台                 |
| packages/core     | workflow 定义、状态机、step contract、过滤规则、hash、纯函数    | 不依赖 Nest、Prisma、HTTP SDK                   |
| packages/db       | Prisma Client、repository、事务、迁移约定                       | 不放业务 workflow 规则                          |
| packages/fetching | RSS 解析、HTTP fetch、SSRF guard、fulltext extractor            | 不做 AI 摘要，不直接写 UI 状态                  |
| packages/ai       | provider adapter、prompt registry、结构化输出、错误分类         | 不知道 Nest controller，不直接操作 API response |
| packages/shared   | DTO 类型、Zod schema、常量、状态枚举                            | 不放服务端私密逻辑                              |
| packages/config   | 环境变量、路径、feature flags、默认设置                         | 不读取业务表                                    |

## 2.3 为什么采用 modular monorepo

推荐使用 `pnpm workspace` 或 Turborepo 风格 monorepo，但不要为了 monorepo 引入过重工具链。

适合的原因：

1. **前后端共享类型**：ArticleStatus、WorkflowDefinition、API schema 可以共享。
2. **核心逻辑可复用**：未来 Electron、server、worker 都复用 `core`。
3. **隔离框架依赖**：Nest 只在 `apps/server`，Vue 只在 `apps/web`。
4. **测试更清晰**：`core` 可以做纯单元测试，`db` 做 SQLite integration test。
5. **未来桌面复用**：Electron 只包装 web + server + worker，不重写业务逻辑。

## 2.4 NestJS 的合理使用方式

NestJS 在这里适合做：

- API controller
- DI composition root
- config / lifecycle
- worker bootstrap
- repository provider 注入
- e2e testing host

NestJS 官方支持 standalone application，可以用 `NestFactory.createApplicationContext()` 启动没有 HTTP listener 的应用上下文，这正适合 worker 进程；需要注意 standalone app 不具备 HTTP 相关能力，例如 route、middleware、controller interceptor 等。([NestJS Documentation][2])

## 2.5 哪些核心逻辑不应该依赖 Nest

这些必须放在纯 TypeScript package：

- Workflow 状态机
- Step 定义与 step registry contract
- Article 状态流转
- URL normalization / hash
- 内容过滤规则
- AI output schema
- retry policy 计算
- job backoff 计算
- provider interface

原因：这些逻辑未来会被 API、worker、Electron、测试脚本共同使用。如果写进 Nest service，很快会出现“业务逻辑离不开 Nest container”的问题。

## 2.6 API 和 worker 是否同进程

第一版建议支持两种启动方式：

```bash
pnpm dev:server      # API + worker 同进程，个人开发默认
pnpm dev:api         # 只启动 API
pnpm dev:worker      # 只启动 worker
```

第一版默认同进程可以降低部署复杂度。需要拆开时机：

- AI / fetch job 变慢，影响 API 响应
- 需要 worker 单独重启
- 需要多个 worker 实例
- Electron main process 需要分别控制 API / worker lifecycle
- 小团队版本需要 API 稳定在线，worker 可横向增加

---

# 4. Monorepo Structure

推荐结构：

```text
ai-reader/
  apps/
    web/
      src/
        app/
        pages/
        routes/
        components/
        features/
        lib/
        styles/
      vite.config.ts
      package.json

    server/
      src/
        main.ts
        worker.ts
        app.module.ts
        modules/
          config/
          prisma/
          workspace/
          feeds/
          articles/
          workflow/
          pipeline/
          jobs/
          worker/
          ai/
          fetching/
          settings/
          auth/
        common/
          dto/
          filters/
          guards/
          interceptors/
      test/
      package.json

    desktop/
      src/
        main/
        preload/
      electron.vite.config.ts
      package.json

  packages/
    core/
      src/
        workflow/
          types.ts
          engine.ts
          state-machine.ts
          step-registry.ts
          retry-policy.ts
        article/
          status.ts
          filters.ts
        url/
          normalize-url.ts
          hash.ts
        errors/
          app-error.ts
          error-category.ts
        index.ts
      package.json

    db/
      prisma/
        schema.prisma
        migrations/
      src/
        prisma-client.ts
        repositories/
          workspace.repository.ts
          feed.repository.ts
          article.repository.ts
          workflow.repository.ts
          pipeline.repository.ts
          job.repository.ts
          setting.repository.ts
        transactions.ts
        sqlite-pragmas.ts
        index.ts
      package.json

    ai/
      src/
        providers/
          ai-provider.ts
          openai-compatible.provider.ts
          provider-registry.ts
        prompts/
          registry.ts
          summary.v1.ts
          translation.v1.ts
          insight.v1.ts
        schemas/
          summary.schema.ts
          translation.schema.ts
          insight.schema.ts
        ai-errors.ts
        input-hash.ts
        index.ts
      package.json

    fetching/
      src/
        http/
          safe-fetch.ts
          ssrf-guard.ts
          redirect-policy.ts
          content-limits.ts
        rss/
          feed-parser.ts
          feed-normalizer.ts
        fulltext/
          fulltext-extractor.ts
          readability.extractor.ts
          jina-reader.extractor.ts
          browserless.extractor.ts
        index.ts
      package.json

    shared/
      src/
        api/
          feeds.schema.ts
          articles.schema.ts
          workflow.schema.ts
          settings.schema.ts
        constants/
          statuses.ts
          languages.ts
        types/
        index.ts
      package.json

    config/
      src/
        env.ts
        paths.ts
        defaults.ts
        feature-flags.ts
        index.ts
      package.json

  tooling/
    eslint/
    tsconfig/

  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
```

## 4.1 package 边界

### `packages/core`

放：

- workflow engine
- pipeline state machine
- step definition types
- retry policy
- URL canonicalization
- hash
- filtering rules
- pure error categories
- article status transition

不放：

- Nest decorators
- Prisma Client
- HTTP fetch
- OpenAI SDK
- Electron API
- Vue code

### `packages/db`

放：

- Prisma schema
- Prisma Client creation
- repository
- migration helper
- SQLite pragmas
- transaction helper

不放：

- AI prompt
- HTTP fetching
- Vue DTO rendering
- workflow step 业务实现

### `packages/ai`

放：

- provider adapter
- OpenAI-compatible client wrapper
- prompt registry
- structured output schema
- AI error classification
- token usage normalization
- inputHash 计算

不放：

- Article repository 直接调用逻辑
- Nest controller
- 前端设置页面

### `packages/fetching`

放：

- RSS parser
- safe HTTP client
- SSRF guard
- redirect validation
- fulltext extractor abstraction
- Readability extractor
- Jina / Browserless optional extractor

不放：

- PipelineRun 写库
- AI 摘要
- Vue rendering

### `apps/server`

放：

- Nest module
- controller
- service composition
- worker entry
- API validation
- auth/session
- application bootstrap

不放：

- 纯 workflow engine 的核心算法
- Prisma schema
- provider-specific prompt 内容

---
