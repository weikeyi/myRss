# Error Handling

## Overview

Server errors should be typed, domain-aware, and safe to expose. Validation happens at the boundary; unexpected failures are logged and converted into stable API responses.

## Error types

- Validation errors for input parsing failures.
- Domain errors for expected business-rule failures.
- Generic internal errors for unexpected exceptions.

## Error handling patterns

- Parse request bodies and query params with shared `zod` schemas.
- Fail fast on invalid env values in `packages/config`.
- Do not let invalid input reach persistence or workflow code.

## API error responses

- Messages should explain the failed action, not dump stack traces.
- Keep secrets, SQL, HTML, and provider payloads out of error responses.
- Return a stable shape that callers can handle without string parsing.

## Common mistakes

- Throwing raw exceptions from feature code.
- Exposing stack traces or SQL to clients.
- Mixing validation and business failures in the same vague message.
