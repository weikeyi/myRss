# Error Handling

## Overview

Shared validation should fail clearly, but shared code should not decide transport behavior. Boundary layers translate shared validation errors into API or UI messages.

## Error types

- Validation errors from `zod`.
- Minimal domain errors if a shared helper needs them.

## Error handling patterns

- Keep contract checks close to the schema.
- Avoid transport-specific error translation in shared modules.

## API error responses

- Shared code should not define HTTP response shapes.
- The server layer owns response mapping.

## Common mistakes

- Swallowing schema failures.
- Replacing shared validation with ad hoc string checks.
