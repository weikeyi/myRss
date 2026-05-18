# Type Safety

## Overview

If this package ever gets UI helpers, they should reuse shared schemas and inferred types where possible.

## Type organization

- Keep any future types local and small.

## Validation

- Follow the same `zod`-first pattern as the rest of the repo if runtime validation is needed.

## Forbidden patterns

- `any`
- duplicated helper interfaces
