# Database Guidelines

## Overview

The DB package is expected to use Prisma with SQLite. The architecture docs already prefer WAL, short write transactions, and repository-shaped access.

## Query patterns

- Keep transactions short.
- Prefer repository methods over raw query access.
- Avoid broad read-modify-write cycles when a smaller update will do.

## Migrations

- Keep Prisma schema and migrations in the DB package.
- Treat schema changes as part of the package lifecycle.
- Keep local SQLite initialization schema-driven. Do not duplicate `schema.prisma`
  as hand-written `CREATE TABLE` SQL in helper scripts; use Prisma commands such
  as `db push` for development database sync so repository types and runtime
  tables do not drift.

## Naming conventions

- Use domain names such as `Workspace`, `Feed`, `Article`, `Job`, and `PipelineRun`.
- Keep indexes aligned with query patterns.

## Common mistakes

- Letting feature code call Prisma directly.
- Building persistence logic that also contains workflow rules.
- Making transactions larger than they need to be.
