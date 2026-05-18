# DB Frontend Guidelines

## Scope

This package does not currently own UI code. If a database-admin surface is ever added, keep it minimal and strictly separated from persistence internals.

## Anti-patterns

- Surfacing raw schema internals to UI code.
- Building DB-adjacent UI before the actual DB package exists.
