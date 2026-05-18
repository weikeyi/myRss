# Web Backend Guidelines

## Scope

This package currently has no backend implementation. Keep the rules aligned with the project architecture so future server-adjacent logic stays small and predictable.

## Current conventions

- Treat `packages/shared` as the source of truth for request and response shapes.
- Keep runtime config out of UI code.
- Keep server-facing logic feature-scoped instead of centralizing everything in one helper layer.

## Real examples in the repo

- `packages/config/src/index.ts` is the only actual runtime config loader right now.
- `packages/shared/src/api/articles.schema.ts` already shows the schema-first contract style.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | Expected app/module layout |
| [Database Guidelines](./database-guidelines.md) | Persistence boundaries |
| [Error Handling](./error-handling.md) | Typed error behavior |
| [Quality Guidelines](./quality-guidelines.md) | Standards for future server work |
| [Logging Guidelines](./logging-guidelines.md) | Log shape and sensitivity rules |

## Anti-patterns

- Encoding business rules directly in transport glue.
- Repeating literal status strings or field names from shared schemas.
- Adding cross-cutting state before the first concrete workflow exists.
