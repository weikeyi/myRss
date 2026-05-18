# Type Safety

## Overview

If this package gains UI, it should reuse the same typed config model and parsing rules from `packages/config/src/index.ts`.

## Type organization

- Reuse shared config types instead of copying settings shapes.
- Keep any future UI types local and small.

## Validation

- Use the same runtime validation source of truth as the backend package.

## Forbidden patterns

- `any`
- duplicated config interfaces
