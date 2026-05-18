# Component Guidelines

## Overview

Components should stay focused on one job: render state, dispatch events, or wrap a narrow piece of interaction. The web app is expected to follow feature-first composition rather than a big shared UI bucket.

## Component structure

- Keep presentation-only components dumb.
- Keep page components thin and assemble them from feature components.
- Keep complex data access outside of leaf components.

## Props conventions

- Use the smallest prop surface that can express the state.
- Prefer explicit booleans and enums over stringly typed mode props.
- Reuse shared article/status types when rendering backend data.

## Styling patterns

- Prefer semantic markup first.
- Keep layout concerns in the page or feature shell, not in tiny leaf components.
- Avoid duplicating the same styling logic in multiple components.

## Accessibility

- Use semantic elements before ARIA.
- Keep keyboard interaction and focus states intact.
- Provide empty, loading, and error states that do not trap the user.

## Common mistakes

- Turning one component into a whole page.
- Passing oversized prop bags across feature boundaries.
- Recreating the same badge or toolbar pattern in many places.

## Examples

- [docs/05-frontend.md](../../../docs/05-frontend.md)
- [packages/shared/src/constants/statuses.ts](../../../../packages/shared/src/constants/statuses.ts)
