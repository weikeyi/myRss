# Core Frontend Guidelines

## Scope

This package does not currently own UI code. If frontend helpers are added here later, they should stay generic and framework-agnostic.

## Current conventions

- Keep exports small and explicit.
- Prefer pure helpers over stateful abstractions.
- Reuse shared literal constants and schemas when a value already exists elsewhere.

## Real examples in the repo

- `packages/core/src/index.ts` is a minimal barrel.
- `packages/shared/src/constants/statuses.ts` is the canonical domain constant pattern.

## Anti-patterns

- Coupling core helpers to a specific UI framework.
- Creating overlapping helper APIs with `packages/shared`.
