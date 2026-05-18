# DB Backend Guidelines

## Scope

This package will hold the persistence layer when the database package is implemented. The repo currently exposes no database code, so the rules are intentionally narrow and aligned with the project plan.

## Current conventions

- Keep persistence isolated from transport and UI code.
- Model shared states and DTOs outside the DB package.
- Prefer repository-shaped access layers once the package exists.

## Real examples in the repo

- `packages/config/src/index.ts` already sets a SQLite-style default `DATABASE_URL`.
- `packages/shared/src/constants/statuses.ts` already defines the canonical state values that a future schema should reference.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | Expected location of schema and repositories |
| [Database Guidelines](./database-guidelines.md) | ORM and migration conventions |
| [Error Handling](./error-handling.md) | How persistence failures should be surfaced |
| [Quality Guidelines](./quality-guidelines.md) | Code standards for DB code |
| [Logging Guidelines](./logging-guidelines.md) | What to log from the data layer |

## Anti-patterns

- Embedding schema migration logic in app feature code.
- Returning raw persistence records across package boundaries.
- Duplicating shared status constants inside DB tables or helpers.
