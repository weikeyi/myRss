# Quality Guidelines

## Overview

Keep this package lean. It should not grow a frontend surface unless a real DB admin UI is added.

## Forbidden patterns

- Adding app UI here.
- Surfacing persistence internals in a generic component library.

## Required patterns

- Keep any future UI narrow and admin-specific.

## Testing requirements

- If UI appears, test it close to the helper boundary.

## Code review checklist

- Is this actually needed in DB tooling?
