# Directory Structure

## Overview

The config package is intentionally tiny. It exists to centralize runtime environment parsing and defaults, not to become another app layer.

## Directory layout

```text
src/
└── index.ts
```

## Module organization

- Keep env parsing and defaulting in one file.
- Keep the package side-effect free.
- Export a typed loader and types from the entry file.

## Naming conventions

- Use `EnvSchema` for the validation schema.
- Use `loadEnv` for the loader.
- Keep exported types named after the runtime shape, such as `AppEnv`.

## Examples

- [packages/config/src/index.ts](../../../packages/config/src/index.ts)
