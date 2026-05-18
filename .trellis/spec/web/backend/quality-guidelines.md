# Quality Guidelines

## Overview

This package should stay empty unless the web app genuinely needs backend-adjacent helpers.

## Forbidden patterns

- Adding server code here.
- Duplicating server API contracts.

## Required patterns

- Keep future helpers web-specific.

## Testing requirements

- Any helper should be easy to test without app startup.

## Code review checklist

- Is this really needed in the web package?
