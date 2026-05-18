# Directory Structure

## Overview

The DB package will own Prisma schema, repositories, and migration-related helpers once implemented.

## Directory layout

```text
src/
├── index.ts
├── repositories/
└── prisma/
```

## Module organization

- Keep Prisma access isolated in repositories.
- Keep schema and migration assets close to the DB package.
- Do not let app modules call Prisma directly.

## Naming conventions

- Use `*.repository.ts` for persistence access.
- Keep schema files and migration assets clearly separated from app services.

## Examples

- [docs/03-data-workflow-worker.md](../../../docs/03-data-workflow-worker.md)
- [packages/config/src/index.ts](../../../../packages/config/src/index.ts)
