# Server Frontend Guidelines

## Scope

This layer is only relevant if the server package grows embedded UI or admin surfaces. The current repo does not ship server-side UI code yet, so the rules stay conservative.

## Current conventions

- Keep UI code separate from transport and business logic.
- Prefer feature-local composition over shared global UI state.
- Reuse the shared API schemas instead of duplicating response shapes.

## Current repo signals

- `apps/web` is still empty, so there is no server-embedded UI pattern to copy yet.
- Shared status and article schemas already live in `packages/shared`.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | Where UI code would live if added |
| [Component Guidelines](./component-guidelines.md) | Composition and props boundaries |
| [Hook Guidelines](./hook-guidelines.md) | Data access and side-effect patterns |
| [State Management](./state-management.md) | Local vs shared state |
| [Quality Guidelines](./quality-guidelines.md) | Code standards and forbidden patterns |
| [Type Safety](./type-safety.md) | zod / TypeScript contract alignment |

## Anti-patterns

- Mixing API handler code with UI rendering.
- Duplicating schema definitions instead of importing shared ones.
- Introducing global UI state before a concrete need exists.

## Implementation note

If this layer is ever used, keep it thin and feature-scoped so it can be removed or moved without touching server internals.
