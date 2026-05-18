# Type Safety

## Overview

If this package ever gets UI helpers, they should stay framework-neutral and use explicit local types.

## Type organization

- Keep any future types local to the helper.
- Reuse shared domain types if they already exist.

## Validation

- Follow the same `zod`-first pattern as the rest of the repo if runtime validation is needed.

## Forbidden patterns

- `any`
- duplicated helper interfaces
