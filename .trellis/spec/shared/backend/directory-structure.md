# Directory Structure

## Overview

The shared package is the source of truth for cross-layer contracts. It already contains the clearest reusable patterns in the repo.

## Directory layout

```text
src/
├── api/
├── constants/
└── index.ts
```

## Module organization

- Keep schemas in `src/api`.
- Keep enums and literal constants in `src/constants`.
- Keep exports explicit through `src/index.ts`.

## Naming conventions

- Use `*.schema.ts` for validation and contract modules.
- Use plural names for constant sets, such as `statuses.ts`.

## Examples

- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
- [packages/shared/src/constants/statuses.ts](../../../../packages/shared/src/constants/statuses.ts)
