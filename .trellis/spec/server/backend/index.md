# Server Backend Guidelines

## Scope

This package will host the runtime server application. The repo currently only has workspace scaffolding, so these rules are based on the established project shape and the shared package patterns already in use.

## Current conventions

- Keep environment parsing in `packages/config`, not in server feature code.
- Keep shared DTOs and enums in `packages/shared`.
- Keep server code modular and thin at the entrypoint level.
- Prefer TypeScript strictness and small exported surfaces.

## Real examples in the repo

- `packages/config/src/index.ts` uses `zod` to parse env values and apply defaults.
- `packages/shared/src/api/articles.schema.ts` defines shared API contracts with `zod`.
- `packages/shared/src/constants/statuses.ts` centralizes literal status unions.
- `packages/core/src/index.ts` is a minimal barrel export.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | Expected server module layout |
| [Database Guidelines](./database-guidelines.md) | How persistence should be isolated |
| [Error Handling](./error-handling.md) | How to surface typed failures |
| [Quality Guidelines](./quality-guidelines.md) | Project-level code standards |
| [Logging Guidelines](./logging-guidelines.md) | How to keep logs usable |

## Anti-patterns

- Putting env parsing directly into controllers or services.
- Exporting large utility bags from the server root.
- Repeating status literals or request schemas inside feature code.
- Mixing transport concerns with domain or persistence logic.

## Implementation note

When server code is added, keep the first version boring: small modules, explicit types, and shared schemas instead of ad hoc request parsing.
