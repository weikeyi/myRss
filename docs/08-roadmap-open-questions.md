# 17. Implementation Roadmap

路线图调整为 **垂直闭环优先**：先让一篇文章从手动 URL 进入系统，经过 job / pipeline / fulltext，最后出现在阅读页；再扩展 RSS 批量摄入、AI、过滤、设置和桌面端。

这样可以最早验证真正的技术风险：

- 异步链路是否可靠。
- step / job / article 状态是否一致。
- 全文抓取是否可用。
- 阅读页是否真的能承载处理结果。
- AI 成本、失败和重试是否可控。

---

## Phase 0：项目初始化

### 目标

搭建 monorepo、基础工具链、空 Nest API、空 Vue app、Prisma SQLite 初始化。

### 具体任务

- 创建 pnpm workspace。
- 配置 TypeScript project references。
- 配置 ESLint / Prettier。
- 创建 `apps/web`。
- 创建 `apps/server`。
- 创建 `packages/core`、`packages/db`、`packages/shared`、`packages/config`。
- 初始化 Prisma SQLite。
- 创建 health check API。
- 创建默认 env config。

### 关键文件

```text
pnpm-workspace.yaml
tsconfig.base.json
apps/web/vite.config.ts
apps/server/src/main.ts
apps/server/src/app.module.ts
packages/db/prisma/schema.prisma
packages/config/src/env.ts
```

### 验收标准

- `pnpm dev:web` 可启动。
- `pnpm dev:server` 可启动。
- `GET /api/v1/healthz` 返回 ok。
- Prisma migrate dev 成功。
- `pnpm typecheck`、`pnpm test`、`pnpm build` 至少有可运行骨架。

### 不做什么

- 不做 RSS。
- 不做 AI。
- 不做 Electron。
- 不做完整认证系统。

---

## Phase 1：基础数据模型 + 阅读列表骨架

### 目标

完成默认 workspace、核心文章模型、最小 API 和阅读列表 UI，让系统有可见的数据面。

### 具体任务

- 实现 Workspace / User / WorkspaceUser bootstrap。
- 实现 Feed / Article / ArticleSource / ArticleContent 基础模型。
- 实现 Prisma repositories。
- 实现 Article list/detail API。
- 实现 read / favorite API。
- 实现 Vue 阅读列表、文章详情空态和基础布局。

### 关键文件

```text
packages/db/prisma/schema.prisma
packages/db/src/repositories/article.repository.ts
packages/db/src/repositories/feed.repository.ts
apps/server/src/modules/workspace/
apps/server/src/modules/articles/
apps/web/src/pages/ArticlesPage.vue
apps/web/src/pages/ArticleDetailPage.vue
packages/shared/src/api/articles.schema.ts
```

### 验收标准

- 默认 workspace 启动时自动创建。
- 手动插入或测试 fixture 的 article 可在列表中显示。
- article list 支持分页。
- read / favorite 可更新。
- 所有查询带 `workspaceId`。

### 可能风险

- 过早设计复杂 user auth。
- DTO 直接暴露 Prisma model。
- `Article.status` 与后续 pipeline 状态规则不清。

### 不做什么

- 不做 feed sync。
- 不做 AI。
- 不做复杂设置页。

---

## Phase 2：Job + Pipeline 最小骨架

### 目标

先实现异步执行底座，让每一步处理都有可追踪状态，再往上叠抓取和 AI。

### 具体任务

- 创建 Job / WorkflowConfig / PipelineRun / PipelineStepRun。
- 实现默认线性 workflow 定义。
- 实现 JobRepository：enqueue / claim / heartbeat / succeed / retry / dead / pause。
- claim 时写入 `lockedBy` 和 `lockVersion`。
- job 后续状态更新必须校验 `lockedBy + lockVersion`。
- 实现 WorkerModule 和 standalone worker entry。
- 实现 pipeline starter 和 step scheduler。
- 实现一个 no-op step handler 用于验证链路。
- 实现 pipeline status API 和前端 timeline 骨架。

### 关键文件

