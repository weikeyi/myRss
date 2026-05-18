# State Management

## Overview

The intended split is explicit: TanStack Query for server state, Pinia for UI state, and URL state for shareable filters. Do not move server data into client stores unless there is a real UI need.

## State categories

- Local state: form fields, modal open state, transient UI flags.
- Global state: sidebar collapse, theme, reading preferences, debug mode.
- Server state: article lists, article detail, feed lists, job / pipeline status.
- URL state: selected feed, search query, status filters, pagination.

## When to use global state

- Use global state only when multiple pages or unrelated components need the same client preference.
- Do not promote one-screen state to Pinia just because it feels convenient.

## Server state

- Cache article and feed data in query state.
- Poll pipeline state when the UI needs it.
- Keep list/detail data normalized by the API, not duplicated in the client.

## Common mistakes

- Storing article lists in Pinia.
- Duplicating derived counts in multiple places.
- Creating a global store before a second consumer exists.

## Examples

- [docs/05-frontend.md](../../../docs/05-frontend.md)
- [packages/shared/src/api/articles.schema.ts](../../../../packages/shared/src/api/articles.schema.ts)
