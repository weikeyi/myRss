# Database Guidelines

## Overview

The intended database stack is Prisma + SQLite. `packages/db` is not implemented yet, but the design is already defined in the architecture docs and config defaults.

## Query patterns

- Keep write transactions short.
- Prefer repository methods over raw query usage in feature code.
- Avoid pushing workflow logic into persistence code.
- Reuse shared status and DTO definitions at the boundary.

## Migrations

- Keep schema changes in the DB package.
- Treat migrations as part of the package lifecycle, not app feature code.
- Prefer incremental schema changes over wide refactors.

## Naming conventions

- Use stable table/entity names that map to domain concepts: `Workspace`, `Feed`, `Article`, `Job`, `PipelineRun`.
- Keep relation names explicit.
- Keep generated IDs string-based.

## Common mistakes

- Letting feature code query the database directly.
- Encoding workflow state in ad hoc columns without a shared contract.
- Changing schema and runtime logic in the same sprawling edit.