```text
packages/core/src/workflow/types.ts
packages/core/src/workflow/engine.ts
packages/core/src/workflow/retry-policy.ts
packages/db/src/repositories/job.repository.ts
packages/db/src/repositories/pipeline.repository.ts
apps/server/src/worker.ts
apps/server/src/modules/jobs/
apps/server/src/modules/pipeline/
apps/server/src/modules/worker/
apps/web/src/features/articles/components/ArticlePipelinePanel.vue
```

### 验收标准

- API 可启动一个测试 pipeline。
- worker 可 claim job 并执行 no-op step。
- 同一个 job 不重复执行。
- worker 重启可恢复 stale running job。
- heartbeat、retry、dead、paused 状态可查。
- `Article.status` 只由 pipeline finalizer 或状态同步服务更新。

### 可能风险

- SQLite busy。
- claim 逻辑竞态。
- job 成功和 step 成功边界混乱。
- 旧 worker 恢复后覆盖新 worker 结果。

### 不做什么

- 不上 Redis。
- 不做多机器 worker。
- 不做 DAG。
- 不做重型 job dashboard。

---

## Phase 3：手动 URL 垂直闭环

### 目标

先打通一篇文章的完整体验：输入 URL -> 创建 Article -> 启动 pipeline -> 抓取全文 -> 阅读页展示。

### 具体任务

- 实现 manual URL API。
- 实现 URL normalize / canonicalUrlHash。
- manual URL 写入 Article 和 ArticleSource。
- 实现 safe fetch 初版。
- 实现 SSRF guard 初版。
- 接入 Readability + jsdom。
- 实现 `fetch_fulltext` step。
- 存储 ArticleContent。
- 阅读详情页展示 Markdown / sanitized HTML。
- 失败时展示 step 错误和 retry。

### 关键文件

```text
packages/core/src/url/normalize-url.ts
packages/fetching/src/http/safe-fetch.ts
packages/fetching/src/http/ssrf-guard.ts
packages/fetching/src/fulltext/readability.extractor.ts
apps/server/src/modules/articles/
apps/server/src/modules/pipeline/steps/fetch-fulltext.step.ts
apps/web/src/features/articles/components/ArticleReader.vue
apps/web/src/features/articles/components/ArticlePipelinePanel.vue
```

### 验收标准

- 输入公开文章 URL 后，文章进入列表。
- pipeline 状态可见。
- 抓取成功后详情页能阅读正文。
- 抓取失败后可 retry。
- private IP / localhost / metadata IP 被拒绝。
- raw HTML 默认不保存。

### 可能风险

- JS-heavy 页面抓不到正文。
- XSS sanitization 不完整。
- URL canonicalization 过度清理导致误合并。

### 不做什么

- 不做 RSS 批量同步。
- 不做 AI。
- 不做 Browserless 默认接入。
- 不缓存图片。

---

## Phase 4：RSS ingestion

### 目标

在已经跑通单篇文章 pipeline 后，再实现 RSS 拉取、解析、去重和批量入库。

### 具体任务

- 实现 RSS parser。
- 实现 feed CRUD。
- 实现 feed item normalize。
- 保存 feed etag / lastModified。
- feed sync 创建 `feed.sync` job。
- feed item upsert Article。
- 每个来源写 ArticleSource。
- 新文章自动启动 pipeline。
- 列表支持 feed 过滤。

### 关键文件

```text
packages/fetching/src/rss/feed-parser.ts
packages/fetching/src/rss/feed-normalizer.ts
apps/server/src/modules/feeds/
apps/server/src/modules/feeds/feed-sync.service.ts
apps/web/src/pages/FeedsPage.vue
apps/web/src/features/feeds/
```

### 验收标准

- 添加 RSS URL 成功。
- 手动同步 feed 可生成 job。
- 重复 sync 不重复创建 Article。
- 同一 Article 可记录多个 ArticleSource。
- feed sync 错误可记录并展示。
- 新文章可自动进入 pipeline。

### 可能风险

- RSS 格式脏数据。
- GUID 不稳定。
- 大量 feed 同步触发太多 pipeline。

### 不做什么

- 不做复杂定时调度。
- 不做 OPML 导入导出。
- 不做全文搜索。

---

## Phase 5：AI 摘要 + 成本保护

### 目标

