# brainstorm: next implementation slice

## Goal

Pick the next implementation slice for `myRss` so the repo can move from docs/spec scaffolding into the first real runnable product increment.

## What I already know

* The repo currently has workspace scaffolding, docs, and `.trellis/spec/` guidelines, but no actual `apps/server` or `apps/web` source code yet.
* The product roadmap in `docs/08-roadmap-open-questions.md` recommends a vertical, incremental approach.
* The project architecture targets Vue 3 + NestJS + Prisma + SQLite, with shared contracts in `packages/shared`.
* The previous bootstrap task completed the project guidelines and is now archived.

## Assumptions (temporary)

* We should keep the next slice small and testable.
* We should avoid starting with the whole product at once.
* The next slice should probably establish either the runnable app skeleton or the shared data contract layer.

## Open Questions

* Which first slice should we build next?

## Requirements (evolving)

* Implement Phase 0: project initialization and runnable skeleton.
* Create the monorepo/app/package structure needed by the roadmap.
* Keep the slice small enough to unblock later work without dragging in product logic.
* Provide a minimal health check and default env loading path.
* Include lint and typecheck in the bootstrap slice.
* Keep the implementation aligned with the already-decided stack: Vue 3 + NestJS + Prisma + SQLite.

## Acceptance Criteria (evolving)

* [ ] `pnpm dev:web` starts the web app.
* [ ] `pnpm dev:server` starts the server app.
* [ ] `GET /api/v1/healthz` returns OK.
* [ ] Prisma SQLite bootstrap exists.
* [ ] Shared env/config parsing exists.
* [ ] Lint and typecheck pass for the workspace packages involved in the slice.
* [ ] The slice is documented and ready for implementation.

## Definition of Done (team quality bar)

* Tests added/updated where appropriate
* Lint / typecheck / CI green
* Docs/notes updated if behavior changes
* Rollout/rollback considered if risky

## Out of Scope (explicit)

* Full article workflow
* RSS ingestion
* AI features
* Desktop packaging
* User-facing product polish beyond the bootstrap shell

## Technical Notes

* Relevant roadmap: [`docs/08-roadmap-open-questions.md`](../../../docs/08-roadmap-open-questions.md)
* Architecture target: [`docs/02-architecture.md`](../../../docs/02-architecture.md)
* Product direction: [`docs/01-product-decisions.md`](../../../docs/01-product-decisions.md)
* This slice corresponds to Phase 0 in the roadmap.
* The repo currently has workspace/spec scaffolding but no `apps/server` or `apps/web` source tree.

## Technical Approach

Bootstrap the monorepo as a thin but real runnable shell:

* `apps/server` runs a Nest app with a `/api/v1/healthz` endpoint.
* `apps/web` runs a Vue 3 app with a small bootstrap page that calls the health endpoint.
* `packages/config` owns env parsing.
* `packages/shared` owns the health contract schema.
* `packages/db` owns a minimal Prisma SQLite schema and scripts.
* Root workspace scripts expose `build`, `typecheck`, `lint`, and `format`.

## Decision (ADR-lite)

**Context**: Phase 0 needed to unblock the rest of the roadmap without jumping into product logic.

**Decision**: Build the runnable shell first, with server/web entrypoints, shared health contract, and Prisma SQLite bootstrap.

**Consequences**: Later work can layer real product features on top of a verified workspace, but the initial schema and app shells stay intentionally small.
