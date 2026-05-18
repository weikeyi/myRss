# Quality Guidelines

## Overview

Keep this package lean. It should not grow a frontend surface unless a real server-admin UI is added.

## Forbidden patterns

- Adding app UI here.
- Surfacing backend internals in a generic component library.

## Required patterns

- Keep any future UI narrow and server-specific.

## Testing requirements

- If UI appears, test it close to the helper boundary.

## Code review checklist

- Is this actually needed in server tooling?
