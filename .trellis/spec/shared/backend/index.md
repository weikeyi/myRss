# Shared Backend Guidelines

## Scope

This package is the source of truth for cross-layer contracts. It already contains the clearest reusable patterns in the repo.

## Current conventions

- Define shared request and response schemas with `zod`.
- Centralize literal status arrays in one place.
- Export both schemas and inferred TypeScript types from the same module.
- Keep the package framework-free.

## Real examples in the repo

- `packages/shared/src/api/articles.schema.ts` defines article list/detail schemas and update payloads.
- `packages/shared/src/constants/statuses.ts` defines `articleStatuses` and `readStates` as `as const` arrays plus derived types.
- `packages/shared/src/index.ts` re-exports both API and constants modules.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | How to keep shared contracts organized |
| [Database Guidelines](./database-guidelines.md) | Avoid persistence-specific leakage |
| [Error Handling](./error-handling.md) | How shared validation failures should behave |
| [Quality Guidelines](./quality-guidelines.md) | Contract design standards |
| [Logging Guidelines](./logging-guidelines.md) | Avoid logging from shared contract code |

## Anti-patterns

- Duplicating enums in multiple packages.
- Exposing raw database models as shared API types.
- Mixing runtime validation with transport-specific code.
