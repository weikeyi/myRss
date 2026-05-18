# Error Handling

## Overview

Core errors should be explicit and predictable. If a rule can fail, name that failure and keep it independent from framework error handling.

## Error types

- Use small domain errors for expected rule violations.
- Keep unexpected exceptions rare and easy to trace.

## Error handling patterns

- Throw only when the caller can meaningfully recover or translate the error.
- Keep error messages short and domain-oriented.

## API error responses

- Core code should not know about HTTP responses.
- Translation to API responses belongs in the server layer.

## Common mistakes

- Returning vague `Error` objects from pure logic.
- Encoding transport semantics in core exceptions.
