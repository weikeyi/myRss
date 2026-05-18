# 11. Fetching and Security Design

## 11.1 Fetching 层结构

```text
packages/fetching/src/
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
```

## 11.2 RSS parser

推荐第一版使用 Node 环境下稳定的 RSS/Atom parser，例如 `@rowanmanning/feed-parser` 或 `rss-parser`。`@rowanmanning/feed-parser` 文档强调支持 RSS、Atom、RDF、JSON Feed，并且对常见 feed 格式错误做了较多兼容；它解析字符串而不是直接请求 URL，因此更适合配合自定义 safe fetch。([GitHub][9])

设计：

```ts
export interface ParsedFeedItem {
    guid?: string
    title: string
    url: string
    publishedAt?: Date
    author?: string
    summary?: string
    raw?: unknown
}

export interface RssParser {
    parse(xml: string): Promise<ParsedFeedItem[]>
}
```

## 11.3 Fulltext extractor 取舍

| 方案                | 优点                     | 缺点                       | 第一版建议    |
| ------------------- | ------------------------ | -------------------------- | ------------- |
| Readability + jsdom | 本地、免费、隐私好、简单 | JS-heavy 页面效果一般      | 默认          |
| Jina Reader         | 对 LLM 友好，接入快      | 外部服务、隐私、缓存和限制 | 可选 fallback |
| Browserless         | 适合 JS-heavy 页面       | 重、慢、需要服务或云       | 延后          |
| Mercury             | 历史上常用               | 生态维护风险需评估         | 不作为默认    |

Mozilla Readability 是 Firefox Reader View 使用的提取库，输出 title、byline、content、textContent、excerpt、siteName 等字段；其文档也提醒对不可信输入和输出需要做 sanitization 与 CSP。([GitHub][10])

Jina Reader 可以把公开 URL 转成适合 LLM 的文本，并提供代理、浏览器渲染等能力，但它本质是外部服务，隐私和缓存策略要在设置中明确提示，不应第一版默认开启。([Jina AI][11])

Browserless 提供 screenshot、PDF、content scraping、download、function 等 REST API，适合作为后续 JS-heavy 网站抓取 fallback，而不是第一版默认路径。([Browserless Docs][12])

## 11.4 第一版推荐抓取策略

```text
RSS sync:
  safeFetch(feed.url)
  -> parse feed
  -> normalize items
  -> upsert Article
  -> enqueue pipeline

Fulltext:
  safeFetch(article.url)
  -> validate content-type
  -> enforce size limit
  -> ReadabilityExtractor
  -> sanitize / convert to markdown
  -> store ArticleContent
```

默认配置：

```ts
export const defaultFetchingSettings = {
    timeoutMs: 20_000,
    maxRedirects: 3,
    maxRssBytes: 2 * 1024 * 1024,
    maxHtmlBytes: 8 * 1024 * 1024,
    allowedProtocols: ['http:', 'https:'],
    allowPrivateIp: false,
    allowLocalhost: false,
    userAgent: 'AIReaderBot/0.1 (+personal app)',
    saveRawHtml: false,
    rawHtmlRetentionDays: 7,
}
```

## 11.5 SSRF guard 设计

必须做。即使是个人应用，只要允许用户输入 URL，就存在 SSRF 风险。

OWASP SSRF 指南明确区分“只能访问可信目标”和“可访问任意外部 URL”的场景；对于后者，需要校验输入、禁用或严格处理重定向，并阻止访问内部网络地址。([OWASP Cheat Sheet Series][13])

规则：

1. 只允许 `http:` / `https:`
2. 禁止：
    - `localhost`
    - `127.0.0.0/8`
    - `::1`
    - private IP
    - link-local
    - multicast
    - cloud metadata IP
    - file/gopher/ftp/data/javascript scheme

3. DNS resolve 后校验 IP。
4. 每次 redirect 后重新校验目标 URL 和解析 IP。
5. 默认不允许非 80/443 端口；可以在高级设置里 allowlist。
6. 最大 redirect 3 次。
7. 禁止 URL username/password。
8. 记录 final URL，但不记录敏感 header。

示例：

```ts
export interface SsrfGuardOptions {
    allowPrivateIp: boolean
    allowLocalhost: boolean
    allowedProtocols: string[]
    allowedPorts?: number[]
    blockedHosts?: string[]
    allowedHosts?: string[]
}

export interface SsrfGuard {
    validateUrlBeforeRequest(url: URL): Promise<void>
    validateResolvedIp(hostname: string, ip: string): Promise<void>
    validateRedirect(from: URL, to: URL): Promise<void>
}
```

