# Config Frontend Guidelines

## Scope

This package does not currently own UI code. If that changes, the rules should stay narrow and only cover configuration-specific UI concerns.

## Current conventions

- Keep configuration loading centralized.
- Reuse the same typed env model from the backend side.
- Do not duplicate configuration defaults in UI code.

## Real example

- `packages/config/src/index.ts` is the current source of truth for config shape.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | Where any config UI would live |
| [Component Guidelines](./component-guidelines.md) | If forms or panels are added |
| [Hook Guidelines](./hook-guidelines.md) | If config data fetching is added |
| [State Management](./state-management.md) | Keep local form state local |
| [Quality Guidelines](./quality-guidelines.md) | Keep config UI minimal |
| [Type Safety](./type-safety.md) | Reuse shared config types |

## Anti-patterns

- Introducing a separate frontend config model when the backend one already exists.
- Hard-coding env names in several UI components.
