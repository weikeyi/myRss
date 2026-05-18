# Error Handling

## Overview

Config failures should be treated as startup failures, not runtime recoverable errors. The loader is expected to validate env eagerly and stop the app if the config is invalid.

## Error types

- Validation errors from `zod` are the main expected failure mode.
- Unexpected parse failures should be surfaced immediately and clearly.

## Error handling patterns

- Let env parsing fail fast.
- Keep the failure message tied to the missing or invalid key.
- Do not silently coerce bad values beyond what `zod` already allows.

## API error responses

- These errors are mostly operator-facing, not end-user-facing.
- Messages should be clear enough to fix the env file or process configuration.

## Common mistakes

- Swallowing parse failures and booting with partial config.
- Duplicating defaults in app code.
- Logging secrets while reporting a config issue.
