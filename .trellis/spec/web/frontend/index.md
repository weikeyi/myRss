# Web Frontend Guidelines

## Scope

The web app is the main user-facing surface planned for this repo. The current tree is still scaffold-only, so these rules lean on the documented architecture and the shared package patterns that already exist.

## Current conventions

- Organize UI by feature, not by technical layer alone.
- Keep pages thin and push reusable work into feature components.
- Consume shared schemas and enums instead of redefining them in the app.
- Keep local state local; introduce global state only when multiple screens need it.

## Real examples in the repo

- `packages/shared/src/api/articles.schema.ts` contains the article list/detail contract.
- `packages/shared/src/constants/statuses.ts` defines the canonical status sets.
- `packages/config/src/index.ts` shows how shared runtime config is loaded.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | `src/pages`, `src/features`, and `src/lib` boundaries |
| [Component Guidelines](./component-guidelines.md) | Reusable UI composition rules |
| [Hook Guidelines](./hook-guidelines.md) | Data fetching and side-effect patterns |
| [State Management](./state-management.md) | What belongs in local vs shared state |
| [Quality Guidelines](./quality-guidelines.md) | Code style and forbidden patterns |
| [Type Safety](./type-safety.md) | Shared contract and validation strategy |

## Anti-patterns

- Putting business logic in route pages.
- Duplicating API response shapes instead of importing shared types.
- Overusing global state for one-screen interactions.
- Creating abstractions before the second real use case exists.
