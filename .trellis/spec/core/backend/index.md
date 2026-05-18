# Core Backend Guidelines

## Scope

This package is the home for pure domain logic and reusable runtime helpers. Right now it only exports a single constant, so keep the package lean until real core utilities are needed.

## Current conventions

- Prefer pure functions and value objects.
- Keep framework dependencies out of this package.
- Keep exports explicit and small.

## Real examples in the repo

- `packages/core/src/index.ts` currently exports only `APP_NAME`.
- `packages/shared/src/constants/statuses.ts` shows the preferred literal-constant style for domain values.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | Where pure domain code belongs |
| [Database Guidelines](./database-guidelines.md) | Avoid accidental persistence coupling |
| [Error Handling](./error-handling.md) | Keep thrown errors predictable |
| [Quality Guidelines](./quality-guidelines.md) | Keep helpers simple |
| [Logging Guidelines](./logging-guidelines.md) | Avoid logging from pure core code |

## Anti-patterns

- Importing UI, ORM, or HTTP framework code.
- Stashing app state in module globals.
- Turning the package into a random utility dump.
