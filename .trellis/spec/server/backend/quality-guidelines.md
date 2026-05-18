# Quality Guidelines

## Overview

Server code should stay modular, typed, and boring. The project already leans on shared `zod` schemas, strict TypeScript, and thin app entrypoints.

## Forbidden patterns

- Putting business logic directly in controllers.
- Calling Prisma from feature code when a repository abstraction should own it.
- Repeating article status literals or request DTO shapes instead of importing `@myrss/shared`.
- Hiding app-wide defaults inside random helpers.

## Required patterns

- Validate inputs with shared schemas.
- Keep modules small and explicit.
- Use clear service boundaries for orchestration.
- Prefer pure helpers in `packages/core`.
- Keep runtime config in `packages/config`.

## Testing requirements

- Pure logic in `packages/core` should be unit-testable.
- Database and repository behavior should be covered with integration tests once `packages/db` exists.
- API behavior should have e2e tests at the server boundary.

## Code review checklist

- Does the change preserve layer boundaries?
- Are shared schemas reused instead of copied?
- Are error messages specific but not leaky?
- Is any new code doing more than one job?