实现第一版 AI 价值，但把预算、token、失败重试和缓存一起做进去。

### 具体任务

- 实现 AI provider adapter。
- 实现 OpenAI-compatible config。
- 实现 API key 设置但不回显。
- 实现 prompt registry。
- 实现 summary schema。
- 实现 inputHash。
- 实现 ArticleAiOutput 缓存。
- 实现每日调用、token、cost 预算。
- 实现单篇最大输入 token 限制。
- 实现 `ai_summary` step。
- 前端展示 summary 和 AI budget 状态。

### 关键文件

```text
packages/ai/src/providers/openai-compatible.provider.ts
packages/ai/src/prompts/summary.v1.ts
packages/ai/src/schemas/summary.schema.ts
packages/ai/src/input-hash.ts
apps/server/src/modules/ai/
apps/server/src/modules/settings/
apps/server/src/modules/pipeline/steps/ai-summary.step.ts
apps/web/src/features/articles/components/ArticleAiPanel.vue
apps/web/src/features/settings/components/AiSettingsForm.vue
```

### 验收标准

- AI key 设置后可生成摘要。
- 输出通过 schema 校验。
- 重复处理命中 cache。
- rate limit 可 retry。
- auth failure 明确提示用户。
- 超预算时 step/job 进入 `paused`，不是永久 failed。
- 设置页可看到今日 AI 用量。

### 可能风险

- provider API 差异。
- JSON schema 不兼容部分模型。
- token 成本失控。
- 长文超过上下文。

### 不做什么

- 不做多轮对话。
- 不做 RAG。
- 不做全文翻译。
- 不默认对所有 feed 强制跑 AI。

---

## Phase 6：过滤 + 失败处理体验

### 目标

让自动摄入更可控，并把 pipeline 的失败、跳过、重试做成用户能理解的操作。

### 具体任务

- pre_filter：标题、URL、feed 规则。
- content_filter：字数、语言、关键词。
- filtered 状态流转。
- optional step failed 后 pipeline partial_failed。
- retry step。
- skip optional step。
- dead jobs 页面或高级模式列表。
- 前端显示 filtered reason 和失败原因。

### 关键文件

```text
packages/core/src/article/filters.ts
apps/server/src/modules/pipeline/steps/pre-filter.step.ts
apps/server/src/modules/pipeline/steps/content-filter.step.ts
apps/server/src/modules/pipeline/
apps/server/src/modules/jobs/
apps/web/src/features/articles/components/ArticleStatusBadge.vue
apps/web/src/pages/JobsPage.vue
```

### 验收标准

- 符合规则的文章直接 filtered。
- filtered 文章不进入 AI step。
- optional step 可 skip。
- 失败文章可 retry。
- 用户看到的是产品文案，不是底层异常堆栈。

### 可能风险

- 过滤规则太复杂。
- 用户误过滤重要文章。
- retry step 和 job retry 边界混乱。

### 不做什么

- 不做机器学习分类器。
- 不做复杂规则 DSL。
- 不做向量过滤。

---

## Phase 7：翻译、解读与轻量设置

### 目标

在摘要稳定后，再补充摘要翻译、AI 解读和必要设置。workflow editor 仍保持克制。

### 具体任务

- translation prompt/schema。
- insight prompt/schema。
- 翻译标题 + 摘要 + key points。
- insight 使用正文 + summary。
- 目标语言设置。
- feed 级别 AI 开关。
- fetching 设置。
- worker 设置。
- cleanup 设置。
- 默认 workflow 的轻量开关。

### 关键文件

```text
packages/ai/src/prompts/translation.v1.ts
packages/ai/src/prompts/insight.v1.ts
packages/ai/src/schemas/translation.schema.ts
packages/ai/src/schemas/insight.schema.ts
apps/server/src/modules/pipeline/steps/ai-translation.step.ts
apps/server/src/modules/pipeline/steps/ai-insight.step.ts
apps/server/src/modules/settings/
apps/web/src/features/settings/
apps/web/src/features/workflow/
```

### 验收标准

- 外文文章可生成中文摘要翻译。
- insight 有结构化输出。
- optional step 失败不会阻止文章可读。
- partial_failed UI 正确。
- 用户可关闭某个 feed 的自动 AI。
- workflow 设置只暴露第一版必要开关。

