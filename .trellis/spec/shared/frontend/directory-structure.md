# Directory Structure

## Overview

This package does not currently own frontend code. If UI helpers are added later, keep them small and contract-focused.

## Module organization

- Reuse shared API schemas and constants instead of redefining them.
- Do not add app pages or stores here.

## Naming conventions

- Keep names contract-oriented and explicit.

## Examples

- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
- [packages/shared/src/constants/statuses.ts](../../../../packages/shared/src/constants/statuses.ts)
