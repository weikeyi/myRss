# brainstorm: next implementation slice

## Goal

Pick the next implementation slice for `myRss` so the repo can move from a runnable bootstrap into the first product-facing increment without over-scoping.

## What I already know

* Phase 0 is already complete: the workspace boots, `apps/server` serves `GET /api/v1/healthz`, and `apps/web` runs a Vue 3 shell.
* The roadmap explicitly recommends a vertical, incremental path: start with one article entering the system, then grow into RSS batch ingestion, AI, filtering, settings, and desktop.
* The next roadmap phase after bootstrap is **Phase 1: 基础数据模型 + 阅读列表骨架**.
* The web app already uses Pinia for local UI state, but the current feature surface is still only the bootstrap page.
* The repo already has an article contract draft in `packages/shared/src/api/articles.schema.ts`.
* The frontend roadmap already reserves `/articles` and `/articles/:articleId`.
* The server data model docs already sketch `Article`, `ArticleContent`, and related workspace/feed relations.

## Assumptions (temporary)

* The next slice should be user-visible, not just backend scaffolding.
* We should keep the slice small enough to ship and verify quickly.
* We should avoid pulling in RSS ingestion or AI before there is a visible reading surface.

## Open Questions

* 文章数据在第一版里怎么进入系统？

## Requirements (evolving)

* Keep the next slice aligned with the roadmap's vertical approach.
* Prefer a small, testable increment over a broad platform rewrite.
* Preserve the current Vue 3 + NestJS + Prisma + SQLite stack.
* Keep shared contracts in `packages/shared`.
* Keep page components thin and feature-oriented.
* Build the reading-list slice as `/articles` plus `/articles/:articleId` shell.
* Use fixture-driven article data for the first visible list/detail experience.
* Seed article data through SQLite / Prisma so the first visible data path matches the real storage layer.
* Seed 3 articles for the first iteration.
* Keep the list page read-only in the first pass.
* Make `/` redirect to `/articles`.
* Keep the detail page as a shell with title, source, summary, and content area.

## Acceptance Criteria (evolving)

* [ ] The chosen next slice is clearly defined and recorded in this PRD.
* [ ] The slice is small enough to implement in one focused pass.
* [ ] The slice has an explicit user-visible or workflow-visible outcome.
* [ ] The slice does not pull in unrelated roadmap phases.
* [ ] The list/detail route shape is fixed before implementation starts.
* [ ] The first visible article data source is agreed before implementation starts.
* [ ] The first article data path uses SQLite seed data rather than hard-coded UI mocks.
* [ ] Seed data includes 3 articles.
* [ ] `/` redirects to `/articles`.
* [ ] The first pass remains read-only.
* [ ] The detail page shows a shell with title, source, summary, and content area.

## Definition of Done

* PRD is converged on one next slice.
* Implementation plan is small and testable.
* Lint / typecheck / build remain part of the execution gate.
* Any new cross-layer contract is captured in shared types.

## Technical Approach

Default candidate: implement **Phase 1** next.

That would mean:

* minimal `workspace` / `article` model groundwork
* a thin article list/detail API
* a Vue reading-list page skeleton
* shared schemas for article payloads

## Decision (ADR-lite)

**Context**: The repo has completed the bootstrap shell and needs a first real product increment.

**Decision**: User chose the roadmap's Phase 1 reading-list slice over pipeline work.

**Consequences**: This gets user-visible value earlier and keeps the async job system out of scope until there is something meaningful to process.

## Out of Scope

* RSS batch ingestion
* AI features
* Electron / desktop packaging
* Full authentication
* Pipeline worker internals unless the user explicitly chooses that branch
* Read/favorite interaction in the first pass

## Technical Notes

* Roadmap: [`docs/08-roadmap-open-questions.md`](../../../docs/08-roadmap-open-questions.md)
* Architecture: [`docs/02-architecture.md`](../../../docs/02-architecture.md)
* Frontend routes: [`docs/05-frontend.md`](../../../docs/05-frontend.md)
* Server API draft: [`docs/04-server-api.md`](../../../docs/04-server-api.md)
* Shared article contract draft: [`packages/shared/src/api/articles.schema.ts`](../../../../packages/shared/src/api/articles.schema.ts)
* Data model draft: [`docs/03-data-workflow-worker.md`](../../../docs/03-data-workflow-worker.md)
* No existing seed/fixture convention was found for article data; `apps/server` only has a placeholder `seed` script.
* Prisma seed will be the first concrete data entry point for the reading-list slice.
* Current web entrypoint: [`apps/web/src/main.ts`](../../../../apps/web/src/main.ts)
* Current server health shell: [`apps/server/src/main.ts`](../../../../apps/server/src/main.ts)

## Decision (ADR-lite)

**Context**: The first visible product slice should be small, user-facing, and aligned with the roadmap.

**Decision**: Build a read-only article list and detail shell, seed 3 articles into SQLite/Prisma, redirect `/` to `/articles`, and defer read/favorite interactions.

**Consequences**: This gives a real UI surface quickly while leaving mutation behavior for a later slice.
