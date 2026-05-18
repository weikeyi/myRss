# Quality Guidelines

## Overview

DB code should isolate persistence, keep transactions short, and translate low-level failures into stable repository-level errors.

## Forbidden patterns

- Business logic in repository methods.
- Direct Prisma calls outside the DB package.
- Long or wide transactions.
- Returning raw persistence objects across unrelated boundaries.

## Required patterns

- Wrap persistence behind repository methods.
- Keep schema and migration changes explicit.
- Keep transaction scopes narrow.

## Testing requirements

- Repository behavior should be covered with SQLite integration tests.
- Migration changes should be checked against the real schema path.

## Code review checklist

- Is the DB logic isolated?
- Are transactions short?
- Is any feature code reaching around the repository layer?
