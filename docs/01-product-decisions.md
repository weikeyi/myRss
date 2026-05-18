以下方案基于你上传的完整产品设想与约束：personal-first、workspace-ready、future desktop，并明确不默认引入 PostgreSQL、Redis、微服务或复杂 SaaS 权限。

# 1. Executive Summary

这个产品第一版应该定位为：

> **个人 AI 阅读工作流系统：把 RSS / URL 内容自动摄入、抓取、过滤、摘要、翻译、解读，并以可追踪 pipeline 的方式进入阅读列表。**

第一版不是 RSS Reader 的 UI 换皮，也不是 SaaS 协作平台。它的核心价值是：

1. **异步处理链路可靠可见**：每篇文章处于哪个阶段、失败在哪里、能否重试。
2. **个人内容处理自动化**：订阅源同步后自动全文抓取、过滤、摘要、翻译、解读。
3. **本地优先、可私有部署**：SQLite + Nest API + Nest worker 即可跑起来。
4. **为 workspace / desktop 预留结构**：但不在第一版实现复杂团队权限或 Electron 发行。

第一版建议做成：

- **单用户默认 workspace**
- **本地或私有服务器 Web App**
- **SQLite 数据库**
- **SQLite job table**
- **线性 workflow engine**
- **NestJS API + worker，可同进程启动**
- **Vue 3 阅读 UI + 设置 UI + pipeline 状态 UI**

不建议第一版做：

- PostgreSQL
- Redis / BullMQ
- 多租户 SaaS
- 团队邀请、RBAC、计费
- 微服务
- 可视化 DAG workflow builder
- Electron 正式桌面发布
- 全文翻译所有文章
- 图片缓存系统
- 浏览器自动化抓取默认开启

原因很简单：这个项目的难点不是“架构够不够大”，而是 **文章处理链路能不能稳定闭环**。先把 RSS → Article → Job → Pipeline → Fetch → AI → Reading List 做扎实。

SQLite 对第一版足够。SQLite 官方文档明确说明 WAL 模式可以提升并发能力，允许读者和写者同时进行，但 SQLite 仍然是单写者模型，写入事务应保持短小；这正好适合个人应用、低并发 worker、短事务 job claim 的场景。([SQLite][1])

---

# 3. Technology Decisions and Trade-offs

## 3.1 推荐技术决策

| 领域              | 第一版选择                         | 原因                                               |
| ----------------- | ---------------------------------- | -------------------------------------------------- |
| 前端              | Vue 3 + Vite                       | 简洁、SFC 体验好、构建快                           |
| 前端 server state | TanStack Query for Vue             | 文章列表、详情、pipeline polling 都是 server state |
| 前端本地 UI 状态  | Pinia                              | 阅读偏好、侧边栏、主题、筛选器                     |
| 后端              | NestJS                             | 组织 API / worker / DI 清晰                        |
| DB ORM            | Prisma                             | schema 明确，迁移和类型友好                        |
| DB                | SQLite WAL                         | personal-first 足够，部署简单                      |
| Job queue         | SQLite job table                   | 避免 Redis，满足低并发异步任务                     |
| Workflow          | 线性 workflow                      | 第一版足够，容易 debug                             |
| AI                | OpenAI-compatible provider adapter | 支持 OpenAI、兼容服务、本地模型代理                |
| Fulltext          | HTTP fetch + Readability           | 本地、低成本、隐私更好                             |
| Desktop           | 后续 Electron                      | 先保证 Web App 核心闭环                            |

Vue 官方文档推荐在构建工具环境中使用 Single-File Components 和 Composition API 构建完整应用；Vite 官方文档也将 `vite build` 作为生产构建入口。([Vue.js][3])

TanStack Query 的价值在于管理 server state，包括缓存、去重、后台更新和分页，这正适合文章列表和 pipeline 状态轮询；Pinia 则适合类型安全、模块化的客户端状态。([TanStack][4])

## 3.2 SQLite 是否足够

足够，前提是：

- worker 并发不要过高
- 写事务短小
- 使用 WAL
- job claim 尽量批量小、事务短
- 大文本不要频繁更新
- raw HTML 不长期塞进 SQLite
- 定期 checkpoint / vacuum / backup

SQLite 的关键限制是同一时间只有一个 writer；WAL 可以改善读写并发，但不能把 SQLite 变成多写者数据库。([SQLite][5])

## 3.3 什么时候 SQLite 不够

出现以下情况再考虑 PostgreSQL：

- 多用户同时高频写入
- workspace/team 协作频繁
- worker 水平扩展到多机器
- 需要复杂全文搜索、报表、权限查询
- job 量达到数十万级且高并发 claim
- 需要独立备份、审计、租户隔离能力

第一版不应提前上 PostgreSQL。迁移预留即可。

---

# 19. Final Recommendation

最终建议路线：

```text
第一阶段目标：
  做一个可靠的 personal-first Web App：
  RSS/URL -> Article -> Job -> Pipeline -> Fetch -> Filter -> AI Summary -> Reading List

技术核心：
  Vue 3 + Vite
  NestJS API
  Nest standalone worker
  Prisma + SQLite WAL
  SQLite job table
  pure TypeScript workflow engine
  Readability fulltext
  OpenAI-compatible AI adapter

架构原则：
  core 不依赖 Nest
  db 封装 Prisma
  fetching 封装所有外部请求和 SSRF guard
  ai 封装 provider/prompt/schema/cache
  server 只做组合和 API
  workspaceId 从第一天进入所有核心表
```

最重要的取舍：

1. **第一版用线性 workflow，不做 DAG。**
2. **第一版用 SQLite job table，不上 Redis。**
3. **第一版做单用户默认 workspace，不做复杂 SaaS 权限。**
4. **第一版默认 Readability，不默认 Browserless。**
5. **第一版默认摘要翻译，不默认全文翻译。**
6. **第一版先用手动 URL 打通垂直闭环，再扩展 RSS 批量摄入。**
7. **AI 摘要要和预算保护一起做，避免 RSS 批量同步后成本失控。**
8. **第一版 Web App 先闭环，Electron 放到后期验证。**
9. **所有核心表预留 workspaceId，所有业务查询强制 workspace scope。**

这样做的好处是：你可以在较短周期内得到一个真正能用的 AI 阅读工作流系统，同时不会把未来 workspace、小团队、桌面版的路堵死。