## 11.6 超时、大小、content-type

建议：

| 类型                   | 限制                                           |
| ---------------------- | ---------------------------------------------- |
| RSS fetch timeout      | 15s                                            |
| Fulltext fetch timeout | 20s                                            |
| AI step timeout        | 90s                                            |
| RSS max bytes          | 2MB                                            |
| HTML max bytes         | 8MB                                            |
| Redirect               | max 3                                          |
| Content-Type RSS       | XML / RSS / Atom / text                        |
| Content-Type Article   | text/html / application/xhtml+xml / text/plain |

不要把无限响应读入内存。`safeFetch` 应该边读边计数，超限立即 abort。

## 11.7 日志和 raw HTML

日志保存：

- URL hash
- finalUrl
- status code
- content-type
- byte length
- duration
- extractor
- error code

不要保存：

- cookies
- authorization header
- full HTML
- AI API key
- full article text 到 error log

raw HTML：

- 默认不保存。
- debug 模式可保存到 file storage，不建议存 SQLite。
- 默认保留 7 天。
- 清理任务删除过期 raw HTML。
- ArticleContent 只长期保存 extracted text / markdown / sanitized HTML。

---

# 12. AI Layer Design

## 12.1 Provider adapter

```ts
export interface AiProviderCapabilities {
    structuredOutput: boolean
    jsonMode: boolean
    streaming: boolean
}

export interface GenerateStructuredInput {
    model: string
    systemPrompt: string
    userPrompt: string
    jsonSchema: unknown
    temperature?: number
    maxOutputTokens?: number
    timeoutMs?: number
}

export interface GenerateStructuredResult<T> {
    data: T
    rawText?: string
    inputTokens?: number
    outputTokens?: number
    providerRequestId?: string
}

export interface AiProvider {
    name: string
    capabilities: AiProviderCapabilities

    generateStructured<T>(input: GenerateStructuredInput): Promise<GenerateStructuredResult<T>>
}
```

OpenAI-compatible adapter：

```ts
export interface OpenAiCompatibleConfig {
    baseUrl: string
    apiKey: string
    defaultHeaders?: Record<string, string>
}
```

目标：

- OpenAI
- OpenAI-compatible 服务
- 本地模型网关
- 未来 Ollama / LM Studio

OpenAI 官方文档建议在需要 JSON Schema 约束时使用 Structured Outputs，并指出 strict schema 模式可以让模型输出匹配提供的 JSON Schema；因此第一版 AI 层应优先走结构化输出，provider 不支持时再 fallback 到 JSON mode + Zod 校验。([OpenAI Developers][14])

## 12.2 Prompt registry

```text
packages/ai/src/prompts/
  registry.ts
  summary.v1.ts
  translation.v1.ts
  insight.v1.ts
```

```ts
export interface PromptTemplate {
    key: 'summary' | 'translation' | 'insight'
    version: string
    system: string
    buildUserPrompt(input: Record<string, unknown>): string
    outputSchema: unknown
}

export class PromptRegistry {
    get(key: string, version: string): PromptTemplate {
        // ...
    }
}
```

存储到 `ArticleAiOutput`：

- `promptKey`
- `promptVersion`
- `promptHash`
- `provider`
- `model`
- `language`
- `inputHash`
- `contentHash`
- `outputJson`
- `inputTokens`
- `outputTokens`
- `costUsd`

## 12.3 摘要、翻译、解读分开

不要把“摘要 + 翻译 + 解读”放在一个 AI call 里。原因：

1. 缓存粒度不同。
2. 失败重试粒度不同。
3. 用户可能只想要摘要。
4. 翻译成本高。
5. 解读 prompt 迭代更频繁。
6. 多语言输出可独立生成。

推荐：

```text
AI_SUMMARY:
  input: article text
  output: structured summary

AI_TRANSLATION:
  input: summary/title or selected content
  output: translation

AI_INSIGHT:
  input: article text + summary
  output: interpretation
```

## 12.4 第一版是否翻译全文

不建议默认翻译全文。

推荐第一版：

- 默认翻译标题 + 摘要 + key points。
- 文章正文保持原文。
- 详情页提供“翻译全文”按钮。
- 只有正文低于阈值时才允许自动全文翻译，例如 `<= 6000 tokens`。
- 长文分块翻译放后续。

原因：

- 成本不可控。
- 长文 chunking 会引入上下文一致性问题。
- 大量全文翻译会迅速膨胀数据库体积。
- 阅读产品的第一价值是筛选，不是创建双语全文存档。

