# Config Backend Guidelines

## Scope

This package owns runtime environment parsing and process-level defaults. It is the clearest example of how the repo wants shared configuration handled.

## Current conventions

- Parse env values with `zod`.
- Apply defaults in the config package, not inline at every call site.
- Export a typed config loader from a single entry file.
- Keep the package side-effect free.

## Real example

```ts
const EnvSchema = z.object({
  DATABASE_URL: z.string().default("file:../../data/myrss.db"),
  PORT: z.coerce.number().int().positive().default(3000)
});
```

See `packages/config/src/index.ts`.

## What to read first

| Guide | Why it matters |
|---|---|
| [Directory Structure](./directory-structure.md) | How config code stays isolated |
| [Database Guidelines](./database-guidelines.md) | Avoiding DB work inside config |
| [Error Handling](./error-handling.md) | How parse failures should surface |
| [Quality Guidelines](./quality-guidelines.md) | Package-level constraints |
| [Logging Guidelines](./logging-guidelines.md) | What not to log while loading env |

## Anti-patterns

- Reading `process.env` from random application code.
- Spreading config parsing logic across multiple packages.
- Returning untyped objects from the config layer.
