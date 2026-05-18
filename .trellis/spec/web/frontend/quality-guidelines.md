# Quality Guidelines

## Overview

Frontend quality here means thin pages, reusable features, typed data boundaries, and stable UI behavior. The architecture docs already prefer feature-based organization with Query/Pinia split.

## Forbidden patterns

- Putting fetch logic directly in page templates.
- Duplicating API response shapes instead of importing shared contracts.
- Growing a global store because a component is inconvenient to pass props into.
- Building UI abstractions before the second use case exists.

## Required patterns

- Keep pages thin.
- Use feature-local composition.
- Keep loading, empty, and error states explicit.
- Reuse shared enums and schemas.

## Testing requirements

- Shared component logic should be easy to unit test.
- State transitions and route behavior should be covered around feature boundaries.
- Anything that maps API data to UI state should be testable without a browser.

## Code review checklist

- Is the component doing one thing?
- Are props small and explicit?
- Is the data boundary typed?
- Does the UI state belong in Pinia, Query, or local state?
