# 10. Vue Frontend Design

## 10.1 路由设计

```text
/
  -> /articles

/articles
  阅读列表

/articles/:articleId
  文章详情

/feeds
  Feed 管理

/feeds/:feedId
  Feed 详情、同步历史、workflow 设置

/workflows
  Workflow 列表

/workflows/:workflowId
  Workflow 配置编辑

/jobs
  Job / pipeline debug 页面，可在高级模式显示

/settings
  /settings/ai
  /settings/fetching
  /settings/worker
  /settings/cleanup
  /settings/security
```

## 10.2 状态管理

推荐：

- **TanStack Query**：服务端状态
    - article list
    - article detail
    - feed list
    - pipeline status polling
    - settings fetch/mutation

- **Pinia**：客户端 UI 状态
    - sidebar collapsed
    - selected feed filter
    - reader font size
    - theme
    - article layout
    - debug mode

不要把 article list 全量塞进 Pinia。它是 server state，应该由 Query cache 管理。

## 10.3 API client 封装

```text
apps/web/src/lib/api/
  http.ts
  errors.ts
  feeds.api.ts
  articles.api.ts
  workflows.api.ts
  settings.api.ts
```

示例：

```ts
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`/api/v1${path}`, {
        ...options,
        headers: {
            'content-type': 'application/json',
            ...(options?.headers ?? {}),
        },
    })

    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new ApiError(res.status, body?.error)
    }

    const body = await res.json()
    return body.data as T
}
```

## 10.4 页面结构

```text
apps/web/src/
  pages/
    ArticlesPage.vue
    ArticleDetailPage.vue
    FeedsPage.vue
    FeedDetailPage.vue
    WorkflowsPage.vue
    WorkflowEditorPage.vue
    SettingsPage.vue

  features/
    articles/
      api.ts
      queries.ts
      components/
        ArticleList.vue
        ArticleListItem.vue
        ArticleStatusBadge.vue
        ArticleToolbar.vue
        ArticleReader.vue
        ArticleAiPanel.vue
        ArticlePipelinePanel.vue

    feeds/
      api.ts
      queries.ts
      components/
        FeedList.vue
        FeedForm.vue
        FeedSyncButton.vue
        FeedStatusBadge.vue

    workflow/
      api.ts
      components/
        WorkflowStepList.vue
        WorkflowStepEditor.vue
        WorkflowJsonPreview.vue
        WorkflowValidationAlert.vue

    settings/
      components/
        AiSettingsForm.vue
        FetchingSettingsForm.vue
        WorkerSettingsForm.vue
        CleanupSettingsForm.vue
```

## 10.5 阅读列表 UI

核心信息：

- 标题
- 来源 feed
- 多来源提示，例如同一文章来自多个 feed
- 发布时间 / 摄入时间
- 阅读状态
- 收藏状态
- pipeline 状态
- 摘要 preview
- 语言
- 失败提示

状态展示建议：

```text
[处理中 4/7]    pipeline running
[已完成]        ready
[部分失败]      partial_failed
[已过滤]        filtered
[失败]          failed
```

交互：

- 点击文章进入详情
- 快捷标记已读
- 收藏
- 重新处理
- 只看未读 / 收藏 / 失败 / 处理中
- 失败文章一键 retry

## 10.6 文章详情 UI

布局：

```text
┌───────────────────────────────────────────────┐
│ Title / Source / Open original / Favorite      │
├───────────────────────────────────────────────┤
│ Tabs: Reader | Summary | Translation | Insight │
├───────────────────────────┬───────────────────┤
│ Article content            │ Pipeline sidepanel│
│ Markdown / sanitized HTML   │ Step timeline    │
│                             │ Retry / Skip     │
└───────────────────────────┴───────────────────┘
```

AI 区块：

- Summary
    - 一句话摘要
    - 要点
    - 标签

- Translation
    - 第一版展示“标题 + 摘要翻译”
    - 全文翻译如果未启用，明确显示“未启用全文翻译”

- Insight
    - 为什么重要
    - 背景
    - 可能偏见 / 不确定性
    - 可跟进问题

## 10.7 Pipeline 状态展示 UI

`ArticlePipelinePanel.vue`：

```text
Pipeline: partial_failed

✓ pre_filter
✓ fetch_fulltext
✓ content_filter
✓ ai_summary
✕ translate_summary
  Error: RATE_LIMIT
  [Retry] [Skip]
○ ai_insight
○ finalize_reading
```

正在处理时：

- 使用 TanStack Query polling，每 2-5 秒刷新。
- 终态后停止 polling。
- 用户点击 retry 后立即 optimistic update 为 queued。

## 10.8 Workflow 配置 UI

第一版不做完整 workflow editor，也不做复杂可视化 DAG builder。默认 workflow 先内置，设置页只开放少量高价值开关，避免把第一版做成配置系统。

第一版可配置：

- 是否自动抓取全文
- 是否自动生成 AI 摘要
- 是否自动翻译摘要
- 是否自动生成 AI 解读
- 默认目标语言
- AI 模型
- 单篇最大输入 token
- 每日 AI 预算
- feed 级别是否自动运行 AI
- fetch timeout / max bytes

后续 workflow editor 再做：

- 左侧 step list
- 右侧 step 参数表单
- 底部 JSON preview
- 保存时服务端校验
- 提供“恢复默认 workflow”

后续可编辑项：

- enable / disable step
- required / optional
- max attempts
- timeout
- AI model
- target language
- fetch extractor
- filtering rules

## 10.9 错误重试交互

用户看到的状态应该是产品语言，而不是工程语言：

| 技术状态                   | 用户文案                 |
| -------------------------- | ------------------------ |
| `running`                  | 正在处理                 |
| `succeeded`                | 已完成                   |
| `partial_failed`           | 部分步骤失败，但文章可读 |
| `filtered`                 | 已根据规则过滤           |
| `paused`                   | 已暂停，等待设置或预算   |
| `dead` job                 | 多次重试失败             |
| `RATE_LIMIT`               | AI 服务限流，稍后可重试  |
| `AI_BUDGET_EXCEEDED`       | 已达到今日 AI 预算       |
| `FETCH_TIMEOUT`            | 抓取超时                 |
| `SCHEMA_VALIDATION_FAILED` | AI 返回格式异常          |

---