### 可能风险

- insight 幻觉。
- 翻译成本增加。
- 设置项过多导致 UI 复杂。

### 不做什么

- 不默认全文翻译。
- 不做分块翻译系统。
- 不做事实核查 agent。
- 不做可视化 DAG workflow builder。

---

## Phase 8：数据清理、备份、稳定性

### 目标

让个人长期使用不容易坏、不爆盘。

### 具体任务

- cleanup job。
- backup job。
- raw HTML 清理。
- old jobs 清理。
- old pipeline runs prune。
- SQLite checkpoint helper。
- database compact 手动操作。
- 全局错误分类。
- 日志脱敏。
- 最小 CI 完整化。

### 关键文件

```text
apps/server/src/modules/maintenance/
packages/db/src/sqlite-pragmas.ts
packages/db/src/backup.ts
apps/web/src/pages/JobsPage.vue
apps/web/src/features/settings/components/CleanupSettingsForm.vue
```

### 验收标准

- 可手动创建 backup。
- cleanup job 可执行。
- dead jobs 可查看和 retry。
- 大量删除后可压缩数据库。
- 日志不包含 secret、cookie、全文内容。
- SQLite WAL / backup 行为被测试覆盖。

### 可能风险

- backup 与 WAL 状态不一致。
- cleanup 误删用户需要的数据。
- VACUUM 耗时影响使用。

### 不做什么

- 不做云同步。
- 不做端到端加密备份。
- 不做对象存储。

---

## Phase 9：Electron 评估或打包

### 目标

Web App 闭环稳定后，再验证是否能打成桌面应用。

### 具体任务

- 创建 `apps/desktop`。
- Electron main 启动 renderer。
- resolve data paths。
- 启动 Nest API。
- 启动 worker。
- safeStorage 存 secret。
- 打包 Windows dev build。
- 日志路径。
- graceful shutdown。

### 关键文件

```text
apps/desktop/src/main/index.ts
apps/desktop/src/preload/index.ts
packages/config/src/paths.ts
apps/server/src/main.ts
apps/server/src/worker.ts
```

### 验收标准

- 桌面 app 可启动。
- SQLite 存在 userData 下。
- 关闭 app 后 worker 停止。
- API key 不明文出现在前端。
- 基础阅读流程可用。

### 可能风险

- 打包体积大。
- Node/Electron/Prisma binary 兼容。
- 自动更新和签名复杂。
- Windows 路径问题。

### 不做什么

- 不做正式自动更新。
- 不做托盘常驻。
- 不做开机启动。
- 不做 app store 分发。

---

# 18. Open Questions

建议在开发前确认这些问题：

1. **目标阅读语言**
    - 默认全部输出中文？
    - 是否保留原语言摘要？

2. **AI provider 优先级**
    - OpenAI 官方？
    - OpenAI-compatible 第三方？
    - 本地模型优先？

3. **AI 成本预算**
    - 每日默认调用上限是多少？
    - 是否允许手动操作突破预算？
    - 哪些 feed 默认自动跑 AI？

4. **默认翻译策略**
    - 只翻译摘要？
    - 用户点击后全文翻译？
    - 哪些 feed 自动翻译？

5. **内容保留策略**
    - 是否长期保存全文？
    - raw HTML 是否允许 debug 保存？
    - 文章删除是软删除还是硬删除？

6. **登录模式**
    - 完全本地无登录？
    - 私有部署密码登录？
    - Electron 是否需要锁屏密码？

7. **Feed 数量和同步频率**
    - 高频新闻源多不多？
    - 是否需要 per-feed sync interval？
    - 同步后是否立即自动跑全文抓取和 AI？

8. **是否需要全文搜索**
    - 第一版可以先不做。
    - 后续可用 SQLite FTS5。

9. **是否要支持手动 URL 收集入口**
    - 浏览器 bookmarklet？
    - Web extension？
    - 分享菜单？
    - 第一版建议只做 URL 输入框。

10. **是否需要导入/导出**
    - OPML import/export 对 RSS 产品很有价值。
    - 可以放在 RSS ingestion 稳定后做。

---
