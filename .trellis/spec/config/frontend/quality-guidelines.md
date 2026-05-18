# Quality Guidelines

## Overview

Keep this package lean. It should not grow a frontend surface unless a real config UI is added.

## Forbidden patterns

- Adding general app UI here.
- Duplicating backend config defaults in a UI layer.

## Required patterns

- Keep any future UI narrow and config-specific.
- Reuse typed config shapes.

## Testing requirements

- If UI appears, test form state and validation.

## Code review checklist

- Is this actually config UI?
- Is the code still small enough to delete later?
