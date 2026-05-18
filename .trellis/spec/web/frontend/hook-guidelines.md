# Hook Guidelines

## Overview

Hooks should wrap reusable client logic, especially query and mutation flows. The intended stack is Vue 3 with feature-local state helpers, not a giant global hook library.

## Custom hook patterns

- Keep hooks focused on one concern.
- Put fetch and mutation helpers near the feature they serve.
- Return typed values and explicit status flags.

## Data fetching

- Keep server state in query cache, not in local component state.
- Group API calls by feature.
- Let hooks own loading and error state where that simplifies components.

## Naming conventions

- Use `use*` names for composable hooks.
- Prefer names that describe the behavior, not the implementation detail.

## Common mistakes

- Pulling fetch logic into components instead of a reusable hook.
- Creating hooks that only wrap one component with no shared value.

## Examples

- [docs/05-frontend.md](../../../docs/05-frontend.md)
- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
