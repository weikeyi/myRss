# Shared Frontend Guidelines

## Scope

This package is the UI-facing counterpart to the shared contract layer. It should be used for shared UI-safe types, not for app-specific state.

## Current conventions

- Reuse shared API schemas and inferred types instead of redefining them.
- Keep shared UI helpers free of app routing or data-fetching concerns.
- Prefer tiny, explicit exports.

## Real examples in the repo

- `packages/shared/src/api/articles.schema.ts` is already designed to be consumed by both frontend and backend code.
- `packages/shared/src/constants/statuses.ts` provides the status unions the UI should render from.

## Anti-patterns

- Copying contract types into page components.
- Adding app-specific state management to the shared package.
