# brainstorm: next implementation slice

## Goal

Pick the next implementation slice for `myRss` after the reading-list slice so the repo keeps moving along the roadmap without over-scoping.

## What I already know

* The reading-list slice is done and archived.
* The repo now has a runnable Vue 3 + NestJS + Prisma + SQLite stack.
* `/articles` and `/articles/:articleId` exist and are wired to seeded SQLite data.
* The roadmap recommends a vertical path: first get one article into the system, then expand into RSS batch ingestion, AI, filtering, settings, and desktop.
* `docs/08-roadmap-open-questions.md` shows Phase 2 as the next major product direction: job + pipeline minimum skeleton.
* The roadmap also keeps RSS fetching / fulltext extraction / AI as later steps.
* The recommended next slice is Phase 2: a job + pipeline minimum skeleton with a no-op step, worker loop, and pipeline status visibility.

## Assumptions (temporary)

* The next slice should still be user-visible or workflow-visible.
* We should keep the slice small enough to verify quickly.
* We should avoid jumping straight into the full RSS/AI stack if a smaller pipeline slice can unblock it.

## Open Questions

* None blocking. The recommended direction is to start with the job + pipeline skeleton.

## Requirements (evolving)

* Keep the next slice aligned with the roadmap's vertical approach.
* Prefer a small, testable increment over a broad platform rewrite.
* Preserve the current Vue 3 + NestJS + Prisma + SQLite stack.
* Keep shared contracts in `packages/shared`.
* Keep page components thin and feature-oriented.
* Build the minimum job / pipeline runtime first.
* Include a no-op step to validate claim / execute / complete flow.
* Expose pipeline status so the first async loop is visible.
* Keep RSS ingestion and AI out of this slice.

## Acceptance Criteria (evolving)

* [ ] The chosen next slice is clearly defined and recorded in this PRD.
* [ ] The slice is small enough to implement in one focused pass.
* [ ] The slice has a workflow-visible outcome: a job can be claimed, processed, and completed.
* [ ] The slice does not pull in unrelated roadmap phases.
* [ ] The implementation plan is small and testable.
* [ ] A no-op step can be enqueued and executed by the worker.
* [ ] Job claim / heartbeat / completion state transitions are persisted.
* [ ] Pipeline status can be queried from the API.

## Definition of Done

* PRD is converged on one next slice.
* Lint / typecheck / build remain part of the execution gate.
* Any new cross-layer contract is captured in shared types.

## Technical Approach

Default candidate from the roadmap: **Phase 2, job + pipeline minimum skeleton**.

That means:

* minimal job / pipeline model groundwork
* a thin pipeline starter API
* shared schemas for pipeline/job payloads
* worker loop + job claim logic
* a no-op step handler to validate the async path
* a lightweight pipeline status view or API response shape

## Decision (ADR-lite)

**Context**: The reading-list slice shipped, and the next step should keep momentum without pulling in the whole ingestion/AI surface.

**Decision**: Build the Phase 2 job + pipeline minimum skeleton first.

**Consequences**: We validate the hardest infrastructure boundary first, while keeping RSS and AI out of scope until the job pipeline is trustworthy.

## Out of Scope

* Full RSS batch ingestion unless explicitly chosen
* AI features
* Electron / desktop packaging
* Full authentication
* Read/favorite expansion of the current article slice unless explicitly chosen
* Full DAG workflow editor
* Multi-machine worker coordination

## Technical Notes

* Roadmap: [`docs/08-roadmap-open-questions.md`](../../../docs/08-roadmap-open-questions.md)
* Architecture: [`docs/02-architecture.md`](../../../docs/02-architecture.md)
* Data/workflow: [`docs/03-data-workflow-worker.md`](../../../docs/03-data-workflow-worker.md)
* Server API: [`docs/04-server-api.md`](../../../docs/04-server-api.md)
* Frontend: [`docs/05-frontend.md`](../../../docs/05-frontend.md)
