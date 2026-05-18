# Directory Structure

## Overview

The server package is intended to be the NestJS runtime for the app. The current repo has no server source files yet, so this structure comes from the architecture and API docs.

## Directory layout

```text
src/
├── main.ts
├── app.module.ts
├── worker.ts
└── modules/
    ├── config/
    ├── prisma/
    ├── workspace/
    ├── articles/
    ├── feeds/
    ├── jobs/
    ├── pipeline/
    └── settings/
```

## Module organization

- Keep each feature in its own `src/modules/<feature>/` folder.
- Keep controllers thin and move orchestration into services.
- Keep persistence access in `packages/db`, not inside feature controllers.
- Keep bootstrap and lifecycle concerns in `config`, `prisma`, and `workspace`.

## Naming conventions

- Use standard Nest suffixes: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.dto.ts`.
- Use `worker.ts` for the standalone job worker entrypoint.
- Use lower-case folder names for feature modules.

## Examples

- [docs/04-server-api.md](../../../docs/04-server-api.md)
- [docs/03-data-workflow-worker.md](../../../docs/03-data-workflow-worker.md)
- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
