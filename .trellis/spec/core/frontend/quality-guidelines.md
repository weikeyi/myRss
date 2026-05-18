# Quality Guidelines

## Overview

Keep this package lean. It should not grow a frontend surface unless a real UI helper is added.

## Forbidden patterns

- Adding app UI here.

## Required patterns

- Keep any future helper tiny and easy to remove.

## Testing requirements

- If UI appears, test it close to the helper boundary.

## Code review checklist

- Is this actually needed in core?
