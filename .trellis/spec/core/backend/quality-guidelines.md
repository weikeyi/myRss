# Quality Guidelines

## Overview

Core code should be tiny, pure, and deterministic. This package is the best place to keep logic that must work the same in API, worker, and tests.

## Forbidden patterns

- Importing framework code.
- Hiding state in module globals.
- Mixing orchestration with pure domain rules.

## Required patterns

- Prefer pure functions.
- Keep inputs and outputs explicit.
- Write helpers that can be tested without booting the app.

## Testing requirements

- Core logic should have direct unit coverage.
- Edge cases should be easy to cover without mocks or DI containers.

## Code review checklist

- Is the change still framework-free?
- Is the function single-purpose?
- Are the inputs and outputs easy to reason about?
