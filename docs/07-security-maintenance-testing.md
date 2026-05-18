# 14. Data Size / Backup / Cleanup Strategy

## 14.1 数据规模预估

个人使用场景：

| 场景              | 估计       |
| ----------------- | ---------- |
| Feed 数           | 20 - 200   |
| 每日新文章        | 100 - 1000 |
| 长期文章数        | 10k - 100k |
| 同时 pending jobs | 10 - 500   |
| worker 并发       | 1 - 3      |

每篇文章大致空间：

| 数据                         | 估算                      |
| ---------------------------- | ------------------------- |
| Article metadata             | 2 - 5 KB                  |
| ArticleContent text/markdown | 20 - 100 KB               |
| AI summary                   | 3 - 15 KB                 |
| AI translation summary       | 3 - 15 KB                 |
| AI insight                   | 5 - 30 KB                 |
| pipeline/job records         | 5 - 20 KB                 |
| raw HTML                     | 100 KB - 2 MB+            |
| full translation             | 约等于正文 text 的 1-2 倍 |

不保存 raw HTML、不缓存图片、只翻译摘要时：

|  文章数 | SQLite 体积粗估 |
| ------: | --------------: |
|  10,000 |    0.4 - 1.5 GB |
|  50,000 |        2 - 7 GB |
| 100,000 |       4 - 15 GB |

保存 raw HTML 后：

|  文章数 |         体积风险 |
| ------: | ---------------: |
|  10,000 |   可能 2 - 15 GB |
|  50,000 |  可能 10 - 75 GB |
| 100,000 | 可能 20 - 150 GB |

缓存图片会更不可控，不建议第一版做。

## 14.2 是否缓存图片

第一版不缓存图片。

推荐：

- 阅读页默认使用原站图片 URL，但设置 `referrerpolicy="no-referrer"`。
- 提供“隐藏外部图片”选项。
- 不做图片代理。
- 不下载图片。
- 不做图片去重。

后续如果做离线阅读，再设计 blob storage 和清理策略。

## 14.3 是否默认保存 raw HTML

不默认保存。

推荐：

```text
saveRawHtml = false
```

可选 debug：

```text
saveRawHtml = true
rawHtmlRetentionDays = 7
rawHtmlStorage = file
```

原因：

- raw HTML 体积大
- 有隐私风险
- 可能包含 tracking / script
- 长期价值低
- SQLite backup 会被拖慢

## 14.4 清理策略

设置项：

```json
{
    "cleanup": {
        "deleteSucceededJobsAfterDays": 30,
        "deleteDeadJobsAfterDays": 90,
        "deleteRawHtmlAfterDays": 7,
        "keepPipelineRunsPerArticle": 5,
        "deleteFetchLogsAfterDays": 30,
        "deleteOldAiOutputs": false,
        "keepAiOutputVersions": 2,
        "autoVacuum": false
    }
}
```

清理任务：

```text
cleanup.run
  -> delete old succeeded jobs
  -> delete old fetch logs
  -> delete expired raw html files
  -> prune pipeline runs
  -> mark stale AI outputs
  -> optional checkpoint
```

## 14.5 Backup 设计

SQLite backup 不应简单复制单个 `.db` 文件，尤其在 WAL 模式下还涉及 `-wal` 和 `-shm` 文件。SQLite 文档说明 WAL 文件是数据库状态的一部分，自动 checkpoint 默认在 WAL 达到约 1000 pages 时触发；SQLite 也提供 online backup API，用于在数据库使用中创建一致快照。([SQLite][1])

推荐：

```text
backup.run
  1. pause cleanup job
  2. trigger passive checkpoint
  3. use SQLite backup API / VACUUM INTO
  4. copy blobs directory manifest
  5. write backup metadata
  6. keep last 7 daily + 4 weekly
```

备份内容：

```text
reader-2026-05-15/
  reader.db
  blobs/
  manifest.json
```

`manifest.json`：

```json
{
    "createdAt": "2026-05-15T12:00:00.000Z",
    "appVersion": "0.1.0",
    "schemaVersion": "202605150001",
    "articleCount": 12345,
    "includesSecrets": false
}
```

## 14.6 WAL / checkpoint / vacuum

建议：

- 启动时设置 WAL。
- 设置 busy timeout。
- 定期 passive checkpoint。
- 大量删除后手动 `VACUUM` 或提示用户“压缩数据库”。
- Electron 退出前可尝试 checkpoint。
- 不要频繁 `VACUUM`，它会重写数据库，耗时明显。

---

# 15. Security and Privacy Checklist

## 15.1 AI API key

必须：

- 前端永远不接触明文 key。
- API response 只返回 `configured` 和 `keyHint`。
- 服务端日志不打印 key。
- Web 私有部署用 env 或加密存储。
- Electron 用 OS keychain / safeStorage。
- 支持 rotate。
- 支持删除 key。

## 15.2 Cookie / session

Web 版如果启用登录：

- `HttpOnly`
- `Secure`，HTTPS 场景
- `SameSite=Lax` 或 `Strict`
- session expiration
- logout 清除 cookie

如果使用 cookie auth，涉及写操作时要考虑 CSRF。personal localhost 模式可以简化，但私有部署在域名下时应开启 CSRF token。

## 15.3 SSRF

必须：

