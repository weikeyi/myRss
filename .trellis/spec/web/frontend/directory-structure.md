# Directory Structure

## Overview

The web app is planned as the main user-facing surface. The architecture docs already define the intended folder split, even though `apps/web` has no source files yet.

## Directory layout

```text
src/
├── pages/
├── features/
├── lib/
├── router/
└── app/
```

## Module organization

- Keep route components in `src/pages`.
- Keep reusable feature logic and components in `src/features/<feature>/`.
- Keep API wrappers and fetch helpers in `src/lib/api`.
- Keep router wiring separate from page implementation.

## Naming conventions

- Pages use `*Page.vue`.
- Feature components use descriptive nouns, not generic wrappers.
- API files use `*.api.ts` or `queries.ts` when they are query-layer helpers.

## Examples

- [docs/05-frontend.md](../../../docs/05-frontend.md)
- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
