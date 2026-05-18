# Type Safety

## Overview

Type safety should come from shared contracts plus runtime validation at the boundary. The repo already uses `zod` for shared schemas and config parsing, so the web app should follow the same pattern.

## Type organization

- Import shared schemas and inferred types from `@myrss/shared`.
- Keep local types small and feature-specific.
- Do not redefine article list/detail payloads in multiple pages.

## Validation

- Validate untrusted input with `zod`.
- Parse API responses at the edge when the data shape is not guaranteed.
- Treat URL params and query params as untrusted input.

## Common patterns

- Infer types from shared schemas.
- Narrow unknown inputs before they enter components.
- Keep route params and query values typed explicitly.

## Forbidden patterns

- `any`
- broad type assertions that skip real validation
- duplicated DTO shapes copied from the API layer

## Examples

- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
- [packages/shared/src/constants/statuses.ts](../../../../packages/shared/src/constants/statuses.ts)
