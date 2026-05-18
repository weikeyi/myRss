# Quality Guidelines

## Overview

Shared code should be framework-free, contract-first, and safe to consume from both backend and frontend code.

## Forbidden patterns

- Duplicating enums in multiple packages.
- Exposing raw database models as shared API types.
- Mixing transport-specific code into shared contracts.

## Required patterns

- Define shared request and response schemas with `zod`.
- Centralize literal status arrays in one place.
- Export both schemas and inferred TypeScript types from the same module.

## Testing requirements

- Schema shape changes should be easy to validate with unit tests.
- Any runtime guard should be testable without the app shell.

## Code review checklist

- Does this belong in shared code?
- Are the exports still framework-free?
- Are schema and type names aligned?