- 禁止 private IP / localhost / metadata IP
- 校验 redirect
- 限制协议
- 限制端口
- 限制超时和大小
- 不转发用户 cookie
- 不允许用户自定义任意 header，至少第一版不允许

## 15.4 外部 HTML XSS

文章 HTML 是不可信内容。

OWASP XSS 指南强调框架自带转义并不覆盖所有 escape hatch；对于 HTML 内容仍需要验证、转义或 sanitization。([OWASP Cheat Sheet Series][20])

策略：

- 优先渲染 Markdown / text。
- 如果渲染 HTML，使用 DOMPurify sanitize。
- 禁用 script、event handler、iframe。
- 外链加 `rel="noopener noreferrer"`。
- 图片可选禁用或 no-referrer。
- 设置 CSP。

DOMPurify 是专门用于清理 HTML、MathML、SVG 中 XSS 的 sanitizer，并提供安全默认配置。([GitHub][21])

## 15.5 日志脱敏

日志禁止：

- API key
- Authorization header
- Cookie
- Set-Cookie
- 全文内容
- raw HTML
- AI prompt 全量内容，除非 debug 且本地明确开启

日志允许：

- articleId
- feedId
- URL hash
- status code
- duration
- byte length
- error code

## 15.6 Workspace 隔离

从第一版开始：

- 每个 repository 方法参数都必须有 `workspaceId`。
- 不提供 `findArticleById(id)`，只提供 `findArticleById(workspaceId, id)`。
- API context 注入 `workspaceId`。
- 测试覆盖跨 workspace 不可见。
- 未来多用户时在 guard 层校验 WorkspaceUser。

---

# 16. Testing Strategy

## 16.1 推荐测试工具

| 层                | 工具                            |
| ----------------- | ------------------------------- |
| core unit test    | Vitest                          |
| Vue component     | Vitest + Vue Test Utils         |
| API e2e           | Nest testing module + Supertest |
| Browser e2e       | Playwright                      |
| DB integration    | Vitest + temp SQLite            |
| HTTP mock         | undici MockAgent / MSW / nock   |
| AI mock           | fake provider adapter           |
| Schema validation | Zod tests                       |
| CI                | GitHub Actions                  |

Vitest 官方定位是 Vite-native test framework，适合复用 Vite 生态配置；Playwright 支持 Chromium、Firefox、WebKit，适合端到端 UI 测试。([vitest.dev][22])

## 16.2 Core 纯函数单元测试

覆盖：

- URL normalize
- sha256 stable json
- retry backoff
- workflow validation
- article status transition
- filter rules
- inputHash

示例：

```text
packages/core/src/workflow/state-machine.test.ts
packages/core/src/url/normalize-url.test.ts
packages/core/src/workflow/retry-policy.test.ts
```

## 16.3 Workflow engine 测试

场景：

- 正常线性 workflow 全部成功
- optional step failed 后继续
- required step failed 后 pipeline failed
- content_filter 返回 filtered 后 downstream skipped
- retry failed step
- skip optional step
- reset downstream

## 16.4 Job runner 测试

场景：

- claim pending job
- 两个 worker 同时 claim 不重复
- job 完成、失败、heartbeat 必须校验 `lockedBy + lockVersion`
- retryable failure 设置 runAfter
- 超过 maxAttempts 进入 dead
- stale running job 被恢复
- stale job 恢复后旧 worker 不能覆盖新 worker 状态
- heartbeat 更新
- canceled job 不执行
- paused job 不会被 worker claim

## 16.5 Repository 测试

使用临时 SQLite 文件：

```text
tmp/test-${random}.db
```

覆盖：

- `workspaceId + canonicalUrlHash` 唯一
- `ArticleSource.dedupeKey` 唯一
- feed URL hash 唯一
- AI output cache 唯一
- pipeline run + step run 创建
- job dedupeKey
- workspace 隔离

## 16.6 API e2e 测试

覆盖：

- add feed
- list feeds
- manual sync creates job
- add manual URL creates article + pipeline
- article list filters
- mark read
- favorite
- retry step
- skip step
- settings secret 不返回明文

## 16.7 Fetching mock 测试

覆盖：

- private IP blocked
- localhost blocked
- redirect to private IP blocked
- content-type rejected
- max bytes exceeded
- timeout
- RSS parse
- Readability extraction

## 16.8 AI provider mock 测试

覆盖：

- structured JSON success
- invalid JSON retry
- schema validation failure
- rate limit retry
- auth failure no retry
- inputHash cache hit
- promptVersion change creates new output
- 超过每日 AI 预算时 step/job 进入 paused
- 单篇超过 token 限制时触发截断或降级策略

## 16.9 SQLite migration 测试

CI 中：

```bash
pnpm prisma validate
pnpm prisma migrate diff --from-empty --to-schema-datamodel packages/db/prisma/schema.prisma --script
pnpm test:db
```

也可以做：

```text
1. 创建旧 schema 数据库
2. 插入 fixture
3. 执行 migration
4. 验证数据仍可读
```

## 16.10 最小 CI

```text
install
  pnpm install --frozen-lockfile

quality
  pnpm lint
  pnpm typecheck

database
  pnpm --filter @app/db prisma:validate
  pnpm --filter @app/db prisma:migrate:test

test
  pnpm test

build
  pnpm --filter web build
  pnpm --filter server build
```

---