## 12.5 inputHash 设计

```ts
export function computeAiInputHash(input: {
    task: 'summary' | 'translation' | 'insight'
    contentHash: string
    promptKey: string
    promptVersion: string
    targetLanguage: string
    params: Record<string, unknown>
}): string {
    return sha256StableJson(input)
}
```

是否包含 model？

建议：

- `inputHash` 不包含 provider/model，只表示任务输入内容。
- 唯一约束包含 provider/model。
- 这样可以比较同一 input 在不同模型下的输出。

唯一键：

```text
workspaceId
articleId
type
language
provider
model
promptKey
promptVersion
inputHash
```

## 12.6 AI 输出缓存

Step 执行前：

```text
1. 计算 contentHash
2. 计算 inputHash
3. 查询 ArticleAiOutput 是否已存在 succeeded output
4. 若存在且 force=false，复用
5. 若不存在，调用 provider
6. validate schema
7. insert output
```

## 12.7 AI 错误分类

```ts
export type AiErrorCode =
    | 'AI_AUTH_FAILED'
    | 'AI_RATE_LIMIT'
    | 'AI_TIMEOUT'
    | 'AI_PROVIDER_5XX'
    | 'AI_BAD_REQUEST'
    | 'AI_SCHEMA_VALIDATION_FAILED'
    | 'AI_CONTEXT_LENGTH_EXCEEDED'
    | 'AI_CONTENT_REJECTED'
    | 'AI_BUDGET_EXCEEDED'
    | 'AI_UNKNOWN'
```

| 错误                    | retry          |
| ----------------------- | -------------- |
| auth failed             | 否             |
| rate limit              | 是             |
| timeout                 | 是             |
| provider 5xx            | 是             |
| bad request             | 否             |
| schema validation       | 可重试 1 次    |
| context length exceeded | 否，需降级截断 |
| content rejected        | 否或人工处理   |
| budget exceeded         | 否，暂停等待   |

OpenAI 关于 API key 安全的文档明确建议不要在浏览器或移动端暴露 API key，并建议使用环境变量、密钥管理、监控和轮换。([OpenAI Help Center][15])

## 12.8 AI 成本保护

AI 成本保护要和 provider adapter 同期实现，不要等到后期再补。个人阅读产品最容易失控的不是单次调用，而是 RSS 批量同步后自动触发大量摘要、翻译和解读。

第一版建议设置：

```json
{
    "aiBudget": {
        "dailyCallLimit": 200,
        "dailyInputTokenLimit": 500000,
        "dailyOutputTokenLimit": 100000,
        "dailyCostUsdLimit": 5,
        "maxInputTokensPerArticle": 12000,
        "autoRunAiForNewArticles": true,
        "autoRunAiForFeedIds": []
    }
}
```

执行策略：

1. AI step 开始前先估算输入 token。
2. 超过 `maxInputTokensPerArticle` 时先截断或降级为“摘要输入”，不要直接把长文全量送入模型。
3. 调用前检查当天预算；超预算时不调用 provider。
4. 超预算不是永久失败，`Job.status` / `PipelineStepRun.status` 进入 `paused`，错误码用 `AI_BUDGET_EXCEEDED`。
5. 用户提高预算或手动继续后，再把 paused job 重新置为 pending。
6. feed 可以关闭自动 AI，只做抓取和阅读列表入库。
7. 所有 AI output 记录 `inputTokens`、`outputTokens`、`costUsd`，用于设置页展示成本。

默认 UX：

- 设置页显示今日调用次数、token、估算费用。
- 文章详情里对暂停的 AI step 显示“已达到今日 AI 预算，可稍后继续”。
- 手动点击“生成摘要”可以要求用户确认是否突破预算。

## 12.9 Summary JSON Schema 示例

```json
{
    "type": "object",
    "additionalProperties": false,
    "required": [
        "language",
        "shortSummary",
        "keyPoints",
        "entities",
        "topics",
        "readingTimeMinutes",
        "confidence"
    ],
    "properties": {
        "language": {
            "type": "string"
        },
        "shortSummary": {
            "type": "string",
            "description": "A concise summary in the target language."
        },
        "keyPoints": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "minItems": 3,
            "maxItems": 8
        },
        "entities": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "topics": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "readingTimeMinutes": {
            "type": "number"
        },
        "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
        }
    }
}
```

## 12.10 Translation JSON Schema 示例

