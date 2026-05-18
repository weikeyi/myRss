# Directory Structure

## Overview

The core package should stay framework-free and house pure domain logic only. It is the place for workflow state machines, retry helpers, hashes, and other reusable functions.

## Directory layout

```text
src/
├── index.ts
└── workflow/
```

## Module organization

- Keep each domain concern in a small subfolder.
- Keep all exports explicit.
- Avoid Nest, Prisma, HTTP, or UI dependencies.

## Naming conventions

- Use plain descriptive file names such as `engine.ts`, `types.ts`, and `retry-policy.ts`.
- Keep helper names rooted in domain concepts.

## Examples

- [packages/core/src/index.ts](../../../../packages/core/src/index.ts)
- [docs/03-data-workflow-worker.md](../../../docs/03-data-workflow-worker.md)
