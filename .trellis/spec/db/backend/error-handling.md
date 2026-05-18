# Error Handling

## Overview

DB errors should be translated into domain-friendly failures as close to the repository boundary as possible.

## Error types

- Prisma or driver errors.
- Repository-level not-found or conflict errors.
- SQLite busy or transaction failures.

## Error handling patterns

- Catch low-level persistence errors in the DB layer.
- Translate them into stable repository errors for the server layer.
- Preserve enough detail for debugging without exposing raw driver output.

## API error responses

- API translation belongs in the server layer.
- The DB layer should surface stable, typed failure reasons.

## Common mistakes

- Letting raw Prisma errors leak into controllers.
- Treating every persistence error as identical.