```json
{
    "type": "object",
    "additionalProperties": false,
    "required": [
        "sourceLanguage",
        "targetLanguage",
        "translatedTitle",
        "translatedSummary",
        "translatedKeyPoints"
    ],
    "properties": {
        "sourceLanguage": {
            "type": "string"
        },
        "targetLanguage": {
            "type": "string"
        },
        "translatedTitle": {
            "type": "string"
        },
        "translatedSummary": {
            "type": "string"
        },
        "translatedKeyPoints": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "notes": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    }
}
```

## 12.11 Insight JSON Schema 示例

```json
{
    "type": "object",
    "additionalProperties": false,
    "required": ["whyItMatters", "background", "mainClaims", "uncertainties", "followUpQuestions"],
    "properties": {
        "whyItMatters": {
            "type": "string"
        },
        "background": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "maxItems": 5
        },
        "mainClaims": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "uncertainties": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "followUpQuestions": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "maxItems": 5
        }
    }
}
```

---

# 13. Electron Roadmap

## 13.1 现在如何为 Electron 预留

现在就要避免：

- 写死数据库路径
- 写死 server port
- 前端写死 API origin
- API key 只支持 env
- worker 只能跟 HTTP server 绑定
- raw HTML / backup 路径散落代码中

应该抽象：

```ts
export interface RuntimePaths {
    dataDir: string
    dbFile: string
    blobDir: string
    backupDir: string
    logDir: string
}
```

Web 私有部署：

```text
DATABASE_URL=file:./data/reader.db
APP_DATA_DIR=./data
```

Electron：

```text
APP_DATA_DIR=<electron app userData>/data
DATABASE_URL=file:<electron app userData>/data/reader.db
```

Electron 的 `app.getPath()` 提供 `userData`、`appData`、`logs`、`sessionData` 等路径；文档也提醒 `userData` 通常用于配置文件，较大缓存类数据更适合放在合适的专用路径。([Electron][16])

## 13.2 Electron main process 如何启动 server / worker

建议正式版：

```text
Electron main
  1. resolve paths
  2. find free localhost port
  3. spawn API process
  4. spawn worker process
  5. wait /healthz
  6. create BrowserWindow
  7. renderer loads local file
  8. renderer calls http://127.0.0.1:<port>/api/v1
```

开发版：

```text
Electron renderer -> Vite dev server
API -> Nest dev server
worker -> standalone worker
```

## 13.3 SQLite 文件放哪里

推荐：

```text
<userData>/data/reader.db
<userData>/data/reader.db-wal
<userData>/data/reader.db-shm
<userData>/blobs/
<userData>/backups/
<logs>/
```

允许用户在设置里改数据目录，是 desktop app 的重要能力。

## 13.4 AI key 本地存储

Electron 版本优先：

- OS keychain
- Electron `safeStorage`
- 或 keytar 类库

Electron `safeStorage` 使用系统加密能力为字符串加密，适合保存本地 secret，但应注意不同平台可用性和加密后端差异。([Electron][17])

DB 中存：

```json
{
    "storageBackend": "electron_safe_storage",
    "keyHint": "sk-...abcd"
}
```

不要把明文 key 存到 SQLite。

## 13.5 自动更新

Electron 内置 `autoUpdater` 支持 macOS 和 Windows，Linux 通常要依赖发行渠道；macOS 自动更新还涉及代码签名。([Electron][18])

第一版不要做自动更新。Electron 阶段再引入：

- electron-builder
- signed releases
- update channel
- rollback 策略
- 数据库 migration 前备份

## 13.6 托盘 / 开机启动

后续做：

- tray 常驻
- background sync
- unread count
- launch at login
- sleep/resume 后 worker 恢复

第一版 Web 不需要。

## 13.7 Electron 安全

必须：

- renderer 禁用 Node integration
- 开启 contextIsolation
- 使用 preload 暴露最小 API
- IPC 校验 sender
- CSP
- 不加载远程不可信代码
- external link 用系统浏览器打开
- 阻止任意 navigation

Electron 官方安全文档强调不要在加载远程内容时启用 Node.js integration，并建议使用 context isolation、sandbox、CSP、IPC sender 校验等措施。([Electron][19])

## 13.8 是否第一版就做 desktop app

不建议。

建议：

```text
Phase 0-8: Web App + local/private deploy
Phase 9: Electron feasibility packaging
Phase 10+: Desktop polish
```

除非你的核心使用场景必须是桌面托盘常驻，否则第一版 Electron 会分散大量精力到打包、签名、更新、路径、崩溃恢复，而不是核心阅读 workflow。

---
